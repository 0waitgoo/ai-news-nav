/**
 * GitHub 同步（第十五轮）：把完整数据 JSON 同步到用户自己的 GitHub 仓库文件。
 * - 前端直连 api.github.com（Contents API），不经过任何中间服务器；
 * - 配置与令牌只存浏览器本地 localStorage 的独立 key（ainav-github-sync-v1），
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
};

export function loadGithubSyncMeta(): GithubSyncMeta {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<GithubSyncMeta>;
      const str = (v: unknown, fallback: string) => (typeof v === 'string' && v.trim() ? v : fallback);
      return {
        enabled: p.enabled === true,
        owner: str(p.owner, ''),
        repo: str(p.repo, ''),
        branch: str(p.branch, 'main'),
        path: str(p.path, 'ainav-data.json'),
        token: typeof p.token === 'string' ? p.token : '',
        lastSha: typeof p.lastSha === 'string' ? p.lastSha : null,
        baseUpdatedAt: typeof p.baseUpdatedAt === 'number' ? p.baseUpdatedAt : 0,
        lastSyncedAt: typeof p.lastSyncedAt === 'number' ? p.lastSyncedAt : null,
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

/**
 * 解析用户粘贴的仓库地址：支持完整 URL（https://github.com/owner/repo，
 * 可带尾随路径如 /tree/main、.git 后缀）与 owner/repo 简写。解析不出返回 null。
 */
export function parseRepoInput(input: string): { owner: string; repo: string } | null {
  const s = input.trim();
  if (!s) return null;
  let rest = s;
  const urlMatch = rest.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/(.+)$/i);
  if (urlMatch) rest = urlMatch[1];
  const parts = rest.split('/').filter(Boolean);
  if (parts.length < 2) return null;
  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/i, '');
  if (!owner || !repo) return null;
  if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) return null;
  return { owner, repo };
}

/** 令牌掩码展示：只露尾 4 位，其余圆点 */
export function maskToken(token: string): string {
  if (!token) return '未设置';
  return token.length > 4 ? `••••••${token.slice(-4)}` : '••••••';
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

function ghHeaders(cfg: GithubSyncConfig): Record<string, string> {
  return {
    Authorization: `Bearer ${cfg.token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
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
  if (status === 401) return '令牌无效或已过期，请检查令牌（401）';
  if (status === 403) return 'GitHub 拒绝访问：令牌权限不足或触发限流（403）';
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
      if (repoRes.status === 404) return { kind: 'error', message: '仓库不存在，或令牌没有访问该仓库的权限' };
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
