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

/** 热门话题条目（第九十五轮）：heat 为源站真实热度原值，heatText 为其格式化展示 */
export interface TrendItem {
  id: number;
  topic: string;
  heat: number;
  heatText: string;
  /** 来源：'微博热搜' | '百度热搜' */
  source: string;
  url: string;
}

export interface TrendsResult {
  items: TrendItem[];
  /** 本次数据成功抓取的时间（ISO）；stale 时为缓存里的时间 */
  updatedAt: string | null;
  /** true = 当前展示的是最近一次成功缓存（源站暂时不可达） */
  stale: boolean;
}

/** 软件榜条目（旧接口类型保留兼容；第九十五轮起榜单组件直接读 api/ranking-data.js 的真实数据） */
export interface SoftwareRankingItem {
  id: number;
  name: string;
  rank: number;
  category: string;
  description: string;
  rating?: number;
  ratingScale?: number;
  reviewCount?: string;
  usageMetric?: string;
  usageValue?: string;
  dataPeriod?: string;
  downloads?: string;
  url?: string;
  logo?: string;
  weeklyViews?: string;
}

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

export async function fetchTrends(): Promise<TrendsResult> {
  try {
    const response = await fetch('/api?type=trends');
    const data = await response.json();
    if (data.success && Array.isArray(data.data)) {
      return { items: data.data, updatedAt: data.updatedAt ?? null, stale: !!data.stale };
    }
    return { items: [], updatedAt: null, stale: false };
  } catch (error) {
    // 第九十五轮：不再用任何写死的话题兜底——拉不到就返回空，前端显示空态
    console.log('Failed to fetch trends', error);
    return { items: [], updatedAt: null, stale: false };
  }
}

export async function fetchSoftwareRanking(): Promise<SoftwareRankingItem[]> {
  try {
    const response = await fetch('/api?type=software-ranking');
    const data = await response.json();
    if (data.success) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.log('Failed to fetch software ranking', error);
    return [];
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

// 第九十五轮：原 getFallbackTrends / getFallbackSoftwareRanking 两份写死数据
// （#Sora 12.4万、ChatGPT 4.8 分 / 月活 1.8 亿等编造数字）已整段删除。
// 所有榜单/话题数字只许来自源站真实数据，拉不到一律返回空、前端显示空态。
