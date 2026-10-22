import React, { useRef, useState } from 'react';
import { Pin, Plus, Check, X, RefreshCw, Upload } from 'lucide-react';
import { SITE_TAG_MAX, cleanSiteTag, letterIconDataUri, siteIconSrc, siteLogoFallback, sortSites, type NavGroup, type SiteEntry } from '../../data/groups';
import { logoForSite, type LocalStore, type SiteDraft } from '../../store/localStore';
import { SiteLogo } from './Card';
import SiteContextMenu, { siteMenuPosition, type SiteMenuState } from './SiteContextMenu';
import { SITE_DRAG_PLACEHOLDER_STYLE, useSiteDragSort } from './useSiteDragSort';

/** 站点名称 / 说明的长度上限（第十六轮⑦）：表单 maxLength + 计数，保存时再硬截断兜底 */
export const SITE_NAME_MAX = 20;
export const SITE_DESC_MAX = 40;

/**
 * 站点标签预设与配色（第三十九轮）：三个写死预设 + 自定义标签。
 * 预设值落盘为大写（VPN / APP / MARK），按钮文字用 VPN / App / Mark；
 * 徽标与表单预设按钮共用同一套色（底/字/边同色系半透明），自定义标签走灰色。
 * 所有渲染 tag 徽标的地方（B 卡收起/展开行、弹窗瓷砖）都经 SiteTagBadge 走 siteTagBadgeCls，不要各处写死颜色。
 */
export const SITE_TAG_PRESETS = [
  {
    value: 'VPN',
    label: 'VPN',
    badgeCls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
    btnCls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/20',
    btnActiveCls: 'bg-emerald-500/35 text-emerald-100 border-emerald-300',
  },
  {
    value: 'APP',
    label: 'App',
    badgeCls: 'bg-blue-500/15 text-blue-400 border-blue-500/40',
    btnCls: 'bg-blue-500/10 text-blue-400 border-blue-500/40 hover:bg-blue-500/20',
    btnActiveCls: 'bg-blue-500/35 text-blue-100 border-blue-300',
  },
  {
    value: 'MARK',
    label: 'Mark',
    badgeCls: 'bg-rose-500/15 text-rose-400 border-rose-500/40',
    btnCls: 'bg-rose-500/10 text-rose-400 border-rose-500/40 hover:bg-rose-500/20',
    btnActiveCls: 'bg-rose-500/35 text-rose-100 border-rose-300',
  },
] as const;

/** 按 tag 值（已大写归一化）取徽标配色类：预设三色，其余一律灰色 */
export function siteTagBadgeCls(tag: string): string {
  return SITE_TAG_PRESETS.find((p) => p.value === tag)?.badgeCls ?? 'bg-white/10 text-white/40 border-white/15';
}

/** 站点行小徽标（第二十六轮，第三十九轮按值配色）：文本 = 站点 tag（已归一化落盘），无 tag 不显示 */
export function SiteTagBadge({ site }: { site: SiteEntry }) {
  const tag = cleanSiteTag(site.tag);
  if (!tag) return null;
  return (
    <span data-site-tag={tag} className={`text-[8px] font-bold border px-1.5 py-0.5 rounded shrink-0 ${siteTagBadgeCls(tag)}`}>
      {tag}
    </span>
  );
}

/** 网址输入自动补协议 */
export function normalizeUrl(raw: string): string {
  const url = raw.trim();
  if (!url) return url;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)) return url;
  return `https://${url}`;
}

const inputCls =
  'w-full bg-white/5 border border-white/12 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400/50 placeholder:text-white/30';

/**
 * 上传图片 → 方形小图标 data URL（第四十九轮）：中心裁方、最长边 ≤128px；
 * PNG 体积 >60KB 时转 JPEG（白底垫底防透明区变黑），仍过大再缩到 96px。
 * 图标会随站点数据一起同步，必须压小，别把原图塞进数据里。
 */
async function compressIconImage(file: File): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - side) / 2;
    const sy = (bitmap.height - side) / 2;
    const canvas = document.createElement('canvas');
    const render = (size: number, jpeg: boolean): string => {
      canvas.width = size;
      canvas.height = size;
      const cx = canvas.getContext('2d');
      if (!cx) return '';
      if (jpeg) {
        cx.fillStyle = '#ffffff';
        cx.fillRect(0, 0, size, size);
      }
      cx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
      return jpeg ? canvas.toDataURL('image/jpeg', 0.87) : canvas.toDataURL('image/png');
    };
    let out = render(Math.min(128, side), false);
    if (out.length > 60000) out = render(Math.min(128, side), true);
    if (out.length > 60000) out = render(96, true);
    bitmap.close();
    return out || null;
  } catch {
    return null;
  }
}

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
  // 标签初值：已迁移的 tag 优先；老站点只有 needVpn 标记时预填 VPN，保存即正式写入 tag
  const [tag, setTag] = useState(() => cleanSiteTag(initial?.tag) || (initial?.needVpn ? 'VPN' : ''));
  const [pinned, setPinned] = useState(!!initial?.pinned);
  const [error, setError] = useState('');
  /* 图标编辑（第四十九轮）：三态初值取站点既有配置（存量站点无字段 = auto）；
     autoLogo 只在用户点了「重新检索」时才有值，代表按当前名称/网址重取的自动图标 */
  const [iconMode, setIconMode] = useState<'auto' | 'text' | 'upload'>(initial?.iconMode ?? 'auto');
  const [iconText, setIconText] = useState(initial?.iconText ?? '');
  const [iconImage, setIconImage] = useState(initial?.iconImage ?? '');
  const [autoLogo, setAutoLogo] = useState('');
  const iconFileRef = useRef<HTMLInputElement>(null);

  // 大预览实时反映当前模式：upload 用图、text 用字母图、auto 用（重取过的或既有的）自动图标
  const previewSrc =
    iconMode === 'upload' && iconImage
      ? iconImage
      : iconMode === 'text' && iconText.trim()
        ? letterIconDataUri(iconText.trim())
        : autoLogo || initial?.logo || logoForSite(name.trim() || '站点', normalizeUrl(url) || 'https://example.com');

  const submit = () => {
    const finalUrl = normalizeUrl(url);
    if (!name.trim()) return setError('请填网站名称');
    if (!finalUrl || !finalUrl.includes('.')) return setError('请填有效网址，如 example.com');
    if (iconMode === 'text' && ![...iconText.trim()].length) return setError('请填写图标文字（1–2 个字）');
    if (iconMode === 'upload' && !iconImage) return setError('请先选择一张图片作图标');
    // 名称/网址变了又没手动重检索时，保存时按新值自动重取一次（与改版前每次保存重算图标的老行为一致）
    const identityChanged = !!initial && (name.trim() !== initial.name || finalUrl !== initial.url);
    onSubmit({
      // 保存时硬截断兜底：即使输入绕过了 maxLength（如程序填充）也不会存入超长文本
      name: name.trim().slice(0, SITE_NAME_MAX),
      url: finalUrl,
      description: description.trim().slice(0, SITE_DESC_MAX),
      // 别名（第二十六轮）：表单不再提供编辑入口，但既有别名数据原样回传保留，继续供搜索直达
      aliases: [...(initial?.aliases ?? [])],
      pinned,
      tag: cleanSiteTag(tag),
      iconMode,
      iconText: iconText.trim(),
      iconImage,
      autoLogo: autoLogo || (identityChanged ? logoForSite(name.trim(), finalUrl) : ''),
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
      {/* 图标编辑（第四十九轮）：大预览 + 三种来源切换（自动检索 / 文字 / 上传图片），保存才落盘 */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0">
          <img
            src={previewSrc}
            alt=""
            data-icon-preview
            className="w-7 h-7 object-contain"
            onError={(e) => {
              const t = e.target as HTMLImageElement;
              if (!t.src.includes('dicebear')) t.src = siteLogoFallback(name || '站点');
            }}
          />
        </span>
        <span className="flex items-center rounded-lg bg-white/5 border border-white/10 overflow-hidden shrink-0">
          {(
            [
              ['auto', '自动检索'],
              ['text', '文字'],
              ['upload', '上传图片'],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              data-icon-mode={m}
              onClick={() => setIconMode(m)}
              className={`text-[11px] px-2.5 py-1.5 transition-colors ${
                iconMode === m ? 'bg-indigo-500/70 text-white font-medium' : 'text-white/50 hover:text-white/85'
              }`}
            >
              {label}
            </button>
          ))}
        </span>
        {iconMode === 'auto' && (
          <button
            type="button"
            data-icon-refetch
            onClick={() => setAutoLogo(logoForSite(name.trim() || '站点', normalizeUrl(url) || 'https://example.com'))}
            className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-white/8 hover:bg-white/12 text-white/70 transition-colors shrink-0"
          >
            <RefreshCw size={11} /> 重新检索
          </button>
        )}
        {iconMode === 'text' && (
          <input
            value={iconText}
            onChange={(e) => setIconText([...e.target.value].slice(0, 2).join(''))}
            placeholder="1–2 个字，如 AI"
            data-icon-text
            className="w-28 shrink-0 bg-white/5 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-white/40 placeholder:text-white/30"
          />
        )}
        {iconMode === 'upload' && (
          <>
            <button
              type="button"
              data-icon-upload
              onClick={() => iconFileRef.current?.click()}
              className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-white/8 hover:bg-white/12 text-white/70 transition-colors shrink-0"
            >
              <Upload size={11} /> {iconImage ? '更换图片' : '选择图片'}
            </button>
            <input
              ref={iconFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  void compressIconImage(f).then((dataUrl) => {
                    if (dataUrl) setIconImage(dataUrl);
                    else setError('这张图片读不了，换一张试试');
                  });
                }
                e.target.value = '';
              }}
            />
            {iconImage && (
              <span className="text-[10px] text-emerald-300 shrink-0">已压缩至 {Math.max(1, Math.round(iconImage.length / 1024))}KB</span>
            )}
          </>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {/* 标签（第二十六轮；第三十九轮改造）：左侧缩短的自定义输入（灰色系，规则不变：仅英文字母、
            自动转大写、最多 4 个）+ 右侧三个写死预设按钮（VPN 绿 / App 蓝 / Mark 红，与徽标同色）。
            点预设 = 设为该标签；再点已选中的预设 = 取消（清标签）；清空输入同样 = 无标签。 */}
        <input
          value={tag}
          onChange={(e) => setTag(cleanSiteTag(e.target.value))}
          placeholder="自定义"
          maxLength={SITE_TAG_MAX}
          data-site-tag-input
          className="w-24 shrink-0 bg-white/5 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-white/40 placeholder:text-white/30"
        />
        {SITE_TAG_PRESETS.map((p) => {
          const active = tag === p.value;
          return (
            <button
              key={p.value}
              type="button"
              data-tag-preset={p.value}
              data-active={active ? 'true' : undefined}
              onClick={() => setTag(active ? '' : p.value)}
              className={`shrink-0 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border transition-colors ${p.btnCls} ${
                active ? p.btnActiveCls : ''
              }`}
            >
              {p.label}
            </button>
          );
        })}
        <label className="flex items-center gap-1.5 text-[11px] text-white/60 shrink-0 cursor-pointer select-none ml-auto">
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
  dragging = false,
  guardClick,
}: {
  site: SiteEntry;
  groupId: string;
  store: LocalStore;
  editing: boolean;
  onEndEdit: () => void;
  onSiteMenu: (e: React.MouseEvent, site: SiteEntry) => void;
  /** 编辑表单在网格中的跨列类（3 列布局时跨满 3 列） */
  formSpanCls: string;
  /** 组内拖动排序（第三十八轮）：本行是否为被拖行（原位占位样式） */
  dragging?: boolean;
  /** 点击守卫：刚拖完时吞掉紧随的 click，避免顺带打开站点 */
  guardClick?: () => boolean;
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
      data-site-drag-id={site.id}
      style={dragging ? SITE_DRAG_PLACEHOLDER_STYLE : undefined}
      onContextMenu={(e) => onSiteMenu(e, site)}
      className="flex items-center gap-2.5 px-2 py-[7px] rounded-2xl hover:bg-white/6 transition-colors relative"
    >
      <button
        onClick={() => {
          if (guardClick?.()) return;
          window.open(site.url, '_blank');
        }}
        className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
      >
        <SiteLogo logo={siteIconSrc(site)} name={site.name} size={34} imgSize={23} grayscale={site.dead} />
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
        <SiteTagBadge site={site} />
      </button>
    </div>
  );
}

/**
 * B 型列表卡的展开态主体：卡内可滚动的行式列表 + 添加网站。
 * 组操作（改名/删组/切形态/失效提示）第十二轮起上移到 GroupListCard 的标题行，与组名同一行。
 * 只有 B 卡在主页原地展开；C 卡走 GroupPanel 弹窗，不用这里。
 * 列数（第二十八轮修订）：展开态站点网格恒为 3 列，不随卡片宽度设置（1 栏/2 栏）变化
 * （第十六轮⑥曾按 colSpan 分档 3/2 列，用户实测 1 栏宽展开只有 2 列太空，改恒 3 列）；
 * 收起态列数在 GroupListCard 里另行按宽度走，不受此处影响。
 * 站点行操作（第十六轮⑤）：悬停无图标，右键弹站点菜单（打开/编辑/删除），编辑态由这里控制。
 */
export default function GroupExpandedBody({
  group,
  store,
}: {
  group: NavGroup;
  store: LocalStore;
  /** 兼容既有调用方传参：展开态列数已恒为 3 列，不再使用此值 */
  colSpan?: 1 | 2;
}) {
  const [adding, setAdding] = useState(false);
  const [menu, setMenu] = useState<SiteMenuState | null>(null);
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const sorted = sortSites(group.sites);
  /** 组内拖动排序（第三十八轮）：行网格内拖动换位，置顶区/普通区不跨区；
   * 本区在 data-nodrag 滚动区内，按下不会触发整卡拖拽排序，两套手势互不干扰 */
  const siteDrag = useSiteDragSort({
    sites: sorted,
    onReorder: (ids) => store.reorderSites(group.id, ids),
  });

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
        <div
          className="grid grid-cols-1 gap-x-2 content-start min-[480px]:grid-cols-3"
          data-expanded-grid
          onPointerDown={siteDrag.onContainerPointerDown}
          onDragStart={siteDrag.onContainerDragStart}
        >
          {siteDrag.items.map((site) => (
            <React.Fragment key={site.id ?? site.name}>
              <EditableSiteRow
                site={site}
                groupId={group.id}
                store={store}
                editing={editingSiteId !== null && editingSiteId === site.id}
                onEndEdit={() => setEditingSiteId(null)}
                onSiteMenu={handleSiteMenu}
                formSpanCls="col-span-1 min-[480px]:col-span-3"
                dragging={siteDrag.isDragging(site)}
                guardClick={siteDrag.consumeSuppressClick}
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

      {/* 组内拖动排序的浮动快照（第三十八轮） */}
      {siteDrag.dragLayer}

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
