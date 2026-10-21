import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Check, ChevronDown, Minus, Pencil, Plus, Sparkles, Trash2, X } from 'lucide-react';
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
 * 计划任务面板（第十八轮；第十九轮：待办分组 + 长期计划两型）：点主页计划卡打开，规格与 GroupPanel 一致（居中实色弹窗）。
 * - 主视图双列（移动端上下堆叠）：左「待办」可勾选/添加，已完成折叠；待办可建「组」——子任务可勾，
 *   组本身不单独勾选，完成态由子任务全勾推导；组计数在头部按子任务摊平（与卡面同一口径）
 * - 右「长期计划」两型：次数型（执行了多少次：进度 = 已执行/目标，行上克制的 +1/−1）与
 *   日期型（设一个完成时间：剩余天数 + 时间进度条，逾期标红，可手动点「完成」）
 * - 行操作走右键菜单（范式同 SiteContextMenu）：编辑 / 删除（菜单内两步确认）；子任务右键只有删除
 * - 头部「AI 整理」切换到整理视图：一句话杂事 → 本地规则拆分预览（可勾选、可改字）→ 确认落库
 *   AI 只做拆分归类，不改动已有事项；拆分实现见 utils/taskSplit.ts（可替换为真 AI）
 * - 第二十五轮：待办/计划两列抽成 TasksSection / PlansSection 共享组件，本面板（variant='panel'）与
 *   2x 任务卡卡面（variant='card'，仅核心交互）共用同一套渲染逻辑；本面板行为不变
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

export default function TaskPanel({ open, store, onClose }: { open: boolean; store: LocalStore; onClose: () => void }) {
  const menuRef = useRef<RowMenuState | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !menuRef.current) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            data-task-panel
            className="relative rounded-[28px] bg-[#17171d] border border-white/10 w-full max-w-3xl max-h-[84vh] flex flex-col overflow-hidden shadow-2xl shadow-black/70"
          >
            <PanelBody store={store} onClose={onClose} menuRef={menuRef} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function PanelBody({
  store,
  onClose,
  menuRef,
}: {
  store: LocalStore;
  onClose: () => void;
  menuRef: React.RefObject<RowMenuState | null>;
}) {
  const { tasks, plans } = store.data;
  const [view, setView] = useState<'main' | 'ai'>('main');

  // 头部计数口径与卡面一致：组按子任务摊平（taskFlatStats）
  const flat = taskFlatStats(tasks);
  const flatOpen = flat.total - flat.done;

  return (
    <>
      {/* 头部：标题 + AI 整理入口 + 关闭（整理视图下换成返回） */}
      <div className="px-5 sm:px-6 pt-5 pb-4 shrink-0 flex items-center gap-2">
        {view === 'ai' ? (
          <>
            <button
              type="button"
              onClick={() => setView('main')}
              className="flex items-center gap-1 text-xs text-white/60 hover:text-white px-2 py-1.5 -ml-2 rounded-lg hover:bg-white/8 transition-colors"
            >
              <ArrowLeft size={14} /> 返回
            </button>
            <h3 className="font-semibold text-base sm:text-lg tracking-tight">AI 整理</h3>
          </>
        ) : (
          <>
            <h3 className="font-semibold text-base sm:text-lg tracking-tight">计划</h3>
            <span className="text-xs text-white/40 tabular-nums">
              待办 {flatOpen} · 计划 {plans.length}
            </span>
            <button
              type="button"
              data-ai-open
              onClick={() => setView('ai')}
              className="ml-auto flex items-center gap-1.5 text-xs font-medium text-indigo-300 hover:text-indigo-200 px-2.5 py-1.5 rounded-lg hover:bg-indigo-500/10 transition-colors"
            >
              <Sparkles size={14} /> AI 整理
            </button>
          </>
        )}
        <button
          type="button"
          onClick={onClose}
          className={`${view === 'ai' ? 'ml-auto' : ''} p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10`}
          aria-label="关闭"
        >
          <X size={16} />
        </button>
      </div>

      {view === 'ai' ? (
        <AiView store={store} onDone={() => setView('main')} />
      ) : (
        <div className="px-5 sm:px-6 pb-5 overflow-y-auto min-h-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 items-start">
            <TasksSection store={store} variant="panel" menuOpenRef={menuRef} />
            <PlansSection store={store} variant="panel" menuOpenRef={menuRef} />
          </div>
        </div>
      )}
    </>
  );
}

/**
 * 待办列（第二十五轮抽成共享组件：完整面板与 2x 任务卡共用同一套渲染/交互逻辑，不复制两套）：
 * - variant='panel'：全功能（含建组入口、行右键编辑/删除）
 * - variant='card'：只保留核心交互（勾选、组展开勾子任务、已完成折叠、底部添加输入）；
 *   建组等复杂操作留在完整面板里，行右键菜单仍可用（编辑/删除）
 */
export function TasksSection({
  store,
  variant,
  menuOpenRef,
}: {
  store: LocalStore;
  variant: 'panel' | 'card';
  menuOpenRef?: React.RefObject<RowMenuState | null>;
}) {
  const { tasks } = store.data;
  const [menu, setMenu] = useState<RowMenuState | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showDone, setShowDone] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupName, setGroupName] = useState('');

  if (menuOpenRef) menuOpenRef.current = menu;

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

  const submitNewTask = () => {
    if (!newTask.trim()) return;
    store.addTask(newTask);
    setNewTask('');
  };

  const submitGroup = () => {
    if (!groupName.trim()) return;
    store.addTaskGroup(groupName);
    setGroupName('');
    setShowGroupForm(false);
  };

  const checkBtn = (done: boolean, onToggle: () => void, label: string) => (
    <button
      type="button"
      aria-label={label}
      onClick={onToggle}
      className={`w-[18px] h-[18px] rounded-[5px] border flex items-center justify-center shrink-0 transition-colors ${
        done ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-white/30 hover:border-indigo-300 text-transparent'
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
        if (e.key === 'Enter') commitEditTask();
        if (e.key === 'Escape') setEditingTaskId(null);
      }}
      onBlur={commitEditTask}
      className="flex-1 min-w-0 bg-white/5 border border-indigo-400/50 rounded-lg px-2 py-1 text-sm outline-none"
      data-task-edit-input
    />
  );

  const taskRow = (task: TaskItem) =>
    isTaskGroup(task) ? (
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
      />
    ) : (
      <div
        key={task.id}
        data-task-row
        onContextMenu={(e) => openMenu(e, 'task', task.id, task.title)}
        className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/[0.04] min-w-0"
      >
        {checkBtn(task.done, () => store.toggleTask(task.id), task.done ? '取消完成' : '标记完成')}
        {editingTaskId === task.id ? (
          titleEditor(task.id)
        ) : (
          <span className={`flex-1 min-w-0 truncate text-sm ${task.done ? 'line-through text-white/35' : 'text-white/85'}`}>
            {task.title}
          </span>
        )}
      </div>
    );

  return (
    <section>
      <div className="flex items-baseline gap-2 mb-1.5">
        <h4 className="text-sm font-semibold">待办</h4>
        <span className="text-[11px] text-white/40">未完成 {flatOpen}</span>
      </div>
      <div data-nodrag>
        {tasks.length === 0 && <p className="text-[13px] text-white/35 px-2 py-3">暂无待办，在下方添加第一件。</p>}
        {openEntries.map(taskRow)}
      </div>
      {doneEntries.length > 0 && (
        <div className="mt-1.5">
          <button
            type="button"
            onClick={() => setShowDone((v) => !v)}
            className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-white/45 hover:text-white/75 transition-colors"
          >
            <ChevronDown size={13} className={`transition-transform ${showDone ? '' : '-rotate-90'}`} />
            已完成 {doneEntries.length} 项
          </button>
          {showDone && <div data-nodrag>{doneEntries.map(taskRow)}</div>}
        </div>
      )}
      <form
        className="mt-2.5 flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl pl-2.5 pr-1.5 py-1 focus-within:border-indigo-400/50 transition-colors"
        onSubmit={(e) => {
          e.preventDefault();
          submitNewTask();
        }}
      >
        <Plus size={14} className="text-white/35 shrink-0" />
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="添加待办，回车确认"
          data-task-add
          className="flex-1 min-w-0 bg-transparent text-sm py-1.5 outline-none placeholder:text-white/30"
        />
      </form>
      {/* 建组入口：组用来收纳一组相关的子任务（如一次采购清单）；仅完整面板提供，2x 卡面不放 */}
      {variant === 'panel' &&
        (showGroupForm ? (
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
              onChange={(e) => setGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setShowGroupForm(false);
              }}
              placeholder="组名，如 周末采购"
              data-group-name
              className="flex-1 min-w-0 bg-white/5 border border-white/12 rounded-xl px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400/50 placeholder:text-white/30"
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
            className="mt-2 w-full py-1.5 rounded-xl border border-dashed border-white/12 text-[11px] text-white/45 hover:text-white/80 hover:border-white/30 transition-colors"
          >
            + 建组（把几件相关的事收在一起）
          </button>
        ))}

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
    </section>
  );
}

/**
 * 长期计划列（第二十五轮抽成共享组件，理由同 TasksSection）：
 * - variant='panel'：全功能（含新计划表单、行右键编辑/删除）
 * - variant='card'：核心交互直接可用（次数型 −1/+1、日期型「完成」），新建/编辑表单留在完整面板
 */
export function PlansSection({
  store,
  variant,
  menuOpenRef,
}: {
  store: LocalStore;
  variant: 'panel' | 'card';
  menuOpenRef?: React.RefObject<RowMenuState | null>;
}) {
  const { plans } = store.data;
  const [menu, setMenu] = useState<RowMenuState | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [showPlanForm, setShowPlanForm] = useState(false);

  if (menuOpenRef) menuOpenRef.current = menu;

  const openMenu = (e: React.MouseEvent, plan: PlanItem) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ ...rowMenuPosition(e), kind: 'plan', id: plan.id, title: plan.title });
  };

  return (
    <section>
      <div className="flex items-baseline gap-2 mb-1.5">
        <h4 className="text-sm font-semibold">长期计划</h4>
        <span className="text-[11px] text-white/40">{plans.length} 个</span>
      </div>
      <div className="flex flex-col gap-1.5" data-nodrag>
        {plans.length === 0 && !showPlanForm && (
          <p className="text-[13px] text-white/35 px-2 py-3">
            {variant === 'panel' ? '暂无长期计划，点下方「+ 新计划」添加。' : '暂无长期计划，展开面板添加。'}
          </p>
        )}
        {plans.map((plan) =>
          editingPlanId === plan.id ? (
            <PlanEditForm key={plan.id} plan={plan} store={store} onClose={() => setEditingPlanId(null)} />
          ) : (
            <PlanRow key={plan.id} plan={plan} store={store} onContextMenu={(e) => openMenu(e, plan)} />
          ),
        )}
      </div>
      {variant === 'panel' &&
        (showPlanForm ? (
          <PlanCreateForm store={store} onClose={() => setShowPlanForm(false)} />
        ) : (
          <button
            type="button"
            data-plan-new
            onClick={() => setShowPlanForm(true)}
            className="mt-3 w-full py-2 rounded-xl border border-dashed border-white/15 text-xs text-white/50 hover:text-white/85 hover:border-white/35 transition-colors"
          >
            + 新计划
          </button>
        ))}

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

/** 组块：标题行（展开箭头 + 标题 + n/m）+ 子任务列表 + 组内添加行；全勾时标题划线 */
const GroupBlock: React.FC<{
  group: TaskItem;
  store: LocalStore;
  startExpanded: boolean;
  editing: boolean;
  editor: React.ReactNode;
  onMenu: (e: React.MouseEvent) => void;
  onChildMenu: (e: React.MouseEvent, childId: string, childTitle: string) => void;
  checkBtn: (done: boolean, onToggle: () => void, label: string) => React.ReactNode;
}> = ({ group, store, startExpanded, editing, editor, onMenu, onChildMenu, checkBtn }) => {
  const [expanded, setExpanded] = useState(startExpanded);
  const [subDraft, setSubDraft] = useState('');
  const kids = group.children ?? [];
  const { done, total } = taskChildProgress(group);
  const allDone = taskGroupDone(group);

  const submitSub = () => {
    if (!subDraft.trim()) return;
    store.addSubTask(group.id, subDraft);
    setSubDraft('');
    setExpanded(true);
  };

  return (
    <div data-task-group className="rounded-xl hover:bg-white/[0.04] px-2 py-1.5" onContextMenu={onMenu}>
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          aria-label={expanded ? '收起组' : '展开组'}
          data-group-toggle
          onClick={() => setExpanded((v) => !v)}
          className="w-[18px] h-[18px] flex items-center justify-center shrink-0 text-white/50 hover:text-white transition-colors"
        >
          <ChevronDown size={14} className={`transition-transform ${expanded ? '' : '-rotate-90'}`} />
        </button>
        {editing ? (
          editor
        ) : (
          <>
            <span
              className={`flex-1 min-w-0 truncate text-sm font-medium ${
                allDone ? 'line-through text-white/35' : 'text-white/90'
              }`}
            >
              {group.title}
            </span>
            <span data-group-progress className="text-[11px] text-white/45 tabular-nums shrink-0">
              {done}/{total}
            </span>
          </>
        )}
      </div>
      {expanded && (
        <div className="mt-0.5 ml-[26px] flex flex-col">
          {kids.length === 0 && (
            <p className="text-xs text-white/35 py-1.5">组里还没有子任务，在下方添加。</p>
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
              <span className={`flex-1 min-w-0 truncate text-[13px] ${child.done ? 'line-through text-white/35' : 'text-white/80'}`}>
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
            <Plus size={13} className="text-white/30 shrink-0" />
            <input
              value={subDraft}
              onChange={(e) => setSubDraft(e.target.value)}
              placeholder="添加子任务，回车确认"
              data-subtask-add
              className="flex-1 min-w-0 bg-transparent text-[13px] py-1 outline-none placeholder:text-white/25 border-b border-transparent focus:border-indigo-400/40 transition-colors"
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
      <div data-plan-item data-plan-mode="date" className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5" onContextMenu={onContextMenu}>
        <div className="flex items-center gap-2">
          <span className={`flex-1 min-w-0 truncate text-sm font-medium ${plan.done ? 'line-through text-white/40' : 'text-white/90'}`}>
            {plan.title}
          </span>
          {plan.done ? (
            <span className="flex items-center gap-1 text-[11px] text-indigo-300 shrink-0">
              <Check size={12} /> 已完成
            </span>
          ) : (
            <button
              type="button"
              data-plan-finish
              onClick={() => store.setPlanDone(plan.id, true)}
              className="text-[11px] px-2 py-1 rounded-md bg-white/6 text-white/60 hover:bg-indigo-500/70 hover:text-white transition-colors shrink-0"
            >
              完成
            </button>
          )}
        </div>
        <div className="mt-1 flex items-baseline gap-2 text-[11px]">
          {plan.done ? (
            <span className="text-white/40">目标 {plan.deadline ? formatMonthDay(plan.deadline) : ''}</span>
          ) : overdue ? (
            <span data-plan-status className="text-red-300 font-medium">
              已逾期 {-daysLeft} 天
            </span>
          ) : (
            <span data-plan-status className="text-white/55">
              {daysLeft === 0 ? '今天到期' : `还剩 ${daysLeft} 天`}
            </span>
          )}
          {!plan.done && plan.deadline && <span className="text-white/35">· 目标 {formatMonthDay(plan.deadline)}</span>}
        </div>
        <div className="mt-2 h-1 rounded-full bg-white/8 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${overdue ? 'bg-red-400/80' : 'bg-indigo-400/90'}`}
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
    'w-6 h-6 rounded-lg bg-white/6 text-white/60 hover:bg-white/12 hover:text-white disabled:opacity-30 disabled:hover:bg-white/6 flex items-center justify-center transition-colors shrink-0';
  return (
    <div data-plan-item data-plan-mode="count" className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5" onContextMenu={onContextMenu}>
      <div className="flex items-center gap-2">
        <span className={`flex-1 min-w-0 truncate text-sm font-medium ${full ? 'text-indigo-200' : 'text-white/90'}`}>
          {plan.title}
        </span>
        <span data-plan-progress className="text-[11px] text-white/50 tabular-nums shrink-0">
          {cur}/{target} {unit}
        </span>
        {full && <Check size={13} className="text-indigo-300 shrink-0" />}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-1 rounded-full bg-white/8 overflow-hidden">
          <div className="h-full rounded-full bg-indigo-400/90 transition-all duration-300" style={{ width: `${Math.round(ratio * 100)}%` }} />
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
  'w-full bg-white/5 border border-white/12 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400/50 placeholder:text-white/30';

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
            <span className="text-[11px] text-white/45 shrink-0">目标</span>
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
            className="w-16 bg-white/5 border border-white/12 rounded-xl px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400/50 placeholder:text-white/30"
          />
        </div>
      ) : (
        <label className="mt-2 flex items-center gap-2">
          <span className="text-[11px] text-white/45 shrink-0">完成时间</span>
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
            <span className="text-[11px] text-white/45 shrink-0">目标</span>
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
          <span className="text-[11px] text-white/45 shrink-0">完成时间</span>
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

/** AI 整理视图：输入杂事 → 本地规则拆分预览（可勾选、可改字；计划可改目标数）→ 确认落库 */
function AiView({ store, onDone }: { store: LocalStore; onDone: () => void }) {
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
        checked ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-white/30 hover:border-indigo-300 text-transparent'
      }`}
    >
      <Check size={12} strokeWidth={3} />
    </button>
  );

  const patchPlan = (i: number, patch: Partial<SplitPlanDraft & { checked: boolean }>) =>
    setPreview((p) => (p ? { ...p, plans: p.plans.map((t, j) => (j === i ? { ...t, ...patch } : t)) } : p));

  return (
    <div className="px-5 sm:px-6 pb-5 overflow-y-auto min-h-0" data-ai-view>
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
        className="w-full bg-white/5 border border-white/12 rounded-2xl px-3.5 py-3 text-sm leading-relaxed outline-none focus:border-indigo-400/50 placeholder:text-white/30 resize-none"
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
        <p className="text-[11px] text-white/35 leading-relaxed">AI 只做拆分归类，不改动已有事项（当前为本地规则拆分）</p>
      </div>

      {preview && (
        <div className="mt-4">
          {preview.todos.length === 0 && preview.plans.length === 0 ? (
            <p className="text-sm text-white/40 py-2">没有拆出可添加的事项，换个说法再试试。</p>
          ) : (
            <>
              {preview.todos.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-white/60 mb-1.5">待办 · {preview.todos.length}</p>
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
                  <p className="text-xs font-semibold text-white/60 mb-1.5">长期计划 · {preview.plans.length}</p>
                  <div className="flex flex-col">
                    {preview.plans.map((item, i) => (
                      <div key={i} data-ai-plan className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-white/[0.04]">
                        {checkBox(item.checked, () => patchPlan(i, { checked: !item.checked }))}
                        <input
                          value={item.title}
                          onChange={(e) => patchPlan(i, { title: e.target.value })}
                          className="flex-1 min-w-0 bg-transparent text-sm py-1 outline-none border-b border-transparent focus:border-indigo-400/50 text-white/85"
                        />
                        <span className="flex items-center gap-1 shrink-0 text-[11px] text-white/40">
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
