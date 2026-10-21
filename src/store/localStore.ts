import { useCallback, useEffect, useState } from 'react';
import { findMappedLogo, navGroups, siteLogoFallback, type NavGroup, type SiteEntry } from '../data/groups';

/**
 * 本地数据层（方案三第一步：本地优先）
 * - 编组数据首次从 src/data/groups.ts 种子初始化，存入 localStorage（单一 key、带 version）
 * - 之后页面一律读本地数据；用户增删改即时落盘，刷新不丢
 * - 布局配置（哪些 A 组件显示）也存这里
 * - 同步层（GitHub 仓库 / 云端）以后只替换这一层的读写后端，组件不感知
 */

export type WidgetId = 'task' | 'news' | 'ranking' | 'trending';

export interface StoreData {
  version: 1;
  groups: NavGroup[];
  /** 当前显示的 A 型组件（按 ALL_WIDGETS 顺序渲染过滤） */
  widgets: WidgetId[];
}

export const ALL_WIDGETS: { id: WidgetId; name: string; desc: string }[] = [
  { id: 'task', name: '今日任务', desc: '任务组件占位卡（设计中）' },
  { id: 'news', name: 'AI 资讯', desc: '今日最热头条 + 热门榜单' },
  { id: 'ranking', name: 'AI 软件榜', desc: 'Product Hunt 每周更新榜单' },
  { id: 'trending', name: '热门话题', desc: '社区热门话题帖子数' },
];

const STORAGE_KEY = 'ainav-store-v1';
const DEFAULT_WIDGETS: WidgetId[] = ['task', 'news', 'ranking', 'trending'];

const genId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/** 给缺少 id 的站点补稳定 ID（种子与导入共用，就地修改传入对象） */
function ensureSiteIds(groups: NavGroup[]): NavGroup[] {
  for (const group of groups) {
    for (const site of group.sites) {
      if (!site.id) site.id = genId('s');
    }
  }
  return groups;
}

function seedData(): StoreData {
  return {
    version: 1,
    groups: ensureSiteIds(structuredClone(navGroups)),
    widgets: [...DEFAULT_WIDGETS],
  };
}

/** 校验任意来源（localStorage / 导入文件）的数据结构，合法则归一化返回，否则 null */
export function validateStoreData(raw: unknown): StoreData | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Partial<StoreData>;
  if (data.version !== 1 || !Array.isArray(data.groups)) return null;
  for (const group of data.groups as NavGroup[]) {
    if (!group || typeof group.id !== 'string' || typeof group.name !== 'string' || !Array.isArray(group.sites)) {
      return null;
    }
    if (group.type !== 'list' && group.type !== 'stack') return null;
    for (const site of group.sites as SiteEntry[]) {
      if (!site || typeof site.name !== 'string' || typeof site.url !== 'string') return null;
      if (typeof site.description !== 'string') site.description = '';
      if (typeof site.logo !== 'string' || !site.logo) site.logo = logoForSite(site.name, site.url);
      if (typeof site.frequency !== 'number') site.frequency = 0;
    }
  }
  const widgets = Array.isArray(data.widgets)
    ? (data.widgets.filter((w) => ALL_WIDGETS.some((aw) => aw.id === w)) as WidgetId[])
    : [...DEFAULT_WIDGETS];
  return { version: 1, groups: ensureSiteIds(data.groups as NavGroup[]), widgets };
}

function loadInitial(): StoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = validateStoreData(JSON.parse(raw));
      if (parsed) return parsed;
    }
  } catch {
    // 存储损坏/不可用时回落种子
  }
  return seedData();
}

/** 用户新增站点的图标：优先内置映射，其次站点 favicon，再由 SiteLogo 兜底 */
export function logoForSite(name: string, url: string): string {
  const mapped = findMappedLogo(name);
  if (mapped) return mapped;
  try {
    const host = new URL(url).hostname;
    if (host) return `https://www.google.com/s2/favicons?domain=${host}&sz=128`;
  } catch {
    // URL 不合法时走兜底图
  }
  return siteLogoFallback(name);
}

export interface SiteDraft {
  name: string;
  url: string;
  description: string;
  aliases: string[];
  pinned: boolean;
}

export function useLocalStore() {
  const [data, setData] = useState<StoreData>(loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // 存储空间不足等情况下静默失败，不阻断使用
    }
  }, [data]);

  const update = useCallback((fn: (d: StoreData) => StoreData) => {
    setData((prev) => fn(structuredClone(prev)));
  }, []);

  const addSite = useCallback(
    (groupId: string, draft: SiteDraft) => {
      update((d) => {
        const group = d.groups.find((g) => g.id === groupId);
        if (group) {
          const minFreq = group.sites.reduce((min, s) => Math.min(min, s.frequency), 0);
          group.sites.push({
            id: genId('s'),
            name: draft.name,
            url: draft.url,
            description: draft.description,
            logo: logoForSite(draft.name, draft.url),
            aliases: draft.aliases,
            pinned: draft.pinned,
            frequency: Math.min(0, minFreq) - 1,
          });
        }
        return d;
      });
    },
    [update],
  );

  const updateSite = useCallback(
    (groupId: string, siteId: string, draft: SiteDraft) => {
      update((d) => {
        const site = d.groups.find((g) => g.id === groupId)?.sites.find((s) => s.id === siteId);
        if (site) {
          site.name = draft.name;
          site.url = draft.url;
          site.description = draft.description;
          site.aliases = draft.aliases;
          site.pinned = draft.pinned;
          site.logo = logoForSite(draft.name, draft.url);
        }
        return d;
      });
    },
    [update],
  );

  const deleteSite = useCallback(
    (groupId: string, siteId: string) => {
      update((d) => {
        const group = d.groups.find((g) => g.id === groupId);
        if (group) group.sites = group.sites.filter((s) => s.id !== siteId);
        return d;
      });
    },
    [update],
  );

  const addGroup = useCallback((name: string): string => {
    const id = genId('g');
    update((d) => {
      d.groups.push({ id, name, type: 'stack', sites: [] });
      return d;
    });
    return id;
  }, [update]);

  const renameGroup = useCallback(
    (groupId: string, name: string) => {
      update((d) => {
        const group = d.groups.find((g) => g.id === groupId);
        if (group) group.name = name;
        return d;
      });
    },
    [update],
  );

  const deleteGroup = useCallback(
    (groupId: string) => {
      update((d) => {
        d.groups = d.groups.filter((g) => g.id !== groupId);
        return d;
      });
    },
    [update],
  );

  const setWidgetVisible = useCallback(
    (widgetId: WidgetId, visible: boolean) => {
      update((d) => {
        const set = new Set(d.widgets);
        if (visible) set.add(widgetId);
        else set.delete(widgetId);
        // 保持 ALL_WIDGETS 的固有顺序，布局稳定
        d.widgets = ALL_WIDGETS.map((w) => w.id).filter((id) => set.has(id));
        return d;
      });
    },
    [update],
  );

  const importData = useCallback((raw: unknown): boolean => {
    const validated = validateStoreData(raw);
    if (!validated) return false;
    setData(validated);
    return true;
  }, []);

  const resetData = useCallback(() => {
    setData(seedData());
  }, []);

  return {
    data,
    addSite,
    updateSite,
    deleteSite,
    addGroup,
    renameGroup,
    deleteGroup,
    setWidgetVisible,
    importData,
    resetData,
  };
}

export type LocalStore = ReturnType<typeof useLocalStore>;
