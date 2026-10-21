import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { LayoutGrid, FolderPlus, X, Plus, Minus } from 'lucide-react';
import type { NavGroup } from '../../data/groups';
import { ALL_WIDGETS, useLocalStore } from '../../store/localStore';
import StickySearch from './StickySearch';
import DataMenu from './DataMenu';
import NewsCard from './NewsCard';
import RankingCard from './RankingCard';
import TaskPlaceholderCard from './TaskPlaceholderCard';
import GroupListCard from './GroupListCard';
import GroupStackCard from './GroupStackCard';
import TrendingWidget from '../widgets/TrendingWidget';

/**
 * V2 新主页（第二轮修订）
 * - 无顶部标题栏：页面直接从吸顶搜索区开始，搜索区旁有低调的「数据」入口（导出/导入）
 * - 4 栏基准网格瀑布流（桌面 4 栏 / 手机 2 栏）；编组点开为卡内原地展开，不弹窗
 * - 全部编组与布局来自本地存储（方案三：本地优先），用户可增删改
 */
export default function HomePage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const store = useLocalStore();
  const { groups, widgets } = store.data;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showWidgetPanel, setShowWidgetPanel] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const listGroups = useMemo(() => groups.filter((g) => g.type === 'list'), [groups]);
  const stackGroups = useMemo(() => groups.filter((g) => g.type === 'stack'), [groups]);
  const [stackA, stackB, stackC, ...stackRest] = stackGroups;
  const hasWidget = (id: (typeof ALL_WIDGETS)[number]['id']) => widgets.includes(id);

  const toggleExpand = (group: NavGroup) => {
    setExpandedId((prev) => (prev === group.id ? null : group.id));
  };

  const openGroupFromSearch = (group: NavGroup) => {
    setExpandedId(group.id);
    window.setTimeout(() => {
      document.getElementById(`v2-group-${group.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const groupWrapperCls = (group: NavGroup) =>
    group.type === 'list'
      ? expandedId === group.id
        ? 'col-span-2 row-span-4'
        : 'col-span-2 row-span-2'
      : expandedId === group.id
        ? 'col-span-2 row-span-4'
        : 'col-span-1 row-span-1';

  const renderGroup = (group: NavGroup, delay: number) =>
    group.type === 'list' ? (
      <GroupListCard
        group={group}
        expanded={expandedId === group.id}
        onToggleExpand={toggleExpand}
        store={store}
        delay={delay}
      />
    ) : (
      <GroupStackCard
        group={group}
        expanded={expandedId === group.id}
        onToggleExpand={toggleExpand}
        store={store}
        delay={delay}
      />
    );

  const createGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;
    const id = store.addGroup(name);
    setNewGroupName('');
    setShowNewGroup(false);
    setExpandedId(id);
    window.setTimeout(() => {
      document.getElementById(`v2-group-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  };

  const dashedTileCls =
    'w-full h-full rounded-[26px] border border-dashed border-white/15 text-white/45 hover:text-white/85 hover:border-white/35 transition-colors flex flex-col items-center justify-center gap-1.5 text-xs';

  return (
    <div className="flex flex-col">
      {/* 吸顶搜索区：搜索 + 数据入口，滚动时停留在视口顶部 */}
      <div className="sticky top-0 z-50 -mt-1 pt-1 pb-2">
        <div className="absolute inset-0 bg-[#0a0a10]/75 backdrop-blur-xl rounded-b-3xl border-b border-white/[0.06]" />
        <div className="relative flex items-start gap-2">
          <StickySearch groups={groups} onOpenGroup={openGroupFromSearch} />
          <DataMenu store={store} />
        </div>
      </div>

      {/* 瀑布流网格：4 栏（手机 2 栏），dense 流自动补齐 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-2 [grid-auto-flow:dense] auto-rows-[158px] sm:auto-rows-[168px] lg:auto-rows-[176px]">
        {/* B 型编组（列表式） */}
        {listGroups.map((group, i) => (
          <div key={group.id} id={`v2-group-${group.id}`} className={`${groupWrapperCls(group)} scroll-mt-20`}>
            {renderGroup(group, 0.02 + i * 0.04)}
          </div>
        ))}

        {/* A 型 · 今日任务占位：1 栏 × 1X */}
        {hasWidget('task') && (
          <div className="col-span-1 row-span-1">
            <TaskPlaceholderCard delay={0.06} />
          </div>
        )}

        {/* C 型编组 ×1 */}
        {stackA && (
          <div id={`v2-group-${stackA.id}`} className={`${groupWrapperCls(stackA)} scroll-mt-20`}>
            {renderGroup(stackA, 0.1)}
          </div>
        )}

        {/* A 型 · AI 资讯：跨 2 栏 × 2X */}
        {hasWidget('news') && (
          <div className="col-span-2 row-span-2">
            <NewsCard onNavigate={onNavigate} delay={0.14} />
          </div>
        )}

        {/* C 型编组 ×2 */}
        {stackB && (
          <div id={`v2-group-${stackB.id}`} className={`${groupWrapperCls(stackB)} scroll-mt-20`}>
            {renderGroup(stackB, 0.18)}
          </div>
        )}
        {stackC && (
          <div id={`v2-group-${stackC.id}`} className={`${groupWrapperCls(stackC)} scroll-mt-20`}>
            {renderGroup(stackC, 0.22)}
          </div>
        )}

        {/* A 型 · AI 软件榜：跨 2 栏 × 2X */}
        {hasWidget('ranking') && (
          <div className="col-span-2 row-span-2">
            <RankingCard delay={0.26} />
          </div>
        )}

        {/* 其余 C 型编组 */}
        {stackRest.map((group, idx) => (
          <div key={group.id} id={`v2-group-${group.id}`} className={`${groupWrapperCls(group)} scroll-mt-20`}>
            {renderGroup(group, 0.3 + idx * 0.04)}
          </div>
        ))}

        {/* A 型 · 热门话题（复用现有 widget）：跨 2 栏 × 1X */}
        {hasWidget('trending') && (
          <div className="col-span-2 row-span-1">
            <TrendingWidget />
          </div>
        )}

        {/* 添加组件入口 */}
        <div className="col-span-1 row-span-1">
          <button onClick={() => setShowWidgetPanel(true)} className={dashedTileCls}>
            <LayoutGrid size={18} />
            添加组件
          </button>
        </div>

        {/* 新建编组入口 */}
        <div className="col-span-1 row-span-1">
          <button onClick={() => setShowNewGroup(true)} className={dashedTileCls}>
            <FolderPlus size={18} />
            新建编组
          </button>
        </div>
      </div>

      <p className="text-center text-[11px] text-white/25 pt-8 pb-2">继续向下滚动 · 编组与组件都存在本机，增删改刷新不丢</p>

      {/* 添加组件面板 */}
      <AnimatePresence>
        {showWidgetPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowWidgetPanel(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel rounded-[24px] bg-[#17171d]/95 w-full max-w-sm p-4 shadow-2xl shadow-black/50"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">主页组件</h3>
                <button onClick={() => setShowWidgetPanel(false)} className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10">
                  <X size={15} />
                </button>
              </div>
              {ALL_WIDGETS.map((w) => {
                const visible = widgets.includes(w.id);
                return (
                  <div key={w.id} className="flex items-center gap-3 px-2 py-2.5 rounded-2xl hover:bg-white/5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{w.name}</p>
                      <p className="text-[11px] text-white/40 truncate">{w.desc}</p>
                    </div>
                    <span className={`text-[10px] shrink-0 ${visible ? 'text-emerald-300' : 'text-white/35'}`}>
                      {visible ? '显示中' : '未显示'}
                    </span>
                    <button
                      onClick={() => store.setWidgetVisible(w.id, !visible)}
                      className={`flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg transition-colors shrink-0 ${
                        visible ? 'bg-white/8 text-white/70 hover:bg-white/12' : 'bg-indigo-500/80 text-white hover:bg-indigo-500'
                      }`}
                    >
                      {visible ? <Minus size={12} /> : <Plus size={12} />}
                      {visible ? '移除' : '添加'}
                    </button>
                  </div>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 新建编组弹窗 */}
      <AnimatePresence>
        {showNewGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowNewGroup(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel rounded-[24px] bg-[#17171d]/95 w-full max-w-xs p-4 shadow-2xl shadow-black/50"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">新建编组</h3>
                <button onClick={() => setShowNewGroup(false)} className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10">
                  <X size={15} />
                </button>
              </div>
              <input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createGroup()}
                placeholder="编组名称，如 影视娱乐"
                autoFocus
                className="w-full bg-white/5 border border-white/12 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400/50 placeholder:text-white/30"
              />
              <button
                onClick={createGroup}
                disabled={!newGroupName.trim()}
                className="mt-3 w-full py-2 rounded-xl bg-indigo-500/80 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
              >
                创建并添加网站
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
