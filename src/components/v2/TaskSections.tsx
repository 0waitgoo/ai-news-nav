import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Layers, Minus, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import {
  dateStrDiffDays,
  formatMonthDay,
  isTaskGroup,
  planCountRatio,
  planDateRatio,
  taskChildProgress,
  taskEntryDone,
  taskFlatStats,
  taskGroupDone,
  todayDateStr,
  type LocalStore,
  type PlanItem,
  type TaskItem,
} from '../../store/localStore';
import { splitTasksText, type SplitPlanDraft } from '../../utils/taskSplit';

/**
 * 计划任务内容区（原 TaskPanel.tsx；第六十九轮起展开面板取消，本文件只剩内容组件，由 2x 计划卡卡面直接承载）：
 * 待办列 TasksSection / 长期计划列 PlansSection / AI 整理视图 AiView。
 * 历史沿革（第十八轮起，本文件前身为计划任务面板）：
 * - 主视图双列（移动端上下堆叠）：左「待办」可勾选/添加，已完成折叠；待办可建「组」——子任务可勾，
 *   组本身不单独勾选，完成态由子任务全勾推导；组计数在头部按子任务摊平（与卡面同一口径）
 * - 右「长期计划」两型：次数型（执行了多少次：进度 = 已执行/目标，行上克制的 +1/−1）与
 *   日期型（设一个完成时间：剩余天数 + 时间进度条，逾期标红，可手动点「完成」）
 * - 行操作走右键菜单（范式同 SiteContextMenu）：编辑 / 删除（菜单内两步确认）；子任务右键只有删除
 * - 头部「AI 整理」切换到整理视图：一句话杂事 → 本地规则拆分预览（可勾选、可改字）→ 确认落库
 *   AI 只做拆分归类，不改动已有事项；拆分实现见 utils/taskSplit.ts（可替换为真 AI）
 * - 第二十五轮：待办/计划两列抽成 TasksSection / PlansSection 共享组件，本面板（variant='panel'）与
 *   2x 任务卡卡面（variant='card'，仅核心交互）共用同一套渲染逻辑；本面板行为不变
 * - 第五十二轮（只动配色，功能/结构不动）：计划条目浮起（bg-white/10 + border-white/20）、
 *   进度轨道 white/20、计数提到 zinc-200、−/+ 钮做实（white/10 底）、待办区次级文字统一 zinc-300 档、
 *   复选框边框 white/50、输入 placeholder zinc-400；本节区与 TaskCard 共用，卡面同步生效
 * - 第五十四轮：待办拖拽合并成组——在「未完成」列表里按住顶层待办行身（控件除外）拖动、
 *   压到另一条顶层待办上松手即合并（手势与反馈沿用 useSiteDragSort 的两段式指针拖拽，
 *   落盘走 store.mergeTaskIntoGroup）；已完成区条目不参与，手动建组入口不变
 * - 第五十七轮：① 修「加了子任务还显示组里还没有子任务」——空提示条件本身没错（与子任务行
 *   同源于 group.children），病在添加路径只靠表单隐式提交：中文输入法组合态下按回车只上屏、
 *   不触发提交，文字留在框里、组仍为空。子任务/添加待办/组名三个输入框改由 keydown 显式提交
 *   （组合中的回车忽略、提交后草稿同步清零防同键重复），标题编辑框的回车同样加组合守卫；
 *   ② 拖拽合并改口径：普通 × 普通改为新建自动命名组「小组N」（语义见 store.mergeTaskIntoGroup）
 * - 第六十九轮：展开面板（TaskPanel）取消——「展开」按钮与面板这一层删除，全部操作回到卡面：
 *   建组入口、新建计划表单不再区分 variant，卡面（唯一的承载方）全功能；AI 整理改为卡面头部
 *   按钮切换卡内视图（AiView 仍在本文件）；待办/组/子任务的截断标题改为点击文字展开全文、
 *   再点收起（勾选框不触发，编辑仍走右键菜单；合并拖拽刚结束的那次点击由 wasJustDragged 守卫吞掉）
 */

interface RowMenuState {
  x: number;
  y: number;
  kind: 'task' | 'taskGroup' | 'taskChild' | 'plan';
  id: string;
  /** kind=taskChild 时为所属顶层待办 id */
  parentId?: string;
  title: string;
}

function rowMenuPosition(e: React.MouseEvent): { x: number; y: number } {
  const MENU_W = 180;
  const MENU_H = 190;
  return {
    x: Math.max(8, Math.min(e.clientX, window.innerWidth - MENU_W - 8)),
    y: Math.max(8, Math.min(e.clientY, window.innerHeight - MENU_H - 8)),
  };
}

/** 拖拽合并的起手阈值（px，与 useSiteDragSort 同值）：短距离移动只算点击，不误触 */
const TASK_DRAG_THRESHOLD = 7;

/**
 * 待办拖拽合并手势（第五十四轮，沿用 useSiteDragSort 的 pending → active 两段式指针拖拽）：
 * - 行身 pointerdown 只登记 pending；越过阈值才激活：源行半透明、标题浮层跟随指针、
 *   指针压住的另一条顶层待办（[data-task-entry]，且必须在本 hook 的 listRef 容器内）以 indigo 高亮
 * - 松手：有高亮目标且不是自己 → onMerge(sourceId, targetId)；落在空白/自己身上、Esc、pointercancel 一律取消复原
 * - 勾选框、展开箭头、输入框、按钮等控件（button/input/form 等）不作起手点，原有点击/右键交互不受影响
 */
function useTaskMergeDrag(onMerge: (sourceId: string, targetId: string) => void) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [clone, setClone] = useState<{ title: string; isGroup: boolean; w: number } | null>(null);
  const cloneRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const pendingRef = useRef<{
    id: string;
    title: string;
    isGroup: boolean;
    pointerId: number;
    startX: number;
    startY: number;
  } | null>(null);
  const activeRef = useRef<{
    id: string;
    pointerId: number;
    offsetX: number;
    offsetY: number;
    lastX: number;
    lastY: number;
    overId: string | null;
  } | null>(null);
  const onMergeRef = useRef(onMerge);
  onMergeRef.current = onMerge;
  /** 最近一次拖拽结束时刻（第六十九轮）：标题点击展开用它吞掉「拖完松手」紧随的那次 click */
  const lastDragEndAtRef = useRef(0);

  useEffect(() => {
    const positionClone = (x: number, y: number) => {
      const d = activeRef.current;
      if (d && cloneRef.current) {
        cloneRef.current.style.transform = `translate(${x - d.offsetX}px, ${y - d.offsetY}px)`;
      }
    };

    const endDrag = (commit: boolean) => {
      const d = activeRef.current;
      pendingRef.current = null;
      if (!d) return;
      lastDragEndAtRef.current = Date.now();
      activeRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      const targetId = d.overId;
      setDragId(null);
      setOverId(null);
      setClone(null);
      if (commit && targetId && targetId !== d.id) onMergeRef.current(d.id, targetId);
    };

    const updateOver = (x: number, y: number) => {
      const d = activeRef.current;
      if (!d) return;
      const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-task-entry]');
      const id = el && listRef.current?.contains(el) ? el.dataset.taskEntry : undefined;
      const next = id && id !== d.id ? id : null;
      if (next !== d.overId) {
        d.overId = next;
        setOverId(next);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const pending = pendingRef.current;
      if (!activeRef.current && pending && e.pointerId === pending.pointerId) {
        if (Math.hypot(e.clientX - pending.startX, e.clientY - pending.startY) < TASK_DRAG_THRESHOLD) return;
        const entryEl = listRef.current?.querySelector<HTMLElement>(`[data-task-entry="${pending.id}"]`);
        if (!entryEl) {
          pendingRef.current = null;
          return;
        }
        // 快照基准：组取头部行（整块含子任务太高），普通待办取行本身
        const gripEl = entryEl.querySelector<HTMLElement>('[data-task-grip]') ?? entryEl;
        const rect = gripEl.getBoundingClientRect();
        pendingRef.current = null;
        activeRef.current = {
          id: pending.id,
          pointerId: pending.pointerId,
          offsetX: pending.startX - rect.left,
          offsetY: pending.startY - rect.top,
          lastX: e.clientX,
          lastY: e.clientY,
          overId: null,
        };
        setDragId(pending.id);
        setClone({ title: pending.title, isGroup: pending.isGroup, w: Math.max(rect.width, 120) });
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
      }
      const d = activeRef.current;
      if (d && e.pointerId === d.pointerId) {
        d.lastX = e.clientX;
        d.lastY = e.clientY;
        positionClone(e.clientX, e.clientY);
        updateOver(e.clientX, e.clientY);
      }
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

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      window.removeEventListener('keydown', onKeyDown);
      if (activeRef.current) {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
  }, []);

  // 浮层挂载后先定位到抓起处，避免首帧闪到左上角（同 useSiteDragSort）
  useEffect(() => {
    const d = activeRef.current;
    if (clone && d && cloneRef.current) {
      cloneRef.current.style.transform = `translate(${d.lastX - d.offsetX}px, ${d.lastY - d.offsetY}px)`;
    }
  }, [clone]);

  /** 挂在顶层待办行身（普通行根 / 组头部行）上：只负责记下起手，控件与右键不作起手点 */
  const beginTaskDrag = (e: React.PointerEvent, task: TaskItem) => {
    if (e.button !== 0 || pendingRef.current || activeRef.current) return;
    const t = e.target as HTMLElement;
    if (t.closest('button, input, textarea, select, a, form, [contenteditable="true"]')) return;
    pendingRef.current = {
      id: task.id,
      title: task.title,
      isGroup: isTaskGroup(task),
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
    };
  };

  /** 刚结束过一次真实拖拽（400ms 内）：标题的 onClick 先问它，是则吞掉本次点击 */
  const wasJustDragged = () => Date.now() - lastDragEndAtRef.current < 400;

  return { dragId, overId, clone, cloneRef, listRef, beginTaskDrag, wasJustDragged };
}

/**
 * 待办列（第二十五轮抽成共享组件；第六十九轮起面板取消，只由 2x 计划卡卡面承载，全功能）：
 * 勾选/添加/建组/组展开勾子任务/已完成折叠/行右键编辑删除/拖拽合并都在卡面直接完成；
 * 标题截断时点击文字展开全文、再点收起（第六十九轮）
 */
export function TasksSection({ store }: { store: LocalStore }) {
  const { tasks } = store.data;
  const [menu, setMenu] = useState<RowMenuState | null>(null);
  /** 「已完成」分组头右键菜单（第四十八轮）：只记位置，开/关与行菜单分开管理 */
  const [doneMenu, setDoneMenu] = useState<{ x: number; y: number } | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showDone, setShowDone] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupName, setGroupName] = useState('');
  /** 两个草稿的 ref 镜像（理由同 GroupBlock 第五十七轮注：回车显式提交 + 同步清零防重复） */
  const newTaskRef = useRef('');
  const groupNameRef = useRef('');
  /** 待办拖拽合并（第五十四轮）：手势状态在本节内管理 */
  const drag = useTaskMergeDrag(store.mergeTaskIntoGroup);
  /** 标题展开全文的条目 id 集合（第六十九轮，点击文字切换；与编辑态互不干扰） */
  const [expandedTitles, setExpandedTitles] = useState<ReadonlySet<string>>(new Set());
  const toggleTitle = (id: string) => {
    if (drag.wasJustDragged()) return;
    setExpandedTitles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 计数口径与卡面一致：组按子任务摊平（taskFlatStats）；顶层条目按完成态分未完成/已完成两区
  const flat = taskFlatStats(tasks);
  const flatOpen = flat.total - flat.done;
  const openEntries = tasks.filter((t) => !taskEntryDone(t));
  const doneEntries = tasks.filter((t) => taskEntryDone(t));

  const openMenu = (e: React.MouseEvent, kind: RowMenuState['kind'], id: string, title: string, parentId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ ...rowMenuPosition(e), kind, id, title, parentId });
  };

  const startEditTask = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setEditText(task.title);
  };

  const commitEditTask = () => {
    if (editingTaskId) store.renameTask(editingTaskId, editText);
    setEditingTaskId(null);
  };

  const changeNewTask = (v: string) => {
    newTaskRef.current = v;
    setNewTask(v);
  };

  const submitNewTask = () => {
    const draft = newTaskRef.current;
    if (!draft.trim()) return;
    store.addTask(draft);
    changeNewTask('');
  };

  const changeGroupName = (v: string) => {
    groupNameRef.current = v;
    setGroupName(v);
  };

  const submitGroup = () => {
    const draft = groupNameRef.current;
    if (!draft.trim()) return;
    store.addTaskGroup(draft);
    changeGroupName('');
    setShowGroupForm(false);
  };

  /** 输入框回车显式提交（第五十七轮，同 GroupBlock 子任务框的口径）：
   * 输入法组合中的回车只上屏；组合结束后的回车直接提交并挡掉表单隐式提交防重复 */
  const enterToSubmit = (submit: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const checkBtn = (done: boolean, onToggle: () => void, label: string) => (
    <button
      type="button"
      aria-label={label}
      onClick={onToggle}
      className={`w-[18px] h-[18px] rounded-[5px] border flex items-center justify-center shrink-0 transition-colors ${
        done ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-white/50 hover:border-indigo-300 text-transparent'
      }`}
    >
      <Check size={12} strokeWidth={3} />
    </button>
  );

  const titleEditor = (id: string) => (
    <input
      value={editText}
      autoFocus
      onChange={(e) => setEditText(e.target.value)}
      onKeyDown={(e) => {
        // 输入法组合中的回车只上屏，别把半成品标题提前提交（第五十七轮）
        if (e.key === 'Enter' && !e.nativeEvent.isComposing) commitEditTask();
        if (e.key === 'Escape') setEditingTaskId(null);
      }}
      onBlur={commitEditTask}
      className="flex-1 min-w-0 bg-white/5 border border-indigo-400/50 rounded-lg px-2 py-1 text-sm outline-none"
      data-task-edit-input
    />
  );

  /** 顶层行渲染：inOpen=true 的行（仅「未完成」区）参与拖拽合并（第五十四轮）——
   * 带 data-task-entry 落点标记与行身起手；已完成区行不带标记、不可拖 */
  const taskRow = (task: TaskItem, inOpen: boolean) => {
    const dragVisual: 'source' | 'over' | null =
      drag.dragId === task.id ? 'source' : drag.overId === task.id ? 'over' : null;
    return isTaskGroup(task) ? (
      <GroupBlock
        key={task.id}
        group={task}
        store={store}
        startExpanded={!taskGroupDone(task)}
        editing={editingTaskId === task.id}
        editor={titleEditor(task.id)}
        onMenu={(e) => openMenu(e, 'taskGroup', task.id, task.title)}
        onChildMenu={(e, childId, childTitle) => openMenu(e, 'taskChild', childId, childTitle, task.id)}
        checkBtn={checkBtn}
        entryId={inOpen ? task.id : undefined}
        dragVisual={inOpen ? dragVisual : null}
        onGripPointerDown={inOpen ? (e) => drag.beginTaskDrag(e, task) : undefined}
        wasJustDragged={drag.wasJustDragged}
      />
    ) : (
      <div
        key={task.id}
        data-task-row
        data-task-entry={inOpen ? task.id : undefined}
        onPointerDown={inOpen ? (e) => drag.beginTaskDrag(e, task) : undefined}
        onContextMenu={(e) => openMenu(e, 'task', task.id, task.title)}
        className={`flex items-center gap-2.5 px-2 py-2 rounded-xl min-w-0 ${
          dragVisual === 'over'
            ? 'bg-indigo-500/15 ring-1 ring-inset ring-indigo-400/60'
            : 'hover:bg-white/[0.04]'
        } ${dragVisual === 'source' ? 'opacity-40' : ''}`}
      >
        {checkBtn(task.done, () => store.toggleTask(task.id), task.done ? '取消完成' : '标记完成')}
        {editingTaskId === task.id ? (
          titleEditor(task.id)
        ) : (
          <span
            data-task-title
            onClick={() => toggleTitle(task.id)}
            title={expandedTitles.has(task.id) ? '点击收起' : '点击展开全文'}
            className={`flex-1 min-w-0 text-sm ${
              expandedTitles.has(task.id) ? 'whitespace-normal break-words' : 'truncate'
            } ${task.done ? 'line-through text-white/35' : 'text-white/85'}`}
          >
            {task.title}
          </span>
        )}
      </div>
    );
  };

  return (
    <section>
      <div className="flex items-baseline gap-2 mb-1.5">
        <h4 className="text-sm font-semibold">待办</h4>
        <span className="text-[11px] text-zinc-300">未完成 {flatOpen}</span>
      </div>
      <div data-nodrag ref={drag.listRef}>
        {tasks.length === 0 && <p className="text-[13px] text-zinc-300 px-2 py-3">暂无待办，在下方添加第一件。</p>}
        {openEntries.map((t) => taskRow(t, true))}
      </div>
      {doneEntries.length > 0 && (
        <div className="mt-1.5">
          <button
            type="button"
            data-done-header
            onClick={() => setShowDone((v) => !v)}
            onContextMenu={(e) => {
              // 右键只出本菜单：拦掉卡片级（尺寸/换底色）与主页空白右键菜单；左键折叠行为不变
              e.preventDefault();
              e.stopPropagation();
              setDoneMenu(rowMenuPosition(e));
            }}
            className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-zinc-300 hover:text-white transition-colors"
          >
            <ChevronDown size={13} className={`transition-transform ${showDone ? '' : '-rotate-90'}`} />
            已完成 {doneEntries.length} 项
          </button>
          {showDone && <div data-nodrag>{doneEntries.map((t) => taskRow(t, false))}</div>}
        </div>
      )}
      <form
        className="mt-2.5 flex items-center gap-1.5 bg-white/[0.07] border border-white/20 rounded-xl pl-2.5 pr-1.5 py-1 focus-within:border-indigo-400/50 transition-colors"
        onSubmit={(e) => {
          e.preventDefault();
          submitNewTask();
        }}
      >
        <Plus size={14} className="text-zinc-300 shrink-0" />
        <input
          value={newTask}
          onChange={(e) => changeNewTask(e.target.value)}
          onKeyDown={enterToSubmit(submitNewTask)}
          placeholder="添加待办，回车确认"
          data-task-add
          className="flex-1 min-w-0 bg-transparent text-sm py-1.5 outline-none placeholder:text-zinc-400"
        />
      </form>
      {/* 建组入口：组用来收纳一组相关的子任务（如一次采购清单）；第六十九轮起卡面直接提供（原仅面板） */}
      {showGroupForm ? (
          <form
            className="mt-2 flex items-center gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              submitGroup();
            }}
          >
            <input
              value={groupName}
              autoFocus
              onChange={(e) => changeGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setShowGroupForm(false);
                else enterToSubmit(submitGroup)(e);
              }}
              placeholder="组名，如 周末采购"
              data-group-name
              className="flex-1 min-w-0 bg-white/5 border border-white/12 rounded-xl px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400/50 placeholder:text-zinc-400"
            />
            <button
              type="submit"
              disabled={!groupName.trim()}
              data-group-create
              className="px-3 py-1.5 rounded-lg bg-indigo-500/80 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium transition-colors shrink-0"
            >
              建组
            </button>
            <button
              type="button"
              onClick={() => setShowGroupForm(false)}
              className="px-3 py-1.5 rounded-lg bg-white/8 text-white/70 text-xs hover:bg-white/12 transition-colors shrink-0"
            >
              取消
            </button>
          </form>
        ) : (
          <button
            type="button"
            data-group-new
            onClick={() => setShowGroupForm(true)}
            className="mt-2 w-full py-1.5 rounded-xl border border-dashed border-white/20 text-[11px] text-zinc-300 hover:text-white hover:border-white/40 transition-colors"
          >
            + 建组（把几件相关的事收在一起）
          </button>
        )}

      {/* 行右键菜单（编辑/删除，删除在菜单内两步确认） */}
      {menu && (
        <RowContextMenu
          state={menu}
          onClose={() => setMenu(null)}
          onPick={(action) => {
            if (action === 'edit') {
              const task = tasks.find((t) => t.id === menu.id);
              if (task) {
                // 在已完成区里的条目要先展开该区，就地编辑框才看得见
                if (taskEntryDone(task)) setShowDone(true);
                startEditTask(task);
              }
            } else if (action === 'delete') {
              if (menu.kind === 'taskChild' && menu.parentId) store.deleteSubTask(menu.parentId, menu.id);
              else store.deleteTask(menu.id);
            }
            setMenu(null);
          }}
        />
      )}

      {/* 「已完成」分组头右键菜单（第四十八轮）：一键清空，不加二次确认（文案写明「全部」防误解） */}
      {doneMenu && (
        <DoneClearMenu
          x={doneMenu.x}
          y={doneMenu.y}
          count={doneEntries.length}
          onClose={() => setDoneMenu(null)}
          onConfirm={() => {
            store.clearCompletedTasks();
            setDoneMenu(null);
          }}
        />
      )}

      {/* 拖拽合并的跟随浮层（第五十四轮）：被拖条目的标题片，视觉语言同主页拖影（深底+亮环+抬升阴影） */}
      {drag.clone && (
        <div
          ref={drag.cloneRef}
          data-task-drag-clone
          className="fixed left-0 top-0 z-[95] pointer-events-none will-change-transform"
          style={{ width: drag.clone.w }}
        >
          <div className="flex items-center gap-2 rounded-xl bg-[#23232c] px-3 py-2 shadow-2xl shadow-black/70 ring-1 ring-white/25 opacity-95">
            {drag.clone.isGroup ? (
              <Layers size={13} className="text-zinc-300 shrink-0" />
            ) : (
              <span className="w-[18px] h-[18px] rounded-[5px] border border-white/50 shrink-0" />
            )}
            <span className="flex-1 min-w-0 truncate text-sm text-white/90">{drag.clone.title}</span>
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * 长期计划列（第二十五轮抽成共享组件，理由同 TasksSection；第六十九轮起只由卡面承载）：
 * 核心交互（次数型 −1/+1、日期型「完成」）与新建/编辑表单都在卡面直接完成，
 * 新建入口原先只在展开面板里，本轮按用户要求搬到卡面（见 PlansSection 末尾「+ 新计划」）
 */
export function PlansSection({ store }: { store: LocalStore }) {
  const { plans } = store.data;
  const [menu, setMenu] = useState<RowMenuState | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [showPlanForm, setShowPlanForm] = useState(false);

  const openMenu = (e: React.MouseEvent, plan: PlanItem) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ ...rowMenuPosition(e), kind: 'plan', id: plan.id, title: plan.title });
  };

  return (
    <section>
      <div className="flex items-baseline gap-2 mb-1.5">
        <h4 className="text-sm font-semibold">长期计划</h4>
        <span className="text-[11px] text-zinc-300">{plans.length} 个</span>
      </div>
      <div className="flex flex-col gap-1.5" data-nodrag>
        {plans.length === 0 && !showPlanForm && (
          <p className="text-[13px] text-zinc-300 px-2 py-3">暂无长期计划，点下方「+ 新计划」添加。</p>
        )}
        {plans.map((plan) =>
          editingPlanId === plan.id ? (
            <PlanEditForm key={plan.id} plan={plan} store={store} onClose={() => setEditingPlanId(null)} />
          ) : (
            <PlanRow key={plan.id} plan={plan} store={store} onContextMenu={(e) => openMenu(e, plan)} />
          ),
        )}
      </div>
      {/* 新建计划入口（第六十九轮：从展开面板搬到卡面，表单即原 PlanCreateForm，卡内原地展开） */}
      {showPlanForm ? (
        <PlanCreateForm store={store} onClose={() => setShowPlanForm(false)} />
      ) : (
        <button
          type="button"
          data-plan-new
          onClick={() => setShowPlanForm(true)}
          className="mt-3 w-full py-2 rounded-xl border border-dashed border-white/25 text-xs text-zinc-300 hover:text-white hover:border-white/45 transition-colors"
        >
          + 新计划
        </button>
      )}

      {/* 行右键菜单（编辑/删除） */}
      {menu && (
        <RowContextMenu
          state={menu}
          onClose={() => setMenu(null)}
          onPick={(action) => {
            if (action === 'edit') setEditingPlanId(menu.id);
            else if (action === 'delete') store.deletePlan(menu.id);
            else if (action === 'markDone') store.setPlanDone(menu.id, true);
            else if (action === 'unmarkDone') store.setPlanDone(menu.id, false);
            setMenu(null);
          }}
        />
      )}
    </section>
  );
}

/** 组块：标题行（展开箭头 + 标题 + n/m）+ 子任务列表 + 组内添加行；全勾时标题划线。
 * 拖拽合并（第五十四轮）：entryId 存在时整块是落点（[data-task-entry]），头部行是起手区
 * （[data-task-grip]，子任务行与组内添加表单不作起手）；dragVisual 渲染源行半透明/落点高亮 */
const GroupBlock: React.FC<{
  group: TaskItem;
  store: LocalStore;
  startExpanded: boolean;
  editing: boolean;
  editor: React.ReactNode;
  onMenu: (e: React.MouseEvent) => void;
  onChildMenu: (e: React.MouseEvent, childId: string, childTitle: string) => void;
  checkBtn: (done: boolean, onToggle: () => void, label: string) => React.ReactNode;
  entryId?: string;
  dragVisual?: 'source' | 'over' | null;
  onGripPointerDown?: (e: React.PointerEvent) => void;
  /** 合并拖拽刚结束守卫（第六十九轮，理由同 TasksSection 的 toggleTitle） */
  wasJustDragged?: () => boolean;
}> = ({ group, store, startExpanded, editing, editor, onMenu, onChildMenu, checkBtn, entryId, dragVisual, onGripPointerDown, wasJustDragged }) => {
  const [expanded, setExpanded] = useState(startExpanded);
  /** 组标题/子任务标题的点击展开全文（第六十九轮，点文字切换，与展开箭头的折叠子任务互不影响） */
  const [titleExpanded, setTitleExpanded] = useState(false);
  const [expandedKids, setExpandedKids] = useState<ReadonlySet<string>>(new Set());
  const [subDraft, setSubDraft] = useState('');
  /** 草稿的 ref 镜像：提交时同步读它并清零，让同一次回车即便同时触发 keydown 与表单 submit 也只加一条；
   * 回车改由输入框 keydown 显式提交（见下方 input）——只靠表单隐式提交时，中文输入法组合态下
   * 按回车只上屏不提交，用户会以为加了、实际文字还留在框里（第五十七轮修） */
  const subDraftRef = useRef('');
  const kids = group.children ?? [];
  const { done, total } = taskChildProgress(group);
  const allDone = taskGroupDone(group);

  const changeSubDraft = (v: string) => {
    subDraftRef.current = v;
    setSubDraft(v);
  };

  const submitSub = () => {
    const draft = subDraftRef.current;
    if (!draft.trim()) return;
    store.addSubTask(group.id, draft);
    changeSubDraft('');
    setExpanded(true);
  };

  return (
    <div
      data-task-group
      data-task-entry={entryId}
      className={`rounded-xl px-2 py-1.5 ${
        dragVisual === 'over' ? 'bg-indigo-500/15 ring-1 ring-inset ring-indigo-400/60' : 'hover:bg-white/[0.04]'
      } ${dragVisual === 'source' ? 'opacity-40' : ''}`}
      onContextMenu={onMenu}
    >
      <div className="flex items-center gap-2 min-w-0" data-task-grip onPointerDown={onGripPointerDown}>
        <button
          type="button"
          aria-label={expanded ? '收起组' : '展开组'}
          data-group-toggle
          onClick={() => setExpanded((v) => !v)}
          className="w-[18px] h-[18px] flex items-center justify-center shrink-0 text-zinc-300 hover:text-white transition-colors"
        >
          <ChevronDown size={14} className={`transition-transform ${expanded ? '' : '-rotate-90'}`} />
        </button>
        {editing ? (
          editor
        ) : (
          <>
            <span
              data-group-title
              onClick={() => {
                if (wasJustDragged?.()) return;
                setTitleExpanded((v) => !v);
              }}
              className={`flex-1 min-w-0 text-sm font-medium ${
                titleExpanded ? 'whitespace-normal break-words' : 'truncate'
              } ${allDone ? 'line-through text-white/35' : 'text-white/90'}`}
            >
              {group.title}
            </span>
            <span data-group-progress className="text-[11px] text-zinc-300 tabular-nums shrink-0">
              {done}/{total}
            </span>
          </>
        )}
      </div>
      {expanded && (
        <div className="mt-0.5 ml-[26px] flex flex-col">
          {kids.length === 0 && (
            <p className="text-xs text-zinc-300 py-1.5">组里还没有子任务，在下方添加。</p>
          )}
          {kids.map((child) => (
            <div
              key={child.id}
              data-subtask-row
              onContextMenu={(e) => {
                e.stopPropagation();
                onChildMenu(e, child.id, child.title);
              }}
              className="flex items-center gap-2.5 py-1.5 min-w-0"
            >
              {checkBtn(child.done, () => store.toggleSubTask(group.id, child.id), child.done ? '取消完成' : '标记完成')}
              <span
                data-subtask-title
                onClick={() => {
                  if (wasJustDragged?.()) return;
                  setExpandedKids((prev) => {
                    const next = new Set(prev);
                    if (next.has(child.id)) next.delete(child.id);
                    else next.add(child.id);
                    return next;
                  });
                }}
                className={`flex-1 min-w-0 text-[13px] ${
                  expandedKids.has(child.id) ? 'whitespace-normal break-words' : 'truncate'
                } ${child.done ? 'line-through text-white/35' : 'text-white/80'}`}
              >
                {child.title}
              </span>
            </div>
          ))}
          <form
            className="mt-1 flex items-center gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              submitSub();
            }}
          >
            <Plus size={13} className="text-zinc-400 shrink-0" />
            <input
              value={subDraft}
              onChange={(e) => changeSubDraft(e.target.value)}
              onKeyDown={(e) => {
                // 输入法组合中（isComposing）的回车只用来上屏，不添加；组合结束后的回车才提交，
                // 并 preventDefault 挡掉表单隐式提交，避免同一次按键重复添加
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submitSub();
                }
              }}
              placeholder="添加子任务，回车确认"
              data-subtask-add
              className="flex-1 min-w-0 bg-transparent text-[13px] py-1 outline-none placeholder:text-zinc-400 border-b border-transparent focus:border-indigo-400/40 transition-colors"
            />
          </form>
        </div>
      )}
    </div>
  );
};

/** 长期计划行：次数型（n/m 单位 + 进度条 + −1/+1）/ 日期型（剩余天数 + 目标日 + 时间进度条 + 完成按钮） */
const PlanRow: React.FC<{
  plan: PlanItem;
  store: LocalStore;
  onContextMenu: (e: React.MouseEvent) => void;
}> = ({ plan, store, onContextMenu }) => {
  if (plan.mode === 'date') {
    const daysLeft = plan.deadline ? dateStrDiffDays(todayDateStr(), plan.deadline) : 0;
    const overdue = !plan.done && daysLeft < 0;
    const ratio = plan.done ? 1 : planDateRatio(plan);
    return (
      <div data-plan-item data-plan-mode="date" className="rounded-2xl border border-white/20 bg-white/10 px-3 py-2.5" onContextMenu={onContextMenu}>
        <div className="flex items-center gap-2">
          <span className={`flex-1 min-w-0 truncate text-sm font-medium ${plan.done ? 'line-through text-white/40' : 'text-white/90'}`}>
            {plan.title}
          </span>
          {plan.done ? (
            <span className="flex items-center gap-1 text-[11px] text-indigo-200 shrink-0">
              <Check size={12} /> 已完成
            </span>
          ) : (
            <button
              type="button"
              data-plan-finish
              onClick={() => store.setPlanDone(plan.id, true)}
              className="text-[11px] px-2 py-1 rounded-md bg-white/10 text-zinc-200 hover:bg-indigo-500/70 hover:text-white transition-colors shrink-0"
            >
              完成
            </button>
          )}
        </div>
        <div className="mt-1 flex items-baseline gap-2 text-[11px]">
          {plan.done ? (
            <span className="text-zinc-400">目标 {plan.deadline ? formatMonthDay(plan.deadline) : ''}</span>
          ) : overdue ? (
            <span data-plan-status className="text-red-200 font-medium">
              已逾期 {-daysLeft} 天
            </span>
          ) : (
            <span data-plan-status className="text-zinc-200">
              {daysLeft === 0 ? '今天到期' : `还剩 ${daysLeft} 天`}
            </span>
          )}
          {!plan.done && plan.deadline && <span className="text-zinc-400">· 目标 {formatMonthDay(plan.deadline)}</span>}
        </div>
        <div className="mt-2 h-1 rounded-full bg-white/20 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${overdue ? 'bg-red-400' : 'bg-indigo-400'}`}
            style={{ width: `${Math.round(ratio * 100)}%` }}
          />
        </div>
      </div>
    );
  }

  const cur = plan.currentCount ?? 0;
  const target = plan.targetCount ?? 0;
  const unit = plan.unit ?? '次';
  const full = target > 0 && cur >= target;
  const ratio = planCountRatio(plan);
  const stepBtn =
    'w-6 h-6 rounded-lg bg-white/10 text-zinc-100 hover:bg-white/20 hover:text-white disabled:opacity-40 disabled:hover:bg-white/10 flex items-center justify-center transition-colors shrink-0';
  return (
    <div data-plan-item data-plan-mode="count" className="rounded-2xl border border-white/20 bg-white/10 px-3 py-2.5" onContextMenu={onContextMenu}>
      <div className="flex items-center gap-2">
        <span className={`flex-1 min-w-0 truncate text-sm font-medium ${full ? 'text-indigo-200' : 'text-white/90'}`}>
          {plan.title}
        </span>
        <span data-plan-progress className="text-[11px] text-zinc-200 tabular-nums shrink-0">
          {cur}/{target} {unit}
        </span>
        {full && <Check size={13} className="text-indigo-200 shrink-0" />}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
          <div className="h-full rounded-full bg-indigo-400 transition-all duration-300" style={{ width: `${Math.round(ratio * 100)}%` }} />
        </div>
        <button
          type="button"
          aria-label="减少一次"
          data-plan-minus
          disabled={cur <= 0}
          onClick={() => store.bumpPlanCount(plan.id, -1)}
          className={stepBtn}
        >
          <Minus size={12} />
        </button>
        <button
          type="button"
          aria-label="增加一次"
          data-plan-plus
          disabled={full}
          onClick={() => store.bumpPlanCount(plan.id, 1)}
          className={stepBtn}
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
};

const planInputCls =
  'w-full bg-white/5 border border-white/12 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400/50 placeholder:text-zinc-400';

/** 新建计划表单：标题 + 类型切换（按次数/按日期）+ 对应字段 */
function PlanCreateForm({ store, onClose }: { store: LocalStore; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<'count' | 'date'>('count');
  const [target, setTarget] = useState('10');
  const [unit, setUnit] = useState('次');
  const [deadline, setDeadline] = useState(todayDateStr());
  const today = todayDateStr();

  const canSubmit =
    title.trim().length > 0 && (mode === 'count' ? parseInt(target, 10) > 0 : deadline >= today);

  const submit = () => {
    if (!canSubmit) return;
    if (mode === 'count') {
      store.addPlan(title, { mode, targetCount: parseInt(target, 10) || 10, unit });
    } else {
      store.addPlan(title, { mode, deadline });
    }
    onClose();
  };

  const modeBtn = (m: 'count' | 'date', label: string) => (
    <button
      type="button"
      data-plan-mode-btn={m}
      onClick={() => setMode(m)}
      className={`flex-1 text-xs py-1.5 rounded-lg transition-colors ${
        mode === m ? 'bg-indigo-500/70 text-white font-medium' : 'text-white/50 hover:text-white/85'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="mt-3 rounded-2xl border border-white/12 bg-white/[0.03] p-3" data-plan-form>
      <input
        value={title}
        autoFocus
        onChange={(e) => setTitle(e.target.value)}
        placeholder="计划标题，如 健身打卡 / 交设计稿"
        data-plan-title
        className={planInputCls}
      />
      <div className="mt-2 flex items-center rounded-xl bg-white/5 border border-white/10 p-0.5">
        {modeBtn('count', '按次数')}
        {modeBtn('date', '按日期')}
      </div>
      {mode === 'count' ? (
        <div className="mt-2 flex items-center gap-2">
          <label className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-[11px] text-zinc-300 shrink-0">目标</span>
            <input
              type="number"
              min={1}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              data-plan-target
              className="w-full min-w-0 bg-white/5 border border-white/12 rounded-xl px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400/50"
            />
          </label>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            maxLength={4}
            placeholder="次"
            data-plan-unit
            className="w-16 bg-white/5 border border-white/12 rounded-xl px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400/50 placeholder:text-zinc-400"
          />
        </div>
      ) : (
        <label className="mt-2 flex items-center gap-2">
          <span className="text-[11px] text-zinc-300 shrink-0">完成时间</span>
          <input
            type="date"
            min={today}
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            data-plan-deadline
            className="flex-1 min-w-0 bg-white/5 border border-white/12 rounded-xl px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400/50 [color-scheme:dark]"
          />
        </label>
      )}
      <div className="mt-2.5 flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          data-plan-submit
          className="px-3.5 py-1.5 rounded-lg bg-indigo-500/80 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium transition-colors"
        >
          添加计划
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-3.5 py-1.5 rounded-lg bg-white/8 text-white/70 text-xs hover:bg-white/12 transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  );
}

/** 编辑计划表单：改标题 + 本类型的目标（次数型：目标数/单位；日期型：目标日）。挂载即以现值初始化 */
const PlanEditForm: React.FC<{ plan: PlanItem; store: LocalStore; onClose: () => void }> = ({ plan, store, onClose }) => {
  const [title, setTitle] = useState(plan.title);
  const [target, setTarget] = useState(String(plan.targetCount ?? 10));
  const [unit, setUnit] = useState(plan.unit ?? '次');
  const [deadline, setDeadline] = useState(plan.deadline ?? todayDateStr());

  const submit = () => {
    if (!title.trim()) return;
    if (plan.mode === 'count') {
      const n = parseInt(target, 10);
      store.updatePlan(plan.id, { title, targetCount: n > 0 ? n : undefined, unit });
    } else {
      store.updatePlan(plan.id, { title, deadline });
    }
    onClose();
  };

  return (
    <div className="rounded-2xl border border-indigo-300/25 bg-indigo-500/[0.05] p-3" data-plan-edit-form>
      <input value={title} autoFocus onChange={(e) => setTitle(e.target.value)} data-plan-edit-title className={planInputCls} />
      {plan.mode === 'count' ? (
        <div className="mt-2 flex items-center gap-2">
          <label className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-[11px] text-zinc-300 shrink-0">目标</span>
            <input
              type="number"
              min={1}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              data-plan-edit-target
              className="w-full min-w-0 bg-white/5 border border-white/12 rounded-xl px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400/50"
            />
          </label>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            maxLength={4}
            data-plan-edit-unit
            className="w-16 bg-white/5 border border-white/12 rounded-xl px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400/50"
          />
        </div>
      ) : (
        <label className="mt-2 flex items-center gap-2">
          <span className="text-[11px] text-zinc-300 shrink-0">完成时间</span>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            data-plan-edit-deadline
            className="flex-1 min-w-0 bg-white/5 border border-white/12 rounded-xl px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400/50 [color-scheme:dark]"
          />
        </label>
      )}
      <div className="mt-2.5 flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={!title.trim()}
          data-plan-edit-save
          className="px-3.5 py-1.5 rounded-lg bg-indigo-500/80 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium transition-colors"
        >
          保存
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-3.5 py-1.5 rounded-lg bg-white/8 text-white/70 text-xs hover:bg-white/12 transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  );
};

/** 「已完成」分组头右键菜单（第四十八轮）：与行菜单同壳同关闭范式，只一项「删除全部已完成项」 */
function DoneClearMenu({
  x,
  y,
  count,
  onClose,
  onConfirm,
}: {
  x: number;
  y: number;
  count: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onScroll = () => onClose();
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    document.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      data-done-clear-menu
      className="fixed z-[90] w-[196px] rounded-2xl bg-[#1e1e26] border border-white/15 shadow-2xl shadow-black/70 p-1.5"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <button
        type="button"
        data-done-clear-action
        onClick={onConfirm}
        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs text-red-300 hover:bg-red-500/10 transition-colors"
      >
        <Trash2 size={13} /> 删除全部已完成项（{count}）
      </button>
    </div>
  );
}

/** 行右键菜单：范式同 SiteContextMenu（实色、点外关闭、删除两步确认） */
function RowContextMenu({
  state,
  onClose,
  onPick,
}: {
  state: RowMenuState;
  onClose: () => void;
  onPick: (action: 'edit' | 'delete' | 'markDone' | 'unmarkDone') => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    setConfirming(false);
  }, [state]);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onScroll = () => onClose();
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    document.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [onClose]);

  const itemCls =
    'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs text-white/75 hover:bg-white/8 hover:text-white transition-colors';
  const showEdit = state.kind !== 'taskChild';
  const deleteLabel = state.kind === 'taskGroup' ? '删除组' : '删除';

  return (
    <div
      ref={ref}
      data-row-menu
      className="fixed z-[90] w-[172px] rounded-2xl bg-[#1e1e26] border border-white/15 shadow-2xl shadow-black/70 p-1.5"
      style={{ left: state.x, top: state.y }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {!confirming ? (
        <>
          <p className="px-2.5 pt-1.5 pb-1 text-[11px] font-medium text-white/55 truncate">{state.title}</p>
          {showEdit && (
            <button type="button" onClick={() => onPick('edit')} className={itemCls}>
              <Pencil size={13} className="text-white/45" /> {state.kind === 'taskGroup' ? '改名' : '编辑'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={13} /> {deleteLabel}
          </button>
        </>
      ) : (
        <>
          <p className="px-2.5 pt-1.5 pb-1.5 text-[11px] text-red-300 truncate">
            {state.kind === 'taskGroup' ? `删除组「${state.title}」及全部子任务？` : `删除「${state.title}」？`}
          </p>
          <div className="flex gap-1.5 px-1 pb-1">
            <button
              type="button"
              onClick={() => onPick('delete')}
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-red-500/80 text-white text-[11px] font-medium hover:bg-red-500 transition-colors"
            >
              确认删除
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/8 text-white/70 text-[11px] hover:bg-white/12 transition-colors"
            >
              算了
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** AI 整理视图：输入杂事 → 本地规则拆分预览（可勾选、可改字；计划可改目标数）→ 确认落库。
 * 第六十九轮起由计划卡卡面头部「AI 整理」按钮切换卡内视图承载（原在展开面板里） */
export function AiView({ store, onDone }: { store: LocalStore; onDone: () => void }) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<{
    todos: { title: string; checked: boolean }[];
    plans: (SplitPlanDraft & { checked: boolean })[];
  } | null>(null);

  const runSplit = () => {
    const result = splitTasksText(text);
    setPreview({
      todos: result.todos.map((title) => ({ title, checked: true })),
      plans: result.plans.map((p) => ({ ...p, checked: true })),
    });
  };

  const confirm = () => {
    if (!preview) return;
    store.addSplitResult(
      preview.todos.filter((t) => t.checked).map((t) => t.title),
      preview.plans
        .filter((p) => p.checked)
        .map((p) => ({ title: p.title, targetCount: p.targetCount, unit: p.unit })),
    );
    setText('');
    setPreview(null);
    onDone();
  };

  const checkedCount = preview
    ? preview.todos.filter((t) => t.checked).length + preview.plans.filter((p) => p.checked).length
    : 0;

  const checkBox = (checked: boolean, onToggle: () => void) => (
    <button
      type="button"
      aria-label={checked ? '不添加' : '添加'}
      onClick={onToggle}
      className={`w-[18px] h-[18px] rounded-[5px] border flex items-center justify-center shrink-0 transition-colors ${
        checked ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-white/50 hover:border-indigo-300 text-transparent'
      }`}
    >
      <Check size={12} strokeWidth={3} />
    </button>
  );

  const patchPlan = (i: number, patch: Partial<SplitPlanDraft & { checked: boolean }>) =>
    setPreview((p) => (p ? { ...p, plans: p.plans.map((t, j) => (j === i ? { ...t, ...patch } : t)) } : p));

  return (
    <div className="overflow-y-auto min-h-0 flex-1" data-ai-view>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setPreview(null);
        }}
        placeholder="下周要交设计稿，还想练吉他，顺便把桌面整理了……想到什么写什么，一行一件也行"
        rows={4}
        autoFocus
        data-ai-input
        className="w-full bg-white/5 border border-white/12 rounded-2xl px-3.5 py-3 text-sm leading-relaxed outline-none focus:border-indigo-400/50 placeholder:text-zinc-400 resize-none"
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={runSplit}
          disabled={!text.trim()}
          data-ai-split
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500/80 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
        >
          <Sparkles size={14} /> 拆分
        </button>
        <p className="text-[11px] text-zinc-400 leading-relaxed">AI 只做拆分归类，不改动已有事项（当前为本地规则拆分）</p>
      </div>

      {preview && (
        <div className="mt-4">
          {preview.todos.length === 0 && preview.plans.length === 0 ? (
            <p className="text-sm text-zinc-300 py-2">没有拆出可添加的事项，换个说法再试试。</p>
          ) : (
            <>
              {preview.todos.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-zinc-300 mb-1.5">待办 · {preview.todos.length}</p>
                  <div className="flex flex-col">
                    {preview.todos.map((item, i) => (
                      <div key={i} data-ai-todo className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-white/[0.04]">
                        {checkBox(item.checked, () =>
                          setPreview((p) =>
                            p ? { ...p, todos: p.todos.map((t, j) => (j === i ? { ...t, checked: !t.checked } : t)) } : p,
                          ),
                        )}
                        <input
                          value={item.title}
                          onChange={(e) =>
                            setPreview((p) =>
                              p ? { ...p, todos: p.todos.map((t, j) => (j === i ? { ...t, title: e.target.value } : t)) } : p,
                            )
                          }
                          className="flex-1 min-w-0 bg-transparent text-sm py-1 outline-none border-b border-transparent focus:border-indigo-400/50 text-white/85"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {preview.plans.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-zinc-300 mb-1.5">长期计划 · {preview.plans.length}</p>
                  <div className="flex flex-col">
                    {preview.plans.map((item, i) => (
                      <div key={i} data-ai-plan className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-white/[0.04]">
                        {checkBox(item.checked, () => patchPlan(i, { checked: !item.checked }))}
                        <input
                          value={item.title}
                          onChange={(e) => patchPlan(i, { title: e.target.value })}
                          className="flex-1 min-w-0 bg-transparent text-sm py-1 outline-none border-b border-transparent focus:border-indigo-400/50 text-white/85"
                        />
                        <span className="flex items-center gap-1 shrink-0 text-[11px] text-zinc-300">
                          目标
                          <input
                            type="number"
                            min={1}
                            value={item.targetCount}
                            onChange={(e) => patchPlan(i, { targetCount: parseInt(e.target.value, 10) || 0 })}
                            data-ai-plan-target
                            className="w-14 bg-white/5 border border-white/12 rounded-lg px-1.5 py-1 text-xs outline-none focus:border-indigo-400/50 text-white/85"
                          />
                          <input
                            value={item.unit}
                            maxLength={4}
                            onChange={(e) => patchPlan(i, { unit: e.target.value })}
                            data-ai-plan-unit
                            className="w-10 bg-white/5 border border-white/12 rounded-lg px-1.5 py-1 text-xs outline-none focus:border-indigo-400/50 text-white/85"
                          />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={confirm}
                disabled={checkedCount === 0}
                data-ai-confirm
                className="px-4 py-2 rounded-xl bg-indigo-500/80 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
              >
                确认添加（{checkedCount}）
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
