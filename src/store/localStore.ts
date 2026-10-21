import { useCallback, useEffect, useState } from 'react';
import {
  findMappedLogo,
  navGroups,
  siteLogoFallback,
  type GroupDisplay,
  type NavGroup,
  type SiteEntry,
} from '../data/groups';

/**
 * 本地数据层（方案三第一步：本地优先）
 * - 编组数据首次从 src/data/groups.ts 种子初始化，存入 localStorage（单一 key、带 version）
 * - 之后页面一律读本地数据；用户增删改即时落盘，刷新不丢
 * - 布局配置（哪些 A 组件显示）也存这里
 * - 同步层（GitHub 仓库 / 云端）以后只替换这一层的读写后端，组件不感知
 */

export type WidgetId = 'task' | 'news' | 'ranking' | 'trending';

/** A 型原生组件在网格中的占位：宽度跨栏数（最多 2 栏） + 高度单位（1X / 2X） */
export interface WidgetLayout {
  colSpan: 1 | 2;
  heightUnits: 1 | 2;
}

export const DEFAULT_WIDGET_LAYOUTS: Record<WidgetId, WidgetLayout> = {
  task: { colSpan: 1, heightUnits: 1 },
  news: { colSpan: 2, heightUnits: 2 },
  ranking: { colSpan: 2, heightUnits: 2 },
  trending: { colSpan: 2, heightUnits: 1 },
};

/** B 型编组卡收起态的默认占位：2 栏 × 2x（与组件共用 WidgetLayout 形状，右键菜单可改） */
export const DEFAULT_GROUP_LAYOUT: WidgetLayout = { colSpan: 2, heightUnits: 2 };

/**
 * 背景设置：来源只有两种——内置预设（纯 CSS）或用户本地图片。
 * 本地图片的 Blob 本体存 IndexedDB（见 bgImageDb.ts），绝不上服务器；
 * 这里只记 kind 与选中的预设（kind='local' 时 presetId 是移除本地图后的回落背景）。
 */
export interface BackgroundSetting {
  kind: 'preset' | 'local';
  presetId: string;
  /** 本地图片最近一次更换的时间戳：让 App 在 kind 不变（换图）时也能感知并重读 IndexedDB */
  localStamp?: number;
}

export interface BackgroundPreset {
  id: string;
  name: string;
  /** 完整的 CSS background 值（渐变/纯色），不引用任何图片资源 */
  css: string;
}

/** 内置背景预设：全部纯 CSS 实现 */
export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'violet',
    name: '星云紫',
    css: 'radial-gradient(1200px 800px at 85% -10%, rgba(139, 92, 246, 0.5), transparent 60%), radial-gradient(1000px 760px at 8% 108%, rgba(76, 29, 149, 0.6), transparent 55%), linear-gradient(155deg, #221344 0%, #150a2e 48%, #0a0a12 100%)',
  },
  {
    id: 'space',
    name: '深空灰',
    css: 'linear-gradient(180deg, #17171c 0%, #101014 55%, #0b0b0e 100%)',
  },
  {
    id: 'ocean',
    name: '深海蓝',
    css: 'radial-gradient(1100px 750px at 80% -10%, rgba(37, 99, 235, 0.38), transparent 60%), linear-gradient(160deg, #0d2140 0%, #081426 52%, #05070d 100%)',
  },
  {
    id: 'forest',
    name: '墨绿',
    css: 'radial-gradient(1100px 750px at 15% -10%, rgba(16, 185, 129, 0.28), transparent 55%), linear-gradient(160deg, #0c2b21 0%, #071a13 55%, #040805 100%)',
  },
];

export const DEFAULT_BACKGROUND: BackgroundSetting = { kind: 'preset', presetId: 'violet' };

/** 按 id 取预设：未知 id 回落默认预设（老数据/导入数据兼容） */
export function backgroundPresetOf(presetId: string): BackgroundPreset {
  return BACKGROUND_PRESETS.find((p) => p.id === presetId) ?? BACKGROUND_PRESETS[0];
}

/** 归一化背景设置：老数据无此字段时回落默认预设；presetId 必须是已知预设 */
function normalizeBackground(raw: unknown): BackgroundSetting {
  if (raw && typeof raw === 'object') {
    const b = raw as { kind?: unknown; presetId?: unknown; localStamp?: unknown };
    const presetId =
      typeof b.presetId === 'string' && BACKGROUND_PRESETS.some((p) => p.id === b.presetId) ? b.presetId : 'violet';
    return {
      kind: b.kind === 'local' ? 'local' : 'preset',
      presetId,
      localStamp: typeof b.localStamp === 'number' ? b.localStamp : undefined,
    };
  }
  return { ...DEFAULT_BACKGROUND };
}

/** 读某编组的布局：未存过时回落默认（老数据兼容） */
export function groupLayoutOf(layouts: Record<string, WidgetLayout>, groupId: string): WidgetLayout {
  return layouts[groupId] ?? DEFAULT_GROUP_LAYOUT;
}

/** C 型编组（文件夹式）的默认占位：1 栏 × 1x（与 B 型共用 groupLayouts 存储，仅缺省值不同） */
export const DEFAULT_STACK_LAYOUT: WidgetLayout = { colSpan: 1, heightUnits: 1 };

/** 读某 C 型编组的布局：未存过时回落 1 栏 × 1x */
export function stackLayoutOf(layouts: Record<string, WidgetLayout>, groupId: string): WidgetLayout {
  return layouts[groupId] ?? DEFAULT_STACK_LAYOUT;
}

/* ---------- 计划任务小工具数据（第十八轮） ---------- */

/** 短期待办：数组顺序即展示顺序 */
export interface TaskItem {
  id: string;
  title: string;
  done: boolean;
  createdAt: number;
}

/** 长期计划的一个步骤（里程碑） */
export interface PlanStep {
  id: string;
  title: string;
  done: boolean;
}

/** 长期计划：进度 = 已完成步骤数 / 总步骤数 */
export interface PlanItem {
  id: string;
  title: string;
  steps: PlanStep[];
  createdAt: number;
}

/** 卡面样式（目前只有任务卡有双样式）：按卡片稳定 key 存，缺省列表式 */
export type CardFaceStyle = 'list' | 'focus';

export function cardFaceStyleOf(styles: Record<string, CardFaceStyle>, cardKey: string): CardFaceStyle {
  return styles[cardKey] === 'focus' ? 'focus' : 'list';
}

/** 归一化 tasks：老数据无此字段 / 元素残缺时逐项清洗，非法整体回落空数组（首次即空状态，不塞假数据） */
function normalizeTasks(raw: unknown): TaskItem[] {
  if (!Array.isArray(raw)) return [];
  const out: TaskItem[] = [];
  for (const t of raw as Partial<TaskItem>[]) {
    if (!t || typeof t.title !== 'string' || !t.title) continue;
    out.push({
      id: typeof t.id === 'string' && t.id ? t.id : genId('t'),
      title: t.title,
      done: t.done === true,
      createdAt: typeof t.createdAt === 'number' ? t.createdAt : 0,
    });
  }
  return out;
}

/** 归一化 plans：同 tasks 口径，步骤逐项清洗 */
function normalizePlans(raw: unknown): PlanItem[] {
  if (!Array.isArray(raw)) return [];
  const out: PlanItem[] = [];
  for (const p of raw as Partial<PlanItem>[]) {
    if (!p || typeof p.title !== 'string' || !p.title) continue;
    const steps: PlanStep[] = [];
    if (Array.isArray(p.steps)) {
      for (const s of p.steps as Partial<PlanStep>[]) {
        if (!s || typeof s.title !== 'string' || !s.title) continue;
        steps.push({
          id: typeof s.id === 'string' && s.id ? s.id : genId('ps'),
          title: s.title,
          done: s.done === true,
        });
      }
    }
    out.push({
      id: typeof p.id === 'string' && p.id ? p.id : genId('p'),
      title: p.title,
      steps,
      createdAt: typeof p.createdAt === 'number' ? p.createdAt : 0,
    });
  }
  return out;
}

/** 归一化卡面样式表：只采纳合法值 */
function normalizeCardFaceStyles(raw: unknown): Record<string, CardFaceStyle> {
  const out: Record<string, CardFaceStyle> = {};
  if (raw && typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (v === 'list' || v === 'focus') out[k] = v;
    }
  }
  return out;
}

export interface StoreData {
  version: 1;
  groups: NavGroup[];
  /** 当前显示的 A 型组件（按 ALL_WIDGETS 顺序渲染过滤） */
  widgets: WidgetId[];
  /** 每个 A 型组件的网格占位（右键菜单可改），缺省走 DEFAULT_WIDGET_LAYOUTS */
  widgetLayouts: Record<WidgetId, WidgetLayout>;
  /** 每个 B 型编组的收起态网格占位（右键菜单可改），按 groupId 存，缺省走 DEFAULT_GROUP_LAYOUT */
  groupLayouts: Record<string, WidgetLayout>;
  /**
   * 主页卡片顺序（用户拖拽排序后落盘）：元素为卡片稳定 key，
   * 编组 = group:<groupId>，原生组件 = widget:<widgetId>。
   * 空数组 = 用默认顺序；读取时经 resolveCardOrder 与当前卡片集合对齐。
   */
  cardOrder: string[];
  /** 背景设置（预设或本地图片标记）；老数据无此字段时回落默认预设 */
  background: BackgroundSetting;
  /**
   * 数据最后变更时间戳（毫秒）：每次经 update() 的用户变更都会刷新；
   * importData 不刷新（保留来源的时间戳），供 GitHub 同步按新旧裁决冲突。
   * 老数据无此字段时为 0（任何带真实时间戳的一端都比它新）。
   */
  updatedAt: number;
  /** 计划任务小工具：短期待办（第十八轮）；老数据无此字段时归一化为空数组 */
  tasks: TaskItem[];
  /** 计划任务小工具：长期计划；老数据无此字段时归一化为空数组 */
  plans: PlanItem[];
  /** 卡面样式（按卡片稳定 key 存，如 widget:task）；老数据无此字段时为空表（各卡回落缺省样式） */
  cardFaceStyles: Record<string, CardFaceStyle>;
}

/** 主页卡片的稳定 key：编组用 group id、原生组件用 widget key，加前缀防撞 */
export const groupCardKey = (groupId: string) => `group:${groupId}`;
export const widgetCardKey = (widgetId: WidgetId) => `widget:${widgetId}`;

/**
 * 把已存顺序与当前应有的卡片集合（defaultOrder）对齐：
 * 已存且仍存在的在前（过滤掉已删除/已隐藏的），新出现的卡片按默认顺序追加到末尾。
 */
export function resolveCardOrder(stored: string[], defaultOrder: string[]): string[] {
  const existing = new Set(defaultOrder);
  const seen = new Set<string>();
  const resolved: string[] = [];
  for (const key of stored) {
    if (existing.has(key) && !seen.has(key)) {
      resolved.push(key);
      seen.add(key);
    }
  }
  for (const key of defaultOrder) {
    if (!seen.has(key)) {
      resolved.push(key);
      seen.add(key);
    }
  }
  return resolved;
}

export const ALL_WIDGETS: { id: WidgetId; name: string; desc: string }[] = [
  { id: 'task', name: '今日任务', desc: '待办与长期计划小工具' },
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
    widgetLayouts: structuredClone(DEFAULT_WIDGET_LAYOUTS),
    groupLayouts: {},
    cardOrder: [],
    background: { ...DEFAULT_BACKGROUND },
    updatedAt: Date.now(),
    tasks: [],
    plans: [],
    cardFaceStyles: {},
  };
}

/**
 * 归一化 widgetLayouts：从默认值出发，仅采纳合法的已存值（旧数据无此字段时全走默认）。
 * 宽度上限为 2 栏：第三轮存量数据里的 4 栏在加载时自动夹到 2，老用户数据不破版。
 */
function normalizeWidgetLayouts(raw: unknown): Record<WidgetId, WidgetLayout> {
  const layouts = structuredClone(DEFAULT_WIDGET_LAYOUTS);
  if (raw && typeof raw === 'object') {
    for (const w of ALL_WIDGETS) {
      const l = (raw as Record<string, { colSpan?: unknown; heightUnits?: unknown } | undefined>)[w.id];
      if (!l) continue;
      if (l.colSpan === 1) layouts[w.id].colSpan = 1;
      else if (typeof l.colSpan === 'number' && l.colSpan >= 2) layouts[w.id].colSpan = 2;
      if (l.heightUnits === 1 || l.heightUnits === 2) layouts[w.id].heightUnits = l.heightUnits;
    }
  }
  return layouts;
}

/** 渲染/写入侧的宽度上限保护：任何来源的 colSpan 都不超过 2 栏 */
export function clampColSpan(span: number | undefined): 1 | 2 {
  return span !== undefined && span >= 2 ? 2 : 1;
}

/** 归一化一个布局值：非法字段逐项回落到 fallback（宽度同样夹到 ≤2 栏） */
function normalizeLayout(raw: unknown, fallback: WidgetLayout): WidgetLayout {
  const layout: WidgetLayout = { ...fallback };
  if (raw && typeof raw === 'object') {
    const l = raw as { colSpan?: unknown; heightUnits?: unknown };
    if (l.colSpan === 1) layout.colSpan = 1;
    else if (typeof l.colSpan === 'number' && l.colSpan >= 2) layout.colSpan = 2;
    if (l.heightUnits === 1 || l.heightUnits === 2) layout.heightUnits = l.heightUnits;
  }
  return layout;
}

/** 归一化 groupLayouts：老数据无此字段时为空表（各组回落 DEFAULT_GROUP_LAYOUT）；逐组采纳合法值 */
function normalizeGroupLayouts(raw: unknown): Record<string, WidgetLayout> {
  const out: Record<string, WidgetLayout> = {};
  if (raw && typeof raw === 'object') {
    for (const [gid, l] of Object.entries(raw as Record<string, unknown>)) {
      if (l && typeof l === 'object') out[gid] = normalizeLayout(l, DEFAULT_GROUP_LAYOUT);
    }
  }
  return out;
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
    // 形态字段向后兼容：新字段 display 优先；旧数据只有 type 时迁移过来；
    // 两者都缺时按种子呈现补默认（AI 对话 = list，其余 = stack）
    const legacy = group as NavGroup & { type?: unknown };
    if (legacy.display !== 'list' && legacy.display !== 'stack') {
      legacy.display =
        legacy.type === 'list' || legacy.type === 'stack'
          ? legacy.type
          : legacy.id === 'ai-chat'
            ? 'list'
            : 'stack';
    }
    delete legacy.type;
    // 自定义副标题向后兼容：老数据无此字段时默认为空字符串（卡面回落显示站点数）
    if (typeof group.subtitle !== 'string') group.subtitle = '';
    // 小角颜色向后兼容：只接受 #rrggbb，其余（老数据无此字段）一律回落空 = 默认灰
    if (typeof group.tabColor !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(group.tabColor)) group.tabColor = '';
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
  const widgetLayouts = normalizeWidgetLayouts((data as { widgetLayouts?: unknown }).widgetLayouts);
  const groupLayouts = normalizeGroupLayouts((data as { groupLayouts?: unknown }).groupLayouts);
  // 卡片顺序：老数据无此字段时为空（回落默认顺序）；只采纳字符串元素
  const rawOrder = (data as { cardOrder?: unknown }).cardOrder;
  const cardOrder = Array.isArray(rawOrder) ? (rawOrder.filter((k) => typeof k === 'string') as string[]) : [];
  const background = normalizeBackground((data as { background?: unknown }).background);
  return {
    version: 1,
    groups: ensureSiteIds(data.groups as NavGroup[]),
    widgets,
    widgetLayouts,
    groupLayouts,
    cardOrder,
    background,
    updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : 0,
    tasks: normalizeTasks((data as { tasks?: unknown }).tasks),
    plans: normalizePlans((data as { plans?: unknown }).plans),
    cardFaceStyles: normalizeCardFaceStyles((data as { cardFaceStyles?: unknown }).cardFaceStyles),
  };
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
    setData((prev) => {
      const next = fn(structuredClone(prev));
      // 每次用户变更都刷新时间戳：GitHub 同步靠它判断本地/云端谁更新
      next.updatedAt = Date.now();
      return next;
    });
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

  const addGroup = useCallback((name: string, display: GroupDisplay): string => {
    const id = genId('g');
    update((d) => {
      d.groups.push({ id, name, display, subtitle: '', tabColor: '', sites: [] });
      return d;
    });
    return id;
  }, [update]);

  const setGroupDisplay = useCallback(
    (groupId: string, display: GroupDisplay) => {
      update((d) => {
        const group = d.groups.find((g) => g.id === groupId);
        if (group) group.display = display;
        return d;
      });
    },
    [update],
  );

  const setWidgetLayout = useCallback(
    (widgetId: WidgetId, patch: Partial<WidgetLayout>) => {
      update((d) => {
        const cur = d.widgetLayouts[widgetId] ?? DEFAULT_WIDGET_LAYOUTS[widgetId];
        const next = { ...cur, ...patch };
        next.colSpan = clampColSpan(next.colSpan);
        d.widgetLayouts[widgetId] = next;
        return d;
      });
    },
    [update],
  );

  /** 编组右键改尺寸：按 groupId 存占位（宽度夹到 ≤2 栏）；
   *  合并基底按 display 取缺省——stack 组是 1 栏 × 1x，只改高度时不能把宽度带成 B 卡默认的 2 栏 */
  const setGroupLayout = useCallback(
    (groupId: string, patch: Partial<WidgetLayout>) => {
      update((d) => {
        const group = d.groups.find((g) => g.id === groupId);
        const fallback = group?.display === 'stack' ? DEFAULT_STACK_LAYOUT : DEFAULT_GROUP_LAYOUT;
        const cur = d.groupLayouts[groupId] ?? fallback;
        const next = { ...cur, ...patch };
        next.colSpan = clampColSpan(next.colSpan);
        d.groupLayouts[groupId] = next;
        return d;
      });
    },
    [update],
  );

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

  /** 设置编组自定义副标题（C 卡卡面第二行）；空字符串 = 回落显示「N 个站点」 */
  const setGroupSubtitle = useCallback(
    (groupId: string, subtitle: string) => {
      update((d) => {
        const group = d.groups.find((g) => g.id === groupId);
        if (group) group.subtitle = subtitle;
        return d;
      });
    },
    [update],
  );

  /** 设置编组文件夹小角颜色（空字符串 = 默认同色灰）；非法值不落盘 */
  const setGroupTabColor = useCallback(
    (groupId: string, color: string) => {
      const safe = color === '' || /^#[0-9a-fA-F]{6}$/.test(color) ? color : '';
      update((d) => {
        const group = d.groups.find((g) => g.id === groupId);
        if (group) group.tabColor = safe;
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

  /** 切换背景：选预设或标记使用本地图片（图片本体在 IndexedDB，由调用方先存好） */
  const setBackground = useCallback(
    (next: BackgroundSetting) => {
      update((d) => {
        d.background = normalizeBackground(next);
        return d;
      });
    },
    [update],
  );

  /** 拖拽排序后保存主页卡片顺序（传入的是已与当前卡片集合对齐的完整顺序） */
  const setCardOrder = useCallback(
    (order: string[]) => {
      update((d) => {
        d.cardOrder = [...order];
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

  /* ---------- 计划任务小工具（第十八轮） ---------- */

  const addTask = useCallback(
    (title: string) => {
      const t = title.trim();
      if (!t) return;
      update((d) => {
        d.tasks.push({ id: genId('t'), title: t, done: false, createdAt: Date.now() });
        return d;
      });
    },
    [update],
  );

  const toggleTask = useCallback(
    (taskId: string) => {
      update((d) => {
        const task = d.tasks.find((t) => t.id === taskId);
        if (task) task.done = !task.done;
        return d;
      });
    },
    [update],
  );

  const renameTask = useCallback(
    (taskId: string, title: string) => {
      const t = title.trim();
      if (!t) return;
      update((d) => {
        const task = d.tasks.find((x) => x.id === taskId);
        if (task) task.title = t;
        return d;
      });
    },
    [update],
  );

  const deleteTask = useCallback(
    (taskId: string) => {
      update((d) => {
        d.tasks = d.tasks.filter((t) => t.id !== taskId);
        return d;
      });
    },
    [update],
  );

  const addPlan = useCallback(
    (title: string, stepTitles: string[]) => {
      const t = title.trim();
      if (!t) return;
      update((d) => {
        d.plans.push({
          id: genId('p'),
          title: t,
          steps: stepTitles.map((s) => s.trim()).filter(Boolean).map((s) => ({ id: genId('ps'), title: s, done: false })),
          createdAt: Date.now(),
        });
        return d;
      });
    },
    [update],
  );

  const togglePlanStep = useCallback(
    (planId: string, stepId: string) => {
      update((d) => {
        const step = d.plans.find((p) => p.id === planId)?.steps.find((s) => s.id === stepId);
        if (step) step.done = !step.done;
        return d;
      });
    },
    [update],
  );

  const deletePlan = useCallback(
    (planId: string) => {
      update((d) => {
        d.plans = d.plans.filter((p) => p.id !== planId);
        return d;
      });
    },
    [update],
  );

  /** AI 整理确认落库：勾选的待办标题与计划（标题+步骤）一次性写入，走同一次 update（同步只推一次） */
  const addSplitResult = useCallback(
    (todos: string[], planDrafts: { title: string; steps: string[] }[]) => {
      update((d) => {
        for (const title of todos) {
          const t = title.trim();
          if (t) d.tasks.push({ id: genId('t'), title: t, done: false, createdAt: Date.now() });
        }
        for (const draft of planDrafts) {
          const t = draft.title.trim();
          if (!t) continue;
          d.plans.push({
            id: genId('p'),
            title: t,
            steps: draft.steps.map((s) => s.trim()).filter(Boolean).map((s) => ({ id: genId('ps'), title: s, done: false })),
            createdAt: Date.now(),
          });
        }
        return d;
      });
    },
    [update],
  );

  /** 卡面样式切换（按卡片稳定 key 存，如 widget:task） */
  const setCardFaceStyle = useCallback(
    (cardKey: string, style: CardFaceStyle) => {
      update((d) => {
        d.cardFaceStyles[cardKey] = style;
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
    setGroupSubtitle,
    setGroupTabColor,
    setGroupDisplay,
    deleteGroup,
    setWidgetVisible,
    setWidgetLayout,
    setGroupLayout,
    setCardOrder,
    setBackground,
    addTask,
    toggleTask,
    renameTask,
    deleteTask,
    addPlan,
    togglePlanStep,
    deletePlan,
    addSplitResult,
    setCardFaceStyle,
    importData,
    resetData,
  };
}

export type LocalStore = ReturnType<typeof useLocalStore>;
