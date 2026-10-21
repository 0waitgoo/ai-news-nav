import React, { useState } from 'react';
import { Pin, Plus, Check, X } from 'lucide-react';
import { sortSites, type NavGroup, type SiteEntry } from '../../data/groups';
import type { LocalStore, SiteDraft } from '../../store/localStore';
import { SiteLogo } from './Card';
import SiteContextMenu, { siteMenuPosition, type SiteMenuState } from './SiteContextMenu';

/** 站点名称 / 说明的长度上限（第十六轮⑦）：表单 maxLength + 计数，保存时再硬截断兜底 */
export const SITE_NAME_MAX = 20;
export const SITE_DESC_MAX = 40;

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
      // 保存时硬截断兜底：即使输入绕过了 maxLength（如程序填充）也不会存入超长文本
      name: name.trim().slice(0, SITE_NAME_MAX),
      url: finalUrl,
      description: description.trim().slice(0, SITE_DESC_MAX),
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
        <div className="relative">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="名称，如 豆包"
            maxLength={SITE_NAME_MAX}
            className={`${inputCls} pr-11`}
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-white/30 pointer-events-none">
            {name.length}/{SITE_NAME_MAX}
          </span>
        </div>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="网址 URL，如 doubao.com" className={inputCls} />
      </div>
      <div className="relative">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="一句介绍"
          maxLength={SITE_DESC_MAX}
          className={`${inputCls} pr-11`}
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-white/30 pointer-events-none">
          {description.length}/{SITE_DESC_MAX}
        </span>
      </div>
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

/**
 * 展开态里的一行站点：点击打开站点；编辑 / 删除改走右键菜单（第十六轮追加，
 * 悬停不再冒出铅笔/垃圾桶图标）。编辑态由父级控制（菜单点「编辑」后进入）。
 */
function EditableSiteRow({
  site,
  groupId,
  store,
  editing,
  onEndEdit,
  onSiteMenu,
  formSpanCls,
}: {
  site: SiteEntry;
  groupId: string;
  store: LocalStore;
  editing: boolean;
  onEndEdit: () => void;
  onSiteMenu: (e: React.MouseEvent, site: SiteEntry) => void;
  /** 编辑表单在网格中的跨列类（3 列布局时跨满 3 列） */
  formSpanCls: string;
}) {
  if (editing) {
    return (
      <div className={formSpanCls}>
        <SiteForm
          initial={site}
          onSubmit={(draft) => {
            store.updateSite(groupId, site.id!, draft);
            onEndEdit();
          }}
          onCancel={onEndEdit}
        />
      </div>
    );
  }

  return (
    <div
      data-site-row={site.name}
      onContextMenu={(e) => onSiteMenu(e, site)}
      className="flex items-center gap-2.5 px-2 py-[7px] rounded-2xl hover:bg-white/6 transition-colors relative"
    >
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
    </div>
  );
}

/**
 * B 型列表卡的展开态主体：卡内可滚动的行式列表 + 添加网站。
 * 组操作（改名/删组/切形态/失效提示）第十二轮起上移到 GroupListCard 的标题行，与组名同一行。
 * 只有 B 卡在主页原地展开；C 卡走 GroupPanel 弹窗，不用这里。
 * 列数（第十六轮⑥）：组宽度为 2 栏时展开列表排 3 列（2 列会空出第三列宽）；1 栏宽保持 2 列。
 * 站点行操作（第十六轮⑤）：悬停无图标，右键弹站点菜单（打开/编辑/删除），编辑态由这里控制。
 */
export default function GroupExpandedBody({
  group,
  store,
  colSpan = 2,
}: {
  group: NavGroup;
  store: LocalStore;
  /** 组的右键布局宽度：2 栏 → 展开列表 3 列；1 栏 → 2 列 */
  colSpan?: 1 | 2;
}) {
  const [adding, setAdding] = useState(false);
  const [menu, setMenu] = useState<SiteMenuState | null>(null);
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const sorted = sortSites(group.sites);
  const wide = colSpan === 2;

  const handleSiteMenu = (e: React.MouseEvent, site: SiteEntry) => {
    // 只出站点菜单：阻止冒泡到卡片包装层（否则会同时弹出卡的尺寸菜单），并屏蔽浏览器默认菜单
    e.preventDefault();
    e.stopPropagation();
    setMenu({ ...siteMenuPosition(e), site });
  };

  return (
    /* 展开体内点击只做组内操作（加站/开站点等），不冒泡到卡片触发收起 */
    <div className="flex-1 min-h-0 flex flex-col" onClick={(e) => e.stopPropagation()}>
      {/* 站点列表：卡内滚动（data-nodrag：此区域内按下拖动不触发整卡拖拽排序） */}
      <div data-nodrag className="flex-1 min-h-0 overflow-y-auto pr-1 -mr-1">
        {sorted.length === 0 && !adding && (
          <p className="text-xs text-white/35 py-6 text-center">这个编组还没有网站，点「增加网站」加上第一个吧</p>
        )}
        <div className={`grid grid-cols-1 gap-x-2 content-start ${wide ? 'min-[480px]:grid-cols-3' : 'min-[480px]:grid-cols-2'}`}>
          {sorted.map((site) => (
            <React.Fragment key={site.id ?? site.name}>
              <EditableSiteRow
                site={site}
                groupId={group.id}
                store={store}
                editing={editingSiteId !== null && editingSiteId === site.id}
                onEndEdit={() => setEditingSiteId(null)}
                onSiteMenu={handleSiteMenu}
                formSpanCls={wide ? 'col-span-1 min-[480px]:col-span-3' : 'col-span-1 min-[480px]:col-span-2'}
              />
            </React.Fragment>
          ))}
          {/* 加站格子：紧跟最后一个站点，与站点行同尺寸的虚线框（唯一的加站入口） */}
          {!adding && (
            <button
              onClick={() => setAdding(true)}
              className="flex items-center justify-center gap-1 px-2 py-[7px] min-h-[48px] rounded-2xl border border-dashed border-white/15 text-[11px] text-white/50 hover:text-white/85 hover:border-white/30 transition-colors"
            >
              <Plus size={13} /> 增加网站
            </button>
          )}
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

      {/* 站点右键菜单（打开/编辑/删除）：渲染在滚动区之外，fixed 定位不被裁剪 */}
      {menu && (
        <SiteContextMenu
          state={menu}
          onClose={() => setMenu(null)}
          onOpen={(site) => window.open(site.url, '_blank')}
          onEdit={(site) => setEditingSiteId(site.id ?? null)}
          onDelete={(site) => {
            if (site.id) store.deleteSite(group.id, site.id);
          }}
        />
      )}
    </div>
  );
}
