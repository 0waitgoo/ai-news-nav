import { COLORS_STORAGE_KEY } from './colorsData';

/**
 * 组件独立存储 key 的登记消费端（第一百零七轮，组件规范 4.1）：
 * 组件在注册表（widgetRegistry）声明 storage.own 后，其 key 在此登记一份，
 * 数据的导出 / 导入 / GitHub 同步三条通道都按这份登记一并打包带走（收藏跟人走）。
 * 登记纪律：新增独立 key 组件时，注册表声明与本表必须同步增补。
 */
export const WIDGET_OWN_STORAGE_KEYS: readonly string[] = [COLORS_STORAGE_KEY];

/** 数据信封标记：写出时仅当确有组件独立数据才包信封，无独立数据时与历史格式逐字一致 */
const ENVELOPE_FORMAT = 'zabox-data';
const ENVELOPE_VERSION = 1;

interface DataEnvelope {
  format: typeof ENVELOPE_FORMAT;
  formatVersion: number;
  store: unknown;
  widgetStorage: Record<string, unknown>;
}

function isEnvelope(v: unknown): v is DataEnvelope {
  if (!v || typeof v !== 'object') return false;
  const e = v as { format?: unknown; store?: unknown };
  return e.format === ENVELOPE_FORMAT && !!e.store && typeof e.store === 'object';
}

/** 收集全部已登记独立 key 的当前数据（解析后的 JSON 值；坏值原样带走不丢弃） */
export function collectWidgetStorage(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  try {
    for (const key of WIDGET_OWN_STORAGE_KEYS) {
      const text = localStorage.getItem(key);
      if (text == null) continue;
      try {
        out[key] = JSON.parse(text);
      } catch {
        out[key] = text;
      }
    }
  } catch {
    /* 存储不可用时返回空表：主数据照常导出/同步，不被组件数据拖垮 */
  }
  return out;
}

/** 把一份收集表写回 localStorage（导入/拉取云端后调用；写完由调用方通知对应组件重读） */
export function restoreWidgetStorage(map: Record<string, unknown> | null | undefined) {
  if (!map) return;
  try {
    for (const key of WIDGET_OWN_STORAGE_KEYS) {
      if (!(key in map)) continue;
      const v = map[key];
      localStorage.setItem(key, typeof v === 'string' ? v : JSON.stringify(v));
    }
  } catch {
    /* 同 collect 的兜底口径 */
  }
}

/**
 * 打包写出（导出 JSON / 本地文件 / GitHub 同步共用）：
 * 无组件独立数据 → 原样返回主数据（与历史文件格式完全一致，老版本可直接导入）；
 * 有 → 包信封 { format, formatVersion, store, widgetStorage }。
 */
export function packDataEnvelope(storeData: unknown): unknown {
  const widgetStorage = collectWidgetStorage();
  if (Object.keys(widgetStorage).length === 0) return storeData;
  const env: DataEnvelope = {
    format: ENVELOPE_FORMAT,
    formatVersion: ENVELOPE_VERSION,
    store: storeData,
    widgetStorage,
  };
  return env;
}

/**
 * 解包读入（导入 / 拉取云端共用）：信封 → 拆出主数据与组件数据；
 * 历史纯主数据格式 → widgetStorage 为 null（不动现有组件数据）。
 */
export function unpackDataEnvelope(parsed: unknown): { store: unknown; widgetStorage: Record<string, unknown> | null } {
  if (isEnvelope(parsed)) {
    const ws = (parsed as DataEnvelope).widgetStorage;
    return {
      store: (parsed as DataEnvelope).store,
      widgetStorage: ws && typeof ws === 'object' ? ws : null,
    };
  }
  return { store: parsed, widgetStorage: null };
}

/** 信封形态下 updatedAt 在 store 子对象里（githubSync.updatedAtOf 共用此判定） */
export function envelopeStoreOf(parsed: unknown): unknown {
  return isEnvelope(parsed) ? (parsed as DataEnvelope).store : parsed;
}
