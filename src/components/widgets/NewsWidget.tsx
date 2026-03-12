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
              
              // 分类标签颜色映射
              const categoryColors: Record<string, { bg: string; text: string }> = {
                '聊天机器人': { bg: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA' },
                '图像生成': { bg: 'rgba(167, 139, 250, 0.15)', text: '#A78BFA' },
                '视频生成': { bg: 'rgba(52, 211, 153, 0.15)', text: '#34D399' },
                '代码编程': { bg: 'rgba(251, 191, 36, 0.15)', text: '#FBBF24' },
                '音频生成': { bg: 'rgba(251, 146, 60, 0.15)', text: '#FB923C' },
                'Agent工具': { bg: 'rgba(248, 113, 113, 0.15)', text: '#F87171' },
                'AI写作': { bg: 'rgba(156, 163, 175, 0.15)', text: '#9CA3AF' },
                'AI搜索': { bg: 'rgba(96, 165, 250, 0.15)', text: '#60A5FA' },
              };
              
              // 排名圆圈样式
              const getRankCircleStyle = (rank: number) => {
                if (rank === 1) return { background: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#000' };
                if (rank === 2) return { background: 'linear-gradient(135deg, #C0C0C0, #A0A0A0)', color: '#000' };
                if (rank === 3) return { background: 'linear-gradient(135deg, #CD7F32, #B87333)', color: '#FFF' };
                return { background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA' };
              };
              
              return sorted.slice(0, 10).map((item, idx) => {
                const rank = idx + 1;
                const rankStyle = getRankCircleStyle(rank);
                const catColors = categoryColors[item.category] || { bg: 'rgba(107, 114, 128, 0.15)', text: '#9CA3AF' };
                
                return (
                  <div 
                    key={item.id} 
                    onClick={() => handleSoftwareClick(item.url || '#')}
                    className="bg-white/[0.03] rounded-xl p-3.5 border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] hover:-translate-y-0.5 hover:shadow-lg cursor-pointer transition-all duration-200"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  >
                    {/* 第一行：排名圆圈 + 软件名称 + 分类标签 */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {/* 排名圆圈 */}
                        <div 
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0"
                          style={{ background: rankStyle.background, color: rankStyle.color }}
                        >
                          {rank}
                        </div>
                        {/* 软件名称 */}
                        <span className="text-[15px] font-bold text-white truncate">{item.name}</span>
                      </div>
                      {/* 分类标签 - 右上角 */}
                      <span 
                        className="text-[11px] font-medium px-2.5 py-1 rounded-full shrink-0"
                        style={{ backgroundColor: catColors.bg, color: catColors.text }}
                      >
                        {item.category}
                      </span>
                    </div>
                    
                    {/* 第二行：评分 + 热度 */}
                    <div className="flex items-center gap-4 pl-10">
                      {/* 评分 */}
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-yellow-400 fill-yellow-400" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span className="text-[13px] font-semibold text-yellow-400">{item.rating}</span>
                      </div>
                      {/* 热度 */}
                      <div className="flex items-center gap-1.5">
                        <Flame size={14} className="text-orange-400" />
                        <span className="text-[13px] font-semibold text-orange-400">{item.usageValue}</span>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}
    </motion.div>
  );
}
