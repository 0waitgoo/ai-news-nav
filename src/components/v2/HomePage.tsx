import React, { useState } from 'react';
import { Sparkles, Check } from 'lucide-react';
import { navGroups, type NavGroup } from '../../data/groups';
import StickySearch from './StickySearch';
import NewsCard from './NewsCard';
import RankingCard from './RankingCard';
import TaskPlaceholderCard from './TaskPlaceholderCard';
import GroupListCard from './GroupListCard';
import GroupStackCard from './GroupStackCard';
import GroupPanel from './GroupPanel';
import TrendingWidget from '../widgets/TrendingWidget';

/**
 * V2.0 新主页
 * - 4 栏基准网格瀑布流（桌面 4 栏 / 手机 2 栏），卡片跨 1–2 栏，高度 1X/2X/3X 随内容，向下滚动续流
 * - 无下方导航条：导航靠顶栏（Sidebar）+ 吸顶搜索
 * - 首屏优先级：搜索 ＞ B 型编组 ＞ 今日任务占位 ＞ 其他卡片
 */
export default function HomePage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [activeGroup, setActiveGroup] = useState<NavGroup | null>(null);

  const listGroup = navGroups.find((g) => g.type === 'list');
  const stackGroups = navGroups.filter((g) => g.type === 'stack');
  // C 型编组排布：新闻/榜单之间穿插，保持瀑布混排
  const [stackA, stackB, ...stackRest] = stackGroups;

  return (
    <div className="flex flex-col">
      {/* 顶栏：左 Logo/站名，右 已同步 + 头像 */}
      <div className="flex items-center justify-between gap-3 pt-1 pb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500/50 to-purple-500/50 border border-indigo-300/30 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
            <Sparkles size={17} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-base sm:text-lg tracking-tight leading-tight truncate">AI Trend &amp; Nav</h1>
            <p className="text-[10px] sm:text-[11px] text-white/40 leading-tight">AI 资讯与工具导航 · V2</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-white/45">
            <span className="w-4 h-4 rounded-full bg-emerald-400/20 text-emerald-300 flex items-center justify-center">
              <Check size={10} />
            </span>
            已同步
          </span>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-fuchsia-500/60 to-indigo-500/60 border border-white/20 flex items-center justify-center text-sm font-bold">
            W
          </div>
        </div>
      </div>

      {/* 吸顶搜索 */}
      <StickySearch onOpenGroup={setActiveGroup} />

      {/* 瀑布流网格：4 栏（手机 2 栏），dense 流自动补齐 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-2 [grid-auto-flow:dense] auto-rows-[158px] sm:auto-rows-[168px] lg:auto-rows-[176px]">
        {/* B 型编组（AI 对话）：跨 2 栏 × 3X */}
        {listGroup && (
          <div className="col-span-2 row-span-3">
            <GroupListCard group={listGroup} onExpand={setActiveGroup} delay={0.02} />
          </div>
        )}

        {/* 今日任务占位：1 栏 × 1X */}
        <div className="col-span-1 row-span-1">
          <TaskPlaceholderCard delay={0.06} />
        </div>

        {/* C 型编组 ×1 */}
        {stackA && (
          <div className="col-span-1 row-span-1">
            <GroupStackCard group={stackA} onExpand={setActiveGroup} delay={0.1} />
          </div>
        )}

        {/* A 型 · AI 资讯：跨 2 栏 × 2X */}
        <div className="col-span-2 row-span-2">
          <NewsCard onNavigate={onNavigate} delay={0.14} />
        </div>

        {/* C 型编组 ×1 */}
        {stackB && (
          <div className="col-span-1 row-span-1">
            <GroupStackCard group={stackB} onExpand={setActiveGroup} delay={0.18} />
          </div>
        )}

        {/* C 型编组 ×1 */}
        {stackRest[0] && (
          <div className="col-span-1 row-span-1">
            <GroupStackCard group={stackRest[0]} onExpand={setActiveGroup} delay={0.22} />
          </div>
        )}

        {/* A 型 · AI 软件榜：跨 2 栏 × 2X */}
        <div className="col-span-2 row-span-2">
          <RankingCard delay={0.26} />
        </div>

        {/* 其余 C 型编组 */}
        {stackRest.slice(1).map((group, idx) => (
          <div key={group.id} className="col-span-1 row-span-1">
            <GroupStackCard group={group} onExpand={setActiveGroup} delay={0.3 + idx * 0.04} />
          </div>
        ))}

        {/* A 型 · 热门话题（复用现有 widget）：跨 2 栏 × 1X */}
        <div className="col-span-2 row-span-1">
          <TrendingWidget />
        </div>
      </div>

      <p className="text-center text-[11px] text-white/25 pt-8 pb-2">继续向下滚动 · 卡片随内容生长，编组与小组件持续补齐中</p>

      {/* D 型编组展开面板 */}
      <GroupPanel group={activeGroup} onClose={() => setActiveGroup(null)} />
    </div>
  );
}
