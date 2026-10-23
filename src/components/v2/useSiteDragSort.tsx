import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { SiteEntry } from '../../data/groups';

/**
 * 组内站点拖动排序（第三十八轮）：C 卡弹窗瓷砖网格与 B 卡展开行网格共用。
 *
 * 规则：置顶站点锁在最前——拖动只能在置顶区内部或普通区内部换位，
 * 落点按区夹取，跨区拖不生效；📌 与置顶状态不因拖动改变。
 * 顺序以存储数组为准（sortSites = 置顶优先 + 区内数组序），松手时把完整显示序交给 onReorder 落盘。
 *
 * 手势（沿用主页卡片拖拽的语言）：按下后移动超过阈值才算拖动，普通点击不受影响；
 * 拖动中原位留虚线占位、快照浮层跟随指针、其余站点按预览顺序实时让位，松手才落盘；
 * Esc / pointercancel 取消；拖完紧随的那次 click 被吞掉，避免顺带打开站点。
 * 参与拖动的站点元素需带 data-site-drag-id={site.id}；编辑表单、添加块等没有此标记，不参与。
 */
const DRAG_THRESHOLD = 7;

export function useSiteDragSort({
  sites,
  onReorder,
}: {
  /** 当前显示顺序（已经过 sortSites：置顶区在前） */
  sites: SiteEntry[];
  onReorder: (orderedIds: string[]) => void;
}) {
  const [previewIds, setPreviewIds] = useState<string[] | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [clone, setClone] = useState<{ html: string; w: number; h: number } | null>(null);
  const cloneRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const pendingRef = useRef<{ id: string; pointerId: number; startX: number; startY: number } | null>(null);
  const activeRef = useRef<{
    id: string;
    pointerId: number;
    offsetX: number;
    offsetY: number;
    lastX: number;
    lastY: number;
    /** 激活瞬间各站点元素的 rect 快照：落点判定按原始槽位算，避免预览重排把目标推走导致落点多进一格 */
    rects: Map<string, DOMRect>;
  } | null>(null);
  const previewRef = useRef<string[] | null>(null);
  const suppressUntilRef = useRef(0);
  const sitesRef = useRef(sites);
  sitesRef.current = sites;
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;

  /** 展示用站点序：拖动中 = 预览序，其余时候 = 入参顺序 */
  const items = useMemo(() => {
    if (!previewIds) return sites;
    const byId = new Map(sites.map((s) => [s.id, s]));
    const out: SiteEntry[] = [];
    for (const id of previewIds) {
      const s = id ? byId.get(id) : undefined;
      if (s) out.push(s);
    }
    for (const s of sites) if (s.id && !previewIds.includes(s.id)) out.push(s);
    return out;
  }, [sites, previewIds]);

  useEffect(() => {
    const setPreview = (ids: string[] | null) => {
      previewRef.current = ids;
      setPreviewIds(ids);
    };

    const positionClone = (x: number, y: number) => {
      const d = activeRef.current;
      if (d && cloneRef.current) {
        cloneRef.current.style.transform = `translate(${x - d.offsetX}px, ${y - d.offsetY}px)`;
      }
    };

    const endDrag = (commit: boolean) => {
      const d = activeRef.current;
      if (!d) {
        pendingRef.current = null;
        return;
      }
      activeRef.current = null;
      pendingRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      const finalIds = previewRef.current;
      setPreview(null);
      setDragId(null);
      setClone(null);
      if (commit && finalIds) {
        const canonical = sitesRef.current.map((s) => s.id);
        if (finalIds.join('|') !== canonical.join('|')) {
          onReorderRef.current(finalIds.filter((x): x is string => !!x));
        }
        // 拖完紧随的 click 会落在站点按钮上：吞掉，避免顺带打开站点
        suppressUntilRef.current = Date.now() + 350;
      }
    };

    /** 由指针位置算出落点（先按行优先序数「中心在指针之前」的站点数，再按置顶分区夹取） */
    const updatePreviewTarget = (x: number, y: number) => {
      const d = activeRef.current;
      const container = containerRef.current;
      const preview = previewRef.current;
      if (!d || !container || !preview) return;
      const canonical = sitesRef.current;
      const dragged = canonical.find((s) => s.id === d.id);
      if (!dragged) return;
      const pinnedTotal = canonical.filter((s) => s.pinned).length;
      const others = preview.filter((id) => id !== d.id);
      let pos = 0;
      for (const id of others) {
        // 优先用激活瞬间的槽位快照（预览重排后元素的实时 rect 已移位，会让落点多算一格）
        const r = d.rects.get(id) ?? container.querySelector(`[data-site-drag-id="${id}"]`)?.getBoundingClientRect();
        if (!r) continue;
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        if (cy < y - 2 || (Math.abs(cy - y) <= r.height / 2 && cx < x)) pos++;
      }
      // 分区夹取：置顶站点只能落在置顶区内（others 里置顶数 = pinnedTotal-1），普通站点不能进置顶区
      if (dragged.pinned) pos = Math.max(0, Math.min(pos, pinnedTotal - 1));
      else pos = Math.max(pinnedTotal, Math.min(pos, others.length));
      const next = [...others];
      next.splice(pos, 0, d.id);
      if (next.join('|') !== preview.join('|')) setPreview(next);
    };

    const onPointerMove = (e: PointerEvent) => {
      const pending = pendingRef.current;
      if (!activeRef.current && pending && e.pointerId === pending.pointerId) {
        if (Math.hypot(e.clientX - pending.startX, e.clientY - pending.startY) < DRAG_THRESHOLD) return;
        const container = containerRef.current;
        const el = container?.querySelector(`[data-site-drag-id="${pending.id}"]`);
        if (!el) {
          pendingRef.current = null;
          return;
        }
        const rect = el.getBoundingClientRect();
        const rects = new Map<string, DOMRect>();
        container.querySelectorAll('[data-site-drag-id]').forEach((n) => {
          const nid = (n as HTMLElement).dataset.siteDragId;
          if (nid) rects.set(nid, n.getBoundingClientRect());
        });
        pendingRef.current = null;
        activeRef.current = {
          id: pending.id,
          pointerId: pending.pointerId,
          offsetX: pending.startX - rect.left,
          offsetY: pending.startY - rect.top,
          lastX: e.clientX,
          lastY: e.clientY,
          rects,
        };
        setPreview(sitesRef.current.map((s) => s.id).filter((x): x is string => !!x));
        setDragId(pending.id);
        setClone({ html: el.outerHTML, w: rect.width, h: rect.height });
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
      }
      const d = activeRef.current;
      if (d && e.pointerId === d.pointerId) {
        d.lastX = e.clientX;
        d.lastY = e.clientY;
        positionClone(e.clientX, e.clientY);
        updatePreviewTarget(e.clientX, e.clientY);
      }
    };

    /** 第二指落下（双指缩放开始）：取消本手势的待命/进行中拖动，缩放优先（第七十三轮）。
     * 同一指自己的 pointerdown 在 React 容器处理器之后到达（id 相同，不受影响）。 */
    const onSecondPointerDown = (e: PointerEvent) => {
      if (pendingRef.current && e.pointerId !== pendingRef.current.pointerId) pendingRef.current = null;
      if (activeRef.current && e.pointerId !== activeRef.current.pointerId) endDrag(false);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (pendingRef.current && e.pointerId === pendingRef.current.pointerId) pendingRef.current = null;
      if (activeRef.current && e.pointerId === activeRef.current.pointerId) endDrag(true);
    };
    const onPointerCancel = (e: PointerEvent) => {
      if (pendingRef.current && e.pointerId === pendingRef.current.pointerId) pendingRef.current = null;
      if (activeRef.current && e.pointerId === activeRef.current.pointerId) endDrag(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeRef.current) endDrag(false);
    };

    window.addEventListener('pointerdown', onSecondPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onSecondPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // 快照挂载后先定位到抓起处，避免首帧闪到角落
  useEffect(() => {
    const d = activeRef.current;
    if (clone && d && cloneRef.current) {
      cloneRef.current.style.transform = `translate(${d.lastX - d.offsetX}px, ${d.lastY - d.offsetY}px)`;
    }
  }, [clone]);

  /** 挂到站点网格容器上：只负责记下起手（哪个站点、从哪按），越过阈值的判定在 window pointermove 里 */
  const onContainerPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || activeRef.current || pendingRef.current) return;
    const t = e.target as HTMLElement;
    if (t.closest('input, textarea, select, [contenteditable="true"]')) return;
    const el = t.closest<HTMLElement>('[data-site-drag-id]');
    if (!el || !el.dataset.siteDragId || !e.currentTarget.contains(el)) return;
    containerRef.current = e.currentTarget as HTMLElement;
    pendingRef.current = { id: el.dataset.siteDragId, pointerId: e.pointerId, startX: e.clientX, startY: e.clientY };
  };

  /** 挂到同一容器上：站点 Logo 是 <img>，按下拖动会触发浏览器原生图片拖拽、接管 pointermove，必须拦下 */
  const onContainerDragStart = (e: React.DragEvent) => e.preventDefault();

  /** 站点点击守卫：刚拖完时返回 true 表示这次 click 应被吞掉（每个拖拽周期只吞一次） */
  const consumeSuppressClick = () => {
    if (Date.now() < suppressUntilRef.current) {
      suppressUntilRef.current = 0;
      return true;
    }
    return false;
  };

  const isDragging = (site: SiteEntry) => dragId !== null && site.id === dragId;

  /** 拖动中的浮动快照（渲染在容器外层即可，fixed 定位；样式与主页拖拽快照同语言） */
  const dragLayer = clone ? (
    <div
      ref={cloneRef}
      className="fixed left-0 top-0 z-[85] pointer-events-none will-change-transform"
      style={{ width: clone.w, height: clone.h }}
    >
      <div
        className="w-full h-full rounded-2xl overflow-hidden bg-[#26262e] shadow-2xl shadow-black/70 ring-1 ring-white/25 opacity-95 scale-[1.03] [&>*]:w-full [&>*]:h-full"
        dangerouslySetInnerHTML={{ __html: clone.html }}
      />
    </div>
  ) : null;

  return { items, isDragging, onContainerPointerDown, onContainerDragStart, consumeSuppressClick, dragLayer };
}

/** 被拖站点在原位的占位样式（与主页拖拽占位同语言：靛蓝虚线框 + 淡蓝底）。
 * 用内联 style 而不是工具类：瓷砖/行根元素自带 border/bg 工具类，级联顺序不可控，内联样式必赢。 */
export const SITE_DRAG_PLACEHOLDER_STYLE: React.CSSProperties = {
  borderStyle: 'dashed',
  borderColor: 'rgba(129, 140, 248, 0.6)',
  backgroundColor: 'rgba(99, 102, 241, 0.1)',
  opacity: 0.6,
};
