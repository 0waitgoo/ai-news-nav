const RAILWAY_API_URL = 'https://ai-news-nav-production-e2e3.up.railway.app/api';

// 备用新闻数据（当Railway不可用时使用）
const fallbackNewsData = [
  { title: 'OpenAI发布GPT-4.5：推理能力大幅提升', description: '最新版本在数学、编程和创意写作方面展现突破性进展，响应速度提升50%', source: '36Kr', category: '语言模型', url: 'https://36kr.com/', publishedAt: new Date().toISOString() },
  { title: 'Claude 4正式推出：专注模式大幅增强', description: 'Anthropic发布新一代Claude模型，长任务处理能力提升3倍', source: '量子位', category: '语言模型', url: 'https://www.qbitai.com/', publishedAt: new Date(Date.now() - 3600000).toISOString() },
  { title: 'Sora新版本发布：视频生成质量超越真实', description: 'OpenAI视频生成工具实现重大突破，生成视频时长可达60秒', source: '机器之心', category: '视频AI', url: 'https://www.jiqizhixin.com/', publishedAt: new Date(Date.now() - 7200000).toISOString() },
  { title: 'Midjourney v7发布：图像细节再创新高', description: '新一代图像生成模型在写实和艺术风格上都有显著提升', source: '爱范儿', category: '图像AI', url: 'https://www.ifanr.com/', publishedAt: new Date(Date.now() - 10800000).toISOString() },
  { title: 'Kimi智能助手用户突破5000万', description: '月之暗面AI产品增速创国产AI应用纪录，月活用户数持续攀升', source: '36Kr', category: '行业动态', url: 'https://36kr.com/', publishedAt: new Date(Date.now() - 14400000).toISOString() },
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

async function fetchFromRailway(type, limit, offset) {
  try {
    const url = new URL(RAILWAY_API_URL);
    url.searchParams.append('type', type);
    if (limit) url.searchParams.append('limit', limit);
    if (offset) url.searchParams.append('offset', offset);
    
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Railway API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch from Railway:', error);
    return null;
  }
}

export default async function handler(req, res) {
  const { method } = req;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (method === 'GET') {
    const { type, limit = 20, offset = 0 } = req.query;
    
    if (type === 'news') {
      const data = await fetchFromRailway('news', limit, offset);
      if (data && data.success) {
        return res.status(200).json(data);
      }
      // Railway 失败，使用备用数据
      return res.status(200).json({
        success: true,
        data: fallbackNewsData.map((item, idx) => ({ ...item, id: idx + 1 })),
        lastUpdate: new Date().toISOString()
      });
    }
    
    if (type === 'trends') {
      const data = await fetchFromRailway('trends');
      if (data && data.success) {
        return res.status(200).json(data);
      }
      // Railway 失败，使用备用数据
      return res.status(200).json({
        success: true,
        data: fallbackTrendsData.map((item, idx) => ({ ...item, id: idx + 1 })),
        lastUpdate: new Date().toISOString()
      });
    }
    
    if (type === 'software-ranking') {
      return res.status(200).json({
        success: true,
        data: softwareRankingData,
        lastUpdate: new Date().toISOString()
      });
    }
    
    if (type === 'health') {
      const data = await fetchFromRailway('health');
      if (data && data.status === 'ok') {
        return res.status(200).json({
          ...data,
          softwareCount: softwareRankingData.length
        });
      }
      return res.status(200).json({
        status: 'ok',
        newsCount: 0,
        trendsCount: 0,
        softwareCount: softwareRankingData.length,
        lastUpdate: new Date().toISOString()
      });
    }
    
    if (type === 'sync') {
      const data = await fetchFromRailway('sync');
      if (data && data.success) {
        return res.status(200).json(data);
      }
      return res.status(500).json({ success: false, error: 'Failed to sync with Railway' });
    }
    
    const data = await fetchFromRailway();
    if (data && data.success) {
      return res.status(200).json({
        ...data,
        softwareRanking: softwareRankingData
      });
    }
    
    return res.status(500).json({ success: false, error: 'Failed to fetch data from Railway' });
  }
  
  if (method === 'POST') {
    const { action } = req.body || {};
    
    if (action === 'refresh') {
      const data = await fetchFromRailway('sync');
      if (data && data.success) {
        return res.status(200).json({
          success: true,
          message: 'Data refreshed from Railway',
          lastUpdate: data.lastUpdate
        });
      }
      return res.status(500).json({ success: false, error: 'Failed to refresh from Railway' });
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
