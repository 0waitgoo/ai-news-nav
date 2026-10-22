import React from 'react';
import { motion } from 'motion/react';
import { groupIcon, siteIconSrc, siteLogoFallback, sortSites, type NavGroup, type SiteEntry } from '../../data/groups';

/**
 * C 型 · 编组堆叠卡（默认 1 栏 × 1X）——「极简文件夹」卡面（第十二轮，用户在第三轮线稿中选定方案四）
 * - 去掉纸片：卡身为四角完整的圆角矩形；上沿左端一个与卡身一体的小角（标签凸起，从卡身后探出、同色系），
 *   小角颜色可按组设置（group.tabColor），未设置时为默认同色灰——用户靠颜色一眼认组
 * - 标题行：组图标瓷砖 + 组名（粗体），右侧小字「N 个站点」；标题行下有一条口线（分隔线）暗示文件夹口
 * - 不再渲染副标题行（subtitle 字段仅保留在数据模型兼容老数据）
 * - 底部图标排是主角：图标瓷砖（置顶优先 + 频率序）可点击直达、悬停放大；卡面其余区域点击打开组弹窗（GroupPanel）
 * - 第十三轮（纠正）：卡身底色不用全透明，改回 B 卡（GroupListCard）同款半透明底——
 *   与 .glass-panel 同数值：rgba(30, 30, 35, 0.4) + backdrop-blur(24px)，页面背景半透出、两型卡观感一致
 * - 第十六轮：与 B 卡一样可右键改尺寸（groupLayouts 按组存，缺省 1 栏 × 1x）；
 *   图标排去掉「+N」尾巴——1 栏每排 7 个（瓷砖 flex 自适应缩小以整排放下），2 栏每排按 48px 瓷砖放宽到 11 个；
 *   未展示完时图标区右端加渐隐罩作提示，不再写数字（总数在标题行已有）
 * - 第十七轮：去掉卡身外投影（原 shadow-xl shadow-black/30），卡面走扁平；图标瓷砖经常态/悬停态核查本就无阴影类，未动
 * - 第二十二轮：卡高 2x 时图标区改 5 列网格——瓷砖从左到右、从上往下逐行排，网格撑满卡宽（左右对齐）、
 *   间距比 1x 更宽松、瓷砖略放大；可见 2 行共 10 个，再多底部渐隐提示（1x 规则不变）
 * - 第二十一轮：卡框（StackCardFrame）与瓷砖区（StackSiteTiles）抽成共享组件，组合卡（ComboCard）复用同一套外观与排版规则
 */

/** 组合卡专用小角：造型与普通 C 卡小角一致（圆角上沿 + clipPath 裁下 7px），按左右半区定位、宽度略收，两块之间留间隙 */
function ComboTabBump({ color, side }: { color: string; side: 'left' | 'right' }) {
  const c = color?.trim() ? color.trim() : '';
  return (
    <div
      data-tab-bump
      data-ear-side={side}
      className="absolute top-0 h-[20px] w-[40%] max-w-[140px] rounded-t-[13px] border border-b-0 pointer-events-none"
      style={{
        backgroundColor: c || '#26262e',
        borderColor: c || 'rgba(255,255,255,0.1)',
        clipPath: 'inset(0 0 7px 0)',
        ...(side === 'left' ? { left: 18 } : { left: 'calc(50% + 8px)' }),
      }}
    />
  );
}

/** C 卡卡框：小角 + 半透明卡身。普通 C 卡与组合卡共用，children 渲染在卡身内（标题行/口线/瓷砖区由调用方组织） */
export function StackCardFrame({
  tabColor,
  tabEars,
  onClick,
  delay = 0,
  ariaLabel,
  children,
  rootProps,
}: {
  /** 小角填充色（已解析：空字符串 = 默认同色灰） */
  tabColor: string;
  /** 组合卡专用（第三十三轮）：左右两组各自的 tabColor，传入时渲染两个小角（各对齐一个 tab、颜色固定不随激活 tab 变），忽略 tabColor */
  tabEars?: [string, string];
  onClick?: () => void;
  delay?: number;
  ariaLabel: string;
  children: React.ReactNode;
  /** 透传到根节点的数据属性（如组合卡的 data-combo-card） */
  rootProps?: Record<string, string>;
}) {
  const color = tabColor?.trim() ? tabColor.trim() : '';
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      onClick={onClick}
      whileHover={{ y: -3 }}
      className="relative w-full h-full text-left group/card cursor-pointer"
      role="button"
      aria-label={ariaLabel}
      {...rootProps}
    >
      {/* 小角（标签凸起）：从卡身后探出，与卡身同色系一体；设了 tabColor 时按组色填充（含同色描边，避免浮在亮背景上丢边）。
          clipPath 裁掉下 7px：卡身透明后，原先被卡身压住的小角下截会透出来，故只保留上沿以上的可见轮廓（与透明化前的外观一致） */}
      {tabEars ? (
        <>
          <ComboTabBump color={tabEars[0]} side="left" />
          <ComboTabBump color={tabEars[1]} side="right" />
        </>
      ) : (
        <div
          data-tab-bump
          className="absolute top-0 left-[18px] h-[20px] w-[46%] max-w-[150px] rounded-t-[13px] border border-b-0"
          style={{
            backgroundColor: color || '#26262e',
            borderColor: color || 'rgba(255,255,255,0.1)',
            clipPath: 'inset(0 0 7px 0)',
          }}
        />
      )}

      {/* 卡身：四角完整的圆角矩形，底色为 B 卡同款半透明（.glass-panel 同数值 rgba(30,30,35,0.4) + blur(24px)，内联实现不动 index.css），
          悬停只提亮描边，不改变底色 */}
      <div
        data-stack-body
        style={{ background: 'rgb(var(--group-card-rgb) / var(--group-card-alpha, 0.4))', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
        className="group-card-scope absolute inset-x-0 bottom-0 top-[13px] z-10 rounded-[22px] border border-white/10 transition-colors group-hover/card:border-white/[0.18] px-4 pt-3.5 pb-4 flex flex-col overflow-hidden"
      >
        {children}
      </div>
    </motion.div>
  );
}

/** 组标题图标瓷砖（头图标规则与普通 C 卡一致：组首站图标，无站点时回落组名首字） */
export function StackGroupIcon({ group, size = 30 }: { group: NavGroup; size?: number }) {
  return (
    <div
      className="rounded-[9px] bg-white flex items-center justify-center overflow-hidden shrink-0"
      style={{ width: size, height: size }}
    >
      {group.sites.length > 0 ? (
        <img
          src={groupIcon(group)}
          alt={group.name}
          loading="lazy"
          className="object-contain"
          style={{ width: size * 0.63, height: size * 0.63 }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      ) : (
        <span className="text-slate-400 text-[13px] font-bold">{group.name.charAt(0)}</span>
      )}
    </div>
  );
}

/** 单个站点瓷砖（白底圆角块 + 站点图标），点击直达并阻止冒泡 */
function SiteTile({ site, className }: { site: SiteEntry; className: string }) {
  const openSite = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(site.url, '_blank');
  };
  return (
    <button type="button" title={site.name} data-face-site={site.name} onClick={openSite} className={className}>
      <span className="block w-full aspect-square rounded-[13px] bg-white overflow-hidden transition-transform duration-150 group-hover/face:scale-110">
        <img
          src={siteIconSrc(site)}
          alt={site.name}
          loading="lazy"
          className={`w-full h-full object-contain p-[16%] ${site.dead ? 'grayscale opacity-60' : ''}`}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (!target.src.includes('dicebear')) target.src = siteLogoFallback(site.name);
          }}
        />
      </span>
    </button>
  );
}

/**
 * C 卡底部瓷砖区（普通 C 卡与组合卡共用同一套排版规则）：
 * - 1x：单行 flex，最多 5 个（第四十六轮），整行在图标区内水平 + 垂直居中，无渐隐
 * - 2x（第二十二轮）：5 列网格撑满卡宽、从上往下逐行排，可见 2 行共 10 个，未展示完底部渐隐
 */
export function StackSiteTiles({
  group,
  colSpan = 1,
  heightUnits = 1,
}: {
  group: NavGroup;
  colSpan?: 1 | 2;
  heightUnits?: 1 | 2;
}) {
  const sorted = sortSites(group.sites);

  if (heightUnits === 2) {
    const faceSites = sorted.slice(0, 10);
    const hasMore = group.sites.length > faceSites.length;
    return (
      <div className="mt-auto pt-3 relative">
        {group.sites.length === 0 ? (
          <span className="text-[11px] text-white/35">点开添加第一个网站</span>
        ) : (
          <div data-tiles-grid="5" className="grid grid-cols-5 gap-2.5">
            {faceSites.map((site) => (
              <React.Fragment key={site.id ?? site.name}>
                <SiteTile site={site} className="group/face w-full rounded-[13px] hover:z-20" />
              </React.Fragment>
            ))}
          </div>
        )}
        {hasMore && (
          <div
            data-icon-fade="bottom"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-12 z-10"
            style={{
              background:
                'linear-gradient(to top, rgb(var(--fade-rgb) / 0.92) 0%, rgb(var(--fade-rgb) / 0.55) 55%, rgb(var(--fade-rgb) / 0) 100%)',
            }}
          />
        )}
      </div>
    );
  }

  /* 单行形态（第四十六轮）：最多 5 个图标，整行在图标区内水平 + 垂直居中
     （不足 5 个同样居中，不再靠左）；超出部分只在弹窗里看，单行不再需要右端渐隐。
     2x 的 5 列网格形态不在本轮范围，保持原样（见上方分支） */
  const faceSites = sorted.slice(0, 5);
  return (
    <div className="flex-1 flex flex-col justify-center pt-3 relative">
      <div className="flex flex-col gap-1.5">
        <div data-icon-row className="flex items-center justify-center gap-1.5">
          {faceSites.map((site) => (
            <React.Fragment key={site.id ?? site.name}>
              <SiteTile site={site} className="group/face flex-1 max-w-[48px] rounded-[13px] hover:z-20" />
            </React.Fragment>
          ))}
        </div>
      </div>
      {group.sites.length === 0 && (
        <span className="text-[11px] text-white/35 self-center">点开添加第一个网站</span>
      )}
    </div>
  );
}

export default function GroupStackCard({
  group,
  onOpen,
  delay = 0,
  colSpan = 1,
  heightUnits = 1,
}: {
  group: NavGroup;
  onOpen: (group: NavGroup) => void;
  delay?: number;
  /** 右键布局宽度：1 栏每排 7 个图标；2 栏每排按 48px 瓷砖放宽 */
  colSpan?: 1 | 2;
  /** 右键布局高度：1x 一排图标；2x 改 5 列网格两排（第二十二轮） */
  heightUnits?: 1 | 2;
}) {
  return (
    <StackCardFrame tabColor={group.tabColor ?? ''} onClick={() => onOpen(group)} delay={delay} ariaLabel={`${group.name} 编组`}>
      {/* 标题行：组图标瓷砖 + 组名；右侧小字「N 个站点」 */}
      <div className="flex items-center gap-2.5 min-w-0">
        <StackGroupIcon group={group} />
        <h3 className="flex-1 min-w-0 font-bold text-[15px] tracking-tight truncate">{group.name}</h3>
        <span className="text-[11px] text-white/40 shrink-0">{group.sites.length} 个站点</span>
      </div>

      {/* 口线：标题行下的一条分隔线，暗示文件夹的开口 */}
      <div className="mt-3 h-px bg-white/[0.08] shrink-0" />

      {/* 底部图标区（主角）：瓷砖可点击直达、悬停放大；未展示完以渐隐罩提示（无 +N 数字） */}
      <StackSiteTiles group={group} colSpan={colSpan} heightUnits={heightUnits} />
    </StackCardFrame>
  );
}
