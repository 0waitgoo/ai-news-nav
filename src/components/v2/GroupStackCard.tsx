import React from 'react';
import { motion } from 'motion/react';
import { groupIcon, pinnedCount, sortSites, type NavGroup } from '../../data/groups';

/**
 * C 型 · 编组堆叠卡（默认 1 栏 × 1X）
 * 显示组图标、组名、站点数、卡面标注「置顶 N」、常用站首字母块；卡背露层表示组内第 2、3 常用站。
 * 按定稿决策：不显示「最近使用/最近打开」。点击打开 D 面板。
 */
export default function GroupStackCard({
  group,
  onExpand,
  delay = 0,
}: {
  group: NavGroup;
  onExpand: (group: NavGroup) => void;
  delay?: number;
}) {
  const sorted = sortSites(group.sites);
  const topSites = sorted.slice(0, 4);
  const extra = group.sites.length - topSites.length;
  const pinned = pinnedCount(group);

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      onClick={() => onExpand(group)}
      className="relative w-full h-full text-left group/card"
      whileHover={{ y: -3 }}
    >
      {/* 卡背露层：第 2、3 常用站 */}
      <div className="absolute inset-0 translate-x-[7px] -translate-y-[5px] rotate-[1.6deg] rounded-[26px] bg-white/[0.045] border border-white/[0.07] transition-transform group-hover/card:translate-x-[10px] group-hover/card:-translate-y-[7px]" />
      <div className="absolute inset-0 translate-x-[3.5px] -translate-y-[2.5px] rotate-[0.8deg] rounded-[26px] bg-white/[0.07] border border-white/[0.08] transition-transform group-hover/card:translate-x-[5px] group-hover/card:-translate-y-[3.5px]" />

      {/* 卡面 */}
      <div className="relative glass-panel glass-panel-hover rounded-[26px] h-full p-3.5 sm:p-4 flex flex-col overflow-hidden transition-colors">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0">
            <img
              src={groupIcon(group)}
              alt={group.name}
              loading="lazy"
              className="w-7 h-7 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-[15px] sm:text-base tracking-tight truncate">{group.name}</h3>
            <p className="text-[11px] text-white/45 mt-0.5 truncate">
              {group.sites.length} 个站点{pinned > 0 ? ` · 置顶 ${pinned}` : ''}
            </p>
          </div>
        </div>

        {/* 常用站首字母块 */}
        <div className="mt-auto pt-2.5 flex items-center gap-1.5">
          {topSites.map((site) => (
            <span
              key={site.name}
              title={site.name}
              className={`w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-[13px] font-bold shrink-0 ${
                site.dead ? 'bg-red-500/10 text-red-300/70 border border-red-400/20' : 'bg-white/8 text-white/80 border border-white/5'
              }`}
            >
              {site.name.charAt(0).toUpperCase()}
            </span>
          ))}
          {extra > 0 && <span className="text-xs font-semibold text-white/45 ml-0.5">+{extra}</span>}
        </div>
      </div>
    </motion.button>
  );
}
