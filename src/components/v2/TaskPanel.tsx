import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Check, ChevronDown, Pencil, Plus, Sparkles, Trash2, X } from 'lucide-react';
import type { LocalStore, PlanItem, TaskItem } from '../../store/localStore';
import { splitTasksText, type SplitPlanDraft } from '../../utils/taskSplit';

/**
 * 计划任务面板（第十八轮）：点主页计划卡打开，规格与 GroupPanel 一致（居中实色弹窗）。
 * - 主视图双列（移动端上下堆叠）：左「待办」可勾选/添加，已完成折叠；右「长期计划」带进度条，可展开勾步骤
 * - 待办行 / 计划行操作走右键菜单（范式同 SiteContextMenu）：编辑（待办就地改标题）/ 删除（菜单内两步确认）
 * - 头部「AI 整理」切换到整理视图：一句话杂事 → 本地规则拆分预览（可勾选、可改字）→ 确认落库
 *   AI 只做拆分归类，不改动已有事项；拆分实现见 utils/taskSplit.ts（可替换为真 AI）
 */

interface RowMenuState {
  x: number;
  y: number;
  kind: 'task' | 'plan';
  id: string;
  title: string;
}

function rowMenuPosition(e: React.MouseEvent): { x: number; y: number } {
  const MENU_W = 180;
  const MENU_H = 168;
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
  const [menu, setMenu] = useState<RowMenuState | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showDone, setShowDone] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [expandedPlans, setExpandedPlans] = useState<Record<string, true>>({});
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planTitle, setPlanTitle] = useState('');
  const [planSteps, setPlanSteps] = useState('');

  menuRef.current = menu;

  const openTasks = tasks.filter((t) => !t.done);
  const doneTasks = tasks.filter((t) => t.done);

  const openMenu = (e: React.MouseEvent, kind: 'task' | 'plan', id: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ ...rowMenuPosition(e), kind, id, title });
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

  const submitPlan = () => {
    if (!planTitle.trim()) return;
    store.addPlan(planTitle, planSteps.split('\n'));
    setPlanTitle('');
    setPlanSteps('');
    setShowPlanForm(false);
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

  const taskRow = (task: TaskItem) => (
    <div
      key={task.id}
      data-task-row
      onContextMenu={(e) => openMenu(e, 'task', task.id, task.title)}
      className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/[0.04] min-w-0"
    >
      {checkBtn(task.done, () => store.toggleTask(task.id), task.done ? '取消完成' : '标记完成')}
      {editingTaskId === task.id ? (
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
        />
      ) : (
        <span className={`flex-1 min-w-0 truncate text-sm ${task.done ? 'line-through text-white/35' : 'text-white/85'}`}>
          {task.title}
        </span>
      )}
    </div>
  );

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
              待办 {openTasks.length} · 计划 {plans.length}
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
        <AiView
          store={store}
          onDone={() => setView('main')}
        />
      ) : (
        <div className="px-5 sm:px-6 pb-5 overflow-y-auto min-h-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 items-start">
            {/* 左列：待办 */}
            <section>
              <div className="flex items-baseline gap-2 mb-1.5">
                <h4 className="text-sm font-semibold">待办</h4>
                <span className="text-[11px] text-white/40">未完成 {openTasks.length}</span>
              </div>
              <div data-nodrag>
                {openTasks.length === 0 && doneTasks.length === 0 && (
                  <p className="text-[13px] text-white/35 px-2 py-3">暂无待办，在下方添加第一件。</p>
                )}
                {openTasks.map(taskRow)}
              </div>
              {doneTasks.length > 0 && (
                <div className="mt-1.5">
                  <button
                    type="button"
                    onClick={() => setShowDone((v) => !v)}
                    className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-white/45 hover:text-white/75 transition-colors"
                  >
                    <ChevronDown size={13} className={`transition-transform ${showDone ? '' : '-rotate-90'}`} />
                    已完成 {doneTasks.length} 项
                  </button>
                  {showDone && <div data-nodrag>{doneTasks.map(taskRow)}</div>}
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
            </section>

            {/* 右列：长期计划 */}
            <section>
              <div className="flex items-baseline gap-2 mb-1.5">
                <h4 className="text-sm font-semibold">长期计划</h4>
                <span className="text-[11px] text-white/40">{plans.length} 个</span>
              </div>
              <div className="flex flex-col gap-1.5" data-nodrag>
                {plans.length === 0 && !showPlanForm && (
                  <p className="text-[13px] text-white/35 px-2 py-3">暂无长期计划，点下方「+ 新计划」添加。</p>
                )}
                {plans.map((plan) => (
                  <PlanBlock
                    key={plan.id}
                    plan={plan}
                    expanded={!!expandedPlans[plan.id]}
                    onToggleExpand={() => setExpandedPlans((prev) => ({ ...prev, [plan.id]: !prev[plan.id] }))}
                    onToggleStep={(stepId) => store.togglePlanStep(plan.id, stepId)}
                    onContextMenu={(e) => openMenu(e, 'plan', plan.id, plan.title)}
                    checkBtn={checkBtn}
                  />
                ))}
              </div>
              {showPlanForm ? (
                <div className="mt-3 rounded-2xl border border-white/12 bg-white/[0.03] p-3">
                  <input
                    value={planTitle}
                    autoFocus
                    onChange={(e) => setPlanTitle(e.target.value)}
                    placeholder="计划标题，如 学会弹吉他"
                    data-plan-title
                    className="w-full bg-white/5 border border-white/12 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400/50 placeholder:text-white/30"
                  />
                  <textarea
                    value={planSteps}
                    onChange={(e) => setPlanSteps(e.target.value)}
                    placeholder={'步骤，每行一条，如：\n认和弦\n练指法\n弹完一首曲子'}
                    rows={4}
                    data-plan-steps
                    className="mt-2 w-full bg-white/5 border border-white/12 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400/50 placeholder:text-white/30 resize-none"
                  />
                  <div className="mt-2.5 flex gap-2">
                    <button
                      type="button"
                      onClick={submitPlan}
                      disabled={!planTitle.trim()}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-500/80 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium transition-colors"
                    >
                      添加计划
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPlanForm(false)}
                      className="px-3.5 py-1.5 rounded-lg bg-white/8 text-white/70 text-xs hover:bg-white/12 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  data-plan-new
                  onClick={() => setShowPlanForm(true)}
                  className="mt-3 w-full py-2 rounded-xl border border-dashed border-white/15 text-xs text-white/50 hover:text-white/85 hover:border-white/35 transition-colors"
                >
                  + 新计划
                </button>
              )}
            </section>
          </div>
        </div>
      )}

      {/* 行右键菜单（编辑/删除） */}
      {menu && (
        <RowContextMenu
          state={menu}
          onClose={() => setMenu(null)}
          onEdit={() => {
            if (menu.kind === 'task') {
              const task = tasks.find((t) => t.id === menu.id);
              if (task) startEditTask(task);
            }
            setMenu(null);
          }}
          onDelete={() => {
            if (menu.kind === 'task') store.deleteTask(menu.id);
            else store.deletePlan(menu.id);
            setMenu(null);
          }}
        />
      )}
    </>
  );
}

interface PlanBlockProps {
  plan: PlanItem;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleStep: (stepId: string) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  checkBtn: (done: boolean, onToggle: () => void, label: string) => React.ReactNode;
}

const PlanBlock: React.FC<PlanBlockProps> = ({ plan, expanded, onToggleExpand, onToggleStep, onContextMenu, checkBtn }) => {
  const total = plan.steps.length;
  const done = plan.steps.filter((s) => s.done).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div data-plan-item className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5" onContextMenu={onContextMenu}>
      <button type="button" onClick={onToggleExpand} className="w-full flex items-center gap-2 text-left">
        <span className="flex-1 min-w-0 truncate text-sm font-medium text-white/90">{plan.title}</span>
        <span data-plan-progress className="text-[11px] text-white/45 tabular-nums shrink-0">
          {done}/{total}
        </span>
        <ChevronDown size={14} className={`text-white/40 shrink-0 transition-transform ${expanded ? '' : '-rotate-90'}`} />
      </button>
      <div className="mt-2 h-1 rounded-full bg-white/8 overflow-hidden">
        <div className="h-full rounded-full bg-indigo-400/90 transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
      {expanded && (
        <div className="mt-2 flex flex-col">
          {total === 0 && <p className="text-xs text-white/35 py-1">还没有步骤（新建计划时可按行填写步骤）。</p>}
          {plan.steps.map((step) => (
            <div key={step.id} className="flex items-center gap-2.5 px-1 py-1.5 min-w-0">
              {checkBtn(step.done, () => onToggleStep(step.id), step.done ? '取消完成' : '标记完成')}
              <span className={`flex-1 min-w-0 truncate text-[13px] ${step.done ? 'line-through text-white/35' : 'text-white/80'}`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/** 行右键菜单：范式同 SiteContextMenu（实色、点外关闭、删除两步确认） */
function RowContextMenu({
  state,
  onClose,
  onEdit,
  onDelete,
}: {
  state: RowMenuState;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
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
          {state.kind === 'task' && (
            <button type="button" onClick={onEdit} className={itemCls}>
              <Pencil size={13} className="text-white/45" /> 编辑
            </button>
          )}
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={13} /> 删除
          </button>
        </>
      ) : (
        <>
          <p className="px-2.5 pt-1.5 pb-1.5 text-[11px] text-red-300 truncate">删除「{state.title}」？</p>
          <div className="flex gap-1.5 px-1 pb-1">
            <button
              type="button"
              onClick={onDelete}
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

/** AI 整理视图：输入杂事 → 本地规则拆分预览（可勾选、可改字）→ 确认落库 */
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
      preview.plans.filter((p) => p.checked).map((p) => ({ title: p.title, steps: p.steps })),
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
                      <div key={i} data-ai-plan className="flex items-start gap-2.5 px-2 py-1.5 rounded-xl hover:bg-white/[0.04]">
                        {checkBox(item.checked, () =>
                          setPreview((p) =>
                            p ? { ...p, plans: p.plans.map((t, j) => (j === i ? { ...t, checked: !t.checked } : t)) } : p,
                          ),
                        )}
                        <div className="flex-1 min-w-0">
                          <input
                            value={item.title}
                            onChange={(e) =>
                              setPreview((p) =>
                                p ? { ...p, plans: p.plans.map((t, j) => (j === i ? { ...t, title: e.target.value } : t)) } : p,
                              )
                            }
                            className="w-full bg-transparent text-sm py-0.5 outline-none border-b border-transparent focus:border-indigo-400/50 text-white/85"
                          />
                          {item.steps.length > 0 && (
                            <p className="text-[11px] text-white/40 mt-0.5">步骤：{item.steps.join(' · ')}</p>
                          )}
                        </div>
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
