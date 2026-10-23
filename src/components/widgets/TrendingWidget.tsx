import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { fetchTrends, type TrendItem } from '../../services/api';
import type { WidgetTint } from '../../store/localStore';
import WidgetTintLayer from '../v2/WidgetTint';

/** 热门话题（第九十五轮重做）：数据经本站 /api 聚合微博热搜 + 百度热搜的公开热榜，
 *  heatText 为源站真实热度的格式化展示；拉不到时显示空态，绝不编造话题与热度。
 *  版式照参照图：卡头「实时 + 更新时间」，话题为单列软底圆角行（# 话题 …… 热度）。 */
export default function TrendingWidget({
  tint,
  heightUnits = 1,
}: {
  /** 专属底色（第二十三轮，由 HomePage 按 widgetTints 分配传入；旧 BentoGrid 用法不传则无底色） */
  tint?: WidgetTint;
  /** 生效高度档（1x 显示 4 行、2x 显示 8 行），由注册表适配层按布局传入 */
  heightUnits?: number;
} = {}) {
  const [items, setItems] = useState<TrendItem[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    const result = await fetchTrends();
    setItems(result.items);
    setUpdatedAt(result.updatedAt);
    setStale(result.stale);
    setFailed(result.items.length === 0);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows = items.slice(0, heightUnits >= 2 ? 8 : 4);
  const timeText = updatedAt
    ? new Date(updatedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
    : '';

  const tintLayer = tint ? <WidgetTintLayer tint={tint} emoji="🔥" /> : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="group-card-scope widget-panel relative rounded-[32px] h-full p-4 sm:p-5 flex flex-col overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {tintLayer}
      <div className="relative flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-indigo-500 text-white shadow-[0_1px_4px_rgba(0,0,0,0.3)] ring-1 ring-black/20 flex items-center justify-center shrink-0">
              <TrendingUp size={14} />
            </div>
            <h3 className="font-semibold text-base sm:text-lg tracking-tight truncate">热门话题</h3>
          </div>
          <span className={`text-[11px] shrink-0 ${stale ? 'text-amber-300/80' : 'text-white/40'}`}>
            {loading ? '实时' : failed ? '实时' : stale ? `实时 · ${timeText}缓存` : `实时 · ${timeText}更新`}
          </span>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <RefreshCw size={20} className="text-white/30 animate-spin" />
          </div>
        ) : failed ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-4">
            <span className="text-sm text-white/60">热榜暂时拉不到</span>
            <span className="text-[11px] text-white/35">微博 / 百度热搜源暂时不可达</span>
            <button
              onClick={load}
              className="mt-1 flex items-center gap-1.5 text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-full px-3 py-1.5 transition-colors"
            >
              <RefreshCw size={12} /> 点此重试
            </button>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col justify-evenly gap-1.5">
            {rows.map((trend) => (
              <button
                key={trend.id}
                onClick={() => trend.url && window.open(trend.url, '_blank')}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl px-3 py-2 text-left transition-colors"
                title={`${trend.topic}（${trend.source}）`}
              >
                <span className="flex-1 min-w-0 text-[13px] font-semibold truncate"># {trend.topic}</span>
                <span className="shrink-0 text-[10px] text-white/35">{trend.source.replace('热搜', '')}</span>
                <span className="shrink-0 text-xs text-white/60 tabular-nums">
                  热度 <span className="text-white/85 font-medium">{trend.heatText}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
