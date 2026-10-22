/**
 * GitHub 同步（第十五轮；第五十轮起只保留 GitHub 登录）：把完整数据 JSON 同步到用户自己的 GitHub 仓库文件。
 * - 前端直连 api.github.com（Contents API），不经过任何中间服务器；
 * - 登录凭证只存浏览器本地 localStorage 的独立 key（ainav-github-sync-v1），
 *   **绝不写入同步的 JSON 内容、也绝不进导出 JSON**（同步内容就是 store.data 本身）；
 * - 冲突裁决靠数据里的 updatedAt：拉取时云端更新则覆盖本地；推送遇 sha 冲突先重新拉取，
 *   云端更新用云端、本地更新换新 sha 重试，仍失败交给用户手动裁决（见 DataMenu）。
 */

export interface GithubSyncConfig {
  owner: string;
  repo: string;
  branch: string;
  path: string;
  token: string;
}

export interface GithubSyncMeta extends GithubSyncConfig {
  enabled: boolean;
  /** 云端文件当前的 sha（最后一次拉取/推送后确认的值）；null = 尚不知道/云端无此文件 */
  lastSha: string | null;
  /** 本地与云端最后一次达成一致时的数据 updatedAt；本地 updatedAt 大于它 = 有待推送变更 */
  baseUpdatedAt: number;
  lastSyncedAt: number | null;
  /** 凭证来源：第五十轮起只剩 'oauth'（GitHub 一键登录）；'pat' 仅为旧本机存储的遗留值，加载时按未登录处理 */
  authMode: 'pat' | 'oauth';
  /** OAuth 登录的 GitHub 用户名（authMode='oauth' 时有值，仅本机展示用） */
  oauthLogin: string;
}

const META_KEY = 'ainav-github-sync-v1';

export const DEFAULT_GITHUB_SYNC_META: GithubSyncMeta = {
  enabled: false,
  owner: '',
  repo: '',
  branch: 'main',
  path: 'ainav-data.json',
  token: '',
  lastSha: null,
  baseUpdatedAt: 0,
  lastSyncedAt: null,
  authMode: 'oauth',
  oauthLogin: '',
};

export function loadGithubSyncMeta(): GithubSyncMeta {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<GithubSyncMeta>;
      const str = (v: unknown, fallback: string) => (typeof v === 'string' && v.trim() ? v : fallback);
      /* 第五十轮：令牌（PAT）方式已下线。本机若存有旧 PAT 配置（authMode 非 'oauth'），
       * 一律按未登录处理：丢弃凭证、关同步、不报错，用户改走 GitHub 登录即可。 */
      const isOauth = p.authMode === 'oauth';
      return {
        enabled: isOauth && p.enabled === true,
        owner: str(p.owner, ''),
        repo: str(p.repo, ''),
        branch: str(p.branch, 'main'),
        path: str(p.path, 'ainav-data.json'),
        token: isOauth && typeof p.token === 'string' ? p.token : '',
        lastSha: typeof p.lastSha === 'string' ? p.lastSha : null,
        baseUpdatedAt: typeof p.baseUpdatedAt === 'number' ? p.baseUpdatedAt : 0,
        lastSyncedAt: typeof p.lastSyncedAt === 'number' ? p.lastSyncedAt : null,
        authMode: 'oauth',
        oauthLogin: isOauth && typeof p.oauthLogin === 'string' ? p.oauthLogin : '',
      };
    }
  } catch {
    // 损坏时回落默认
  }
  return { ...DEFAULT_GITHUB_SYNC_META };
}

export function saveGithubSyncMeta(meta: GithubSyncMeta): void {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    // 静默失败，不阻断使用
  }
}

/** 配置是否完整（能发起同步的最低要求） */
export function githubConfigComplete(m: GithubSyncMeta): boolean {
  return Boolean(m.owner && m.repo && m.token);
}

/* ---- UTF-8 安全的 base64（数据含中文，不能直接 btoa） ---- */
export function b64EncodeUtf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

export function b64DecodeUtf8(b64: string): string {
  const bin = atob(b64.replace(/\s/g, ''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/* ---- GitHub Contents API ---- */
const API_BASE = 'https://api.github.com';

function tokenHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

function ghHeaders(cfg: GithubSyncConfig): Record<string, string> {
  return tokenHeaders(cfg.token);
}

function contentsUrl(cfg: GithubSyncConfig): string {
  const encodedPath = cfg.path.split('/').filter(Boolean).map(encodeURIComponent).join('/');
  return `${API_BASE}/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${encodedPath}`;
}

/** 从解析出的数据里取 updatedAt（没有/非法一律 0） */
export function updatedAtOf(data: unknown): number {
  if (data && typeof data === 'object' && typeof (data as { updatedAt?: unknown }).updatedAt === 'number') {
    return (data as { updatedAt: number }).updatedAt;
  }
  return 0;
}

export type GhGetResult =
  | { kind: 'ok'; data: unknown; text: string; sha: string; updatedAt: number }
  | { kind: 'missing' }
  | { kind: 'error'; message: string };

function httpErrorMessage(status: number): string {
  if (status === 401) return '登录状态无效或已过期，请重新登录（401）';
  if (status === 403) return 'GitHub 拒绝访问：权限不足或触发限流（403）';
  return `GitHub 请求失败（${status}）`;
}

/** 拉取云端文件：区分「文件不存在（仓库在）」与各类错误 */
export async function ghGetFile(cfg: GithubSyncConfig): Promise<GhGetResult> {
  let res: Response;
  try {
    res = await fetch(`${contentsUrl(cfg)}?ref=${encodeURIComponent(cfg.branch)}`, { headers: ghHeaders(cfg) });
  } catch {
    return { kind: 'error', message: '网络错误，无法连接 GitHub' };
  }
  if (res.status === 404) {
    // 分不清是仓库不存在还是文件不存在：再查一次仓库本身
    try {
      const repoRes = await fetch(`${API_BASE}/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}`, {
        headers: ghHeaders(cfg),
      });
      if (repoRes.status === 404) return { kind: 'error', message: '仓库不存在或无权访问' };
      if (repoRes.status === 401) return { kind: 'error', message: httpErrorMessage(401) };
      if (!repoRes.ok) return { kind: 'error', message: httpErrorMessage(repoRes.status) };
    } catch {
      return { kind: 'error', message: '网络错误，无法连接 GitHub' };
    }
    return { kind: 'missing' };
  }
  if (!res.ok) return { kind: 'error', message: httpErrorMessage(res.status) };
  try {
    const body = (await res.json()) as { content?: string; sha?: string };
    if (typeof body.content !== 'string' || typeof body.sha !== 'string') {
      return { kind: 'error', message: 'GitHub 返回的文件格式异常（可能路径指向文件夹）' };
    }
    const text = b64DecodeUtf8(body.content);
    const data: unknown = JSON.parse(text);
    return { kind: 'ok', data, text, sha: body.sha, updatedAt: updatedAtOf(data) };
  } catch {
    return { kind: 'error', message: '云端文件不是有效的 JSON 数据' };
  }
}

/* ---- GitHub OAuth 登录（唯一的同步入口）----
 * 流程：前端从 /api/github-oauth?config=1 拿公开 client_id → 跳 GitHub 授权页 →
 * 回跳站点根带 ?code&state → 前端把 code 交给 /api/github-oauth 换 access_token
 * （client_secret 只在服务端环境变量里，前端永远接触不到）。
 * 换来的 token 与 PAT 存同一处本机独立存储（META_KEY），同样绝不进同步/导出 JSON。
 * 登录后同步目标固定为登录账号下的私有仓库 ainav-data（见 OAUTH_* 常量）。 */

export const OAUTH_REPO_NAME = 'ainav-data';
export const OAUTH_BRANCH = 'main';
export const OAUTH_FILE_PATH = 'ainav-data.json';
const OAUTH_STATE_KEY = 'ainav-oauth-state';

/** 生成并暂存 OAuth state（防 CSRF），返回要带去授权页的值 */
export function beginOAuthState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const state = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  try {
    sessionStorage.setItem(OAUTH_STATE_KEY, state);
  } catch {
    // sessionStorage 不可用时回跳校验必然失败，会给出报错，不静默放行
  }
  return state;
}

/** 取出并清掉暂存的 state（一次性使用） */
export function consumeOAuthState(): string | null {
  try {
    const v = sessionStorage.getItem(OAUTH_STATE_KEY);
    sessionStorage.removeItem(OAUTH_STATE_KEY);
    return v;
  } catch {
    return null;
  }
}

/** 拼 GitHub 授权 URL：回调地址就是注册 OAuth App 时填的站点根，不另传 redirect_uri */
export function buildOAuthAuthorizeUrl(clientId: string, state: string): string {
  return `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(clientId)}&scope=repo&state=${encodeURIComponent(state)}`;
}

/** 从服务端拿公开配置（client_id）；拿不到/未配置一律 null */
export async function fetchOAuthClientId(): Promise<string | null> {
  try {
    const res = await fetch('/api/github-oauth?config=1');
    if (!res.ok) return null;
    const body = (await res.json().catch(() => null)) as { clientId?: unknown } | null;
    return typeof body?.clientId === 'string' && body.clientId ? body.clientId : null;
  } catch {
    return null;
  }
}

/** 用授权 code 向服务端换 access_token（secret 在服务端） */
export async function exchangeOAuthCode(code: string): Promise<{ token: string } | { error: string }> {
  let res: Response;
  try {
    res = await fetch('/api/github-oauth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
  } catch {
    return { error: '网络错误，无法完成 GitHub 登录，请重试' };
  }
  const body = (await res.json().catch(() => null)) as { access_token?: unknown; error?: unknown } | null;
  if (res.ok && typeof body?.access_token === 'string' && body.access_token) {
    return { token: body.access_token };
  }
  if (body?.error === 'oauth_not_configured') {
    return { error: '服务端未配置 GitHub 登录' };
  }
  return { error: 'GitHub 登录失败：授权码已失效或被拒绝，请重新登录' };
}

/** 用 token 查登录账号名 */
export async function ghGetUser(token: string): Promise<{ login: string } | { error: string }> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/user`, { headers: tokenHeaders(token) });
  } catch {
    return { error: '网络错误，无法连接 GitHub' };
  }
  if (!res.ok) return { error: httpErrorMessage(res.status) };
  const body = (await res.json().catch(() => null)) as { login?: unknown } | null;
  if (typeof body?.login !== 'string' || !body.login) {
    return { error: 'GitHub 未返回账号信息，请重新登录' };
  }
  return { login: body.login };
}

/**
 * 确保登录账号下有同步仓库 ainav-data：没有就创建为私有仓库；
 * 已存在（无论私有与否）照常用。返回 { repo } 或错误文案。
 */
export async function ensureOAuthRepo(
  token: string,
  login: string,
): Promise<{ repo: string } | { error: string }> {
  const headers = tokenHeaders(token);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/repos/${encodeURIComponent(login)}/${OAUTH_REPO_NAME}`, { headers });
  } catch {
    return { error: '网络错误，无法连接 GitHub' };
  }
  if (res.ok) return { repo: OAUTH_REPO_NAME };
  if (res.status !== 404) return { error: httpErrorMessage(res.status) };
  // 仓库不存在 → 创建（私有）
  let createRes: Response;
  try {
    createRes = await fetch(`${API_BASE}/user/repos`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: OAUTH_REPO_NAME,
        private: true,
        description: 'ai-news-nav 的同步数据（自动创建，请勿公开）',
      }),
    });
  } catch {
    return { error: '网络错误，创建同步仓库失败' };
  }
  if (createRes.ok) return { repo: OAUTH_REPO_NAME };
  // 并发下可能刚被别处建好：再确认一次存在性
  try {
    const again = await fetch(`${API_BASE}/repos/${encodeURIComponent(login)}/${OAUTH_REPO_NAME}`, { headers });
    if (again.ok) return { repo: OAUTH_REPO_NAME };
  } catch {
    // 忽略，统一报创建失败
  }
  if (createRes.status === 401 || createRes.status === 403) {
    return { error: httpErrorMessage(createRes.status) };
  }
  return { error: `创建同步仓库失败（${createRes.status}），请稍后重试` };
}

export type GhPutResult = { kind: 'ok'; sha: string } | { kind: 'conflict' } | { kind: 'error'; message: string };

/** 写回云端文件：sha 为 null 表示新建；sha 与云端不一致时 GitHub 返回 409/422，归类 conflict */
export async function ghPutFile(cfg: GithubSyncConfig, text: string, sha: string | null): Promise<GhPutResult> {
  let res: Response;
  try {
    res = await fetch(contentsUrl(cfg), {
      method: 'PUT',
      headers: { ...ghHeaders(cfg), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'sync: update ainav data',
        content: b64EncodeUtf8(text),
        branch: cfg.branch,
        ...(sha ? { sha } : {}),
      }),
    });
  } catch {
    return { kind: 'error', message: '网络错误，无法连接 GitHub' };
  }
  if (res.status === 409 || res.status === 422) return { kind: 'conflict' };
  if (!res.ok) return { kind: 'error', message: httpErrorMessage(res.status) };
  try {
    const body = (await res.json()) as { content?: { sha?: string } };
    const newSha = body.content?.sha;
    if (typeof newSha !== 'string') return { kind: 'error', message: 'GitHub 未返回新文件 sha' };
    return { kind: 'ok', sha: newSha };
  } catch {
    return { kind: 'error', message: 'GitHub 返回格式异常' };
  }
}
