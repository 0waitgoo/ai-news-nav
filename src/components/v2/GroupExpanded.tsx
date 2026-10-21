import React, { useState } from 'react';
import { Pin, Pencil, Trash2, Plus, Check, X, AlertTriangle } from 'lucide-react';
import { deadCount, sortSites, type NavGroup, type SiteEntry } from '../../data/groups';
import type { LocalStore, SiteDraft } from '../../store/localStore';
import { SiteLogo } from './Card';

/** 网址输入自动补协议 */
export function normalizeUrl(raw: string): string {
  const url = raw.trim();
  if (!url) return url;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)) return url;
  return `https://${url}`;
}

const inputCls =
  'w-full bg-white/5 border border-white/12 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400/50 placeholder:text-white/30';

/** 添加 / 编辑网站的内联表单 */
export function SiteForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: SiteEntry;
  onSubmit: (draft: SiteDraft) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [url, setUrl] = useState(initial?.url ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [aliases, setAliases] = useState((initial?.aliases ?? []).join('，'));
  const [pinned, setPinned] = useState(!!initial?.pinned);
  const [error, setError] = useState('');

  const submit = () => {
    const finalUrl = normalizeUrl(url);
    if (!name.trim()) return setError('请填网站名称');
    if (!finalUrl || !finalUrl.includes('.')) return setError('请填有效网址，如 example.com');
    onSubmit({
      name: name.trim(),
      url: finalUrl,
      description: description.trim(),
      aliases: aliases
        .split(/[,，]/)
        .map((a) => a.trim())
        .filter(Boolean),
      pinned,
    });
  };

  return (
    <div className="rounded-2xl bg-indigo-500/[0.07] border border-indigo-300/20 p-3 flex flex-col gap-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="名称，如 豆包" className={inputCls} />
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="网址 URL，如 doubao.com" className={inputCls} />
      </div>
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="一句介绍" className={inputCls} />
      <div className="flex items-center gap-2">
        <input value={aliases} onChange={(e) => setAliases(e.target.value)} placeholder="别名（可选，逗号分隔，搜别名可直达）" className={`${inputCls} flex-1`} />
        <label className="flex items-center gap-1.5 text-[11px] text-white/60 shrink-0 cursor-pointer select-none">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="accent-amber-400" />
          置顶
        </label>
      </div>
      {error && <p className="text-[11px] text-red-300">{error}</p>}
      <div className="flex items-center gap-2 pt-0.5">
        <button onClick={submit} className="flex items-center gap-1 text-[11px] font-medium px-3 py-1.5 rounded-lg bg-indigo-500/80 hover:bg-indigo-500 text-white transition-colors">
          <Check size={12} /> 保存
        </button>
        <button onClick={onCancel} className="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/12 text-white/70 transition-colors">
          <X size={12} /> 取消
        </button>
      </div>
    </div>
  );
}

/** 展开态里的一行站点：点开站点；悬停露出 编辑 / 删除 */
function EditableSiteRow({
  site,
  groupId,
  store,
}: {
  site: SiteEntry;
  groupId: string;
  store: LocalStore;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="col-span-1 min-[480px]:col-span-2">
        <SiteForm
          initial={site}
          onSubmit={(draft) => {
            store.updateSite(groupId, site.id!, draft);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="group/row flex items-center gap-2.5 px-2 py-[7px] rounded-2xl hover:bg-white/6 transition-colors relative">
      <button onClick={() => window.open(site.url, '_blank')} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
        <SiteLogo logo={site.logo} name={site.name} size={34} imgSize={23} grayscale={site.dead} />
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-1.5">
            <span className={`text-[13px] font-semibold truncate ${site.dead ? 'text-white/45' : ''}`}>{site.name}</span>
            {site.pinned && <Pin size={11} className="text-amber-400 fill-amber-400 shrink-0" />}
            {site.dead && (
              <span className="text-[9px] font-medium text-red-300 bg-red-500/15 px-1.5 py-0.5 rounded shrink-0">失效</span>
            )}
          </span>
          <span className="block text-[11px] text-white/45 truncate mt-0.5">{site.description}</span>
        </span>
        {site.needVpn && (
          <span className="text-[8px] font-bold text-white/40 bg-white/10 px-1.5 py-0.5 rounded shrink-0">VPN</span>
        )}
      </button>
      <span className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity">
        <button
          onClick={() => setEditing(true)}
          title="编辑网站"
          className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={() => store.deleteSite(groupId, site.id!)}
          title="删除网站"
          className="p-1.5 rounded-lg text-white/50 hover:text-red-300 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </span>
    </div>
  );
}

/**
 * 编组展开态主体（B / C 共用）：卡内可滚动的 2 列行式列表 + 添加网站 + 组操作。
 * 展开后不会弹窗、不会变成纯图标，就在卡内往下看。
 */
export default function GroupExpandedBody({ group, store }: { group: NavGroup; store: LocalStore }) {
  const [adding, setAdding] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [groupName, setGroupName] = useState(group.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const sorted = sortSites(group.sites);
  const dead = deadCount(group);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* 组操作行：改名 / 删组 */}
      <div className="flex items-center gap-2 pb-2 shrink-0">
        {renaming ? (
          <>
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className={`${inputCls} max-w-[180px]`}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && groupName.trim()) {
                  store.renameGroup(group.id, groupName.trim());
                  setRenaming(false);
                }
              }}
            />
            <button
              onClick={() => {
                if (groupName.trim()) store.renameGroup(group.id, groupName.trim());
                setRenaming(false);
              }}
              className="text-[11px] px-2.5 py-1.5 rounded-lg bg-indigo-500/80 text-white"
            >
              保存
            </button>
            <button onClick={() => setRenaming(false)} className="text-[11px] px-2.5 py-1.5 rounded-lg bg-white/8 text-white/70">
              取消
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                setGroupName(group.name);
                setRenaming(true);
              }}
              className="flex items-center gap-1 text-[11px] text-white/45 hover:text-white/80 transition-colors"
            >
              <Pencil size={11} /> 改组名
            </button>
            {confirmDelete ? (
              <span className="flex items-center gap-1.5 text-[11px]">
                <span className="text-red-300">删除整个编组？</span>
                <button onClick={() => store.deleteGroup(group.id)} className="px-2 py-1 rounded-md bg-red-500/80 text-white font-medium">
                  确认删除
                </button>
                <button onClick={() => setConfirmDelete(false)} className="px-2 py-1 rounded-md bg-white/8 text-white/70">
                  算了
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1 text-[11px] text-white/45 hover:text-red-300 transition-colors"
              >
                <Trash2 size={11} /> 删组
              </button>
            )}
          </>
        )}
        {dead > 0 && (
          <span className="ml-auto flex items-center gap-1 text-[10px] text-red-300/80 shrink-0">
            <AlertTriangle size={11} /> {dead} 个失效链接 · 已标记（不会自动删除）
          </span>
        )}
      </div>

      {/* 站点列表：卡内滚动 */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 -mr-1">
        {sorted.length === 0 && !adding && (
          <p className="text-xs text-white/35 py-6 text-center">这个编组还没有网站，点下方「添加网站」加上第一个吧</p>
        )}
        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-x-2 content-start">
          {sorted.map((site) => (
            <React.Fragment key={site.id ?? site.name}>
              <EditableSiteRow site={site} groupId={group.id} store={store} />
            </React.Fragment>
          ))}
        </div>
        {adding && (
          <div className="mt-2">
            <SiteForm
              onSubmit={(draft) => {
                store.addSite(group.id, draft);
                setAdding(false);
              }}
              onCancel={() => setAdding(false)}
            />
          </div>
        )}
      </div>

      {/* 添加网站 */}
      {!adding && (
        <button
          onClick={() => setAdding(true)}
          className="mt-2 w-full py-2 rounded-xl border border-dashed border-white/15 text-[11px] text-white/50 hover:text-white/85 hover:border-white/30 transition-colors flex items-center justify-center gap-1 shrink-0"
        >
          <Plus size={13} /> 添加网站
        </button>
      )}
    </div>
  );
}
