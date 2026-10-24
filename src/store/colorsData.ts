import { useSyncExternalStore } from 'react';

/**
 * 中式色卡组件的自有数据（第一百零七轮，组件规范 4.1 独立 key 四条硬约定）：
 * - key = `ainav-widget-colors-data`（前缀 ainav-widget-colors-，已在组件注册表登记，
 *   同步/导出/导入按登记一并处理，见 store/widgetStorage.ts）；
 * - 只存色名引用不存色值（色值以 src/data/traditionalColors.ts 为准，数据集修订自动生效）；
 * - 自带 version + migrate：发版改结构时只升 version 并在 migrate 里补迁移，旧数据不丢；
 * - 组件从主页移除不删此数据（与商店「移除不删数据、重加恢复」的全站口径一致）。
 */
export const COLORS_STORAGE_KEY = 'ainav-widget-colors-data';
const COLORS_DATA_VERSION = 1;

export interface SavedPalette {
  name: string;
  /** 色名引用（同 favorites 口径） */
  colors: string[];
}

export interface ColorsData {
  version: number;
  /** 收藏的单色（色名） */
  favorites: string[];
  /** 用户自存的配色 */
  savedPalettes: SavedPalette[];
}

const EMPTY: ColorsData = { version: COLORS_DATA_VERSION, favorites: [], savedPalettes: [] };

/** 结构清洗：非字符串色名、坏配色整项丢弃（迁移与加载共用，永不抛错） */
function sanitize(raw: unknown): ColorsData {
  if (!raw || typeof raw !== 'object') return { ...EMPTY };
  const r = raw as { favorites?: unknown; savedPalettes?: unknown };
  const favorites = Array.isArray(r.favorites)
    ? [...new Set(r.favorites.filter((x): x is string => typeof x === 'string' && x.length > 0))]
    : [];
  const savedPalettes: SavedPalette[] = [];
  if (Array.isArray(r.savedPalettes)) {
    for (const p of r.savedPalettes) {
      if (!p || typeof p !== 'object') continue;
      const pp = p as { name?: unknown; colors?: unknown };
      if (typeof pp.name !== 'string' || !Array.isArray(pp.colors)) continue;
      const colors = [...new Set(pp.colors.filter((x): x is string => typeof x === 'string' && x.length > 0))];
      if (colors.length > 0) savedPalettes.push({ name: pp.name, colors });
    }
  }
  return { version: COLORS_DATA_VERSION, favorites, savedPalettes };
}

/** 迁移入口：version 落后时在此逐级升（当前只有 v1，sanitize 即兜底迁移） */
function migrate(raw: unknown): ColorsData {
  return sanitize(raw);
}

function load(): ColorsData {
  try {
    const text = localStorage.getItem(COLORS_STORAGE_KEY);
    if (!text) return { ...EMPTY };
    return migrate(JSON.parse(text));
  } catch {
    return { ...EMPTY };
  }
}

let state: ColorsData = load();
const listeners = new Set<() => void>();

function emit(next: ColorsData) {
  state = next;
  try {
    localStorage.setItem(COLORS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* 存储不可用（隐私模式等）时只保内存态，不报错 */
  }
  listeners.forEach((fn) => fn());
}

export function getColorsData(): ColorsData {
  return state;
}

export function useColorsData(): ColorsData {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    () => state,
    () => state,
  );
}

/** 同步/导入恢复后由 widgetStorage.restoreWidgetStorage 调用：重读本 key 并通知订阅者 */
export function reloadColorsData() {
  const next = load();
  if (JSON.stringify(next) !== JSON.stringify(state)) {
    state = next;
    listeners.forEach((fn) => fn());
  }
}

export function toggleFavorite(name: string) {
  const has = state.favorites.includes(name);
  emit({
    ...state,
    favorites: has ? state.favorites.filter((n) => n !== name) : [...state.favorites, name],
  });
}

export function savePalette(name: string, colors: string[]) {
  emit({ ...state, savedPalettes: [...state.savedPalettes, { name, colors: [...colors] }] });
}

export function removeSavedPalette(index: number) {
  emit({ ...state, savedPalettes: state.savedPalettes.filter((_, i) => i !== index) });
}
