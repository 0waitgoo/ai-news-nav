import React from 'react';
import { Trophy } from 'lucide-react';
// 软件榜数据：GitHub Actions 每周运行 scripts/update-ranking.js 从 Product Hunt
// 官方 API 生成的真实榜单（votes 为源站真实票数）；无真实数据时为空数组显示空态。
// @ts-ignore - JS 数据文件无类型声明
import { softwareRankingData, rankingMeta } from '../../../api/ranking-data.js';
import type { WidgetTint } from '../../store/localStore';
import { Card, CardIconBadge } from './Card';

interface RankingEntry {
  rank: number;
  name: string;
  tagline: string;
  votes: number;
  url: string;
}

interface RankingMeta {
  source: string;
  period: string;
  generatedAt: string;
}

const entries = ([...(softwareRankingData as RankingEntry[])]).sort((a, b) => a.rank - b.rank);
const meta = rankingMeta as RankingMeta;
const maxVotes = entries.length ? Math.max(...entries.map((e) => e.votes)) : 0;

const rankStyle = (rank: number) => {
  if (rank === 1) return 'bg-yellow-500/25 text-yellow-300';
  if (rank === 2) return 'bg-gray-300/20 text-gray-200';
  if (rank === 3) return 'bg-orange-500/20 text-orange-300';
  return 'bg-white/5 text-white/45';
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/** A 型 · AI 软件榜卡（第九十五轮重做）：序号 + 名称 + 按真实票数比例的横条 + 真实票数。
 *  数据只来自 Product Hunt 本周榜单的真实 votes，界面上不出现任何无源数字。 */
export default function RankingCard({
  delay = 0,
  tint,
  heightUnits = 2,
}: {
  delay?: number;
  /** 专属底色（第二十三轮，由 HomePage 按 widgetTints 分配传入） */
  tint?: WidgetTint;
  /** 生效高度档（1x 显示 4 行、2x 显示 8 行），由注册表适配层按布局传入 */
  heightUnits?: number;
}) {
  const rows = entries.slice(0, heightUnits >= 2 ? 8 : 4);
  return (
    <Card
      title="AI 软件榜"
      icon={
        <CardIconBadge className="bg-amber-500 text-white">
          <Trophy size={14} />
        </CardIconBadge>
      }
      right={<span className="text-[11px] text-white/40 shrink-0">本周</span>}
      delay={delay}
      tint={tint}
      watermark="🏆"
    >
      {rows.length === 0 ? (
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center gap-1.5 px-4">
          <span className="text-sm text-white/60">榜单数据接入中</span>
          <span className="text-[11px] leading-relaxed text-white/35">
            数据来源 Product Hunt · 每周更新
            <br />
            首期真实数据生成后自动上榜
          </span>
        </div>
      ) : (
        <>
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col justify-evenly gap-0.5">
            {rows.map((item) => (
              <button
                key={item.rank}
                onClick={() => item.url && window.open(item.url, '_blank')}
                className="flex items-center gap-2.5 px-1.5 py-1 rounded-xl hover:bg-white/5 text-left transition-colors"
                title={item.tagline || item.name}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${rankStyle(item.rank)}`}>
                  {item.rank}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-semibold truncate leading-tight">{item.name}</span>
                  {item.tagline && (
                    <span className="block text-[10px] text-white/40 truncate leading-tight mt-0.5">{item.tagline}</span>
                  )}
                </span>
                <span className="w-14 sm:w-20 shrink-0 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <span
                    className={`block h-full rounded-full ${item.rank <= 3 ? 'bg-amber-400/90' : 'bg-white/55'}`}
                    style={{ width: `${maxVotes ? Math.max(6, Math.round((item.votes / maxVotes) * 100)) : 0}%` }}
                  />
                </span>
                <span className="shrink-0 w-14 text-right text-xs font-medium text-white/75 tabular-nums">
                  {item.votes.toLocaleString('en-US')} 票
                </span>
              </button>
            ))}
          </div>
          <div className="shrink-0 pt-2 text-[10px] text-white/30 truncate">
            数据来源：Product Hunt 本周榜单 · {formatDate(meta.generatedAt)}更新
          </div>
        </>
      )}
    </Card>
  );
}
