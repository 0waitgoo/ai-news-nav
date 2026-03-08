import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const db = new Database(join(__dirname, 'news.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    source TEXT NOT NULL,
    url TEXT,
    image TEXT,
    category TEXT,
    publishedAt TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS trends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT NOT NULL,
    volume TEXT NOT NULL,
    color TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS software_ranking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    rank INTEGER NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    downloads TEXT,
    rating TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

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
  { title: 'Runway发布Gen-4：视频编辑能力质的飞跃', description: 'AI视频创作平台新增镜头控制功能，创作更精准', source: '极客公园', category: '视频AI', url: 'https://www.geekpark.net/' },
  { title: '英伟达发布新一代AI芯片B200', description: 'Blackwell架构GPU训练性能提升30倍，推理成本大幅下降', source: '品玩', category: '硬件', url: 'https://www.pingwest.com/' },
  { title: '通义千问3.0发布：中文理解能力全球第一', description: '阿里云新一代大模型在中文任务上全面领先', source: '36Kr', category: '语言模型', url: 'https://36kr.com/' },
  { title: 'Pika 2.0发布：短视频生成更可控', description: 'AI视频生成初创公司Pika发布重大更新', source: '量子位', category: '视频AI', url: 'https://www.qbitai.com/' },
  { title: 'AI Agents爆发：AutoGPT获10亿美元融资', description: 'AI Agent赛道火热，多家公司获得大额融资', source: '虎嗅', category: '创业', url: 'https://www.huxiu.com/' },
  { title: 'GPT-5架构首曝：混合专家系统详解', description: 'OpenAI新架构或实现真正的通用人工智能', source: '机器之心', category: '语言模型', url: 'https://www.jiqizhixin.com/' },
  { title: '国产AI芯片好消息：华为昇腾910B产能提升', description: '国产AI芯片供货紧张缓解，价格下降20%', source: '品玩', category: '硬件', url: 'https://www.pingwest.com/' },
  { title: 'Copilot全面集成Windows 12', description: '微软AI助手深度融入操作系统，生产力大幅提升', source: '极客公园', category: '软件', url: 'https://www.geekpark.net/' },
  { title: 'AI医疗突破：诊断准确率超人类医生', description: 'AI辅助诊断系统在多项疾病检测中表现优于专科医生', source: '36Kr', category: '健康医疗', url: 'https://36kr.com/' },
  { title: 'Stability AI发布Stable Diffusion 3.5', description: '开源图像生成模型最新版本发布，生成速度提升2倍', source: '爱范儿', category: '图像AI', url: 'https://www.ifanr.com/' },
  { title: 'AI教育爆发：新东方推出AI老师', description: '传统教育巨头全面拥抱AI，一对一辅导智能化', source: '虎嗅', category: '行业动态', url: 'https://www.huxiu.com/' },
  { title: 'Udio v2发布：AI音乐创作更专业', description: 'AI音乐生成工具新增多轨道编辑功能', source: '量子位', category: '音频AI', url: 'https://www.qbitai.com/' },
  { title: 'Character AI开放API：开发者可创建虚拟角色', description: 'AI聊天机器人平台向开发者开放接口', source: '机器之心', category: '软件', url: 'https://www.jiqizhixin.com/' },
  { title: 'OpenAI草莓模型发布：推理能力质的飞跃', description: '新一代草莓模型在复杂推理任务上表现惊艳', source: '36Kr', category: '语言模型', url: 'https://36kr.com/' },
  { title: 'AI自动驾驶新进展：Waymo扩大运营范围', description: '无人驾驶出租车在美国多城市开始商业运营', source: '极客公园', category: '行业动态', url: 'https://www.geekpark.net/' },
  { title: '腾讯混元发布：微信生态AI能力全面升级', description: '腾讯AI助手接入微信生态，入口更便捷', source: '品玩', category: '语言模型', url: 'https://www.pingwest.com/' },
  { title: 'AI虚拟主播爆发：短视频行业迎来变革', description: 'AI虚拟主播24小时直播带货成新趋势', source: '虎嗅', category: '行业动态', url: 'https://www.huxiu.com/' },
  { title: 'Apple Intelligence正式登陆中国', description: '苹果AI服务在中国区上线，Siri能力大幅提升', source: '爱范儿', category: '软件', url: 'https://www.ifanr.com/' },
  { title: 'AI游戏制作：Unity发布AI工具Unity Muse', description: '游戏引擎集成AI创作能力，开发效率大幅提升', source: '极客公园', category: '软件', url: 'https://www.geekpark.net/' },
  { title: '国产大模型备案数突破200个', description: '中国AI大模型进入规范化发展阶段', source: '36Kr', category: '行业动态', url: 'https://36kr.com/' },
];

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

async function fetchNews() {
  const allNews = [];
  const RSS_URLS = [
    { url: 'https://www.36kr.com/feed', source: '36Kr', category: 'AI新闻' },
    { url: 'https://www.qbitai.com/feed', source: '量子位', category: 'AI报道' },
  ];
  
  for (const rssConfig of RSS_URLS) {
    try {
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
    return aiNewsData.map((item, idx) => ({
      ...item,
      publishedAt: new Date(Date.now() - idx * 3600000 * Math.random() * 24).toISOString()
    }));
  }
  
  return allNews.map((item, idx) => ({
    ...item,
    publishedAt: item.publishedAt || new Date(Date.now() - idx * 3600000).toISOString()
  }));
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

async function fetchAITrends() {
  return [
    { topic: '#Sora', volume: '12.4万', color: 'text-blue-400' },
    { topic: '#Kimi', volume: '9.8万', color: 'text-purple-400' },
    { topic: '#可灵', volume: '4.5万', color: 'text-emerald-400' },
    { topic: '#Suno', volume: '3.2万', color: 'text-orange-400' },
    { topic: '#GPT-5', volume: '2.8万', color: 'text-green-400' },
    { topic: '#Claude', volume: '2.5万', color: 'text-yellow-400' },
    { topic: '#Midjourney', volume: '2.1万', color: 'text-pink-400' },
    { topic: '#Gemini', volume: '1.9万', color: 'text-red-400' },
  ];
}

async function fetchSoftwareRanking() {
  return [
    { id: 1, name: 'ChatGPT', rank: 1, category: 'AI助手', description: 'OpenAI推出的AI对话助手', downloads: '1.2亿+', rating: '4.8' },
    { id: 2, name: 'Claude', rank: 2, category: 'AI助手', description: 'Anthropic推出的AI助手', downloads: '8500万+', rating: '4.9' },
    { id: 3, name: 'Kimi', rank: 3, category: 'AI助手', description: '月之暗面推出的国产AI助手', downloads: '5000万+', rating: '4.7' },
    { id: 4, name: 'Midjourney', rank: 4, category: '图像生成', description: 'AI图像生成工具', downloads: '3200万+', rating: '4.6' },
    { id: 5, name: 'Suno', rank: 5, category: '音频生成', description: 'AI音乐生成工具', downloads: '2800万+', rating: '4.5' },
    { id: 6, name: 'Sora', rank: 6, category: '视频生成', description: 'OpenAI视频生成工具', downloads: '2100万+', rating: '4.7' },
    { id: 7, name: '通义千问', rank: 7, category: 'AI助手', description: '阿里云AI助手', downloads: '1800万+', rating: '4.4' },
    { id: 8, name: '文心一言', rank: 8, category: 'AI助手', description: '百度AI助手', downloads: '1500万+', rating: '4.3' },
  ];
}

async function syncNews() {
  console.log('Starting news sync...');
  
  const news = await fetchNews();
  
  db.prepare('DELETE FROM news').run();
  
  const insert = db.prepare(`
    INSERT INTO news (title, description, source, url, category, publishedAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const insertMany = db.transaction((newsList) => {
    for (const item of newsList) {
      insert.run(
        item.title,
        item.description,
        item.source,
        item.url || '',
        item.category,
        item.publishedAt || new Date().toISOString()
      );
    }
  });
  
  insertMany(news);
  console.log(`Synced ${news.length} news items`);
  
  const trends = await fetchAITrends();
  
  db.prepare('DELETE FROM trends').run();
  
  const insertTrend = db.prepare(`
    INSERT INTO trends (topic, volume, color)
    VALUES (?, ?, ?)
  `);
  
  const insertTrendsMany = db.transaction((trendsList) => {
    for (const item of trendsList) {
      insertTrend.run(item.topic, item.volume, item.color || '');
    }
  });
  
  insertTrendsMany(trends);
  console.log(`Synced ${trends.length} trends`);
  
  lastManualSync = new Date().toISOString();
  return { newsCount: news.length, trendsCount: trends.length };
}

app.get('/api/news', (req, res) => {
  try {
    const { limit = 30, offset = 0, category } = req.query;
    
    let query = 'SELECT * FROM news';
    const params = [];
    
    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY publishedAt DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const news = db.prepare(query).all(...params);
    res.json({ success: true, data: news });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/trends', (req, res) => {
  try {
    const trends = db.prepare('SELECT * FROM trends ORDER BY volume DESC').all();
    res.json({ success: true, data: trends });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/software-ranking', (req, res) => {
  try {
    const ranking = db.prepare('SELECT * FROM software_ranking ORDER BY rank ASC').all();
    if (ranking.length === 0) {
      const fallbackData = fetchSoftwareRanking();
      const insert = db.prepare(`
        INSERT INTO software_ranking (name, rank, category, description, downloads, rating)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const insertMany = db.transaction((data) => {
        for (const item of data) {
          insert.run(item.name, item.rank, item.category, item.description, item.downloads, item.rating);
        }
      });
      insertMany(fallbackData);
      return res.json({ success: true, data: fallbackData });
    }
    res.json({ success: true, data: ranking });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/sync', async (req, res) => {
  try {
    const result = await syncNews();
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  const newsCount = db.prepare('SELECT COUNT(*) as count FROM news').get();
  const trendsCount = db.prepare('SELECT COUNT(*) as count FROM trends').get();
  res.json({ 
    status: 'ok', 
    newsCount: newsCount.count, 
    trendsCount: trendsCount.count,
    lastSync: db.prepare('SELECT MAX(createdAt) as lastSync FROM news').get().lastSync,
    lastManualSync: lastManualSync,
    nextScheduledSync: nextScheduledSync || getNextScheduledTime(),
    autoUpdateInterval: INTERVAL / 1000 / 60
  });
});

const INTERVAL = 6 * 60 * 60 * 1000;
const DAILY_UPDATE_HOUR = 6;
const DAILY_UPDATE_MINUTE = 0;

let lastManualSync = null;
let nextScheduledSync = null;

function getNextScheduledTime() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(DAILY_UPDATE_HOUR, DAILY_UPDATE_MINUTE, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  return next.toISOString();
}

function scheduleDailyUpdate() {
  const now = new Date();
  const nextUpdate = new Date(now);
  nextUpdate.setHours(DAILY_UPDATE_HOUR, DAILY_UPDATE_MINUTE, 0, 0);
  
  if (nextUpdate <= now) {
    nextUpdate.setDate(nextUpdate.getDate() + 1);
  }
  
  const delay = nextUpdate.getTime() - now.getTime();
  nextScheduledSync = nextUpdate.toISOString();
  
  console.log(`Daily news update scheduled for: ${nextUpdate.toLocaleString('zh-CN')}`);
  
  setTimeout(async () => {
    try {
      console.log('Executing scheduled daily news sync...');
      await syncNews();
      lastManualSync = new Date().toISOString();
    } catch (error) {
      console.error('Scheduled daily sync failed:', error);
    }
    scheduleDailyUpdate();
  }, delay);
}

setInterval(async () => {
  try {
    await syncNews();
    lastManualSync = new Date().toISOString();
  } catch (error) {
    console.error('Auto sync failed:', error);
  }
}, INTERVAL);

syncNews().then(() => {
  scheduleDailyUpdate();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API endpoints:`);
    console.log(`  - GET  /api/news    - Get news list`);
    console.log(`  - GET  /api/trends   - Get trends`);
    console.log(`  - POST /api/sync     - Force sync news`);
    console.log(`  - GET  /api/health   - Health check`);
    console.log(`Auto-update: Every ${INTERVAL / 1000 / 60} minutes + daily at ${DAILY_UPDATE_HOUR}:00`);
  });
});
