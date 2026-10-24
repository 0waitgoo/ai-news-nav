import React, { useRef, useState } from 'react';
import type { LocalStore } from '../../store/localStore';
import {
  ghGetFile,
  ghPutFile,
  type GithubSyncConfig,
} from '../../store/githubSync';
import { packDataEnvelope, restoreWidgetStorage } from '../../store/widgetStorage';
import { reloadColorsData } from '../../store/colorsData';

/**
 * 桌面计划应用的同步条（第一百一十六轮）：与网站计划组件同源数据（tasks/plans），
 * 通过网站版同一套 GitHub 同步协议（ainav-data 私仓整份 store JSON）与网站互通。
 * 与网站版的区别：网站版走 OAuth 一键登录（回跳站点），桌面应用没有回跳地址，
 * 故走粘贴令牌（与扩展版方案 B 同款）；令牌只存本机独立 key，绝不进同步 JSON。
 * v1 口径：本应用供你自己用，同步仓固定为你自己的 0waitgoo/ainav-data；
 * 公开版需改成每人自己的仓（下一步）。
 */
const TOKEN_KEY = 'zabox-plan-sync-token';
const SHA_KEY = 'zabox-plan-sync-sha';

function loadToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? '';
  } catch {
    return '';
  }
}

function loadSha(): string | null {
  try {
    return localStorage.getItem(SHA_KEY);
  } catch {
    return null;
  }
}

export default function PlanSyncBar({ store }: { store: LocalStore }) {
  const [token, setToken] = useState(loadToken);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const dataRef = useRef(store.data);
  dataRef.current = store.data;
  const shaRef = useRef<string | null>(loadSha());

  const cfg = (t: string): GithubSyncConfig => ({
    owner: '0waitgoo',
    repo: 'ainav-data',
    branch: 'main',
    path: 'ainav-data.json',
    token: t,
  });

  const saveSha = (sha: string | null) => {
    shaRef.current = sha;
    try {
      if (sha) localStorage.setItem(SHA_KEY, sha);
      else localStorage.removeItem(SHA_KEY);
    } catch {
      /* 忽略 */
    }
  };

  const push = async (c: GithubSyncConfig, sha: string | null): Promise<boolean> => {
    const text = JSON.stringify(packDataEnvelope(dataRef.current), null, 2);
    const res = await ghPutFile(c, text, sha);
    if (res.kind === 'ok') {
      saveSha(res.sha);
      setStatus('已推送，网站那边同步一次即互通');
      return true;
    }
    setStatus(res.kind === 'error' ? res.message : '推送冲突：两边都有变化，先在网站上同步一次');
    return false;
  };

  const sync = async () => {
    const t = token.trim();
    if (!t || busy) return;
    setBusy(true);
    setStatus('正在同步…');
    try {
      const c = cfg(t);
      const remote = await ghGetFile(c);
      if (remote.kind === 'error') {
        setStatus(remote.message);
        return;
      }
      if (remote.kind === 'missing') {
        await push(c, null);
        return;
      }
      const localUpdatedAt = dataRef.current.updatedAt;
      if (remote.updatedAt > localUpdatedAt) {
        if (!store.importData(remote.data)) {
          setStatus('云端数据结构不对，无法导入');
          return;
        }
        if (remote.widgetStorage) {
          restoreWidgetStorage(remote.widgetStorage);
          reloadColorsData();
        }
        saveSha(remote.sha);
        setStatus('云端较新，已拉取');
        return;
      }
      if (remote.updatedAt < localUpdatedAt) {
        await push(c, remote.sha);
        return;
      }
      saveSha(remote.sha);
      setStatus('已是最新');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-[#17171d]/95 backdrop-blur border-b border-white/10 px-3 py-2 flex items-center gap-2">
      <span className="shrink-0 text-xs font-medium text-white/80">同步</span>
      <input
        type="password"
        value={token}
        placeholder="首次使用：粘贴 GitHub 令牌（需 ainav-data 仓读写权限）"
        onChange={(e) => {
          setToken(e.target.value);
          try {
            localStorage.setItem(TOKEN_KEY, e.target.value);
          } catch {
            /* 忽略 */
          }
        }}
        className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white/85 placeholder:text-white/30 outline-none focus:border-indigo-400/50"
      />
      <button
        type="button"
        onClick={() => void sync()}
        disabled={busy || !token.trim()}
        className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-default text-white transition-colors"
      >
        {busy ? '同步中…' : '同步'}
      </button>
      {status && <span className="hidden sm:block shrink-0 text-[11px] text-white/45 truncate max-w-[220px]">{status}</span>}
    </div>
  );
}
