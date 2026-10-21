import React from 'react';
import { motion } from 'motion/react';
import { Pin, ChevronDown, ChevronUp } from 'lucide-react';
import { sortSites, type NavGroup } from '../../data/groups';
import type { LocalStore } from '../../store/localStore';
import { SiteLogo } from './Card';
import GroupExpandedBody from './GroupExpanded';

const COLLAPSED_COUNT = 8;

/**
 * B 型 · 编组列表卡（默认跨 2 栏）
 * 站点 2 列行式排布（图标 + 名称 + 一句介绍 + 标签，同旧站 AI 导航）。
 * 收起显示前 8 个（2 列 × 4 行）；点「展开全部」卡片原地向下展开，
 * 其余站点在卡内滚动区域里继续以行式呈现——不弹窗、不变纯图标。
 */
export default function GroupListCard({
  group,
  expanded,
  onToggleExpand,
  store,
  delay = 0,
}: {
  group: NavGroup;
  expanded: boolean;
  onToggleExpand: (group: NavGroup) => void;
  store: LocalStore;
  delay?: number;
}) {
  const sorted = sortSites(group.sites);
  const rows = sorted.slice(0, COLLAPSED_COUNT);

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

      {expanded ? (
        <GroupExpandedBody group={group} store={store} />
      ) : (
        <>
          {/* 收起态：2 列行式，前 8 个 */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-x-2 content-start">
              {rows.map((site) => (
                <button
                  key={site.id ?? site.name}
                  onClick={() => window.open(site.url, '_blank')}
                  className="flex items-center gap-2.5 px-2 py-[7px] rounded-2xl hover:bg-white/6 text-left transition-colors"
                >
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
              ))}
            </div>
          </div>

          {/* 卡尾：原地展开 */}
          <button
            onClick={() => onToggleExpand(group)}
            className="mt-2 pt-3 border-t border-white/10 w-full flex items-center justify-center gap-1 text-xs font-medium text-indigo-300 hover:text-indigo-200 transition-colors shrink-0"
          >
            展开全部 {group.sites.length} 个 <ChevronDown size={13} />
          </button>
        </>
      )}

      {expanded && (
        <button
          onClick={() => onToggleExpand(group)}
          className="mt-2 pt-3 border-t border-white/10 w-full flex items-center justify-center gap-1 text-xs font-medium text-white/50 hover:text-white/80 transition-colors shrink-0"
        >
          收起 <ChevronUp size={13} />
        </button>
      )}
    </motion.div>
  );
}
