import React from 'react';
import { motion } from 'motion/react';
import { Pin } from 'lucide-react';
import { sortSites, type NavGroup } from '../../data/groups';
import type { LocalStore } from '../../store/localStore';
import { SiteLogo } from './Card';
import GroupExpandedBody from './GroupExpanded';

/**
 * B 型 · 编组列表卡（收起态占格由右键布局决定：默认 2 栏 × 2x）
 * 站点行式排布（图标 + 名称 + 一句介绍 + 标签，同旧站 AI 导航）。
 * 收起只显示站点：2 栏时 2 列 × 4 行 = 8 个，1 栏时单列 4 个；卡面无展开按钮行，
 * 点卡面任意位置（站点与组内控件除外，均已阻止冒泡）原地展开 / 收起——不弹窗、不变纯图标。
 * 展开后站点在卡内滚动区域里继续以行式呈现，末尾有虚线「增加网站」格子。
 */
export default function GroupListCard({
  group,
  expanded,
  onToggleExpand,
  store,
  colSpan = 2,
  delay = 0,
}: {
  group: NavGroup;
  expanded: boolean;
  onToggleExpand: (group: NavGroup) => void;
  store: LocalStore;
  /** 收起态宽度（右键布局）：1 栏时站点改单列、显示 4 个；2 栏时 2 列、显示 8 个 */
  colSpan?: 1 | 2;
  delay?: number;
}) {
  const sorted = sortSites(group.sites);
  const visibleCount = colSpan === 1 ? 4 : 8;
  const rows = sorted.slice(0, visibleCount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      onClick={() => onToggleExpand(group)}
      className="glass-panel glass-panel-hover rounded-[28px] h-full p-4 sm:p-5 flex flex-col overflow-hidden transition-colors cursor-pointer"
    >
      {/* 标题行 */}
      <div className="flex items-center justify-between gap-2 mb-2 shrink-0">
        <h3 className="font-semibold text-base sm:text-lg tracking-tight">{group.name}</h3>
        <span className="text-[11px] text-white/40 shrink-0">编组 · {group.sites.length} 个站点</span>
      </div>

      {expanded ? (
        <GroupExpandedBody group={group} store={store} />
      ) : (
        /* 收起态：只显示站点（无底部横线、无「展开全部」字样，整卡点击展开） */
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className={`grid gap-x-2 content-start ${colSpan === 1 ? 'grid-cols-1' : 'grid-cols-1 min-[480px]:grid-cols-2'}`}>
            {rows.map((site) => (
              <button
                key={site.id ?? site.name}
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(site.url, '_blank');
                }}
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
      )}
    </motion.div>
  );
}
