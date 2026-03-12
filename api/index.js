// Vercel Serverless Function - 直接抓取RSS新闻
// 不依赖Railway，直接在这里实现RSS抓取

import https from 'https';
import http from 'http';

// RSS源配置
const RSS_URLS = [
  { url: 'https://www.36kr.com/feed', source: '36Kr', category: 'AI新闻' },
  { url: 'https://www.qbitai.com/feed', source: '量子位', category: 'AI报道' },
];

// 备用数据
const fallbackNewsData = [
  { title: 'OpenAI发布GPT-4.5：推理能力大幅提升', description: '最新版本在数学、编程和创意写作方面展现突破性进展，响应速度提升50%', source: '36Kr', category: '语言模型', url: 'https://36kr.com/', publishedAt: new Date().toISOString() },
  { title: 'Claude 4正式推出：专注模式大幅增强', description: 'Anthropic发布新一代Claude模型，长任务处理能力提升3倍', source: '量子位', category: '语言模型', url: 'https://www.qbitai.com/', publishedAt: new Date(Date.now() - 3600000).toISOString() },
  { title: 'Sora新版本发布：视频生成质量超越真实', description: 'OpenAI视频生成工具实现重大突破，生成视频时长可达60秒', source: '机器之心', category: '视频AI', url: 'https://www.jiqizhixin.com/', publishedAt: new Date(Date.now() - 7200000).toISOString() },
];

const fallbackTrendsData = [
  { topic: '#Sora', volume: '12.4万', color: 'text-blue-400' },
  { topic: '#Kimi', volume: '9.8万', color: 'text-purple-400' },
  { topic: '#可灵', volume: '4.5万', color: 'text-emerald-400' },
  { topic: '#Suno', volume: '3.2万', color: 'text-orange-400' },
  { topic: '#GPT-5', volume: '2.8万', color: 'text-green-400' },
  { topic: '#Claude', volume: '2.5万', color: 'text-yellow-400' },
  { topic: '#Midjourney', volume: '2.1万', color: 'text-pink-400' },
  { topic: '#Gemini', volume: '1.9万', color: 'text-red-400' },
];

const softwareRankingData = [
  { id: 1, name: 'ChatGPT', rank: 1, category: 'AI助手', description: 'OpenAI推出的AI对话助手', downloads: '1.2亿+', rating: '4.8', url: 'https://chat.openai.com', logo: '/icon_APP/chatgpticon.svg' },
  { id: 2, name: 'Claude', rank: 2, category: 'AI助手', description: 'Anthropic推出的AI助手', downloads: '8500万+', rating: '4.9', url: 'https://claude.ai', logo: '/icon_APP/claude.svg' },
  { id: 3, name: 'Kimi', rank: 3, category: 'AI助手', description: '月之暗面推出的国产AI助手', downloads: '5000万+', rating: '4.7', url: 'https://kimi.moonshot.cn', logo: '/icon_APP/KIMI.svg' },
  { id: 4, name: 'DeepSeek', rank: 4, category: 'AI助手', description: '深度求索AI助手', downloads: '4500万+', rating: '4.6', url: 'https://deepseek.com', logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=deepseek&backgroundColor=6366f1' },
  { id: 5, name: 'Midjourney', rank: 5, category: '图像生成', description: 'AI图像生成工具', downloads: '3200万+', rating: '4.6', url: 'https://www.midjourney.com', logo: '/icon_APP/Midjourney.svg' },
  { id: 6, name: 'Suno', rank: 6, category: '音频生成', description: 'AI音乐生成工具', downloads: '2800万+', rating: '4.5', url: 'https://suno.com', logo: '/icon_APP/suno.svg' },
  { id: 7, name: 'Nano Banana', rank: 7, category: 'AI写作', description: 'AI写作平台', downloads: '2500万+', rating: '4.4', url: 'https://nanobanana.com', logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=nanobanana&backgroundColor=f59e0b' },
  { id: 8, name: 'Sora', rank: 8, category: '视频生成', description: 'OpenAI视频生成工具', downloads: '2100万+', rating: '4.7', url: 'https://openai.com/sora', logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=sora&backgroundColor=ef4444' },
  { id: 9, name: 'Flowith', rank: 9, category: 'AI工作流', description: 'AI工作流平台', downloads: '1900万+', rating: '4.4', url: 'https://flowith.com', logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=flowith&backgroundColor=8b5cf6' },
  { id: 10, name: '通义千问', rank: 10, category: 'AI助手', description: '阿里云AI助手', downloads: '1800万+', rating: '4.4', url: 'https://tongyi.aliyun.com', logo: '/icon_APP/tongyi.svg' },
  { id: 11, name: '文心一言', rank: 11, category: 'AI助手', description: '百度AI助手', downloads: '1500万+', rating: '4.3', url: 'https://yiyan.baidu.com', logo: '/icon_APP/baidu.svg' },
  { id: 12, name: '豆包', rank: 12, category: 'AI助手', description: '字节跳动AI助手', downloads: '1200万+', rating: '4.5', url: 'https://www.doubao.com', logo: '/icon_APP/doubao.svg' },
  { id: 13, name: '腾讯混元', rank: 13, category: 'AI助手', description: '腾讯AI大模型', downloads: '1000万+', rating: '4.6', url: 'https://hunyuan.tencent.com', logo: '/icon_APP/icon-tengxun.svg' },
  { id: 14, name: 'Liblib', rank: 14, category: '图像生成', description: '国产AI图像生成平台', downloads: '800万+', rating: '4.4', url: 'https://www.liblib.art', logo: '/icon_APP/liblib.svg' },
];

// 全局缓存
let cachedNews = [];
let cachedTrends = [];
let lastUpdate = null;
let isInitialized = false;

// 获取RSS内容
function fetchRSS(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, {
      timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// 解析RSS
function parseRSS(xml) {
  const items = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemContent = match[1];
    const titleMatch = itemContent.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>|<title[^>]*>(.*?)<\/title>/i);
    const linkMatch = itemContent.match(/<link[^>]*>(.*?)<\/link>/i);
    const descMatch = itemContent.match(/<description[^>]*><!\[CDATA\[(.*?)\]\]><\/description>|<description[^>]*>(.*?)<\/description>/i);
    const pubDateMatch = itemContent.match(/<pubDate[^>]*>(.*?)<\/pubDate>/i);
    
    items.push({
      title: titleMatch ? (titleMatch[1] || titleMatch[2] || '').trim() : '',
      link: linkMatch ? linkMatch[1].trim() : '',
      description: descMatch ? (descMatch[1] || descMatch[2] || '').trim() : '',
      pubDate: pubDateMatch ? pubDateMatch[1].trim() : ''
    });
  }
  
  return items;
}

// 判断是否是AI新闻
function isAINews(title) {
  const keywords = ['AI', '人工智能', '大模型', 'GPT', 'Sora', 'Claude', 'Kimi', 'Gemini', 'Midjourney', 'Suno', '视频生成', '图像生成', 'LLM', '模型', 'OpenAI', 'Anthropic', '月之暗面', '通义', '文心', '字节', '腾讯', '华为', '芯片', 'GPU', 'Agent', '算力', '深度学习', '神经网络'];
  const lowerTitle = title.toLowerCase();
  return keywords.some(keyword => lowerTitle.includes(keyword.toLowerCase()));
}

// 同步新闻
async function syncNews() {
  console.log('Syncing news from RSS...');
  const allNews = [];
  
  for (const rssConfig of RSS_URLS) {
    try {
      console.log(`Fetching ${rssConfig.source}...`);
      const xml = await fetchRSS(rssConfig.url, 8000);
      const items = parseRSS(xml);
      
      items.slice(0, 10).forEach((item) => {
        if (isAINews(item.title)) {
          allNews.push({
            title: item.title,
            description: item.description.replace(/<[^>]+>/g, '').substring(0, 200),
            source: rssConfig.source,
            category: rssConfig.category,
            url: item.link.replace(/<!\[CDATA\[(.*?)\]\]>/, '$1'),
            publishedAt: item.pubDate || new Date().toISOString()
          });
        }
      });
    } catch (error) {
      console.log(`${rssConfig.source} failed: ${error.message}`);
    }
  }
  
  if (allNews.length > 0) {
    cachedNews = allNews.map((item, idx) => ({
      ...item,
      id: idx + 1
    }));
    cachedTrends = fallbackTrendsData.map((item, idx) => ({ ...item, id: idx + 1 }));
    lastUpdate = new Date().toISOString();
    console.log(`Synced ${cachedNews.length} news items`);
  } else {
    console.log('Using fallback data');
    cachedNews = fallbackNewsData.map((item, idx) => ({ ...item, id: idx + 1 }));
    cachedTrends = fallbackTrendsData.map((item, idx) => ({ ...item, id: idx + 1 }));
    lastUpdate = new Date().toISOString();
  }
  
  isInitialized = true;
  return { newsCount: cachedNews.length, trendsCount: cachedTrends.length };
}

// 打乱数组
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Vercel Handler
export default async function handler(req, res) {
  const { method } = req;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 初始化数据（如果还没初始化）
  if (!isInitialized) {
    await syncNews();
  }

  if (method === 'GET') {
    const { type, limit = 20, offset = 0 } = req.query;
    
    if (type === 'news') {
      const shuffled = shuffleArray(cachedNews);
      return res.status(200).json({
        success: true,
        data: shuffled.slice(parseInt(offset), parseInt(offset) + parseInt(limit)),
        lastUpdate
      });
    }
    
    if (type === 'trends') {
      return res.status(200).json({
        success: true,
        data: cachedTrends,
        lastUpdate
      });
    }
    
    if (type === 'software-ranking') {
      return res.status(200).json({
        success: true,
        data: softwareRankingData,
        lastUpdate
      });
    }
    
    if (type === 'health') {
      return res.status(200).json({
        status: 'ok',
        newsCount: cachedNews.length,
        trendsCount: cachedTrends.length,
        softwareCount: softwareRankingData.length,
        lastUpdate
      });
    }
    
    if (type === 'sync') {
      const result = await syncNews();
      return res.status(200).json({
        success: true,
        ...result,
        lastUpdate
      });
    }
    
    // 默认返回所有数据
    return res.status(200).json({
      success: true,
      news: shuffleArray(cachedNews).slice(0, 10),
      trends: cachedTrends,
      softwareRanking: softwareRankingData,
      lastUpdate
    });
  }
  
  if (method === 'POST') {
    const { action } = req.body || {};
    
    if (action === 'refresh') {
      const result = await syncNews();
      return res.status(200).json({
        success: true,
        message: 'News refreshed',
        ...result,
        lastUpdate
      });
    }
    
    return res.status(400).json({
      success: false,
      error: 'Unknown action'
    });
  }
  
  res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}
