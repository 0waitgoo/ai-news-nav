const API_BASE = '/api';

export interface HealthInfo {
  status: string;
  newsCount: number;
  trendsCount: number;
  lastSync: string;
  lastManualSync: string | null;
  nextScheduledSync: string;
  autoUpdateInterval: number;
}

export interface NewsItem {
  id: number;
  title: string;
  description?: string;
  source: string;
  url: string;
  image?: string;
  category: string;
  publishedAt: string;
}

export interface TrendItem {
  id: number;
  topic: string;
  volume: string;
  color: string;
}

export interface SoftwareRankingItem {
  id: number;
  name: string;
  rank: number;
  category: string;
  description: string;
  downloads: string;
  rating: string;
  url?: string;
  logo?: string;
}

const softwareIconMap: Record<string, string> = {
  'KIMI': '/icon_APP/KIMI.svg',
  'doubao': '/icon_APP/doubao.svg',
  'tongyi': '/icon_APP/tongyi.svg',
  'baidu': '/icon_APP/baidu.svg',
  'chatgpt': '/icon_APP/chatgpticon.svg',
  'claude': '/icon_APP/claude.svg',
  'gemini': '/icon_APP/gemini.svg',
  'liblib': '/icon_APP/liblib.svg',
  'Midjourney': '/icon_APP/Midjourney.svg',
  'keling': '/icon_APP/keling.svg',
  'jianying': '/icon_APP/jianying.svg',
  'suno': '/icon_APP/suno.svg',
  'cursor': '/icon_APP/cursor.svg',
  'windsurf': '/icon_APP/windsurf.svg',
  'github': '/icon_APP/github.svg',
  'vscode': '/icon_APP/vscode.svg',
  'trae': '/icon_APP/trae1.png',
  '有道龙虾': '/icon_APP/有道龙虾.svg',
  '元气AI': '/icon_APP/元气AI.png',
  'copaw': '/icon_APP/copaw.png',
  'openclaw': '/icon_APP/openclaw.svg',
};

const getSoftwareLogo = (name: string): string => {
  const lowerName = name.toLowerCase();
  for (const [key, path] of Object.entries(softwareIconMap)) {
    if (lowerName.includes(key.toLowerCase())) {
      return path;
    }
  }
  return `/icon_APP/${name}.svg`;
};

export async function fetchNews(limit = 20, offset = 0): Promise<NewsItem[]> {
  try {
    const response = await fetch(`/api?type=news&limit=${limit}&offset=${offset}`);
    const data = await response.json();
    if (data.success) {
      return data.data;
    }
    return getFallbackNews();
  } catch (error) {
    console.log('Using fallback news data');
    return getFallbackNews().slice(offset, offset + limit);
  }
}

export async function fetchTrends(): Promise<TrendItem[]> {
  try {
    const response = await fetch('/api?type=trends');
    const data = await response.json();
    if (data.success) {
      return data.data;
    }
    return getFallbackTrends();
  } catch (error) {
    console.log('Using fallback trends data');
    return getFallbackTrends();
  }
}

export async function fetchSoftwareRanking(): Promise<SoftwareRankingItem[]> {
  try {
    const response = await fetch('/api?type=software-ranking');
    const data = await response.json();
    if (data.success) {
      return data.data;
    }
    return getFallbackSoftwareRanking();
  } catch (error) {
    console.log('Using fallback software ranking data');
    return getFallbackSoftwareRanking();
  }
}

export async function syncNews(): Promise<{ success: boolean; newsCount?: number; trendsCount?: number }> {
  try {
    const response = await fetch('/api?type=sync', {
      method: 'GET'
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to sync news:', error);
    return { success: false };
  }
}

export async function fetchHealth(): Promise<HealthInfo | null> {
  try {
    const response = await fetch('/api?type=health');
    const data = await response.json();
    if (data.status === 'ok') {
      return data;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch health:', error);
    return null;
  }
}

function getFallbackNews(): NewsItem[] {
  return [
    { id: 1, title: 'OpenAI发布GPT-4.5：推理能力大幅提升', description: '最新版本在数学、编程和创意写作方面展现突破性进展', source: '36Kr', category: '语言模型', url: 'https://36kr.com/', publishedAt: new Date().toISOString() },
    { id: 2, title: 'Claude 4正式推出：专注模式大幅增强', description: 'Anthropic发布新一代Claude模型', source: '量子位', category: '语言模型', url: 'https://www.qbitai.com/', publishedAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 3, title: 'Sora新版本发布：视频生成质量超越真实', description: 'OpenAI视频生成工具实现重大突破', source: '机器之心', category: '视频AI', url: 'https://www.jiqizhixin.com/', publishedAt: new Date(Date.now() - 7200000).toISOString() },
  ];
}

function getFallbackTrends(): TrendItem[] {
  return [
    { id: 1, topic: '#Sora', volume: '12.4万', color: 'text-blue-400' },
    { id: 2, topic: '#Kimi', volume: '9.8万', color: 'text-purple-400' },
    { id: 3, topic: '#可灵', volume: '4.5万', color: 'text-emerald-400' },
    { id: 4, topic: '#Suno', volume: '3.2万', color: 'text-orange-400' },
  ];
}

function getFallbackSoftwareRanking(): SoftwareRankingItem[] {
  return [
    { id: 1, name: 'ChatGPT', rank: 1, category: 'AI助手', description: 'OpenAI推出的AI对话助手', downloads: '1.2亿+', rating: '4.8', url: 'https://chat.openai.com', logo: getSoftwareLogo('ChatGPT') },
    { id: 2, name: 'Claude', rank: 2, category: 'AI助手', description: 'Anthropic推出的AI助手', downloads: '8500万+', rating: '4.9', url: 'https://claude.ai', logo: getSoftwareLogo('Claude') },
    { id: 3, name: 'Kimi', rank: 3, category: 'AI助手', description: '月之暗面推出的国产AI助手', downloads: '5000万+', rating: '4.7', url: 'https://kimi.moonshot.cn', logo: getSoftwareLogo('Kimi') },
    { id: 4, name: 'Midjourney', rank: 4, category: '图像生成', description: 'AI图像生成工具', downloads: '3200万+', rating: '4.6', url: 'https://www.midjourney.com', logo: getSoftwareLogo('Midjourney') },
    { id: 5, name: 'Suno', rank: 5, category: '音频生成', description: 'AI音乐生成工具', downloads: '2800万+', rating: '4.5', url: 'https://suno.com', logo: getSoftwareLogo('Suno') },
    { id: 6, name: 'Sora', rank: 6, category: '视频生成', description: 'OpenAI视频生成工具', downloads: '2100万+', rating: '4.7', url: 'https://openai.com/sora', logo: getSoftwareLogo('Sora') },
    { id: 7, name: '通义千问', rank: 7, category: 'AI助手', description: '阿里云AI助手', downloads: '1800万+', rating: '4.4', url: 'https://tongyi.aliyun.com', logo: getSoftwareLogo('通义千问') },
    { id: 8, name: '文心一言', rank: 8, category: 'AI助手', description: '百度AI助手', downloads: '1500万+', rating: '4.3', url: 'https://yiyan.baidu.com', logo: getSoftwareLogo('文心一言') },
  ];
}
