import { useEffect, useState } from 'react';

/**
 * 本机显示偏好（第四十二轮）：外观模式（暗夜/白天）+ 编组卡底框透明度。
 * 与背景设置同属「这台设备上的显示设置」家族，但按产品口径**不进 store.data**：
 * 不参与 JSON 导出/导入、不随 GitHub 同步走，换设备各设各的。故独立存一个 localStorage key。
 * 生效方式：App 把 theme 写到 <html data-theme>、把 alpha 写成 CSS 变量 --group-card-alpha。
 * 白天模式的最终定义（第五十八轮收敛为一句话）：与暗夜完全相同，只有 B 卡与 C 卡
 * （含组合卡）卡面变白底深字。为此 App 背景层不随主题变（旧版白色遮罩 veil 已撤除）、
 * 小组件/顶栏/弹窗保持暗夜观感、搜索框与数据按钮白天也钉回暗夜深色毛玻璃
 * （index.css 的 [data-theme="light"] .card-glass-surface 规则）；
 * index.css 里其余 light 覆盖仍全部限定在编组卡作用域（.group-card-panel / .group-card-scope）内。
 * 液态玻璃（外观第三档 'glass'）：作用域与白天同口径——只换编组卡卡面
 * （及同源的搜索框/数据按钮 .card-glass-surface）的材质；第五十八轮起改为 React Bits
 * GlassSurface 的真实折射移植（见 components/v2/GlassSurface.tsx），CSS 渐变版降为
 * 不支持 SVG backdrop 滤镜的浏览器上的回退层。文字仍走白色系；
 * 底框透明度滑杆在三档下语义一致（玻璃档控制玻璃 tint 浓淡），且同时驱动 A 型小组件
 * 的渐变 tint 强度（见 WidgetTint）。
 */
export type DisplayTheme = 'dark' | 'light' | 'glass';

export interface DisplayPrefs {
  theme: DisplayTheme;
  /** 编组卡（B/C/组合卡）底框不透明度 0–1；默认 0.4 = 改版前的 rgba(30,30,35,0.4) */
  groupCardAlpha: number;
}

const STORAGE_KEY = 'ainav-display-prefs-v1';

export const DEFAULT_DISPLAY_PREFS: DisplayPrefs = { theme: 'dark', groupCardAlpha: 0.4 };

function normalizePrefs(raw: unknown): DisplayPrefs {
  if (raw && typeof raw === 'object') {
    const p = raw as { theme?: unknown; groupCardAlpha?: unknown };
    return {
      theme: p.theme === 'light' ? 'light' : p.theme === 'glass' ? 'glass' : 'dark',
      groupCardAlpha:
        typeof p.groupCardAlpha === 'number' && Number.isFinite(p.groupCardAlpha)
          ? Math.min(1, Math.max(0, p.groupCardAlpha))
          : DEFAULT_DISPLAY_PREFS.groupCardAlpha,
    };
  }
  return { ...DEFAULT_DISPLAY_PREFS };
}

export function loadDisplayPrefs(): DisplayPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizePrefs(JSON.parse(raw)) : { ...DEFAULT_DISPLAY_PREFS };
  } catch {
    return { ...DEFAULT_DISPLAY_PREFS };
  }
}

/** 把偏好应用到文档根：data-theme 供编组卡作用域内的 CSS 覆盖翻色，--group-card-alpha 供编组卡底色取 alpha */
export function applyDisplayPrefs(prefs: DisplayPrefs): void {
  const root = document.documentElement;
  root.dataset.theme = prefs.theme;
  root.style.setProperty('--group-card-alpha', String(prefs.groupCardAlpha));
}

/* ---------- 极简订阅：多个组件（App 应用副作用 / 背景面板控件）共享同一份状态 ---------- */

let current: DisplayPrefs = loadDisplayPrefs();
const listeners = new Set<(p: DisplayPrefs) => void>();

export function setDisplayPrefs(patch: Partial<DisplayPrefs>): void {
  current = normalizePrefs({ ...current, ...patch });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    /* 本地存储不可用时仅本次会话生效 */
  }
  applyDisplayPrefs(current);
  listeners.forEach((fn) => fn(current));
}

export function useDisplayPrefs(): DisplayPrefs {
  const [prefs, setPrefs] = useState<DisplayPrefs>(current);
  useEffect(() => {
    const fn = (p: DisplayPrefs) => setPrefs(p);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return prefs;
}
