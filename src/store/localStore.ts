import { useCallback, useEffect, useState } from 'react';
import {
  cleanSiteTag,
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

/* ---------- 计划任务小工具数据（第十八轮；第十九轮重构） ---------- */

/** 待办子任务：组内的一项 */
export interface TaskChild {
  id: string;
  title: string;
  done: boolean;
}

/**
 * 短期待办：数组顺序即展示顺序。
 * 第十九轮起顶层条目可带 children —— 只要 children 是数组（哪怕空）就是「组」：
 * 组本身不单独勾选，完成态由子任务全勾推导（见 taskGroupDone）；普通待办 children 缺省。
 */
export interface TaskItem {
  id: string;
  title: string;
  /** 普通待办的完成态；组忽略此字段（由子任务推导） */
  done: boolean;
  createdAt: number;
  children?: TaskChild[];
}

/** 是否为组（children 为数组即是组，空组也算） */
export const isTaskGroup = (t: TaskItem): boolean => Array.isArray(t.children);

/** 组的子任务进度（非组返回 0/0） */
export function taskChildProgress(t: TaskItem): { done: number; total: number } {
  const kids = t.children ?? [];
  return { done: kids.filter((c) => c.done).length, total: kids.length };
}

/** 组完成态：至少一个子任务且全部勾完（空组不算完成） */
export const taskGroupDone = (t: TaskItem): boolean => {
  if (!isTaskGroup(t)) return false;
  const { done, total } = taskChildProgress(t);
  return total > 0 && done === total;
};

/** 顶层条目是否算「已完成」：普通待办看 done，组看子任务全勾 */
export const taskEntryDone = (t: TaskItem): boolean => (isTaskGroup(t) ? taskGroupDone(t) : t.done);

/**
 * 卡面/面板统一的待办计数口径（第十九轮）：把组按子任务摊平计数——
 * 普通待办计 1，组计 children.length；分子同样摊平（组内已勾数）。
 */
export function taskFlatStats(tasks: TaskItem[]): { total: number; done: number } {
  let total = 0;
  let done = 0;
  for (const t of tasks) {
    if (isTaskGroup(t)) {
      const p = taskChildProgress(t);
      total += p.total;
      done += p.done;
    } else {
      total += 1;
      if (t.done) done += 1;
    }
  }
  return { total, done };
}

/** 长期计划类型：次数型（执行了多少次） / 日期型（设一个完成时间） */
export type PlanMode = 'count' | 'date';

/**
 * 长期计划（第十九轮重构；第十八轮的 steps「计划组」形态已废弃，存量在归一化时迁移为次数型）：
 * - count：进度 = currentCount / targetCount，unit 为自由文本单位（次/节/笔…，默认「次」）
 * - date：deadline 为目标完成日（YYYY-MM-DD），startDate 为创建日，时间进度 = 已流逝比例；done 为手动完成标记
 */
export interface PlanItem {
  id: string;
  title: string;
  mode: PlanMode;
  targetCount?: number;
  unit?: string;
  currentCount?: number;
  deadline?: string;
  startDate?: string;
  done?: boolean;
  createdAt: number;
}

/** 本地日期转 YYYY-MM-DD（按本地时区，不走 UTC 避免差一天） */
export function toDateStr(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export const todayDateStr = (): string => toDateStr(new Date());

const DATE_STR_RE = /^\d{4}-\d{2}-\d{2}$/;
export const isDateStr = (s: unknown): s is string => typeof s === 'string' && DATE_STR_RE.test(s);

/** 两个 YYYY-MM-DD 之间相差的整天数（b - a，可为负） */
export function dateStrDiffDays(a: string, b: string): number {
  const pa = a.split('-').map(Number);
  const pb = b.split('-').map(Number);
  const ta = Date.UTC(pa[0], pa[1] - 1, pa[2]);
  const tb = Date.UTC(pb[0], pb[1] - 1, pb[2]);
  return Math.round((tb - ta) / 86400000);
}

/** 「M月d日」展示用 */
export function formatMonthDay(dateStr: string): string {
  const [, m, d] = dateStr.split('-').map(Number);
  return `${m}月${d}日`;
}

/** 次数型进度 0~1（无目标时 0） */
export function planCountRatio(p: PlanItem): number {
  const target = p.targetCount ?? 0;
  if (target <= 0) return 0;
  return Math.min(1, (p.currentCount ?? 0) / target);
}

/** 日期型时间进度 0~1：startDate→deadline 已流逝比例（同日/过期夹到边界） */
export function planDateRatio(p: PlanItem): number {
  if (!isDateStr(p.deadline)) return 0;
  const start = isDateStr(p.startDate) ? p.startDate : p.deadline;
  const total = dateStrDiffDays(start, p.deadline);
  if (total <= 0) return 1;
  const elapsed = dateStrDiffDays(start, todayDateStr());
  return Math.min(1, Math.max(0, elapsed / total));
}

/** 卡面样式（目前只有任务卡有双样式）：按卡片稳定 key 存，缺省列表式 */
export type CardFaceStyle = 'list' | 'focus';

export function cardFaceStyleOf(styles: Record<string, CardFaceStyle>, cardKey: string): CardFaceStyle {
  return styles[cardKey] === 'focus' ? 'focus' : 'list';
}

/** 归一化 tasks：老数据无此字段 / 元素残缺时逐项清洗，非法整体回落空数组（首次即空状态，不塞假数据）。
 *  children 是数组的元素按「组」保留（子任务逐项清洗），非数组一律不当组。 */
function normalizeTasks(raw: unknown): TaskItem[] {
  if (!Array.isArray(raw)) return [];
  const out: TaskItem[] = [];
  for (const t of raw as Partial<TaskItem>[]) {
    if (!t || typeof t.title !== 'string' || !t.title) continue;
    const item: TaskItem = {
      id: typeof t.id === 'string' && t.id ? t.id : genId('t'),
      title: t.title,
      done: t.done === true,
      createdAt: typeof t.createdAt === 'number' ? t.createdAt : 0,
    };
    if (Array.isArray(t.children)) {
      const kids: TaskChild[] = [];
      for (const c of t.children as Partial<TaskChild>[]) {
        if (!c || typeof c.title !== 'string' || !c.title) continue;
        kids.push({
          id: typeof c.id === 'string' && c.id ? c.id : genId('tc'),
          title: c.title,
          done: c.done === true,
        });
      }
      item.children = kids;
    }
    out.push(item);
  }
  return out;
}

/**
 * 归一化 plans（第十九轮）：
 * - 新形态按 mode 清洗字段：count 需正整数目标（非法回落 1）与非负已执行数；date 需合法 deadline，
 *   无合法 deadline 的 date 型回落次数型；startDate 非法时用创建日/今天兜底。
 * - 存量迁移：第十八轮的 steps 形态（无 mode 且带 steps 数组）→ 次数型：
 *   targetCount = steps 总数（0 步回落 1 防除零）、currentCount = 已勾数、unit 取「次」，迁移后不再保留 steps。
 */
function normalizePlans(raw: unknown): PlanItem[] {
  if (!Array.isArray(raw)) return [];
  const out: PlanItem[] = [];
  for (const p of raw as (Partial<PlanItem> & { steps?: unknown })[]) {
    if (!p || typeof p.title !== 'string' || !p.title) continue;
    const base: PlanItem = {
      id: typeof p.id === 'string' && p.id ? p.id : genId('p'),
      title: p.title,
      mode: 'count',
      createdAt: typeof p.createdAt === 'number' ? p.createdAt : 0,
    };
    const cleanCount = (v: unknown, fallback: number) =>
      typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : fallback;
    const cleanCurrent = (v: unknown) =>
      typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
    const cleanUnit = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 4) : '次');

    if (p.mode === 'date' && isDateStr(p.deadline)) {
      base.mode = 'date';
      base.deadline = p.deadline;
      base.startDate = isDateStr(p.startDate)
        ? p.startDate
        : base.createdAt > 0
          ? toDateStr(new Date(base.createdAt))
          : todayDateStr();
      base.done = p.done === true;
    } else if (p.mode === 'count' || p.mode === 'date') {
      // 新形态次数型（date 型但 deadline 坏了也落这里，保证计划可用）
      base.targetCount = cleanCount(p.targetCount, 1);
      base.currentCount = cleanCurrent(p.currentCount);
      base.unit = cleanUnit(p.unit);
    } else if (Array.isArray(p.steps)) {
      // —— 存量迁移：steps 式旧计划 → 次数型 ——
      const steps = p.steps as { done?: unknown }[];
      base.targetCount = Math.max(1, steps.length);
      base.currentCount = steps.filter((s) => s && s.done === true).length;
      base.unit = '次';
    } else {
      base.targetCount = cleanCount(p.targetCount, 1);
      base.currentCount = cleanCurrent(p.currentCount);
      base.unit = cleanUnit(p.unit);
    }
    out.push(base);
  }
  return out;
}

/**
 * C 卡组合（第二十一轮）：两个文件夹式（stack）编组拖拽合并成一张卡，一组最多 2 个组。
 * 组合只记成员与当前 tab，两个组本体数据（名字/站点/tabColor/类型）完全不动；
 * 卡片顺序里组合占一个条目（key = combo:<id>），尺寸存 groupLayouts 的同一 key。
 */
export interface ComboItem {
  id: string;
  /** 恰好 2 个成员组 id：[0] 为左 tab、[1] 为右 tab */
  groupIds: [string, string];
  /** 当前选中的 tab（必须是成员之一） */
  activeGroupId: string;
}

/** 归一化组合：成员必须真实存在且仍为 stack 型、两两不重复、一个组至多属于一个组合；
 *  任一条件不满足（成员被删/改型等）即解散该组合，剩余组按普通卡渲染（渲染侧另有兜底） */
function normalizeCombos(raw: unknown, groups: NavGroup[]): ComboItem[] {
  if (!Array.isArray(raw)) return [];
  const byId = new Map(groups.map((g) => [g.id, g]));
  const used = new Set<string>();
  const out: ComboItem[] = [];
  for (const c of raw as Partial<ComboItem>[]) {
    if (!c || typeof c.id !== 'string' || !c.id || !Array.isArray(c.groupIds)) continue;
    const [a, b] = c.groupIds as unknown[];
    if (typeof a !== 'string' || typeof b !== 'string' || a === b) continue;
    const ga = byId.get(a);
    const gb = byId.get(b);
    if (!ga || !gb || ga.display !== 'stack' || gb.display !== 'stack') continue;
    if (used.has(a) || used.has(b)) continue;
    used.add(a);
    used.add(b);
    out.push({
      id: c.id,
      groupIds: [a, b],
      activeGroupId: c.activeGroupId === b ? b : a,
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
  /**
   * 主页卡片栏锚点（第三十四轮，按栏排放）：key = 卡片稳定 key，value = 起始栏（0–3，桌面 4 栏制）。
   * 栏内顺序由 cardOrder 在栏内过滤得到，不另存序号。放置规则见 components/v2/laneLayout.ts。
   * 空表 = 尚未迁移，HomePage 首次渲染时按旧瀑布流位置生成锚点并静默落盘；
   * 个别 key 缺失（新加的卡）由放置引擎回落到当前最矮的栏，HomePage 随即补写。
   */
  cardCols: Record<string, number>;
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
  /** C 卡组合（第二十一轮）：老数据无此字段时归一化为空数组 */
  combos: ComboItem[];
}

/** 主页卡片的稳定 key：编组用 group id、原生组件用 widget key，加前缀防撞 */
export const groupCardKey = (groupId: string) => `group:${groupId}`;
export const widgetCardKey = (widgetId: WidgetId) => `widget:${widgetId}`;
/** 组合卡的稳定 key（顺序与尺寸布局都按这个 key 存） */
export const comboCardKey = (comboId: string) => `combo:${comboId}`;

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

/**
 * 站点标签迁移（第二十六轮，种子与校验共用，就地修改）：
 * 已存 tag 先清洗（仅英文字母/大写/≤4）；无合法 tag 但带旧 needVpn 标记的迁移为 tag='VPN'，
 * 此后徽标只认 tag；两者皆无则删字段（无标签不显示徽标）。
 */
function migrateSiteTags(groups: NavGroup[]): NavGroup[] {
  for (const group of groups) {
    for (const site of group.sites) {
      const cleaned = cleanSiteTag(site.tag);
      if (cleaned) site.tag = cleaned;
      else if (site.needVpn) site.tag = 'VPN';
      else delete site.tag;
    }
  }
  return groups;
}

function seedData(): StoreData {
  return {
    version: 1,
    groups: migrateSiteTags(ensureSiteIds(structuredClone(navGroups))),
    widgets: [...DEFAULT_WIDGETS],
    widgetLayouts: structuredClone(DEFAULT_WIDGET_LAYOUTS),
    groupLayouts: {},
    cardOrder: [],
    cardCols: {},
    background: { ...DEFAULT_BACKGROUND },
    updatedAt: Date.now(),
    tasks: [],
    plans: [],
    cardFaceStyles: {},
    combos: [],
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

/** 归一化卡片栏锚点（第三十四轮）：只采纳有限数值，夹到 0–3 并取整；老数据无此字段时为空表（待迁移） */
function normalizeCardCols(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (raw && typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof v === 'number' && Number.isFinite(v)) out[k] = Math.max(0, Math.min(3, Math.floor(v)));
    }
  }
  return out;
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
  const cardCols = normalizeCardCols((data as { cardCols?: unknown }).cardCols);
  const groups = migrateSiteTags(ensureSiteIds(data.groups as NavGroup[]));
  return {
    version: 1,
    groups,
    widgets,
    widgetLayouts,
    groupLayouts,
    cardOrder,
    cardCols,
    background,
    updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : 0,
    tasks: normalizeTasks((data as { tasks?: unknown }).tasks),
    plans: normalizePlans((data as { plans?: unknown }).plans),
    cardFaceStyles: normalizeCardFaceStyles((data as { cardFaceStyles?: unknown }).cardFaceStyles),
    combos: normalizeCombos((data as { combos?: unknown }).combos, groups),
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
  /** 别名：表单已无编辑入口（第二十六轮），编辑时由表单原样回传既有别名，不清除 */
  aliases: string[];
  pinned: boolean;
  /** 站点标签（第二十六轮）：空字符串 = 无标签，落盘前经 cleanSiteTag 清洗 */
  tag: string;
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
          const tag = cleanSiteTag(draft.tag);
          group.sites.push({
            id: genId('s'),
            name: draft.name,
            url: draft.url,
            description: draft.description,
            logo: logoForSite(draft.name, draft.url),
            aliases: draft.aliases,
            pinned: draft.pinned,
            frequency: Math.min(0, minFreq) - 1,
            ...(tag ? { tag } : {}),
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
          // 标签：清洗后落盘，清空输入即移除标签（徽标随之消失）
          const tag = cleanSiteTag(draft.tag);
          if (tag) site.tag = tag;
          else delete site.tag;
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
        // 删掉组合的成员组时组合随之解散（第二十一轮联动）：另一组以普通卡留在组合原来的位置
        for (const combo of d.combos.filter((c) => c.groupIds.includes(groupId))) {
          const otherId = combo.groupIds.find((id) => id !== groupId);
          d.combos = d.combos.filter((c) => c.id !== combo.id);
          delete d.groupLayouts[comboCardKey(combo.id)];
          // 栏锚点（第三十四轮）：另一组继承组合所在的栏，删组合锚点
          const comboCol = d.cardCols[comboCardKey(combo.id)];
          if (comboCol !== undefined && otherId) d.cardCols[groupCardKey(otherId)] = comboCol;
          delete d.cardCols[comboCardKey(combo.id)];
          const idx = d.cardOrder.indexOf(comboCardKey(combo.id));
          if (idx >= 0 && otherId) d.cardOrder.splice(idx, 1, groupCardKey(otherId));
        }
        d.groups = d.groups.filter((g) => g.id !== groupId);
        return d;
      });
    },
    [update],
  );

  /* ---------- C 卡组合（第二十一轮） ---------- */

  /**
   * 合并两个文件夹式编组：拖拽 dragged 压住 target 满 2.5 秒松手时调用。
   * 组合落在 target 的位置；groupIds = [dragged, target]——被拖来的组放左 tab 且默认选中（与用户示意图一致）；
   * 组合尺寸继承 target 当前尺寸（存 groupLayouts 的 combo key；成员各自的布局条目不动，拆分时自然恢复）。
   */
  const mergeCombo = useCallback(
    (draggedId: string, targetId: string, currentOrder: string[]) => {
      if (draggedId === targetId) return;
      update((d) => {
        const dg = d.groups.find((g) => g.id === draggedId);
        const tg = d.groups.find((g) => g.id === targetId);
        if (!dg || !tg || dg.display !== 'stack' || tg.display !== 'stack') return d;
        if (d.combos.some((c) => c.groupIds.includes(draggedId) || c.groupIds.includes(targetId))) return d;
        const id = genId('c');
        d.combos.push({ id, groupIds: [draggedId, targetId], activeGroupId: draggedId });
        d.groupLayouts[comboCardKey(id)] = { ...stackLayoutOf(d.groupLayouts, targetId) };
        // 栏锚点（第三十四轮）：组合落在 target 所在的栏；成员锚点先保留，拆分时以组合锚点为准重写
        const targetCol = d.cardCols[groupCardKey(targetId)] ?? d.cardCols[groupCardKey(draggedId)];
        if (targetCol !== undefined) d.cardCols[comboCardKey(id)] = targetCol;
        const order = currentOrder.filter((k) => k !== groupCardKey(draggedId));
        const ti = order.indexOf(groupCardKey(targetId));
        if (ti >= 0) order[ti] = comboCardKey(id);
        else order.push(comboCardKey(id));
        d.cardOrder = order;
        return d;
      });
    },
    [update],
  );

  /** 拆分组合：组合条目原位替换回两个组条目（原左右顺序），删组合记录与其尺寸条目 */
  const splitCombo = useCallback(
    (comboId: string, currentOrder: string[]) => {
      update((d) => {
        const combo = d.combos.find((c) => c.id === comboId);
        if (!combo) return d;
        d.combos = d.combos.filter((c) => c.id !== comboId);
        delete d.groupLayouts[comboCardKey(comboId)];
        // 栏锚点（第三十四轮）：两个组都回到组合所在的栏（顺序由 cardOrder 决定上下），删组合锚点
        const comboCol = d.cardCols[comboCardKey(comboId)];
        if (comboCol !== undefined) {
          for (const gid of combo.groupIds) d.cardCols[groupCardKey(gid)] = comboCol;
        }
        delete d.cardCols[comboCardKey(comboId)];
        const order = [...currentOrder];
        const idx = order.indexOf(comboCardKey(comboId));
        const keys = combo.groupIds.map((gid) => groupCardKey(gid));
        if (idx >= 0) order.splice(idx, 1, ...keys);
        else order.push(...keys);
        d.cardOrder = order;
        return d;
      });
    },
    [update],
  );

  /** 组合内某组切成详细列表时脱离组合：另一组变回普通 C 卡留在组合位，该组（已是 B 卡）排在其后，删组合记录 */
  const detachComboMemberAsList = useCallback(
    (comboId: string, groupId: string, currentOrder: string[]) => {
      update((d) => {
        const combo = d.combos.find((c) => c.id === comboId);
        if (!combo || !combo.groupIds.includes(groupId)) return d;
        const otherId = combo.groupIds.find((id) => id !== groupId);
        d.combos = d.combos.filter((c) => c.id !== comboId);
        delete d.groupLayouts[comboCardKey(comboId)];
        // 栏锚点（第三十四轮）：留下的一组与脱离的一组都先落在组合原来的栏（顺序紧邻），删组合锚点
        const comboCol = d.cardCols[comboCardKey(comboId)];
        if (comboCol !== undefined) {
          if (otherId) d.cardCols[groupCardKey(otherId)] = comboCol;
          d.cardCols[groupCardKey(groupId)] = comboCol;
        }
        delete d.cardCols[comboCardKey(comboId)];
        const order = [...currentOrder];
        const idx = order.indexOf(comboCardKey(comboId));
        const keys = otherId ? [groupCardKey(otherId), groupCardKey(groupId)] : [groupCardKey(groupId)];
        if (idx >= 0) order.splice(idx, 1, ...keys);
        else order.push(...keys);
        d.cardOrder = order;
        return d;
      });
    },
    [update],
  );

  /**
   * tab 拖出落定（第二十一轮修订新增的解组方式）：把某组从组合中拖出成独立卡，
   * 组合随之解散、另一组留作普通 C 卡；落点顺序以拖拽预览的最终顺序为准
   * （预览里组合条目已拆成两个组条目，这里只做兜底校正）。
   * 栏锚点（第三十四轮）：colsPatch 为拖拽预览给出的两组最终栏位（被拖组 = 落点栏，
   * 另一组 = 组合原来的栏）；缺省时两组都回落到组合原来的栏。
   */
  const extractComboGroup = useCallback(
    (comboId: string, groupId: string, finalOrder: string[], colsPatch: Record<string, number> = {}) => {
      update((d) => {
        const combo = d.combos.find((c) => c.id === comboId);
        if (!combo || !combo.groupIds.includes(groupId)) return d;
        d.combos = d.combos.filter((c) => c.id !== comboId);
        delete d.groupLayouts[comboCardKey(comboId)];
        const comboCol = d.cardCols[comboCardKey(comboId)];
        if (comboCol !== undefined) {
          for (const gid of combo.groupIds) d.cardCols[groupCardKey(gid)] = comboCol;
        }
        delete d.cardCols[comboCardKey(comboId)];
        for (const [k, v] of Object.entries(colsPatch)) {
          if (Number.isFinite(v)) d.cardCols[k] = Math.max(0, Math.min(3, Math.floor(v)));
        }
        const order = finalOrder.filter((k) => k !== comboCardKey(comboId));
        for (const gid of combo.groupIds) {
          const k = groupCardKey(gid);
          if (!order.includes(k)) order.push(k);
        }
        d.cardOrder = order;
        return d;
      });
    },
    [update],
  );

  /** 切换组合当前 tab（持久化，刷新/跨设备同步后保持） */
  const setComboActive = useCallback(
    (comboId: string, groupId: string) => {
      update((d) => {
        const combo = d.combos.find((c) => c.id === comboId);
        if (combo && combo.groupIds.includes(groupId)) combo.activeGroupId = groupId;
        return d;
      });
    },
    [update],
  );

  /** 组合卡右键改尺寸：按 combo key 存 groupLayouts，缺省同 C 卡（1 栏 × 1x），宽度夹到 ≤2 栏 */
  const setComboLayout = useCallback(
    (comboId: string, patch: Partial<WidgetLayout>) => {
      update((d) => {
        const key = comboCardKey(comboId);
        const cur = d.groupLayouts[key] ?? DEFAULT_STACK_LAYOUT;
        const next = { ...cur, ...patch };
        next.colSpan = clampColSpan(next.colSpan);
        d.groupLayouts[key] = next;
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

  /**
   * 拖拽落盘（第三十四轮）：一次写入最终顺序 + 被拖卡的栏锚点补丁（colsPatch 只含本次变化的 key）。
   * 走 update()：这是用户编辑，刷新 updatedAt 供同步裁决。
   */
  const setCardPlacement = useCallback(
    (order: string[], colsPatch: Record<string, number>) => {
      update((d) => {
        d.cardOrder = [...order];
        for (const [k, v] of Object.entries(colsPatch)) {
          if (Number.isFinite(v)) d.cardCols[k] = Math.max(0, Math.min(3, Math.floor(v)));
        }
        return d;
      });
    },
    [update],
  );

  /**
   * 静默补写栏锚点（第三十四轮）：放置引擎回落/夹取出的锚点与已存值不一致时由 HomePage 调用。
   * 直写 setData 且不刷新 updatedAt——回落不是用户编辑，不应触发同步冲突裁决；
   * 补丁与现状完全一致时返回原对象（不触发重渲染）。
   */
  const ensureCardCols = useCallback((patch: Record<string, number>) => {
    setData((prev) => {
      let changed = false;
      const next = { ...prev.cardCols };
      for (const [k, v] of Object.entries(patch)) {
        if (!Number.isFinite(v)) continue;
        const c = Math.max(0, Math.min(3, Math.floor(v)));
        if (next[k] !== c) {
          next[k] = c;
          changed = true;
        }
      }
      if (!changed) return prev;
      return { ...prev, cardCols: next };
    });
  }, []);

  /**
   * 存量迁移落盘（第三十四轮）：cardCols 为空时，HomePage 按旧瀑布流位置生成
   * （顺序, 锚点）并经此一次性写入；已有锚点时不覆盖。静默写入，不刷新 updatedAt。
   */
  const applyCardMigration = useCallback((order: string[], cols: Record<string, number>) => {
    setData((prev) => {
      if (Object.keys(prev.cardCols).length > 0) return prev;
      const clean: Record<string, number> = {};
      for (const [k, v] of Object.entries(cols)) {
        if (Number.isFinite(v)) clean[k] = Math.max(0, Math.min(3, Math.floor(v)));
      }
      if (Object.keys(clean).length === 0) return prev;
      return { ...prev, cardOrder: [...order], cardCols: clean };
    });
  }, []);

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

  /* ---------- 计划任务小工具（第十八轮；第十九轮：待办分组 + 计划两型） ---------- */

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

  /** 新建空组（children 为空数组即成组，之后往里加子任务） */
  const addTaskGroup = useCallback(
    (title: string) => {
      const t = title.trim();
      if (!t) return;
      update((d) => {
        d.tasks.push({ id: genId('t'), title: t, done: false, createdAt: Date.now(), children: [] });
        return d;
      });
    },
    [update],
  );

  const addSubTask = useCallback(
    (taskId: string, title: string) => {
      const t = title.trim();
      if (!t) return;
      update((d) => {
        const task = d.tasks.find((x) => x.id === taskId);
        if (task && Array.isArray(task.children)) {
          task.children.push({ id: genId('tc'), title: t, done: false });
        }
        return d;
      });
    },
    [update],
  );

  const toggleSubTask = useCallback(
    (taskId: string, childId: string) => {
      update((d) => {
        const child = d.tasks.find((x) => x.id === taskId)?.children?.find((c) => c.id === childId);
        if (child) child.done = !child.done;
        return d;
      });
    },
    [update],
  );

  const deleteSubTask = useCallback(
    (taskId: string, childId: string) => {
      update((d) => {
        const task = d.tasks.find((x) => x.id === taskId);
        if (task && Array.isArray(task.children)) {
          task.children = task.children.filter((c) => c.id !== childId);
        }
        return d;
      });
    },
    [update],
  );

  /** 勾选普通待办；组没有独立勾选态，调用到组上时忽略（完成态由子任务推导） */
  const toggleTask = useCallback(
    (taskId: string) => {
      update((d) => {
        const task = d.tasks.find((t) => t.id === taskId);
        if (task && !Array.isArray(task.children)) task.done = !task.done;
        return d;
      });
    },
    [update],
  );

  /** 改标题：普通待办与组共用（组改名也走这里） */
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

  /** 删除顶层条目：删组时连子任务一起删 */
  const deleteTask = useCallback(
    (taskId: string) => {
      update((d) => {
        d.tasks = d.tasks.filter((t) => t.id !== taskId);
        return d;
      });
    },
    [update],
  );

  /** 新建长期计划（第十九轮两型）：count 带目标数+单位；date 带目标日，startDate 记今天 */
  const addPlan = useCallback(
    (title: string, opts: { mode: PlanMode; targetCount?: number; unit?: string; deadline?: string }) => {
      const t = title.trim();
      if (!t) return;
      update((d) => {
        if (opts.mode === 'date') {
          if (!isDateStr(opts.deadline)) return d;
          d.plans.push({
            id: genId('p'),
            title: t,
            mode: 'date',
            deadline: opts.deadline,
            startDate: todayDateStr(),
            done: false,
            createdAt: Date.now(),
          });
        } else {
          const target =
            typeof opts.targetCount === 'number' && opts.targetCount > 0 ? Math.floor(opts.targetCount) : 10;
          d.plans.push({
            id: genId('p'),
            title: t,
            mode: 'count',
            targetCount: target,
            unit: (opts.unit ?? '').trim().slice(0, 4) || '次',
            currentCount: 0,
            createdAt: Date.now(),
          });
        }
        return d;
      });
    },
    [update],
  );

  /** 编辑计划：按其当前类型改标题与目标（次数型的目标/单位、日期型的目标日） */
  const updatePlan = useCallback(
    (planId: string, patch: { title?: string; targetCount?: number; unit?: string; deadline?: string }) => {
      update((d) => {
        const plan = d.plans.find((p) => p.id === planId);
        if (!plan) return d;
        if (typeof patch.title === 'string' && patch.title.trim()) plan.title = patch.title.trim();
        if (plan.mode === 'count') {
          if (typeof patch.targetCount === 'number' && patch.targetCount > 0) {
            plan.targetCount = Math.floor(patch.targetCount);
          }
          if (typeof patch.unit === 'string') plan.unit = patch.unit.trim().slice(0, 4) || '次';
        } else if (isDateStr(patch.deadline)) {
          plan.deadline = patch.deadline;
        }
        return d;
      });
    },
    [update],
  );

  /** 次数型 +1 / −1：夹在 0 与目标之间（到顶即满，−1 供纠错） */
  const bumpPlanCount = useCallback(
    (planId: string, delta: number) => {
      update((d) => {
        const plan = d.plans.find((p) => p.id === planId);
        if (plan && plan.mode === 'count') {
          const target = plan.targetCount ?? 0;
          const next = (plan.currentCount ?? 0) + delta;
          plan.currentCount = Math.max(0, target > 0 ? Math.min(target, next) : next);
        }
        return d;
      });
    },
    [update],
  );

  /** 日期型手动完成 / 取消完成 */
  const setPlanDone = useCallback(
    (planId: string, done: boolean) => {
      update((d) => {
        const plan = d.plans.find((p) => p.id === planId);
        if (plan && plan.mode === 'date') plan.done = done;
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

  /** AI 整理确认落库：勾选的待办标题与次数型计划草稿一次性写入，走同一次 update（同步只推一次） */
  const addSplitResult = useCallback(
    (todos: string[], planDrafts: { title: string; targetCount: number; unit: string }[]) => {
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
            mode: 'count',
            targetCount: draft.targetCount > 0 ? Math.floor(draft.targetCount) : 10,
            unit: (draft.unit ?? '').trim().slice(0, 4) || '次',
            currentCount: 0,
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
    mergeCombo,
    splitCombo,
    extractComboGroup,
    detachComboMemberAsList,
    setComboActive,
    setComboLayout,
    setWidgetVisible,
    setWidgetLayout,
    setGroupLayout,
    setCardOrder,
    setCardPlacement,
    ensureCardCols,
    applyCardMigration,
    setBackground,
    addTask,
    addTaskGroup,
    addSubTask,
    toggleSubTask,
    deleteSubTask,
    toggleTask,
    renameTask,
    deleteTask,
    addPlan,
    updatePlan,
    bumpPlanCount,
    setPlanDone,
    deletePlan,
    addSplitResult,
    setCardFaceStyle,
    importData,
    resetData,
  };
}

export type LocalStore = ReturnType<typeof useLocalStore>;
