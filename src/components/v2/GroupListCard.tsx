import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Pin, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { GROUP_NAME_MAX, sortSites, textCharCount, type NavGroup } from '../../data/groups';
import type { LocalStore } from '../../store/localStore';
import { SiteLogo } from './Card';
import GroupExpandedBody, { SiteTagBadge } from './GroupExpanded';

/**
 * B 型 · 编组列表卡（收起态占格由右键布局决定：默认 2 栏 × 2x）
 * 站点行式排布（图标 + 名称 + 一句介绍 + 标签，同旧站 AI 导航）。
 * 收起只显示站点：可见数按布局算（栏数 × 每列行数，2x 每列 4 行、1x 每列 2 行）。
 * 展开 / 收起只由明确按钮控制（第十六轮修正，整卡点击太容易误触）：
 * 唯一入口是头部组名后的小胶囊按钮——收起态显示「展开」、展开态显示「收起」（第三十/三十一轮最终形态；
 * 第十六轮的卡底渐隐提示条与卡底展开小按钮、第三十轮前的卡底收起条均已退役）。点卡面空白处不展开也不收起，点站点行仍是打开网站。
 * 展开后站点在卡内滚动区域里继续以行式呈现，末尾有虚线「增加网站」格子。
 * 第十二轮头部调整：标题行 = 组名 +「· N 个站点」小字（原右上角「编组 · N 个站点」已删除）；该计数第三十轮已删除，收起态标题行同样不带计数；
 * 展开态的组操作（改组名 / 删组 / 详细列表↔文件夹式切换）上移到标题行右侧，与组名同一行。
 * 第十六轮：收起态可见数按布局（栏数 × 高度行数）计算，溢出时卡底渐隐 +「还有 N 个站点」提示。
 * 第二十轮：2 栏宽时收起态网格也统一 3 列（与展开态一致，用户明确不要收起时 2 列）；1 栏保持单列。
 */
export default function GroupListCard({
  group,
  expanded,
  onToggleExpand,
  store,
  colSpan = 2,
  heightUnits = 2,
  delay = 0,
}: {
  group: NavGroup;
  expanded: boolean;
  onToggleExpand: (group: NavGroup) => void;
  store: LocalStore;
  /** 收起态宽度（右键布局）：1 栏时站点单列；2 栏时 3 列（第二十轮，与展开态统一） */
  colSpan?: 1 | 2;
  /** 收起态高度（右键布局）：2x 每列 4 行；1x 每列 2 行——实际可见数按此计算，溢出提示的 N 才准确 */
  heightUnits?: 1 | 2;
  delay?: number;
}) {
  const sorted = sortSites(group.sites);
  const cols = colSpan === 1 ? 1 : 3;
  const rowsPerCol = heightUnits === 2 ? 4 : 2;
  const visibleCount = cols * rowsPerCol;
  const rows = sorted.slice(0, visibleCount);

  // 展开态组操作（原在展开体顶部一行，第十二轮上提到标题行）
  const [renaming, setRenaming] = useState(false);
  const [groupName, setGroupName] = useState(group.name);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="glass-panel glass-panel-hover relative rounded-[28px] h-full p-4 sm:p-5 flex flex-col overflow-hidden transition-colors"
    >
      {/* 标题行：组名（展开时其后跟「收起」胶囊按钮）；展开时右侧同行放组操作（标题行内点击不触发卡片展开/收起） */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mb-2 shrink-0" onClick={expanded ? stop : undefined}>
        {expanded && renaming ? (
          <span className="flex items-center gap-2 min-w-0">
            <span className="relative block">
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                autoFocus
                maxLength={GROUP_NAME_MAX}
                data-group-name-input
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && groupName.trim()) {
                    store.renameGroup(group.id, groupName.trim());
                    setRenaming(false);
                  }
                }}
                className="w-40 bg-white/5 border border-white/15 rounded-xl px-3 py-1.5 pr-10 text-sm outline-none focus:border-indigo-400/60"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-white/30 pointer-events-none">
                {textCharCount(groupName)}/{GROUP_NAME_MAX}
              </span>
            </span>
            <button
              onClick={() => {
                if (groupName.trim()) store.renameGroup(group.id, groupName.trim());
                setRenaming(false);
              }}
              className="text-[11px] px-2.5 py-1.5 rounded-lg bg-indigo-500/80 text-white shrink-0"
            >
              保存
            </button>
            <button onClick={() => setRenaming(false)} className="text-[11px] px-2.5 py-1.5 rounded-lg bg-white/10 text-white/70 shrink-0">
              取消
            </button>
          </span>
        ) : (
          <>
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-semibold text-base sm:text-lg tracking-tight truncate">{group.name}</h3>
              {/* 组名后唯一的小胶囊按钮（第三十/三十一轮最终形态）：收起态 =「展开」、展开态 =「收起」，同位置同样式；
                  「· N 个站点」计数已删，卡底部不再有任何展开/收起条（第十六轮底部渐隐提示条与卡底展开小按钮就此退役） */}
              <button
                type="button"
                {...(expanded ? { 'data-collapse-btn': true } : { 'data-expand-btn': true })}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand(group);
                }}
                className="flex items-center gap-1 text-[11px] text-white/50 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3 py-1 transition-colors cursor-pointer shrink-0"
              >
                {expanded ? (
                  <>收起 <ChevronUp size={13} /></>
                ) : (
                  <>展开 <ChevronDown size={13} /></>
                )}
              </button>
            </div>
            {expanded && (
              <span className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => {
                    setGroupName(group.name);
                    setRenaming(true);
                  }}
                  className="flex items-center gap-1 text-[11px] text-white/45 hover:text-white/80 transition-colors"
                >
                  <Pencil size={11} /> 改组名
                </button>
                {confirmDelete ? (
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-red-300">删除整个编组？</span>
                    <button onClick={() => store.deleteGroup(group.id)} className="px-2 py-1 rounded-md bg-red-500/80 text-white font-medium">
                      确认删除
                    </button>
                    <button onClick={() => setConfirmDelete(false)} className="px-2 py-1 rounded-md bg-white/8 text-white/70">
                      算了
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-1 text-[11px] text-white/45 hover:text-red-300 transition-colors"
                  >
                    <Trash2 size={11} /> 删组
                  </button>
                )}
                {/* 形态切换：详细列表（B） ↔ 文件夹式（C） */}
                <span className="flex items-center rounded-lg bg-white/5 border border-white/10 overflow-hidden">
                  <button
                    onClick={() => store.setGroupDisplay(group.id, 'list')}
                    title="详细列表卡：在主页原地展开成行式列表"
                    className={`text-[11px] px-2.5 py-1 transition-colors ${
                      group.display === 'list' ? 'bg-indigo-500/70 text-white font-medium' : 'text-white/50 hover:text-white/85'
                    }`}
                  >
                    详细列表
                  </button>
                  <button
                    onClick={() => store.setGroupDisplay(group.id, 'stack')}
                    title="文件夹式卡：紧凑堆叠卡，点开弹窗看图标"
                    className={`text-[11px] px-2.5 py-1 transition-colors ${
                      group.display === 'stack' ? 'bg-indigo-500/70 text-white font-medium' : 'text-white/50 hover:text-white/85'
                    }`}
                  >
                    文件夹式
                  </button>
                </span>
                {/* 失效链接汇总提示已按用户要求删除（第二十九轮）：站点行自身的「失效」徽标保留 */}
              </span>
            )}
          </>
        )}
      </div>

      {expanded ? (
        <GroupExpandedBody group={group} store={store} colSpan={colSpan} />
      ) : (
        /* 收起态：只显示站点（无底部横线、无「展开全部」字样、无底部渐隐）；展开靠头部组名后的「展开」按钮，不靠整卡点击 */
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-hidden">
          <div data-collapsed-grid className={`grid gap-x-2 content-start ${colSpan === 1 ? 'grid-cols-1' : 'grid-cols-1 min-[480px]:grid-cols-3'}`}>
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
                <SiteTagBadge site={site} />
              </button>
            ))}
          </div>
          </div>
          {/* 收起态列表到底自然结束：底部渐隐提示条与卡底「展开」小按钮已删除（第三十一轮），展开入口统一在头部 */}
        </div>
      )}
    </motion.div>
  );
}
