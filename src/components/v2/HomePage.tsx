import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { LayoutGrid, FolderPlus, X, Plus, Minus, Check, List, Folder } from 'lucide-react';
import type { GroupDisplay, NavGroup } from '../../data/groups';
import { ALL_WIDGETS, useLocalStore, type WidgetId } from '../../store/localStore';
import StickySearch from './StickySearch';
import DataMenu from './DataMenu';
import NewsCard from './NewsCard';
import RankingCard from './RankingCard';
import TaskPlaceholderCard from './TaskPlaceholderCard';
import GroupListCard from './GroupListCard';
import GroupStackCard from './GroupStackCard';
import GroupPanel from './GroupPanel';
import TrendingWidget from '../widgets/TrendingWidget';

/**
 * V2 新主页（第三轮修订）
 * - 无顶部标题栏：页面直接从吸顶搜索区开始，搜索区旁有低调的「数据」入口（导出/导入）
 * - 4 栏基准网格瀑布流（桌面 4 栏 / 手机 2 栏）
 * - B 型编组（display=list）：主页原地向下拉开 + 卡内滚动；C 型编组（display=stack）：点击弹窗看 ICON 瓷砖
 * - A 型原生组件可右键改尺寸（1/2/4 栏 × 1x/2x），布局存本地
 * - 全部编组与布局来自本地存储（方案三：本地优先），用户可增删改
 */
export default function HomePage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const store = useLocalStore();
  const { groups, widgets, widgetLayouts } = store.data;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [panelGroupId, setPanelGroupId] = useState<string | null>(null);
  const [showWidgetPanel, setShowWidgetPanel] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDisplay, setNewGroupDisplay] = useState<GroupDisplay>('stack');
  const [widgetMenu, setWidgetMenu] = useState<{ id: WidgetId; x: number; y: number } | null>(null);
  const widgetMenuRef = useRef<HTMLDivElement>(null);

  const listGroups = useMemo(() => groups.filter((g) => g.display === 'list'), [groups]);
  const stackGroups = useMemo(() => groups.filter((g) => g.display === 'stack'), [groups]);
  const [stackA, stackB, stackC, ...stackRest] = stackGroups;
  const hasWidget = (id: WidgetId) => widgets.includes(id);
  const panelGroup = panelGroupId ? (groups.find((g) => g.id === panelGroupId) ?? null) : null;

  /* ---------- A 型组件右键尺寸菜单 ---------- */
  useEffect(() => {
    if (!widgetMenu) return;
    const onPointerDown = (e: MouseEvent) => {
      if (widgetMenuRef.current && !widgetMenuRef.current.contains(e.target as Node)) setWidgetMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setWidgetMenu(null);
    };
    const onScroll = () => setWidgetMenu(null);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    document.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [widgetMenu]);

  const openWidgetMenu = (e: React.MouseEvent, id: WidgetId) => {
    e.preventDefault();
    e.stopPropagation();
    const MENU_W = 208;
    const MENU_H = 196;
    setWidgetMenu({
      id,
      x: Math.max(8, Math.min(e.clientX, window.innerWidth - MENU_W - 8)),
      y: Math.max(8, Math.min(e.clientY, window.innerHeight - MENU_H - 8)),
    });
  };

  const widgetCls = (id: WidgetId) => {
    const layout = widgetLayouts[id];
    const col =
      layout.colSpan === 4 ? 'col-span-2 lg:col-span-4' : layout.colSpan === 2 ? 'col-span-2' : 'col-span-1';
    const row = layout.heightUnits === 2 ? 'row-span-2' : 'row-span-1';
    return `${col} ${row}`;
  };

  /* ---------- 编组展开 / 弹窗 ---------- */
  const toggleExpand = (group: NavGroup) => {
    setExpandedId((prev) => (prev === group.id ? null : group.id));
  };

  const scrollToGroup = (id: string) => {
    window.setTimeout(() => {
      document.getElementById(`v2-group-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const openGroupFromSearch = (group: NavGroup) => {
    if (group.display === 'list') {
      setExpandedId(group.id);
      scrollToGroup(group.id);
    } else {
      setPanelGroupId(group.id);
    }
  };

  const handleBecomeList = (group: NavGroup) => {
    setPanelGroupId(null);
    setExpandedId(group.id);
    scrollToGroup(group.id);
  };

  const groupWrapperCls = (group: NavGroup) =>
    group.display === 'list'
      ? expandedId === group.id
        ? 'col-span-2 row-span-4'
        : 'col-span-2 row-span-2'
      : 'col-span-1 row-span-1';

  const renderGroup = (group: NavGroup, delay: number) =>
    group.display === 'list' ? (
      <GroupListCard
        group={group}
        expanded={expandedId === group.id}
        onToggleExpand={toggleExpand}
        store={store}
        delay={delay}
      />
    ) : (
      <GroupStackCard group={group} onOpen={(g) => setPanelGroupId(g.id)} delay={delay} />
    );

  const createGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;
    const id = store.addGroup(name, newGroupDisplay);
    setNewGroupName('');
    setShowNewGroup(false);
    if (newGroupDisplay === 'list') {
      setExpandedId(id);
      scrollToGroup(id);
    } else {
      // 文件夹式：直接打开弹窗，方便立刻往里加网站
      window.setTimeout(() => setPanelGroupId(id), 60);
    }
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

        {/* A 型 · 今日任务占位（右键可改尺寸） */}
        {hasWidget('task') && (
          <div className={widgetCls('task')} onContextMenu={(e) => openWidgetMenu(e, 'task')}>
            <TaskPlaceholderCard delay={0.06} />
          </div>
        )}

        {/* C 型编组 ×1 */}
        {stackA && (
          <div id={`v2-group-${stackA.id}`} className={`${groupWrapperCls(stackA)} scroll-mt-20`}>
            {renderGroup(stackA, 0.1)}
          </div>
        )}

        {/* A 型 · AI 资讯（右键可改尺寸） */}
        {hasWidget('news') && (
          <div className={widgetCls('news')} onContextMenu={(e) => openWidgetMenu(e, 'news')}>
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

        {/* A 型 · AI 软件榜（右键可改尺寸） */}
        {hasWidget('ranking') && (
          <div className={widgetCls('ranking')} onContextMenu={(e) => openWidgetMenu(e, 'ranking')}>
            <RankingCard delay={0.26} />
          </div>
        )}

        {/* 其余 C 型编组 */}
        {stackRest.map((group, idx) => (
          <div key={group.id} id={`v2-group-${group.id}`} className={`${groupWrapperCls(group)} scroll-mt-20`}>
            {renderGroup(group, 0.3 + idx * 0.04)}
          </div>
        ))}

        {/* A 型 · 热门话题（右键可改尺寸） */}
        {hasWidget('trending') && (
          <div className={widgetCls('trending')} onContextMenu={(e) => openWidgetMenu(e, 'trending')}>
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

      <p className="text-center text-[11px] text-white/25 pt-8 pb-2">继续向下滚动 · 编组与组件都存在本机，增删改刷新不丢 · 原生组件可右键改尺寸</p>

      {/* C 型编组弹窗（ICON 瓷砖） */}
      <GroupPanel group={panelGroup} store={store} onClose={() => setPanelGroupId(null)} onBecomeList={handleBecomeList} />

      {/* A 型组件右键尺寸菜单（实色） */}
      <AnimatePresence>
        {widgetMenu && (
          <motion.div
            ref={widgetMenuRef}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="fixed z-[80] w-[200px] rounded-2xl bg-[#1e1e26] border border-white/15 shadow-2xl shadow-black/70 p-2.5"
            style={{ left: widgetMenu.x, top: widgetMenu.y }}
          >
            <p className="px-1 pb-2 text-[11px] font-medium text-white/60">
              {ALL_WIDGETS.find((w) => w.id === widgetMenu.id)?.name} · 组件尺寸
            </p>
            <p className="px-1 pb-1 text-[10px] tracking-wider text-white/40 uppercase">宽度</p>
            <div className="flex gap-1 pb-2.5">
              {([1, 2, 4] as const).map((n) => {
                const selected = widgetLayouts[widgetMenu.id].colSpan === n;
                return (
                  <button
                    key={n}
                    onClick={() => store.setWidgetLayout(widgetMenu.id, { colSpan: n })}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs transition-colors ${
                      selected ? 'bg-indigo-500/80 text-white font-semibold' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {selected && <Check size={12} />}
                    {n} 栏
                  </button>
                );
              })}
            </div>
            <p className="px-1 pb-1 text-[10px] tracking-wider text-white/40 uppercase">高度</p>
            <div className="flex gap-1">
              {([1, 2] as const).map((n) => {
                const selected = widgetLayouts[widgetMenu.id].heightUnits === n;
                return (
                  <button
                    key={n}
                    onClick={() => store.setWidgetLayout(widgetMenu.id, { heightUnits: n })}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs transition-colors ${
                      selected ? 'bg-indigo-500/80 text-white font-semibold' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {selected && <Check size={12} />}
                    {n}x
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* 新建编组弹窗：先选形态（详细列表 / 文件夹式） */}
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
              className="rounded-[24px] bg-[#17171d] border border-white/10 w-full max-w-sm p-4 shadow-2xl shadow-black/60"
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
              <p className="text-[11px] text-white/45 mt-3.5 mb-2">编组形态（之后也能在组内切换）</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setNewGroupDisplay('list')}
                  className={`text-left rounded-2xl border p-3 transition-colors ${
                    newGroupDisplay === 'list'
                      ? 'border-indigo-400/70 bg-indigo-500/15'
                      : 'border-white/12 bg-white/[0.03] hover:border-white/30'
                  }`}
                >
                  <span className={`flex items-center gap-1.5 text-[13px] font-semibold ${newGroupDisplay === 'list' ? 'text-indigo-200' : ''}`}>
                    <List size={14} /> 详细列表
                  </span>
                  <span className="block text-[11px] text-white/45 leading-relaxed mt-1.5">
                    图标 + 名称 + 介绍成行展示，点开在主页原地向下拉开
                  </span>
                </button>
                <button
                  onClick={() => setNewGroupDisplay('stack')}
                  className={`text-left rounded-2xl border p-3 transition-colors ${
                    newGroupDisplay === 'stack'
                      ? 'border-indigo-400/70 bg-indigo-500/15'
                      : 'border-white/12 bg-white/[0.03] hover:border-white/30'
                  }`}
                >
                  <span className={`flex items-center gap-1.5 text-[13px] font-semibold ${newGroupDisplay === 'stack' ? 'text-indigo-200' : ''}`}>
                    <Folder size={14} /> 文件夹式
                  </span>
                  <span className="block text-[11px] text-white/45 leading-relaxed mt-1.5">
                    紧凑的小卡像文件夹，点开弹窗看组内图标
                  </span>
                </button>
              </div>
              <button
                onClick={createGroup}
                disabled={!newGroupName.trim()}
                className="mt-3.5 w-full py-2 rounded-xl bg-indigo-500/80 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
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
