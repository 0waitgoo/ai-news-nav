import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { LayoutGrid, FolderPlus, X, Plus, Minus, Check, List, Folder } from 'lucide-react';
import type { GroupDisplay, NavGroup } from '../../data/groups';
import {
  ALL_WIDGETS,
  clampColSpan,
  groupCardKey,
  groupLayoutOf,
  resolveCardOrder,
  widgetCardKey,
  type LocalStore,
  type WidgetId,
  type WidgetLayout,
} from '../../store/localStore';
import StickySearch from './StickySearch';
import DataMenu from './DataMenu';
import BackgroundMenu from './BackgroundMenu';
import { TopNav } from '../Sidebar';
import NewsCard from './NewsCard';
import RankingCard from './RankingCard';
import TaskPlaceholderCard from './TaskPlaceholderCard';
import GroupListCard from './GroupListCard';
import GroupStackCard from './GroupStackCard';
import GroupPanel from './GroupPanel';
import TrendingWidget from '../widgets/TrendingWidget';

/**
 * V2 新主页（第三轮修订 + 第五轮拖拽排序 + 第八轮顶栏一行对齐）
 * - 无顶部标题栏：页面直接从吸顶栏开始——同一行内左半（2 栏）放页面导航图标组、右半（2 栏）放搜索框 + 低调的「数据」入口（导出/导入），整条栏吸顶
 * - 4 栏基准网格瀑布流（桌面 4 栏 / 手机 2 栏）
 * - B 型编组（display=list）：主页原地向下拉开 + 卡内滚动；C 型编组（display=stack）：点击弹窗看 ICON 瓷砖
 * - A 型原生组件与 B 型编组可右键改尺寸（1/2 栏 × 1x/2x，宽度最多 2 栏），布局存本地
 * - 全部卡片（编组 + 原生组件）可按住拖拽排序：超过阈值才判定拖拽，普通点击不受影响；顺序存本地
 * - 全部编组与布局来自本地存储（方案三：本地优先），用户可增删改
 */

/** 向上查找最近的可滚动祖先（拖拽到边缘时自动滚动用） */
function findScrollAncestor(el: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = el.parentElement;
  while (node && node !== document.body) {
    const oy = window.getComputedStyle(node).overflowY;
    if ((oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight) return node;
    node = node.parentElement;
  }
  return null;
}
export default function HomePage({ onNavigate, store }: { onNavigate: (page: string) => void; store: LocalStore }) {
  const { groups, widgets, widgetLayouts, groupLayouts } = store.data;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [panelGroupId, setPanelGroupId] = useState<string | null>(null);
  const [showWidgetPanel, setShowWidgetPanel] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDisplay, setNewGroupDisplay] = useState<GroupDisplay>('stack');
  /** 右键尺寸菜单的目标：原生组件或 B 型编组（共用同一套菜单） */
  type SizeMenuTarget = { kind: 'widget'; id: WidgetId } | { kind: 'group'; id: string };
  const [sizeMenu, setSizeMenu] = useState<(SizeMenuTarget & { x: number; y: number }) | null>(null);
  const sizeMenuRef = useRef<HTMLDivElement>(null);

  const listGroups = useMemo(() => groups.filter((g) => g.display === 'list'), [groups]);
  const stackGroups = useMemo(() => groups.filter((g) => g.display === 'stack'), [groups]);
  const [stackA, stackB, stackC, ...stackRest] = stackGroups;
  const hasWidget = (id: WidgetId) => widgets.includes(id);
  const panelGroup = panelGroupId ? (groups.find((g) => g.id === panelGroupId) ?? null) : null;

  /* ---------- 右键尺寸菜单（原生组件与 B 型编组共用） ---------- */
  useEffect(() => {
    if (!sizeMenu) return;
    const onPointerDown = (e: MouseEvent) => {
      if (sizeMenuRef.current && !sizeMenuRef.current.contains(e.target as Node)) setSizeMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSizeMenu(null);
    };
    const onScroll = () => setSizeMenu(null);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    document.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [sizeMenu]);

  const openSizeMenu = (e: React.MouseEvent, target: SizeMenuTarget) => {
    e.preventDefault();
    e.stopPropagation();
    const MENU_W = 208;
    const MENU_H = 196;
    setSizeMenu({
      ...target,
      x: Math.max(8, Math.min(e.clientX, window.innerWidth - MENU_W - 8)),
      y: Math.max(8, Math.min(e.clientY, window.innerHeight - MENU_H - 8)),
    });
  };

  /** 菜单当前目标的布局与改尺寸入口（组件走 widgetLayouts，编组走 groupLayouts） */
  const sizeMenuLayout: WidgetLayout | null = sizeMenu
    ? sizeMenu.kind === 'widget'
      ? widgetLayouts[sizeMenu.id]
      : groupLayoutOf(groupLayouts, sizeMenu.id)
    : null;
  const sizeMenuTitle = sizeMenu
    ? sizeMenu.kind === 'widget'
      ? `${ALL_WIDGETS.find((w) => w.id === sizeMenu.id)?.name ?? ''} · 组件尺寸`
      : `${groups.find((g) => g.id === sizeMenu.id)?.name ?? ''} · 编组尺寸`
    : '';
  const applySizeMenuLayout = (patch: Partial<WidgetLayout>) => {
    if (!sizeMenu) return;
    if (sizeMenu.kind === 'widget') store.setWidgetLayout(sizeMenu.id, patch);
    else store.setGroupLayout(sizeMenu.id, patch);
  };

  const widgetCls = (id: WidgetId) => {
    const layout = widgetLayouts[id];
    // 宽度上限 2 栏：渲染侧再夹一次，存量异常值也不破版
    const col = clampColSpan(layout.colSpan) === 2 ? 'col-span-2' : 'col-span-1';
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

  const groupWrapperCls = (group: NavGroup) => {
    if (group.display !== 'list') return 'col-span-1 row-span-1';
    // 展开态沿用既有高度逻辑（2 栏 × 4 行），不被右键布局设置影响
    if (expandedId === group.id) return 'col-span-2 row-span-4';
    // 收起态按右键布局占格（宽度夹到 ≤2 栏；老数据回落默认 2 栏 × 2x）
    const layout = groupLayoutOf(groupLayouts, group.id);
    const col = clampColSpan(layout.colSpan) === 2 ? 'col-span-2' : 'col-span-1';
    const row = layout.heightUnits === 2 ? 'row-span-2' : 'row-span-1';
    return `${col} ${row}`;
  };

  const renderGroup = (group: NavGroup, delay: number) =>
    group.display === 'list' ? (
      <GroupListCard
        group={group}
        expanded={expandedId === group.id}
        onToggleExpand={toggleExpand}
        store={store}
        colSpan={groupLayoutOf(groupLayouts, group.id).colSpan}
        delay={delay}
      />
    ) : (
      <GroupStackCard group={group} onOpen={(g) => setPanelGroupId(g.id)} delay={delay} />
    );

  /* ---------- 主页卡片顺序（拖拽排序后存本地） ---------- */
  // 默认顺序与此前硬编码的交错排版完全一致：B 组 → 任务 → C×1 → 资讯 → C×2 → 软件榜 → 其余 C → 热门话题
  const defaultOrder = useMemo(() => {
    const order: string[] = listGroups.map((g) => groupCardKey(g.id));
    if (hasWidget('task')) order.push(widgetCardKey('task'));
    if (stackA) order.push(groupCardKey(stackA.id));
    if (hasWidget('news')) order.push(widgetCardKey('news'));
    if (stackB) order.push(groupCardKey(stackB.id));
    if (stackC) order.push(groupCardKey(stackC.id));
    if (hasWidget('ranking')) order.push(widgetCardKey('ranking'));
    for (const g of stackRest) order.push(groupCardKey(g.id));
    if (hasWidget('trending')) order.push(widgetCardKey('trending'));
    return order;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listGroups, stackA, stackB, stackC, stackRest, widgets]);

  const baseOrder = useMemo(
    () => resolveCardOrder(store.data.cardOrder, defaultOrder),
    [store.data.cardOrder, defaultOrder],
  );
  const [previewOrder, setPreviewOrder] = useState<string[] | null>(null);
  const displayOrder = previewOrder ?? baseOrder;

  const itemByKey = useMemo(() => {
    const map = new Map<string, { group?: NavGroup; widgetId?: WidgetId }>();
    for (const g of groups) map.set(groupCardKey(g.id), { group: g });
    for (const w of ALL_WIDGETS) {
      if (widgets.includes(w.id)) map.set(widgetCardKey(w.id), { widgetId: w.id });
    }
    return map;
  }, [groups, widgets]);

  const cardSpanCls = (key: string) => {
    const item = itemByKey.get(key);
    if (!item) return 'col-span-1 row-span-1';
    if (item.group) return groupWrapperCls(item.group);
    return widgetCls(item.widgetId as WidgetId);
  };

  const renderCardItem = (key: string, index: number) => {
    const item = itemByKey.get(key);
    if (!item) return null;
    const delay = Math.min(0.02 + index * 0.04, 0.4);
    if (item.group) return renderGroup(item.group, delay);
    switch (item.widgetId) {
      case 'task':
        return <TaskPlaceholderCard delay={delay} />;
      case 'news':
        return <NewsCard onNavigate={onNavigate} delay={delay} />;
      case 'ranking':
        return <RankingCard delay={delay} />;
      case 'trending':
        return <TrendingWidget />;
      default:
        return null;
    }
  };

  /* ---------- 拖拽排序 ----------
   * 指针按下后移动超过阈值才判定为拖拽：普通点击（开站点 / B 卡展开 / C 卡弹窗 / 右键菜单）完全不受影响；
   * 拖拽中被拖卡片变为虚线占位、浮动快照跟随指针，其余卡片按预览顺序实时让位，松手才落盘。
   * 表单控件与 data-nodrag 区域（B 卡展开的滚动列表）内按下不触发拖拽。 */
  const DRAG_THRESHOLD = 8;
  const wrapperRefs = useRef(new Map<string, HTMLDivElement>());
  const pendingDragRef = useRef<{ key: string; pointerId: number; startX: number; startY: number } | null>(null);
  const activeDragRef = useRef<{
    key: string;
    pointerId: number;
    offsetX: number;
    offsetY: number;
    lastX: number;
    lastY: number;
    scrollEl: HTMLElement | null;
  } | null>(null);
  const previewOrderRef = useRef<string[] | null>(null);
  const baseOrderRef = useRef<string[]>(baseOrder);
  baseOrderRef.current = baseOrder;
  const storeRef = useRef(store);
  storeRef.current = store;
  const suppressClickRef = useRef(false);
  const cloneRef = useRef<HTMLDivElement>(null);
  const autoScrollRafRef = useRef(0);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dragSnap, setDragSnap] = useState<{ html: string; w: number; h: number } | null>(null);

  useEffect(() => {
    const positionClone = (x: number, y: number) => {
      const d = activeDragRef.current;
      if (d && cloneRef.current) {
        cloneRef.current.style.transform = `translate(${x - d.offsetX}px, ${y - d.offsetY}px)`;
      }
    };

    const updatePreviewTarget = (x: number, y: number) => {
      const d = activeDragRef.current;
      const order = previewOrderRef.current;
      if (!d || !order) return;
      let hit: { key: string; rect: DOMRect } | null = null;
      wrapperRefs.current.forEach((el, key) => {
        if (key === d.key) return;
        const r = el.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) hit = { key, rect: r };
      });
      if (!hit) return;
      const targetIndex = order.indexOf(hit.key);
      const from = order.indexOf(d.key);
      if (targetIndex < 0 || from < 0) return;
      // 阅读顺序判定落点在目标之前还是之后：先看纵向中心带，带内再看横向中心
      const r = hit.rect;
      const midY = r.top + r.height / 2;
      let after: boolean;
      if (y > midY + r.height * 0.25) after = true;
      else if (y < midY - r.height * 0.25) after = false;
      else after = x > r.left + r.width / 2;
      const next = [...order];
      next.splice(from, 1);
      let to = targetIndex;
      if (from < targetIndex) to -= 1;
      if (after) to += 1;
      to = Math.max(0, Math.min(next.length, to));
      next.splice(to, 0, d.key);
      if (next.join('|') !== order.join('|')) {
        previewOrderRef.current = next;
        setPreviewOrder(next);
      }
    };

    const stopAutoScroll = () => cancelAnimationFrame(autoScrollRafRef.current);
    const startAutoScroll = () => {
      const step = () => {
        const d = activeDragRef.current;
        if (!d) return;
        const el = d.scrollEl;
        if (el) {
          const r = el.getBoundingClientRect();
          const EDGE = 72;
          const SPEED = 14;
          if (d.lastY < r.top + EDGE && el.scrollTop > 0) {
            el.scrollBy(0, -SPEED);
            updatePreviewTarget(d.lastX, d.lastY);
          } else if (d.lastY > r.bottom - EDGE && el.scrollTop + el.clientHeight < el.scrollHeight) {
            el.scrollBy(0, SPEED);
            updatePreviewTarget(d.lastX, d.lastY);
          }
        }
        autoScrollRafRef.current = requestAnimationFrame(step);
      };
      autoScrollRafRef.current = requestAnimationFrame(step);
    };

    const endDrag = (commit: boolean) => {
      if (!activeDragRef.current) return;
      activeDragRef.current = null;
      pendingDragRef.current = null;
      stopAutoScroll();
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      const finalOrder = previewOrderRef.current;
      previewOrderRef.current = null;
      setPreviewOrder(null);
      setDragKey(null);
      setDragSnap(null);
      if (commit && finalOrder && finalOrder.join('|') !== baseOrderRef.current.join('|')) {
        storeRef.current.setCardOrder(finalOrder);
      }
      // 拖拽松手后的那次 click 可能落在站点按钮上，吞掉避免误开站点 / 误触展开
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 250);
    };

    const onPointerMove = (e: PointerEvent) => {
      const pending = pendingDragRef.current;
      if (!activeDragRef.current && pending && e.pointerId === pending.pointerId) {
        if (Math.hypot(e.clientX - pending.startX, e.clientY - pending.startY) < DRAG_THRESHOLD) return;
        const el = wrapperRefs.current.get(pending.key);
        if (!el) {
          pendingDragRef.current = null;
          return;
        }
        const rect = el.getBoundingClientRect();
        activeDragRef.current = {
          key: pending.key,
          pointerId: pending.pointerId,
          offsetX: pending.startX - rect.left,
          offsetY: pending.startY - rect.top,
          lastX: e.clientX,
          lastY: e.clientY,
          scrollEl: findScrollAncestor(el),
        };
        pendingDragRef.current = null;
        const order = [...baseOrderRef.current];
        previewOrderRef.current = order;
        setPreviewOrder(order);
        setDragKey(pending.key);
        setDragSnap({ html: el.innerHTML, w: rect.width, h: rect.height });
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        startAutoScroll();
      }
      const d = activeDragRef.current;
      if (d && e.pointerId === d.pointerId) {
        d.lastX = e.clientX;
        d.lastY = e.clientY;
        positionClone(e.clientX, e.clientY);
        updatePreviewTarget(e.clientX, e.clientY);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (pendingDragRef.current && e.pointerId === pendingDragRef.current.pointerId) pendingDragRef.current = null;
      if (activeDragRef.current && e.pointerId === activeDragRef.current.pointerId) endDrag(true);
    };
    const onPointerCancel = (e: PointerEvent) => {
      if (pendingDragRef.current && e.pointerId === pendingDragRef.current.pointerId) pendingDragRef.current = null;
      if (activeDragRef.current && e.pointerId === activeDragRef.current.pointerId) endDrag(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeDragRef.current) endDrag(false);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      window.removeEventListener('keydown', onKeyDown);
      stopAutoScroll();
    };
  }, []);

  // 浮动快照一挂载就先定位到抓起的位置，避免首帧闪到角落
  useLayoutEffect(() => {
    const d = activeDragRef.current;
    if (dragSnap && d && cloneRef.current) {
      cloneRef.current.style.transform = `translate(${d.lastX - d.offsetX}px, ${d.lastY - d.offsetY}px)`;
    }
  }, [dragSnap]);

  const handleCardPointerDown = (e: React.PointerEvent, key: string) => {
    if (e.button !== 0 || activeDragRef.current || pendingDragRef.current) return;
    const target = e.target as HTMLElement;
    if (target.closest('input, textarea, select, [contenteditable="true"], [data-nodrag]')) return;
    suppressClickRef.current = false;
    pendingDragRef.current = { key, pointerId: e.pointerId, startX: e.clientX, startY: e.clientY };
  };

  const handleGridClickCapture = (e: React.SyntheticEvent) => {
    if (suppressClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClickRef.current = false;
    }
  };

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
      {/* 吸顶栏（一行对齐）：与下方卡片网格同款 4 栏 grid——左半 2 栏放页面导航图标组（靠左），
          右半 2 栏放搜索框 +「数据」入口（算在右半内）；整条栏吸顶，滚动时停留在视口顶部。
          移动端为 2 栏 grid，左右各半，仍保持一行不换行。 */}
      <div className="sticky top-0 z-50 -mt-1 pt-1 pb-2">
        <div className="absolute inset-0 bg-[#0a0a10]/75 backdrop-blur-xl rounded-b-3xl border-b border-white/[0.06]" />
        <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-center">
          <div className="col-span-1 lg:col-span-2 flex items-center justify-start gap-2 min-w-0">
            <BackgroundMenu store={store} />
            <TopNav onPageChange={onNavigate} currentPage="home" />
          </div>
          <div className="col-span-1 lg:col-span-2 flex items-center gap-2 min-w-0">
            <StickySearch groups={groups} onOpenGroup={openGroupFromSearch} />
            <DataMenu store={store} />
          </div>
        </div>
      </div>

      {/* 瀑布流网格：4 栏（手机 2 栏），dense 流自动补齐；卡片按 displayOrder 统一渲染，可拖拽排序 */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-2 [grid-auto-flow:dense] auto-rows-[158px] sm:auto-rows-[168px] lg:auto-rows-[176px]"
        onClickCapture={handleGridClickCapture}
        onDragStart={(e) => e.preventDefault()}
      >
        {displayOrder.map((key, i) => {
          const item = itemByKey.get(key);
          if (!item) return null;
          const wid = item.widgetId;
          return (
            <div
              key={key}
              id={item.group ? `v2-group-${item.group.id}` : undefined}
              ref={(el) => {
                if (el) wrapperRefs.current.set(key, el);
                else wrapperRefs.current.delete(key);
              }}
              data-card-key={key}
              className={`${cardSpanCls(key)} scroll-mt-20 relative`}
              style={{ touchAction: 'pan-y' }}
              onPointerDown={(e) => handleCardPointerDown(e, key)}
              onContextMenu={
                item.group?.display === 'list'
                  ? (e) => openSizeMenu(e, { kind: 'group', id: item.group!.id })
                  : wid
                    ? (e) => openSizeMenu(e, { kind: 'widget', id: wid })
                    : undefined
              }
            >
              <div className={dragKey === key ? 'h-full invisible' : 'h-full'}>{renderCardItem(key, i)}</div>
              {dragKey === key && (
                <div className="absolute inset-0 z-10 rounded-[26px] border-2 border-dashed border-indigo-400/60 bg-indigo-500/10 pointer-events-none" />
              )}
            </div>
          );
        })}

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

      <p className="text-center text-[11px] text-white/25 pt-8 pb-2">继续向下滚动 · 编组与组件都存在本机，增删改刷新不丢 · 卡片可按住拖动排序 · 组件与编组可右键改尺寸</p>

      {/* 拖拽中的浮动卡片快照：跟随指针，带抬升阴影 */}
      {dragSnap && (
        <div
          ref={cloneRef}
          className="fixed left-0 top-0 z-[95] pointer-events-none will-change-transform"
          style={{ width: dragSnap.w, height: dragSnap.h }}
        >
          <div
            className="w-full h-full rounded-[26px] overflow-hidden shadow-2xl shadow-black/80 ring-1 ring-white/25 opacity-95 scale-[1.02] [&>*]:h-full"
            dangerouslySetInnerHTML={{ __html: dragSnap.html }}
          />
        </div>
      )}

      {/* C 型编组弹窗（ICON 瓷砖） */}
      <GroupPanel group={panelGroup} store={store} onClose={() => setPanelGroupId(null)} onBecomeList={handleBecomeList} />

      {/* 右键尺寸菜单（实色）：A 型组件与 B 型编组共用 */}
      <AnimatePresence>
        {sizeMenu && sizeMenuLayout && (
          <motion.div
            ref={sizeMenuRef}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="fixed z-[80] w-[200px] rounded-2xl bg-[#1e1e26] border border-white/15 shadow-2xl shadow-black/70 p-2.5"
            style={{ left: sizeMenu.x, top: sizeMenu.y }}
          >
            <p className="px-1 pb-2 text-[11px] font-medium text-white/60">{sizeMenuTitle}</p>
            <p className="px-1 pb-1 text-[10px] tracking-wider text-white/40 uppercase">宽度</p>
            <div className="flex gap-1 pb-2.5">
              {([1, 2] as const).map((n) => {
                const selected = sizeMenuLayout.colSpan === n;
                return (
                  <button
                    key={n}
                    onClick={() => applySizeMenuLayout({ colSpan: n })}
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
                const selected = sizeMenuLayout.heightUnits === n;
                return (
                  <button
                    key={n}
                    onClick={() => applySizeMenuLayout({ heightUnits: n })}
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
