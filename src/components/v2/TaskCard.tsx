import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Check, ListTodo, Plus } from 'lucide-react';
import { cardFaceStyleOf, widgetCardKey, type LocalStore, type TaskItem } from '../../store/localStore';

/**
 * A 型 · 计划任务卡（第十八轮，替换原「今日任务」占位卡）
 * 数据走 localStore 的 tasks/plans（本地优先，随导出/文件/GitHub 同步一起走）。
 * 卡面两样式（右键菜单切换，按卡片存 cardFaceStyles）：
 * - list 列表式（默认）：今日进度 x/y + 细进度线 + 前 3 条未完成待办（卡面可直接勾，勾完划线留影片刻后移出）+ 快速添加行
 * - focus 焦点式：只突出第一条未完成待办（大字）+「还有 N 件」+ 快速添加行
 * 点卡面（非控件区域）打开计划面板。
 */
export default function TaskCard({
  store,
  onOpen,
  delay = 0,
}: {
  store: LocalStore;
  onOpen: () => void;
  delay?: number;
}) {
  const { tasks, cardFaceStyles } = store.data;
  const face = cardFaceStyleOf(cardFaceStyles, widgetCardKey('task'));
  const [draft, setDraft] = useState('');
  /** 刚在卡面上勾完的待办：先划线留影，片刻后才移出前 3（避免勾完瞬间跳变） */
  const [justDone, setJustDone] = useState<Record<string, true>>({});
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const total = tasks.length;
  const doneCount = tasks.filter((t) => t.done).length;
  const open = tasks.filter((t) => !t.done);
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

  // 列表式可见行：按数据顺序取前 3 条（未完成 + 正在留影的已完成）
  const rows: TaskItem[] = [];
  for (const t of tasks) {
    if (rows.length >= 3) break;
    if (!t.done || justDone[t.id]) rows.push(t);
  }

  const submitDraft = () => {
    const title = draft.trim();
    if (!title) return;
    store.addTask(title);
    setDraft('');
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, form, [data-nopanel]')) return;
    onOpen();
  };

  const focusTask = open[0];
  const restCount = Math.max(0, open.length - 1);

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
      {/* 头部：标题 + 今日进度 */}
      <div className="flex items-center gap-2 mb-2.5 shrink-0">
        <div className="w-7 h-7 rounded-full bg-indigo-500/25 text-indigo-200 flex items-center justify-center">
          <ListTodo size={14} />
        </div>
        <h3 className="font-semibold text-base sm:text-lg tracking-tight">计划</h3>
        <span data-task-progress className="ml-auto text-xs text-white/45 tabular-nums">
          {doneCount}/{total}
        </span>
      </div>
      <div className="h-1 rounded-full bg-white/8 overflow-hidden shrink-0 mb-3">
        <div className="h-full rounded-full bg-indigo-400/90 transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>

      {face === 'list' ? (
        <div className="flex-1 min-h-0 flex flex-col gap-1">
          {rows.length === 0 ? (
            <p className="flex-1 flex items-center text-[13px] text-white/35">暂无待办，在下方添加第一件。</p>
          ) : (
            rows.map((t) => (
              <div key={t.id} className="flex items-center gap-2 py-1 min-w-0">
                <button
                  type="button"
                  aria-label={t.done ? '取消完成' : '标记完成'}
                  onClick={() => handleToggle(t)}
                  className={`w-[18px] h-[18px] rounded-[5px] border flex items-center justify-center shrink-0 transition-colors ${
                    t.done ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-white/30 hover:border-indigo-300 text-transparent'
                  }`}
                >
                  <Check size={12} strokeWidth={3} />
                </button>
                <span className={`text-[13px] truncate ${t.done ? 'line-through text-white/35' : 'text-white/85'}`}>{t.title}</span>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col">
          {focusTask ? (
            <>
              <p className="text-[11px] tracking-wider text-white/40 uppercase mb-1.5">下一件事</p>
              <p data-task-focus-title className="text-xl font-semibold leading-snug line-clamp-3">{focusTask.title}</p>
              <p className="mt-auto text-xs text-white/45">
                {restCount > 0 ? `还有 ${restCount} 件` : '就这一件了'}
              </p>
            </>
          ) : (
            <>
              <p className="text-[11px] tracking-wider text-white/40 uppercase mb-1.5">下一件事</p>
              <p className="text-xl font-semibold leading-snug text-white/50">暂无待办</p>
              <p className="mt-auto text-xs text-white/35">在下方添加第一件。</p>
            </>
          )}
        </div>
      )}

      {/* 快速添加行（卡面直接加待办，回车落库） */}
      <form
        className="mt-3 shrink-0 flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl pl-2.5 pr-1.5 py-1 focus-within:border-indigo-400/50 transition-colors"
        onSubmit={(e) => {
          e.preventDefault();
          submitDraft();
        }}
      >
        <Plus size={14} className="text-white/35 shrink-0" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="添加待办，回车确认"
          data-task-quickadd
          className="flex-1 min-w-0 bg-transparent text-[13px] py-1 outline-none placeholder:text-white/30"
        />
      </form>
    </motion.div>
  );
}
