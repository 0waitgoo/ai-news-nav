import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Check, Layers, ListTodo, Maximize2 } from 'lucide-react';
import {
  cardFaceStyleOf,
  isTaskGroup,
  taskChildProgress,
  taskEntryDone,
  taskFlatStats,
  taskGroupDone,
  widgetCardKey,
  type LocalStore,
  type TaskItem,
  type WidgetTint,
} from '../../store/localStore';
import { PlansSection, TasksSection } from './TaskPanel';
import WidgetTintLayer from './WidgetTint';

/**
 * A 型 · 计划任务卡（第十八轮，替换原「今日任务」占位卡；第十九轮加待办分组）
 * 数据走 localStore 的 tasks/plans（本地优先，随导出/文件/GitHub 同步一起走）。
 * 卡面两样式（右键菜单切换，按卡片存 cardFaceStyles）：
 * - list 列表式（默认）：今日进度 x/y + 细进度线 + 前 3 条未完成待办（卡面可直接勾，勾完划线留影片刻后移出）
 * - focus 焦点式：只突出第一条未完成待办（大字）+「还有 N 件」
 * 进度计数口径（第十九轮）：组按子任务摊平计数（见 localStore.taskFlatStats）。
 * 组在卡面只算一个顶层条目、显示「组名 · n/m」、不展开子任务，点行进面板处理。
 * 第二十五轮（尺寸布局）：
 * - 高 1x：两种卡面都隐藏「添加待办」输入框（原先会压住第三行待办），添加走弹窗或 2x 卡面；
 *   卡面只展示进度与待办行，点卡面（非控件区域）打开计划面板
 * - 高 2x：卡面直接呈现弹窗式布局——复用 TaskPanel 的 TasksSection/PlansSection（variant='card'）：
 *   宽 2 栏左右双列、宽 1 栏上下堆叠，勾选/添加待办/计划 +1 与完成在卡内直接可用；
 *   建组、AI 整理、新建计划表单等复杂操作仍留在弹窗，头部留「展开」入口打开完整面板；
 *   2x 时点卡面空白不再打开弹窗（避免和卡内交互冲突）
 */
export default function TaskCard({
  store,
  onOpen,
  delay = 0,
  colSpan = 1,
  heightUnits = 1,
  tint,
}: {
  store: LocalStore;
  onOpen: () => void;
  delay?: number;
  /** 右键布局宽度（2x 面板式布局时决定双列/堆叠） */
  colSpan?: 1 | 2;
  /** 右键布局高度：1 = 简洁卡面（点开弹窗），2 = 面板式布局（卡内直接操作） */
  heightUnits?: 1 | 2;
  /** 专属底色（第二十三轮，由 HomePage 按 widgetTints 分配传入；1x/2x 两壳都生效） */
  tint?: WidgetTint;
}) {
  const { tasks, cardFaceStyles } = store.data;
  const face = cardFaceStyleOf(cardFaceStyles, widgetCardKey('task'));
  /** 刚在卡面上勾完的待办：先划线留影，片刻后才移出前 3（避免勾完瞬间跳变） */
  const [justDone, setJustDone] = useState<Record<string, true>>({});
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  // 进度口径：组按子任务摊平（普通待办计 1，组计子任务数），见 taskFlatStats
  const { total, done: doneCount } = taskFlatStats(tasks);
  const open = tasks.filter((t) => !taskEntryDone(t));
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const handleToggle = (task: TaskItem) => {
    store.toggleTask(task.id);
    if (!task.done) {
      // 勾上：留影 0.9 秒后移出
      setJustDone((prev) => ({ ...prev, [task.id]: true }));
      const timer = setTimeout(() => {
        setJustDone((prev) => {
          const next = { ...prev };
          delete next[task.id];
          return next;
        });
        timers.current.delete(task.id);
      }, 900);
      timers.current.set(task.id, timer);
    } else if (justDone[task.id]) {
      const timer = timers.current.get(task.id);
      if (timer) clearTimeout(timer);
      timers.current.delete(task.id);
      setJustDone((prev) => {
        const next = { ...prev };
        delete next[task.id];
        return next;
      });
    }
  };

  // 列表式可见行：按数据顺序取前 3 个顶层条目（未完成的普通待办 + 正在留影的已完成 + 未全勾的组）
  const rows: TaskItem[] = [];
  for (const t of tasks) {
    if (rows.length >= 3) break;
    if (isTaskGroup(t)) {
      if (!taskGroupDone(t)) rows.push(t);
    } else if (!t.done || justDone[t.id]) {
      rows.push(t);
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, form, [data-nopanel]')) return;
    onOpen();
  };

  const focusTask = open[0];
  const restCount = Math.max(0, open.length - 1);

  /** 专属底色层（第二十三轮）：1x/2x 两壳共用，内容以 relative 层级盖在其上；
   * 水印单独调低（第五十二轮）：2x 时 📋 正压在长期计划区，0.16 会干扰阅读，降到 0.1 */
  const tintLayer = tint ? <WidgetTintLayer tint={tint} emoji="📋" watermarkOpacity={0.1} /> : null;

  /* ---------- 高 2x：面板式布局（复用 TaskPanel 双列内容，核心交互卡内直接可用） ---------- */
  if (heightUnits === 2) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay }}
        data-task-card
        data-task-mode="full"
        className="glass-panel glass-panel-hover relative rounded-[28px] h-full p-4 sm:p-5 flex flex-col overflow-hidden transition-colors"
      >
        {tintLayer}
        <div className="relative flex flex-col flex-1 min-h-0">
        {/* 头部：标题 + 今日进度 + 「展开」入口（打开完整面板，复杂操作都在那里） */}
        <div className="flex items-center gap-2 mb-2.5 shrink-0">
          <div className="w-7 h-7 rounded-full bg-indigo-500/35 text-indigo-100 flex items-center justify-center">
            <ListTodo size={14} />
          </div>
          <h3 className="font-semibold text-base sm:text-lg tracking-tight">计划</h3>
          <span data-task-progress className="ml-auto text-xs text-zinc-300 tabular-nums">
            {doneCount}/{total}
          </span>
          <button
            type="button"
            data-task-expand
            onClick={onOpen}
            className="flex items-center gap-1 text-[11px] font-medium text-zinc-200 hover:text-white bg-white/10 hover:bg-white/[0.18] px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
          >
            <Maximize2 size={12} /> 展开
          </button>
        </div>
        <div className="h-1 rounded-full bg-white/20 overflow-hidden shrink-0 mb-3">
          <div className="h-full rounded-full bg-indigo-400 transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>

        {/* 双列内容与完整面板同一套组件（variant='card' 仅核心交互）；整区 data-nodrag：在卡内滚动/操作不触发卡片拖拽 */}
        <div className="flex-1 min-h-0 overflow-y-auto" data-nodrag>
          <div className={`grid gap-5 sm:gap-6 items-start ${colSpan === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <TasksSection store={store} variant="card" />
            <PlansSection store={store} variant="card" />
          </div>
        </div>
        </div>
      </motion.div>
    );
  }

  /* ---------- 高 1x：简洁卡面（无添加输入框，点卡面开弹窗） ---------- */
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      data-task-card
      data-task-face={face}
      onClick={handleCardClick}
      className="glass-panel glass-panel-hover relative rounded-[28px] h-full p-4 sm:p-5 flex flex-col overflow-hidden transition-colors cursor-pointer"
    >
      {tintLayer}
      <div className="relative flex flex-col flex-1 min-h-0">
      {/* 头部：标题 + 今日进度 */}
      <div className="flex items-center gap-2 mb-2.5 shrink-0">
        <div className="w-7 h-7 rounded-full bg-indigo-500/35 text-indigo-100 flex items-center justify-center">
          <ListTodo size={14} />
        </div>
        <h3 className="font-semibold text-base sm:text-lg tracking-tight">计划</h3>
        <span data-task-progress className="ml-auto text-xs text-zinc-300 tabular-nums">
          {doneCount}/{total}
        </span>
      </div>
      <div className="h-1 rounded-full bg-white/20 overflow-hidden shrink-0 mb-3">
        <div className="h-full rounded-full bg-indigo-400 transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>

      {face === 'list' ? (
        <div className="flex-1 min-h-0 flex flex-col gap-1">
          {rows.length === 0 ? (
            <p className="flex-1 flex items-center text-[13px] text-zinc-300">暂无待办，点开面板添加第一件。</p>
          ) : (
            rows.map((t) =>
              isTaskGroup(t) ? (
                // 组行：不给勾选框（点行进面板处理子任务），显示「组名 · n/m」
                <div key={t.id} data-task-group-row className="flex items-center gap-2 py-1 min-w-0">
                  <span className="w-[18px] h-[18px] rounded-[5px] bg-white/[0.12] text-zinc-200 flex items-center justify-center shrink-0">
                    <Layers size={11} />
                  </span>
                  <span className="text-[13px] truncate text-white/85">{t.title}</span>
                  <span data-task-group-progress className="text-[11px] text-zinc-300 tabular-nums shrink-0">
                    · {taskChildProgress(t).done}/{taskChildProgress(t).total}
                  </span>
                </div>
              ) : (
                <div key={t.id} className="flex items-center gap-2 py-1 min-w-0">
                  <button
                    type="button"
                    aria-label={t.done ? '取消完成' : '标记完成'}
                    onClick={() => handleToggle(t)}
                    className={`w-[18px] h-[18px] rounded-[5px] border flex items-center justify-center shrink-0 transition-colors ${
                      t.done ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-white/50 hover:border-indigo-300 text-transparent'
                    }`}
                  >
                    <Check size={12} strokeWidth={3} />
                  </button>
                  <span className={`text-[13px] truncate ${t.done ? 'line-through text-white/35' : 'text-white/85'}`}>{t.title}</span>
                </div>
              ),
            )
          )}
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col">
          {focusTask ? (
            <>
              <p className="text-[11px] tracking-wider text-zinc-300 uppercase mb-1.5">下一件事</p>
              <p data-task-focus-title className="text-xl font-semibold leading-snug line-clamp-3">{focusTask.title}</p>
              {isTaskGroup(focusTask) && (
                <p className="mt-1 text-xs text-zinc-300 tabular-nums">
                  一组 {taskChildProgress(focusTask).total} 项 · 已完成 {taskChildProgress(focusTask).done}
                </p>
              )}
              <p className="mt-auto text-xs text-zinc-300">
                {restCount > 0 ? `还有 ${restCount} 件` : '就这一件了'}
              </p>
            </>
          ) : (
            <>
              <p className="text-[11px] tracking-wider text-zinc-300 uppercase mb-1.5">下一件事</p>
              <p className="text-xl font-semibold leading-snug text-zinc-200">暂无待办</p>
              <p className="mt-auto text-xs text-zinc-400">点开面板添加第一件。</p>
            </>
          )}
        </div>
      )}
      </div>
    </motion.div>
  );
}
