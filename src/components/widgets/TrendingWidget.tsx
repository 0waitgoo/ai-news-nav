import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { fetchTrends, type TrendItem } from '../../services/api';

export default function TrendingWidget() {
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrends = async () => {
      setLoading(true);
      try {
        const trendsData = await fetchTrends();
        setTrends(trendsData);
      } catch (error) {
        console.error('Failed to fetch trends:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTrends();
  }, []);

  const defaultTrends = [
    { id: 1, topic: '#Sora', volume: '12.4万', color: 'text-blue-400' },
    { id: 2, topic: '#Kimi', volume: '9.8万', color: 'text-purple-400' },
    { id: 3, topic: '#可灵', volume: '4.5万', color: 'text-emerald-400' },
    { id: 4, topic: '#Suno', volume: '3.2万', color: 'text-orange-400' },
  ];

  const displayTrends = trends.length > 0 ? trends : defaultTrends;

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-panel rounded-[32px] h-full p-4 sm:p-5 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3 sm:mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <TrendingUp size={14} className="text-indigo-400" />
            </div>
            <h3 className="font-semibold text-base sm:text-lg tracking-tight">热门话题</h3>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw size={20} className="text-white/30 animate-spin" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="glass-panel rounded-[32px] h-full p-4 sm:p-5 flex flex-col overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <TrendingUp size={14} className="text-indigo-400" />
          </div>
          <h3 className="font-semibold text-base sm:text-lg tracking-tight">热门话题</h3>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 flex-1 min-h-0">
        {displayTrends.slice(0, 8).map((trend, idx) => (
          <div key={idx} className="bg-white/5 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-center border border-white/5">
            <span className={`text-sm font-bold ${trend.color || 'text-white'} mb-1 truncate`}>{trend.topic}</span>
            <span className="text-xs font-medium text-white/50 truncate">{trend.volume} 帖子</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
