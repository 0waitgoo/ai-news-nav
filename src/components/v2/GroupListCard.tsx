import React from 'react';
import { motion } from 'motion/react';
import { Pin, ChevronRight } from 'lucide-react';
import { sortSites, type NavGroup } from '../../data/groups';
import { SiteLogo } from './Card';

const MAX_ROWS = 8;

/**
 * B 型 · 编组列表卡（默认跨 2 栏）
 * 组内站点成行：图标 + 名称 + 一句介绍；点行直达站点，点「展开全部」打开 D 面板。
 */
export default function GroupListCard({
  group,
  onExpand,
  delay = 0,
}: {
  group: NavGroup;
  onExpand: (group: NavGroup) => void;
  delay?: number;
}) {
  const sorted = sortSites(group.sites);
  const rows = sorted.slice(0, MAX_ROWS);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="glass-panel glass-panel-hover rounded-[28px] h-full p-4 sm:p-5 flex flex-col overflow-hidden transition-colors"
    >
      {/* 标题行 */}
      <div className="flex items-center justify-between gap-2 mb-2 shrink-0">
        <h3 className="font-semibold text-base sm:text-lg tracking-tight">{group.name}</h3>
        <span className="text-[11px] text-white/40 shrink-0">编组 · {group.sites.length} 个站点</span>
      </div>

      {/* 站点行 */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col justify-start">
        {rows.map((site) => (
          <button
            key={site.name}
            onClick={() => window.open(site.url, '_blank')}
            className="flex items-center gap-3 px-2 py-[7px] rounded-2xl hover:bg-white/6 text-left transition-colors relative"
          >
            <SiteLogo logo={site.logo} name={site.name} size={36} imgSize={24} grayscale={site.dead} />
            <span className="flex-1 min-w-0">
              <span className="flex items-center gap-1.5">
                <span className={`text-sm font-semibold truncate ${site.dead ? 'text-white/45' : ''}`}>{site.name}</span>
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
        ))}
      </div>

      {/* 卡尾：展开全部 */}
      <button
        onClick={() => onExpand(group)}
        className="mt-2 pt-3 border-t border-white/10 w-full flex items-center justify-center gap-1 text-xs font-medium text-indigo-300 hover:text-indigo-200 transition-colors shrink-0"
      >
        点击展开全部 · 纯图标视图 <ChevronRight size={13} />
      </button>
    </motion.div>
  );
}
