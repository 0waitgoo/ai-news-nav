import React from 'react';
import { motion } from 'motion/react';
import { ListTodo } from 'lucide-react';

/**
 * A 型 · 今日任务占位卡（V2.0 决策：先占位，后期再专项设计）
 * 不实现任何任务功能，仅以虚线占位样式上主页。
 */
export default function TaskPlaceholderCard({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="rounded-[28px] h-full p-4 sm:p-5 flex flex-col border-2 border-dashed border-white/15 bg-white/[0.02]"
    >
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <div className="w-7 h-7 rounded-full bg-white/5 text-white/40 flex items-center justify-center">
          <ListTodo size={14} />
        </div>
        <h3 className="font-semibold text-base sm:text-lg tracking-tight text-white/70">今日任务</h3>
        <span className="ml-auto text-[10px] font-medium text-white/40 bg-white/5 px-2 py-0.5 rounded-full">占位</span>
      </div>
      <div className="flex-1 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-1.5 text-center px-3">
        <p className="text-sm font-medium text-white/50">任务组件 · 设计中</p>
        <p className="text-[11px] text-white/30 leading-relaxed">三端同步的任务计划小工具<br />后期专项设计，敬请期待</p>
      </div>
    </motion.div>
  );
}
