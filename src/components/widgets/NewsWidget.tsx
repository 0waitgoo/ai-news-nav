import React, { useState, useEffect } from 'react';
import { TrendingUp, Eye, RefreshCw, Clock, Flame } from 'lucide-react';
import { motion } from 'motion/react';
import { fetchNews, fetchSoftwareRanking, syncNews, fetchHealth, type NewsItem, type SoftwareRankingItem, type HealthInfo } from '../../services/api';

type TabType = 'news' | 'ranking';

export default function NewsWidget() {
  const [activeTab, setActiveTab] = useState<TabType>('news');
  const [topNews, setTopNews] = useState<NewsItem | null>(null);
  const [recentNews, setRecentNews] = useState<NewsItem[]>([]);
  const [softwareRanking, setSoftwareRanking] = useState<SoftwareRankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthInfo, setHealthInfo] = useState<HealthInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [news, ranking, health] = await Promise.all([
          fetchNews(10),
          fetchSoftwareRanking(),
          fetchHealth()
        ]);
        if (news.length > 0) {
          setTopNews(news[0]);
          setRecentNews(news.slice(1, 4));
        }
        setSoftwareRanking(ranking);
        setHealthInfo(health);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await syncNews();
      if (result.success) {
        const news = await fetchNews(10);
        if (news.length > 0) {
          setTopNews(news[0]);
          setRecentNews(news.slice(1, 4));
        }
        const health = await fetchHealth();
        setHealthInfo(health);
      }
    } catch (error) {
      console.error('Failed to refresh news:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/20 text-yellow-400';
    if (rank === 2) return 'bg-gray-400/20 text-gray-300';
    if (rank === 3) return 'bg-orange-600/20 text-orange-400';
    return 'bg-white/5 text-white/50';
  };

  const handleSoftwareClick = (url: string) => {
    if (url && url !== '#') {
      window.open(url, '_blank');
    }
  };

  const loadingApp = {
    name: '加载中...',
    description: '正在获取数据',
    icon: '📰'
  };

  const defaultApp = {
    name: 'ChatGPT',
    description: 'OpenAI推出的AI对话助手',
    icon: '🤖'
  };

  const displayApp = topNews ? {
    name: topNews.title.slice(0, 20),
    description: topNews.description || topNews.category,
    icon: '📰'
  } : defaultApp;

  const recentApps = recentNews.map((news, idx) => ({
    name: news.title.slice(0, 15),
    icon: '📰',
    growth: new Date(news.publishedAt).toLocaleDateString('MM-DD'),
    url: news.url || '#'
  }));

  if (recentApps.length === 0) {
    recentApps.push(
      { name: 'Claude', icon: '🧠', growth: '+38%', url: 'https://claude.ai' },
      { name: 'Midjourney', icon: '🎨', growth: '+52%', url: 'https://www.midjourney.com' },
      { name: 'Kimi', icon: '🌙', growth: '+72%', url: 'https://kimi.moonshot.cn' }
    );
  }

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel rounded-[32px] h-full p-4 flex flex-col justify-between relative overflow-hidden border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-pink-500/20">
          <RefreshCw size={40} className="text-white/20 animate-spin" />
        </div>
        <div className="relative z-10 flex justify-between items-start">
          <span className="px-3 py-1.5 text-[11px] font-bold tracking-wider uppercase bg-gradient-to-r from-pink-500/80 to-purple-500/80 backdrop-blur-md rounded-full text-white shadow-lg">
            🏆 今日最热
          </span>
        </div>
        <div className="relative z-10 mt-auto">
          <div className="flex items-center gap-2 text-white/70 text-xs mb-2 sm:mb-3 font-medium">
            <Eye size={14} />
            <span>加载中...</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-4xl animate-pulse">⏳</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold leading-[1.15] tracking-tight">
                {loadingApp.name}
              </h2>
              <p className="text-white/70 text-xs sm:text-sm">
                {loadingApp.description}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-panel rounded-[32px] h-full p-4 flex flex-col justify-between relative overflow-hidden group border border-white/10"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="absolute inset-0 z-0 flex items-center justify-center bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-pink-500/20">
        <span className="text-[120px] opacity-20">{displayApp.icon}</span>
      </div>

      <div className="relative z-10 flex justify-between items-start">
        <span className="px-3 py-1.5 text-[11px] font-bold tracking-wider uppercase bg-gradient-to-r from-pink-500/80 to-purple-500/80 backdrop-blur-md rounded-full text-white shadow-lg">
          {activeTab === 'news' ? '🏆 今日最热' : '📱 软件榜'}
        </span>
        
        <div className="flex items-center gap-2">
          {activeTab === 'news' && healthInfo && (
            <div className="flex items-center gap-1 text-[9px] text-white/40">
              <Clock size={10} />
              <span>{healthInfo.lastSync ? new Date(healthInfo.lastSync).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '刚刚'}</span>
            </div>
          )}
          {activeTab === 'news' && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all disabled:opacity-50"
              title="刷新新闻"
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            </button>
          )}
          <div className="flex bg-white/5 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('news')}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                activeTab === 'news'
                  ? 'bg-pink-500/20 text-pink-300'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              资讯
            </button>
            <button
              onClick={() => setActiveTab('ranking')}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                activeTab === 'ranking'
                  ? 'bg-pink-500/20 text-pink-300'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              软件榜
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'news' ? (
        <>
          <div className="relative z-10 mt-auto">
            <div className="flex items-center gap-2 text-white/70 text-xs mb-2 sm:mb-3 font-medium">
              <Eye size={14} />
              <span>{topNews?.source || 'AI资讯'}</span>
              <span className="w-1 h-1 rounded-full bg-white/30 mx-1"></span>
              <span className="text-indigo-300">{topNews?.category || '最新'}</span>
            </div>
            
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">{displayApp.icon}</span>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold leading-[1.15] tracking-tight">
                  {displayApp.name}
                </h2>
                <p className="text-white/70 text-xs sm:text-sm">
                  {displayApp.description}
                </p>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-[10px] font-medium text-white/40 mb-2">热门榜单</p>
              <div className="space-y-1.5">
                {recentApps.slice(0, 3).map((app, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center gap-2 text-[10px] rounded-lg p-1 -mx-1"
                  >
                    <span className="w-4 h-4 rounded bg-white/10 flex items-center justify-center text-white/50 text-[8px] font-bold">
                      {idx + 2}
                    </span>
                    <span>{app.icon}</span>
                    <span className="text-white/70 truncate flex-1">{app.name}</span>
                    <span className="text-green-400/80">{app.growth}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="relative z-10 mt-2 flex-1 overflow-y-auto">
          <div className="space-y-2">
            {(() => {
              const sorted = [...softwareRanking].sort((a, b) => {
                const aViews = parseInt(String(a.usageValue || a.weeklyViews || a.downloads || '0').replace(/[亿万]/g, ''));
                const bViews = parseInt(String(b.usageValue || b.weeklyViews || b.downloads || '0').replace(/[亿万]/g, ''));
                const aMultiplier = String(a.usageValue || a.weeklyViews || a.downloads || '').includes('亿') ? 10000 : 1;
                const bMultiplier = String(b.usageValue || b.weeklyViews || b.downloads || '').includes('亿') ? 10000 : 1;
                return (bViews * bMultiplier) - (aViews * aMultiplier);
              });
              return sorted.slice(0, 10).map((item, idx) => (
                <div 
                  key={item.id} 
                  onClick={() => handleSoftwareClick(item.url || '#')}
                  className="bg-white/5 rounded-xl p-2.5 border border-white/5 hover:bg-white/10 cursor-pointer transition-all group"
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${getRankColor(idx + 1)}`}>
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-bold text-white truncate">{item.name}</span>
                        <span className="text-[10px] text-white/50 shrink-0">{item.category}</span>
                      </div>
                      
                      {/* 评分行 */}
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <svg
                              key={i}
                              className={`w-3 h-3 ${i < Math.floor(item.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`}
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-[11px] font-medium text-yellow-400">{item.rating}</span>
                        <span className="text-[9px] text-white/40">/ {item.ratingScale || 5}</span>
                        <span className="text-[9px] text-white/30">·</span>
                        <span className="text-[9px] text-white/50">{item.reviewCount}评价</span>
                      </div>
                      
                      {/* 使用量行 */}
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <Flame size={10} className="text-orange-400/70" />
                        <span className="text-white/60">{item.usageMetric}</span>
                        <span className="text-orange-400/80 font-medium">{item.usageValue || item.weeklyViews || item.downloads}</span>
                        <span className="text-white/30">·</span>
                        <span className="text-white/40">{item.dataPeriod}数据</span>
                      </div>
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}
    </motion.div>
  );
}
