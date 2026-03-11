import express from 'express';
import cors from 'cors';
import https from 'https';
import http from 'http';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

let cachedNews = [];
let cachedTrends = [];
let lastUpdate = null;

const aiNewsData = [
  { title: 'OpenAI发布GPT-4.5：推理能力大幅提升', description: '最新版本在数学、编程和创意写作方面展现突破性进展，响应速度提升50%', source: '36Kr', category: '语言模型', url: 'https://36kr.com/' },
  { title: 'Claude 4正式推出：专注模式大幅增强', description: 'Anthropic发布新一代Claude模型，长任务处理能力提升3倍', source: '量子位', category: '语言模型', url: 'https://www.qbitai.com/' },
  { title: 'Sora新版本发布：视频生成质量超越真实', description: 'OpenAI视频生成工具实现重大突破，生成视频时长可达60秒', source: '机器之心', category: '视频AI', url: 'https://www.jiqizhixin.com/' },
  { title: 'Midjourney v7发布：图像细节再创新高', description: '新一代图像生成模型在写实和艺术风格上都有显著提升', source: '爱范儿', category: '图像AI', url: 'https://www.ifanr.com/' },
  { title: 'Kimi智能助手用户突破5000万', description: '月之暗面AI产品增速创国产AI应用纪录，月活用户数持续攀升', source: '36Kr', category: '行业动态', url: 'https://36kr.com/' },
  { title: '可灵AI视频生成全面开放API', description: '快手可灵AI开放企业级API接口，支持批量视频创作', source: '极客公园', category: '视频AI', url: 'https://www.geekpark.net/' },
  { title: 'Google发布Gemini 2.5 Pro：多模态能力领先', description: 'Google最新多模态模型在各项基准测试中刷新纪录', source: '品玩', category: '多模态', url: 'https://www.pingwest.com/' },
  { title: 'Suno v4发布：专业音乐制作能力增强', description: 'AI音乐生成工具新增专业混音功能，音乐人创作更便捷', source: '爱范儿', category: '音频AI', url: 'https://www.ifanr.com/' },
  { title: '百度文心一言4.0企业版正式发布', description: '百度发布新一代企业级AI服务，支持私有化部署', source: '36Kr', category: '语言模型', url: 'https://36kr.com/' },
  { title: 'Meta开源LLaMA 4：性能超越闭源模型', description: 'Meta新一代开源大模型参数规模达千亿级别', source: '虎嗅', category: '语言模型', url: 'https://www.huxiu.com/' },
];

const aiTrendsData = [
  { topic: '#Sora', volume: '12.4万', color: 'text-blue-400' },
  { topic: '#Kimi', volume: '9.8万', color: 'text-purple-400' },
  { topic: '#可灵', volume: '4.5万', color: 'text-emerald-400' },
  { topic: '#Suno', volume: '3.2万', color: 'text-orange-400' },
  { topic: '#GPT-5', volume: '2.8万', color: 'text-green-400' },
  { topic: '#Claude', volume: '2.5万', color: 'text-yellow-400' },
  { topic: '#Midjourney', volume: '2.1万', color: 'text-pink-400' },
  { topic: '#Gemini', volume: '1.9万', color: 'text-red-400' },
];

function initializeData() {
  cachedNews = aiNewsData.map((item, idx) => ({
    ...item,
    id: idx + 1,
    publishedAt: new Date(Date.now() - idx * 3600000).toISOString()
  }));
  cachedTrends = aiTrendsData.map((item, idx) => ({
    ...item,
    id: idx + 1
  }));
  lastUpdate = new Date().toISOString();
}

initializeData();

function fetchWithTimeout(url, options = {}, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      ...options.headers
    };
    
    const req = protocol.get(url, { timeout, headers, ...options }, (res) => {
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

function isAINews(title) {
  const keywords = ['AI', '人工智能', '大模型', 'GPT', 'Sora', 'Claude', 'Kimi', 'Gemini', 'Midjourney', 'Suno', '视频生成', '图像生成', 'LLM', '模型', 'OpenAI', 'Anthropic', '月之暗面', '通义', '文心', '字节', '腾讯', '华为', '芯片', 'GPU', 'Agent'];
  const lowerTitle = title.toLowerCase();
  return keywords.some(keyword => lowerTitle.includes(keyword.toLowerCase()));
}

async function syncNews() {
  console.log('Starting news sync...');
  const allNews = [];
  const RSS_URLS = [
    { url: 'https://www.36kr.com/feed', source: '36Kr', category: 'AI新闻' },
    { url: 'https://www.qbitai.com/feed', source: '量子位', category: 'AI报道' },
  ];
  
  for (const rssConfig of RSS_URLS) {
    try {
      console.log(`Fetching ${rssConfig.url}...`);
      const xml = await fetchWithTimeout(rssConfig.url, {}, 15000);
      const items = parseRSS(xml);
      
      items.slice(0, 15).forEach((item) => {
        if (isAINews(item.title)) {
          allNews.push({
            title: item.title,
            description: item.description.replace(/<[^>]+>/g, '').substring(0, 200),
            source: rssConfig.source,
            category: rssConfig.category,
            url: item.link,
            publishedAt: item.pubDate || new Date().toISOString()
          });
        }
      });
    } catch (error) {
      console.log(`${rssConfig.source} RSS fetch failed: ${error.message}`);
    }
  }
  
  if (allNews.length < 5) {
    console.log('Using fallback AI news data');
    cachedNews = aiNewsData.map((item, idx) => ({
      ...item,
      id: idx + 1,
      publishedAt: new Date(Date.now() - idx * 3600000 * Math.random() * 24).toISOString()
    }));
  } else {
    cachedNews = allNews.map((item, idx) => ({
      ...item,
      id: idx + 1,
      publishedAt: item.publishedAt || new Date(Date.now() - idx * 3600000).toISOString()
    }));
  }
  
  cachedTrends = aiTrendsData.map((item, idx) => ({
    ...item,
    id: idx + 1
  }));
  
  lastUpdate = new Date().toISOString();
  console.log(`Synced ${cachedNews.length} news items`);
  return { newsCount: cachedNews.length, trendsCount: cachedTrends.length };
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

app.get('/api', (req, res) => {
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
  
  if (type === 'health') {
    return res.status(200).json({
      status: 'ok',
      newsCount: cachedNews.length,
      trendsCount: cachedTrends.length,
      lastUpdate
    });
  }
  
  if (type === 'sync') {
    syncNews().then(result => {
      return res.status(200).json({
        success: true,
        ...result,
        lastUpdate
      });
    }).catch(error => {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    });
    return;
  }
  
  return res.status(200).json({
    success: true,
    news: shuffleArray(cachedNews).slice(0, 10),
    trends: cachedTrends,
    lastUpdate
  });
});

const INTERVAL = 6 * 60 * 60 * 1000;

syncNews().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API endpoints:`);
    console.log(`  - GET  /api?type=news   - Get news list`);
    console.log(`  - GET  /api?type=trends  - Get trends`);
    console.log(`  - GET  /api?type=health  - Health check`);
    console.log(`  - GET  /api?type=sync    - Force sync news`);
    console.log(`Auto-update: Every ${INTERVAL / 1000 / 60} minutes`);
  });
  
  setInterval(() => {
    syncNews().catch(error => {
      console.error('Auto sync failed:', error);
    });
  }, INTERVAL);
});
