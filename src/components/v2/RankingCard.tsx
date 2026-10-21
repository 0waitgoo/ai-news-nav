import React from 'react';
import { Trophy, Star, Flame } from 'lucide-react';
// 软件榜数据：由 GitHub Actions 每周自动更新的静态数据文件（数据管线保持不变）
// @ts-ignore - JS 数据文件无类型声明
import { softwareRankingData } from '../../../api/ranking-data.js';
import type { WidgetTint } from '../../store/localStore';
import { Card, CardIconBadge } from './Card';

interface RankingEntry {
  id: number;
  name: string;
  rank: number;
  category: string;
  description: string;
  rating: number;
  reviewCount?: string;
  usageValue?: string;
  dataPeriod?: string;
  url?: string;
}

const entries = ([...(softwareRankingData as RankingEntry[])]).sort((a, b) => a.rank - b.rank).slice(0, 6);

const rankStyle = (rank: number) => {
  if (rank === 1) return 'bg-yellow-500/25 text-yellow-300';
  if (rank === 2) return 'bg-gray-300/20 text-gray-200';
  if (rank === 3) return 'bg-orange-500/20 text-orange-300';
  return 'bg-white/5 text-white/45';
};

/** A 型 · AI 软件榜卡：使用 api/ranking-data.js 的每周自动更新数据 */
export default function RankingCard({
  delay = 0,
  tint,
}: {
  delay?: number;
  /** 专属底色（第二十三轮，由 HomePage 按 widgetTints 分配传入） */
  tint?: WidgetTint;
}) {
  return (
    <Card
      title="AI 软件榜"
      icon={
        <CardIconBadge className="bg-amber-500/20 text-amber-300">
          <Trophy size={14} />
        </CardIconBadge>
      }
      right={<span className="text-[10px] text-white/35">Product Hunt · 每周更新</span>}
      delay={delay}
      tint={tint}
      watermark={<Trophy size={176} strokeWidth={1} />}
    >
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col gap-1">
        {entries.map((item) => (
          <button
            key={item.id}
            onClick={() => item.url && window.open(item.url, '_blank')}
            className="flex items-center gap-3 px-2 py-[7px] rounded-xl hover:bg-white/5 text-left transition-colors"
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${rankStyle(item.rank)}`}>
              {item.rank}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold truncate">{item.name}</span>
              <span className="block text-[11px] text-white/40 truncate">{item.description}</span>
            </span>
            <span className="flex items-center gap-1 shrink-0 text-xs text-white/70">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              {item.rating}
            </span>
            {item.usageValue && (
              <span className="hidden sm:flex items-center gap-1 shrink-0 text-xs text-white/50 w-20 justify-end">
                <Flame size={12} className="text-orange-400/80" />
                {item.usageValue}
              </span>
            )}
          </button>
        ))}
      </div>
    </Card>
  );
}
