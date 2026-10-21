import React from 'react';
import { motion } from 'motion/react';
import { groupIcon, siteLogoFallback, sortSites, type NavGroup, type SiteEntry } from '../../data/groups';
import { SiteLogo } from './Card';

/**
 * C 型 · 编组堆叠卡（默认 1 栏 × 1X）—— 文件夹卡面（第六轮，用户拍板原方案二造型 + 5 条修订）
 * - 文件夹造型：左上标签页（组图标 + 组名），身子是四角完整的圆角矩形，衔接无缺口/断角
 * - 右上露出两张纸：印排序最靠前两站的真实 LOGO（置顶优先 + 频率），可点击直达，悬停 LOGO 放大
 * - 第二行显示自定义副标题（group.subtitle），未设置时回落「N 个站点」；不显示置顶小字行
 * - 底部一排前 5 站真实 ICON（可点击直达），超出以「+N」尾块收尾（点击开弹窗）
 * - 卡面其余区域点击打开组弹窗（GroupPanel）
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
  const paperSites = sorted.slice(0, 2);
  const faceSites = sorted.slice(0, 5);
  const extra = group.sites.length - faceSites.length;
  const subtitle = group.subtitle?.trim() ? group.subtitle.trim() : `${group.sites.length} 个站点`;

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
      {/* 右上露出的两张纸：靠前两站的真实 LOGO，可点击直达、悬停放大 */}
      {paperSites.map((site, i) => (
        <button
          key={site.id ?? site.name}
          type="button"
          title={site.name}
          data-paper-site={site.name}
          onClick={(e) => openSite(e, site)}
          className={`group/paper absolute top-[3px] w-[52px] h-[76px] rounded-[7px] bg-[#f4f4f6] border border-black/10 shadow-lg shadow-black/40 pt-[7px] flex justify-center transition-transform duration-200 hover:z-30 hover:scale-[1.07] ${
            i === 0
              ? 'right-[54px] -rotate-[5deg] z-[1] group-hover/card:-translate-y-[3px]'
              : 'right-[15px] rotate-[4deg] z-[2] group-hover/card:-translate-y-[4px]'
          }`}
        >
          <img
            src={site.logo}
            alt={site.name}
            loading="lazy"
            className={`w-[29px] h-[29px] object-contain transition-transform duration-200 group-hover/paper:scale-125 ${site.dead ? 'grayscale opacity-60' : ''}`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.src.includes('dicebear')) target.src = siteLogoFallback(site.name);
            }}
          />
        </button>
      ))}

      {/* 文件夹身子：四角完整的圆角矩形（实色，不透出背后的纸） */}
      <div className="absolute inset-x-0 bottom-0 top-[42px] z-10 rounded-[22px] bg-[#1e1e24] border border-white/10 shadow-xl shadow-black/30 transition-colors group-hover/card:border-white/[0.18] px-4 pt-3 pb-3.5 flex flex-col overflow-hidden">
        {/* 第二行：自定义副标题（未设置回落「N 个站点」） */}
        <p className="text-[15px] font-semibold tracking-tight text-white/90 truncate pr-1">{subtitle}</p>

        {/* 底部一排：前 5 站真 ICON，可点击直达；超出以 +N 收尾 */}
        <div className="mt-auto pt-2 flex items-center gap-1.5">
          {faceSites.map((site) => (
            <button
              key={site.id ?? site.name}
              type="button"
              title={site.name}
              data-face-site={site.name}
              onClick={(e) => openSite(e, site)}
              className="group/face shrink-0 rounded-xl hover:z-20"
            >
              <span className="block transition-transform duration-150 group-hover/face:scale-110">
                <SiteLogo logo={site.logo} name={site.name} size={34} imgSize={24} grayscale={site.dead} />
              </span>
            </button>
          ))}
          {extra > 0 && <span className="text-xs font-semibold text-white/45 ml-0.5">+{extra}</span>}
          {group.sites.length === 0 && <span className="text-[11px] text-white/35">点开添加第一个网站</span>}
        </div>
      </div>

      {/* 左上标签页：组图标 + 组名，与身子重叠衔接（身子左上角圆角在其下方完整露出） */}
      <div className="absolute top-[8px] left-[12px] z-20 h-[38px] max-w-[58%] flex items-center gap-2 pl-2.5 pr-3.5 rounded-t-[14px] rounded-br-[16px] rounded-bl-[4px] bg-[#26262e] border border-white/10 border-b-0 shadow-md shadow-black/20">
        <div className="w-[22px] h-[22px] rounded-md bg-white flex items-center justify-center overflow-hidden shrink-0">
          {group.sites.length > 0 ? (
            <img
              src={groupIcon(group)}
              alt={group.name}
              loading="lazy"
              className="w-[15px] h-[15px] object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <span className="text-slate-400 text-[11px] font-bold">{group.name.charAt(0)}</span>
          )}
        </div>
        <h3 className="font-semibold text-[13px] tracking-tight truncate">{group.name}</h3>
      </div>
    </motion.div>
  );
}
