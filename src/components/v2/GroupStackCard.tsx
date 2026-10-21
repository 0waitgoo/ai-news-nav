import React from 'react';
import { motion } from 'motion/react';
import { groupIcon, siteLogoFallback, sortSites, type NavGroup, type SiteEntry } from '../../data/groups';

/**
 * C 型 · 编组堆叠卡（默认 1 栏 × 1X）——「极简文件夹」卡面（第十二轮，用户在第三轮线稿中选定方案四）
 * - 去掉纸片：卡身为四角完整的圆角矩形；上沿左端一个与卡身一体的小角（标签凸起，从卡身后探出、同色系），
 *   小角颜色可按组设置（group.tabColor），未设置时为默认同色灰——用户靠颜色一眼认组
 * - 标题行：组图标瓷砖 + 组名（粗体），右侧小字「N 个站点」；标题行下有一条口线（分隔线）暗示文件夹口
 * - 不再渲染副标题行（subtitle 字段仅保留在数据模型兼容老数据）
 * - 底部图标排是主角：前 5 站大图标瓷砖（置顶优先 + 频率序）可点击直达、悬停放大，超出以「+N」收尾（点击开弹窗）
 * - 卡面其余区域点击打开组弹窗（GroupPanel）
 * - 第十三轮：卡身底色改全透明，页面背景（预设渐变/本地图片）直接透出；轮廓靠描边 + 口线 + 外阴影维持可辨
 */
export default function GroupStackCard({
  group,
  onOpen,
  delay = 0,
}: {
  group: NavGroup;
  onOpen: (group: NavGroup) => void;
  delay?: number;
}) {
  const sorted = sortSites(group.sites);
  const faceSites = sorted.slice(0, 5);
  const extra = group.sites.length - faceSites.length;
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

      {/* 卡身：四角完整的圆角矩形，底色全透明（透出页面背景），轮廓靠描边 + 口线 + 外阴影；悬停只提亮描边，不回填底色 */}
      <div className="absolute inset-x-0 bottom-0 top-[13px] z-10 rounded-[22px] border border-white/10 shadow-xl shadow-black/30 transition-colors group-hover/card:border-white/[0.18] px-4 pt-3.5 pb-4 flex flex-col overflow-hidden">
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

        {/* 底部图标排（主角）：前 5 站大图标瓷砖，可点击直达；超出以 +N 收尾（点击冒泡开弹窗） */}
        <div className="mt-auto pt-3 flex items-end gap-1.5">
          {faceSites.map((site) => (
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
          {extra > 0 && <span className="text-[13px] font-semibold text-white/45 ml-1 pb-1">+{extra}</span>}
          {group.sites.length === 0 && <span className="text-[11px] text-white/35">点开添加第一个网站</span>}
        </div>
      </div>
    </motion.div>
  );
}
