import React from 'react';
import { motion } from 'motion/react';
import { groupIcon, siteLogoFallback, sortSites, type NavGroup, type SiteEntry } from '../../data/groups';

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
 *   排数 = 高度（1x 一排、2x 两排）；未展示完时图标区右端加渐隐罩作提示，不再写数字（总数在标题行已有）
 */
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
  /** 右键布局高度：1x 一排图标、2x 两排图标 */
  heightUnits?: 1 | 2;
}) {
  const sorted = sortSites(group.sites);
  const perRow = colSpan === 1 ? 7 : 11;
  const rowCount = heightUnits === 2 ? 2 : 1;
  const faceSites = sorted.slice(0, perRow * rowCount);
  const hasMore = group.sites.length > faceSites.length;
  const iconRows: SiteEntry[][] = [];
  for (let i = 0; i < faceSites.length; i += perRow) iconRows.push(faceSites.slice(i, i + perRow));
  const tabColor = group.tabColor?.trim() ? group.tabColor.trim() : '';

  const openSite = (e: React.MouseEvent, site: SiteEntry) => {
    e.stopPropagation();
    window.open(site.url, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      onClick={() => onOpen(group)}
      whileHover={{ y: -3 }}
      className="relative w-full h-full text-left group/card cursor-pointer"
      role="button"
      aria-label={`${group.name} 编组`}
    >
      {/* 小角（标签凸起）：从卡身后探出，与卡身同色系一体；设了 tabColor 时按组色填充（含同色描边，避免浮在亮背景上丢边）。
          clipPath 裁掉下 7px：卡身透明后，原先被卡身压住的小角下截会透出来，故只保留上沿以上的可见轮廓（与透明化前的外观一致） */}
      <div
        data-tab-bump
        className="absolute top-0 left-[18px] h-[20px] w-[46%] max-w-[150px] rounded-t-[13px] border border-b-0"
        style={{
          backgroundColor: tabColor || '#26262e',
          borderColor: tabColor || 'rgba(255,255,255,0.1)',
          clipPath: 'inset(0 0 7px 0)',
        }}
      />

      {/* 卡身：四角完整的圆角矩形，底色为 B 卡同款半透明（.glass-panel 同数值 rgba(30,30,35,0.4) + blur(24px)，内联实现不动 index.css），
          悬停只提亮描边，不改变底色 */}
      <div
        data-stack-body
        style={{ background: 'rgba(30, 30, 35, 0.4)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
        className="absolute inset-x-0 bottom-0 top-[13px] z-10 rounded-[22px] border border-white/10 shadow-xl shadow-black/30 transition-colors group-hover/card:border-white/[0.18] px-4 pt-3.5 pb-4 flex flex-col overflow-hidden"
      >
        {/* 标题行：组图标瓷砖 + 组名；右侧小字「N 个站点」 */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-[30px] h-[30px] rounded-[9px] bg-white flex items-center justify-center overflow-hidden shrink-0">
            {group.sites.length > 0 ? (
              <img
                src={groupIcon(group)}
                alt={group.name}
                loading="lazy"
                className="w-[19px] h-[19px] object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <span className="text-slate-400 text-[13px] font-bold">{group.name.charAt(0)}</span>
            )}
          </div>
          <h3 className="flex-1 min-w-0 font-bold text-[15px] tracking-tight truncate">{group.name}</h3>
          <span className="text-[11px] text-white/40 shrink-0">{group.sites.length} 个站点</span>
        </div>

        {/* 口线：标题行下的一条分隔线，暗示文件夹的开口 */}
        <div className="mt-3 h-px bg-white/[0.08] shrink-0" />

        {/* 底部图标区（主角）：按布局分排（1x 一排 / 2x 两排），瓷砖可点击直达、悬停放大；
            未展示完时右端渐隐罩提示（无 +N 数字）。瓷砖 flex-1 自适应：1 栏 7 个时自动缩小整排放下，宽卡时封顶 48px */}
        <div className="mt-auto pt-3 relative">
          <div className="flex flex-col gap-1.5">
            {iconRows.map((rowSites, ri) => (
              <div key={ri} data-icon-row className="flex items-end gap-1.5">
                {rowSites.map((site) => (
                  <button
                    key={site.id ?? site.name}
                    type="button"
                    title={site.name}
                    data-face-site={site.name}
                    onClick={(e) => openSite(e, site)}
                    className="group/face flex-1 max-w-[48px] rounded-[13px] hover:z-20"
                  >
                    <span className="block w-full aspect-square rounded-[13px] bg-white overflow-hidden transition-transform duration-150 group-hover/face:scale-110">
                      <img
                        src={site.logo}
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
                ))}
              </div>
            ))}
          </div>
          {group.sites.length === 0 && <span className="text-[11px] text-white/35">点开添加第一个网站</span>}
          {hasMore && (
            <div
              data-icon-fade
              className="pointer-events-none absolute inset-y-0 right-0 w-12 z-10"
              style={{
                background:
                  'linear-gradient(to right, rgba(23,23,29,0) 0%, rgba(23,23,29,0.55) 55%, rgba(23,23,29,0.92) 100%)',
              }}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
