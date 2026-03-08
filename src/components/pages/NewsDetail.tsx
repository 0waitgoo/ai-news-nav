import React from 'react';
import { ArrowLeft, Clock, ArrowUpRight } from 'lucide-react';

interface NewsItem {
  id: number;
  title: string;
  source: string;
  time: string;
  image?: string;
  category: string;
  description?: string;
  isFeatured?: boolean;
}

interface NewsDetailProps {
  news: NewsItem;
  onBack: () => void;
}

function NewsDetail({ news, onBack }: NewsDetailProps) {
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-4"
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">返回新闻列表</span>
      </button>

      <div className="glass-panel rounded-[32px] border border-white/10 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="px-4 py-2 text-xs font-bold tracking-wider uppercase bg-indigo-500/80 backdrop-blur-md rounded-full text-white shadow-lg shadow-indigo-500/20">
            {news.category}
          </span>
        </div>

        <div className="flex items-center gap-3 text-white/70 text-sm mb-6 font-medium flex-wrap">
          <Clock size={16} />
          <span>{news.time}</span>
          <span className="w-1 h-1 rounded-full bg-white/30 mx-1"></span>
          <span className="text-indigo-300">{news.source}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-6 tracking-tight">
          {news.title}
        </h1>

        {news.description && (
          <div className="text-white/80 text-base sm:text-lg leading-relaxed space-y-4">
            <p>{news.description}</p>
            <p className="text-white/60">
              这是关于{news.title}的详细报道。在这个快速发展的AI时代，保持对前沿技术的关注至关重要。我们将持续为您带来最新的AI新闻和深度分析。
            </p>
            <p className="text-white/60">
              更多精彩内容，敬请关注我们的新闻更新。
            </p>
          </div>
        )}

        {!news.description && (
          <div className="text-white/70 text-base leading-relaxed space-y-4">
            <p>这是关于{news.title}的详细报道。</p>
            <p className="text-white/60">
              在这个快速发展的AI时代，保持对前沿技术的关注至关重要。我们将持续为您带来最新的AI新闻和深度分析。
            </p>
            <p className="text-white/60">
              更多精彩内容，敬请关注我们的新闻更新。
            </p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-white/10">
          <button className="flex items-center gap-2 px-6 py-3 bg-indigo-500/80 hover:bg-indigo-600/90 backdrop-blur-md rounded-xl text-white font-medium transition-all shadow-lg shadow-indigo-500/20">
            阅读原文
            <ArrowUpRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(NewsDetail);
