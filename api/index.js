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

let cachedNews = [];
let cachedTrends = [];
let cachedSoftwareRanking = [];
let lastUpdate = null;

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function initializeData() {
  if (cachedNews.length === 0) {
    cachedNews = aiNewsData.map((item, idx) => ({
      ...item,
      id: idx + 1,
      publishedAt: new Date(Date.now() - idx * 3600000).toISOString()
    }));
    cachedTrends = aiTrendsData.map((item, idx) => ({
      ...item,
      id: idx + 1
    }));
    cachedSoftwareRanking = softwareRankingData;
    lastUpdate = new Date().toISOString();
  }
}

initializeData();

export default function handler(req, res) {
  const { method } = req;

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
        data: cachedSoftwareRanking,
        lastUpdate
      });
    }
    
    if (type === 'health') {
      return res.status(200).json({
        status: 'ok',
        newsCount: cachedNews.length,
        trendsCount: cachedTrends.length,
        softwareCount: cachedSoftwareRanking.length,
        lastUpdate
      });
    }
    
    if (type === 'sync') {
      cachedNews = aiNewsData.map((item, idx) => ({
        ...item,
        id: idx + 1,
        publishedAt: new Date(Date.now() - idx * 3600000).toISOString()
      }));
      lastUpdate = new Date().toISOString();
      
      return res.status(200).json({
        success: true,
        message: 'Data refreshed',
        newsCount: cachedNews.length,
        lastUpdate
      });
    }
    
    return res.status(200).json({
      success: true,
      news: shuffleArray(cachedNews).slice(0, 10),
      trends: cachedTrends,
      softwareRanking: cachedSoftwareRanking,
      lastUpdate
    });
  }
  
  if (method === 'POST') {
    const { action } = req.body || {};
    
    if (action === 'refresh') {
      cachedNews = aiNewsData.map((item, idx) => ({
        ...item,
        id: idx + 1,
        publishedAt: new Date(Date.now() - idx * 3600000).toISOString()
      }));
      lastUpdate = new Date().toISOString();
      
      return res.status(200).json({
        success: true,
        message: 'Data refreshed',
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
