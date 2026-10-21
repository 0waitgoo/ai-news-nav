import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Pin, Pencil, Trash2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { deadCount, sortSites, type NavGroup } from '../../data/groups';
import type { LocalStore } from '../../store/localStore';
import { SiteLogo } from './Card';
import GroupExpandedBody from './GroupExpanded';

/**
 * B 型 · 编组列表卡（收起态占格由右键布局决定：默认 2 栏 × 2x）
 * 站点行式排布（图标 + 名称 + 一句介绍 + 标签，同旧站 AI 导航）。
 * 收起只显示站点：可见数按布局算（栏数 × 每列行数，2x 每列 4 行、1x 每列 2 行）。
 * 展开 / 收起只由明确按钮控制（第十六轮修正，整卡点击太容易误触）：
 * 收起态溢出时底部渐隐提示条本身就是展开按钮，未溢出时卡底有同款「展开」小按钮；
 * 展开态在卡片底部固定一条「收起」按钮。点卡面空白处不展开也不收起，点站点行仍是打开网站。
 * 展开后站点在卡内滚动区域里继续以行式呈现，末尾有虚线「增加网站」格子。
 * 第十二轮头部调整：标题行 = 组名 +「· N 个站点」小字（原右上角「编组 · N 个站点」已删除）；
 * 展开态的组操作（改组名 / 删组 / 详细列表↔文件夹式切换）上移到标题行右侧，与组名同一行。
 * 第十六轮：收起态可见数按布局（栏数 × 高度行数）计算，溢出时卡底渐隐 +「还有 N 个站点」提示。
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
  /** 收起态宽度（右键布局）：1 栏时站点改单列、显示 4 个；2 栏时 2 列、显示 8 个 */
  colSpan?: 1 | 2;
  /** 收起态高度（右键布局）：2x 每列 4 行；1x 每列 2 行——实际可见数按此计算，溢出提示的 N 才准确 */
  heightUnits?: 1 | 2;
  delay?: number;
}) {
  const sorted = sortSites(group.sites);
  const cols = colSpan === 1 ? 1 : 2;
  const rowsPerCol = heightUnits === 2 ? 4 : 2;
  const visibleCount = cols * rowsPerCol;
  const rows = sorted.slice(0, visibleCount);
  /** 收起态未展示的站点数：> 0 时卡底出现渐隐 + 「还有 N 个站点」提示（第十六轮） */
  const hiddenCount = expanded ? 0 : sorted.length - rows.length;
  const dead = deadCount(group);

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
      {/* 标题行：组名 +「· N 个站点」；展开时右侧同行放组操作（标题行内点击不触发卡片展开/收起） */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mb-2 shrink-0" onClick={expanded ? stop : undefined}>
        {expanded && renaming ? (
          <span className="flex items-center gap-2 min-w-0">
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && groupName.trim()) {
                  store.renameGroup(group.id, groupName.trim());
                  setRenaming(false);
                }
              }}
              className="w-40 bg-white/5 border border-white/15 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-indigo-400/60"
            />
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
            <div className="flex items-baseline gap-2 min-w-0">
              <h3 className="font-semibold text-base sm:text-lg tracking-tight truncate">{group.name}</h3>
              <span className="text-[11px] text-white/40 shrink-0">· {group.sites.length} 个站点</span>
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
                {dead > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-red-300/80 shrink-0">
                    <AlertTriangle size={11} /> {dead} 个失效链接 · 已标记（不会自动删除）
                  </span>
                )}
              </span>
            )}
          </>
        )}
      </div>

      {expanded ? (
        <GroupExpandedBody group={group} store={store} colSpan={colSpan} />
      ) : (
        /* 收起态：只显示站点（无底部横线、无「展开全部」字样）；展开靠底部按钮，不靠整卡点击 */
        <div className="flex-1 min-h-0 flex flex-col">
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
          {/* 未溢出时卡底的「展开」小按钮：保证任何 B 卡都有明确的展开入口（溢出时用底部渐隐条按钮） */}
          {hiddenCount === 0 && (
            <div className="shrink-0 flex justify-center pt-1.5">
              <button
                type="button"
                data-expand-btn
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand(group);
                }}
                className="flex items-center gap-1 text-[11px] text-white/50 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3 py-1 transition-colors cursor-pointer"
              >
                展开 <ChevronDown size={13} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 展开态：卡片底部固定的「收起」按钮（第十六轮修正：收起只点这里，不靠整卡点击） */}
      {expanded && (
        <div className="shrink-0 flex justify-center pt-2">
          <button
            type="button"
            data-collapse-btn
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(group);
            }}
            className="flex items-center gap-1 text-[11px] text-white/50 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3 py-1 transition-colors cursor-pointer"
          >
            收起 <ChevronUp size={13} />
          </button>
        </div>
      )}

      {/* 收起态溢出提示 = 展开按钮（第十六轮）：底部渐隐（fade 到卡底深色）整条可点，
          带 ⌄ 图标与 hover 提亮；点它才展开，点卡面其他空白处不展开。全部展示完不出现（改用卡底小「展开」按钮） */}
      {hiddenCount > 0 && (
        <button
          type="button"
          data-overflow-hint
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(group);
          }}
          className="group/hint absolute inset-x-0 bottom-0 h-14 z-10 flex items-end justify-center pb-2.5 cursor-pointer"
          style={{
            background:
              'linear-gradient(to top, rgba(17,17,23,0.94) 0%, rgba(17,17,23,0.72) 52%, rgba(17,17,23,0) 100%)',
          }}
        >
          <span className="flex items-center gap-1 text-[11px] text-white/60 group-hover/hint:text-white transition-colors">
            还有 {hiddenCount} 个站点 <ChevronDown size={13} />
          </span>
        </button>
      )}
    </motion.div>
  );
}
