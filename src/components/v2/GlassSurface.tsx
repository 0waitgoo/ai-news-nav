import React, { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type RefObject } from 'react';
import { useDisplayPrefs } from '../../store/displayPrefs';

/**
 * 液态玻璃 · 真实折射实现（第五十八轮，替换第五十五轮的纯 CSS 渐变版——用户验收原话：
 * 「现在的液态玻璃不像，只是一个渐变色。液态玻璃按照这个数值，不要参考圆角。」）
 *
 * 源码来源：React Bits《GlassSurface》TS-TW 版
 * （shadcn 注册表 https://reactbits.dev/r/GlassSurface-TS-TW.json ，
 *  同源代码 github.com/DavidHDev/react-bits 的 src/ts-tailwind/Components/GlassSurface/GlassSurface.tsx）。
 * 按原版 SVG 路线移植其核心机制，不做近似仿制：
 *  1) generateDisplacementMap：按元素尺寸生成位移贴图——黑底上叠圆角矩形的红（横向）/蓝（纵向）
 *     两条线性渐变（蓝层以 mix-blend-mode:difference 混合），再压一层向内缩进 edgeSize、
 *     以 blur 高斯模糊的 brightness/opacity 灰矩形，把中心压成平坦区——得到「边缘强位移、
 *     中心近乎不动」的折射场（原版矩形路径；任意形状路径的 traceShape/bendShape 本站用不到，未移植）；
 *  2) 滤镜链与原版 JSX 逐节点一致：feImage 载入贴图 → 三条 feDisplacementMap 分别处理 R/G/B
 *     （scale = distortionScale + 通道 offset，xChannelSelector=R、yChannelSelector=G，
 *     通道间的 scale 差产生边缘色差）→ feColorMatrix 各取单通道 → feBlend(screen) 两次合成
 *     → feGaussianBlur(stdDeviation = displace) 收尾；
 *  3) 以 backdrop-filter: url(#滤镜) saturate(1) 作用在宿主元素上，背景 =
 *     hsl(0 0% 0% / backgroundOpacity)（原版 refractive 档在深色 color-scheme 下的取值）。
 *
 * 与原版的差异（性能扩展，第五十八轮任务书允许并要求如实说明）：
 *  - 原版每个 GlassSurface 实例独占一份 <filter> 与位移贴图；本站主页同时有十几张卡，
 *    若逐卡一份，贴图数量 = 卡数且每次改尺寸全员重生。这里改为**按尺寸分桶共享**：
 *    宽/高量化到 4px 网格 + 圆角组成桶 key，同桶的卡共用一份滤镜与贴图
 *    （feImage 以 preserveAspectRatio="none" 拉伸到宿主，桶内 ≤4px 的尺寸差只带来可忽略的贴图缩放）。
 *  - 原版 ResizeObserver 直接逐次重生贴图；这里对尺寸变化做 120ms 防抖后再换桶。
 *  - 不支持 SVG backdrop 滤镜的浏览器（原版 supportsSVGFilters 对 Safari/Firefox 直接判否，
 *    以及 url() backdrop 不可用的环境）不设变量，index.css 里 [data-theme="glass"] 的
 *    CSS 渐变版作为回退层继续生效（本站的「frosted」回退）。
 *
 * 用户指定参数（官方自定义面板 Player 预设截图，固定不随滑杆变）：
 *  distortionScale -180 / displace 0.5 / blur 11 / brightness 50 / opacity 0.93 /
 *  borderWidth 0.07 / redOffset 0 / greenOffset 10 / blueOffset 20 / saturation 1 /
 *  backgroundOpacity 0.1（此值是滑杆 40% 处的基准，随滑杆线性缩放，见 glassTintOpacity）。
 *  borderRadius 不用截图的 30px：由各宿主传入自身圆角（B 卡 28 / C 卡 22 / 搜索面 16）。
 * 第六十轮（用户新口径）：三通道偏移统一改为 -50（redOffset / greenOffset / blueOffset
 *  均为 -50），三通道位移 scale 因此同为 -230——各通道位移量一致，边缘不再有彩虹色差
 *  条纹，只剩纯折射；其余参数一律不动。
 */
export const GLASS_PARAMS = {
  distortionScale: -180,
  displace: 0.5,
  blur: 11,
  brightness: 50,
  opacity: 0.93,
  borderWidth: 0.07,
  redOffset: -50,
  greenOffset: -50,
  blueOffset: -50,
  saturation: 1,
  backgroundOpacity: 0.1,
  mixBlendMode: 'difference',
} as const;

/** 滑杆（底框透明度 groupCardAlpha）→ 玻璃 tint 不透明度：以给定 backgroundOpacity 0.1 为
 *  alpha=0.4（滑杆默认）处的基准点线性缩放，alpha=0 时为 0、alpha=1 时为 0.25 */
export function glassTintOpacity(groupCardAlpha: number): number {
  return Math.min(0.3, Math.max(0, GLASS_PARAMS.backgroundOpacity * (groupCardAlpha / 0.4)));
}

/* ---------- 支持性检测（与原版 supportsSVGFilters 同逻辑，结果缓存） ---------- */
let supportedCache: boolean | null = null;
export function glassSvgSupported(): boolean {
  if (supportedCache !== null) return supportedCache;
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    supportedCache = false;
    return supportedCache;
  }
  const isWebkit = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  const isFirefox = /Firefox/.test(navigator.userAgent);
  if (isWebkit || isFirefox) {
    supportedCache = false;
    return supportedCache;
  }
  const div = document.createElement('div');
  div.style.backdropFilter = 'url(#zabox-glass-probe)';
  supportedCache = div.style.backdropFilter !== '';
  return supportedCache;
}

/* ---------- 位移贴图生成（原版 generateDisplacementMap，参数化 w/h/圆角） ---------- */
function generateDisplacementMap(width: number, height: number, borderRadius: number, idSuffix: string): string {
  const p = GLASS_PARAMS;
  const edgeSize = Math.min(width, height) * (p.borderWidth * 0.5);
  const redGradId = `red-${idSuffix}`;
  const blueGradId = `blue-${idSuffix}`;
  const softId = `soft-${idSuffix}`;
  const svgContent = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="red"/>
          </linearGradient>
          <linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="blue"/>
          </linearGradient>
          <filter id="${softId}" filterUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}" color-interpolation-filters="sRGB">
            <feGaussianBlur stdDeviation="${p.blur}" />
          </filter>
        </defs>
        <rect x="0" y="0" width="${width}" height="${height}" fill="black"></rect>
        <rect x="0" y="0" width="${width}" height="${height}" rx="${borderRadius}" fill="url(#${redGradId})" />
        <rect x="0" y="0" width="${width}" height="${height}" rx="${borderRadius}" fill="url(#${blueGradId})" style="mix-blend-mode: ${p.mixBlendMode}" />
        <rect x="${edgeSize}" y="${edgeSize}" width="${width - edgeSize * 2}" height="${height - edgeSize * 2}" rx="${borderRadius}" fill="hsl(0 0% ${p.brightness}% / ${p.opacity})" filter="url(#${softId})" />
      </svg>
    `;
  return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
}

/* ---------- 尺寸分桶注册表：同桶共享一份 <filter> + 贴图 ---------- */
export interface GlassBucket {
  id: string;
  w: number;
  h: number;
  radius: number;
  mapUrl: string;
}

const QUANT = 4; // 尺寸量化步长（px）：桶内尺寸差由 feImage 拉伸吸收
const bucketMap = new Map<string, GlassBucket>();
let bucketSnapshot: GlassBucket[] = [];
const registryListeners = new Set<() => void>();

function registerGlassBucket(w: number, h: number, radius: number): GlassBucket {
  const qw = Math.max(8, Math.round(w / QUANT) * QUANT);
  const qh = Math.max(8, Math.round(h / QUANT) * QUANT);
  const key = `${qw}x${qh}r${radius}`;
  const hit = bucketMap.get(key);
  if (hit) return hit;
  const bucket: GlassBucket = {
    id: `zabox-glass-${key}`,
    w: qw,
    h: qh,
    radius,
    mapUrl: generateDisplacementMap(qw, qh, radius, key),
  };
  bucketMap.set(key, bucket);
  bucketSnapshot = [...bucketMap.values()];
  registryListeners.forEach((fn) => fn());
  rasterizeBucketMap(bucket);
  return bucket;
}

/* ---------- 第八十九轮：位移贴图改喂 PNG 光栅图（去除 C 卡中部横线） ----------
 * 用户真机反馈（2026-10-24）：液态玻璃下编组卡/组合卡卡面中下部有一条横贯的亮线，
 * 把身后壁纸的颜色勾出来；两张卡上线的相对位置一致（距卡身顶约同一偏移）。
 * 排查（无头 SwiftShader，四组探针）：精确复刻滤镜链的隔离页（9 种变体）、真实应用
 * 12 面逐行采样、注入全空玻璃面（平滑/硬条纹/高频三种幕布）、瓷砖间隙列采样、
 * DPR 1/1.25/1.5——均无此缝；位移场数学上中部平滑、贴图中心采样符合灰值预期，
 * tint/高光/叠层逐个证伪。只剩生产链与隔离探针的唯一差异未被覆盖：生产贴图是
 * **SVG 文本**（feImage 直载 data:image/svg+xml，图内还嵌一层 feGaussianBlur），
 * 隔离探针用的是 PNG 位图。真实 GPU（ANGLE/D3D）下 Chrome 对 SVG 图源的滤镜求值
 * 走逐元素光栅化，该路径的图面分块/裁切会在卡面形成采样接缝——与第八十/八十三轮
 * 「无头复现不出、真机才有」的 GPU 专属伪影同类。
 * 修法：贴图定义仍由 generateDisplacementMap 的同一份 SVG 给出，但在浏览器里一次性
 * 光栅化为 PNG（2× 超采样，喂回 feImage 时等比缩放，折射场像素级等价、参数不动），
 * feImage 只接触普通位图纹理，绕开 SVG 图源的逐元素光栅化。光栅化完成前先用原 SVG
 * 地址顶着（与旧版行为一致、首帧不缺折射），完成后按桶替换 mapUrl 并通知
 * GlassDefsHost 重渲染全部宿主；光栅化失败则保持 SVG（旧行为），不抛错。 */
const rasterizedBuckets = new Set<string>();
function rasterizeBucketMap(bucket: GlassBucket): void {
  if (typeof document === 'undefined' || rasterizedBuckets.has(bucket.id)) return;
  rasterizedBuckets.add(bucket.id);
  /* 第九十七轮（性能回归修复）：光栅分辨率 2×/2048 改 1×/1024。版本二分实测
   * （无头 SwiftShader、1024×700、玻璃档滚动帧中位）：89 轮前 1517ms → 89 轮后
   * 1900~1950ms（+25~29%），台阶恰在本光栅化；暗夜档四版无差异。机制：feImage
   * 每帧求值要采样/解码这张大位图（2× 超采样下大卡贴图达 2048px、上 MB 级
   * data URL），成为全玻璃面共同的固定开销。位移场是平滑解析场（渐变+高斯），
   * 分辨率不携带场信息：1×（=宿主 CSS 尺寸、上限 1024）采样与 2× 的场差在
   * test-r97 等价断言内（逐像素 meanAbsDiff 与 89 轮 SVG↔PNG 同一口径）；
   * 折射参数（scale/blur/displace/区域）一字未动，贴图定义仍是同一份 SVG。 */
  const SS = 1; // 光栅倍数（第九十七轮由 2 改 1，理由见上）
  const img = new Image();
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(1024, bucket.w * SS);
      canvas.height = Math.min(1024, bucket.h * SS);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const png = canvas.toDataURL('image/png');
      if (png.startsWith('data:image/png') && bucket.mapUrl !== png) {
        bucket.mapUrl = png;
        bucketSnapshot = [...bucketMap.values()];
        registryListeners.forEach((fn) => fn());
      }
    } catch {
      /* 光栅化失败：保持 SVG 贴图（旧行为） */
    }
  };
  img.src = bucket.mapUrl;
}

/** 自测/诊断用：已注册的桶是否全部换成 PNG 贴图 */
export function glassBucketsAllPng(): boolean {
  return bucketSnapshot.length > 0 && bucketSnapshot.every((b) => b.mapUrl.startsWith('data:image/png'));
}

function subscribeRegistry(fn: () => void): () => void {
  registryListeners.add(fn);
  return () => {
    registryListeners.delete(fn);
  };
}
function getRegistrySnapshot(): GlassBucket[] {
  return bucketSnapshot;
}

/** 当前已生成的共享滤镜数（自测/诊断用） */
export function glassBucketCount(): number {
  return bucketMap.size;
}

/* ---------- 滤镜定义宿主：全页只挂一份，渲染注册表里的全部 <filter> ----------
 * 与原版一致用「absolute + 0 尺寸 + 不 display:none」的 svg 承载 defs，
 * 保证 Chrome 对 url(#id) 的 backdrop 引用可解析。 */
export function GlassDefsHost() {
  const buckets = useSyncExternalStore(subscribeRegistry, getRegistrySnapshot, getRegistrySnapshot);
  if (buckets.length === 0) return null;
  const p = GLASS_PARAMS;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {buckets.map((b) => (
          /* 第八十轮：滤镜区域四边各外扩 25% 留边——位移最大幅度 ±115px（scale 230），
             宿主边缘处的输出像素要采样元素框外的幕布；区域恰好 100% 时框外采样命中的是
             透明黑（feColorMatrix 的 alpha 行取位移后源 alpha → 边缘通道变透明、折射在
             边缘断崖）。外扩后边缘采样落到真实幕布上。feImage 的贴图矩形仍是 0/0/100%：
             贴图外区域取透明黑 = 位移量恒定偏移，那部分结果只落在元素框外、被宿主
             裁剪裁掉，不进画面。折射参数（scale/blur/通道）一律不动。 */
          <filter key={b.id} id={b.id} colorInterpolationFilters="sRGB" x="-25%" y="-25%" width="150%" height="150%">
            <feImage x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" href={b.mapUrl} />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={p.distortionScale + p.redOffset}
              xChannelSelector="R"
              yChannelSelector="G"
              result="dispRed"
            />
            <feColorMatrix
              in="dispRed"
              type="matrix"
              values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="red"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={p.distortionScale + p.greenOffset}
              xChannelSelector="R"
              yChannelSelector="G"
              result="dispGreen"
            />
            <feColorMatrix
              in="dispGreen"
              type="matrix"
              values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="green"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={p.distortionScale + p.blueOffset}
              xChannelSelector="R"
              yChannelSelector="G"
              result="dispBlue"
            />
            <feColorMatrix
              in="dispBlue"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
              result="blue"
            />
            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" result="output" />
            <feGaussianBlur in="output" stdDeviation={p.displace} />
          </filter>
        ))}
      </defs>
    </svg>
  );
}

/* ---------- 宿主 hook：量尺寸 → 注册/换桶 → 返回 ref 与玻璃 tint 变量 ----------
 * tint 走 CSS 变量 --glass-bg，由 index.css 的 [data-theme="glass"] 规则以 !important 消费
 * （变量不在场 = CSS 回退渐变）。折射本体（backdrop-filter: url()）则由本 hook 以
 * setProperty(..., 'important') 命令式直写元素——原因：构建用的 Lightning CSS 会把样式表里
 * 的标准属性 backdrop-filter 删得只剩 -webkit- 形式，而 -webkit-backdrop-filter 不渲染
 * url() 类型的 SVG 滤镜引用（隔离实验 probe-r58/probe-r58b 实证：标准属性内联/经变量/
 * 命令式 !important 三种写法均能渲染色差位移，且与 -webkit- 的 blur 并存时标准属性胜出；
 * -webkit- 写 url() 时条纹原样透过、无位移）。这与原版用 React 内联 style 写
 * backdropFilter 的落点一致（内联标准属性），只是本站额外加了 !important 以压过
 * C 卡自身的内联 blur 与样式表规则。停用/卸载时按接管前捕获的原值恢复，不伤宿主自有样式。 */
export function useGlassBackdrop<T extends HTMLElement>(borderRadius: number): {
  ref: RefObject<T | null>;
  style: CSSProperties | undefined;
} {
  const { theme, groupCardAlpha } = useDisplayPrefs();
  const active = theme === 'glass' && glassSvgSupported();
  const ref = useRef<T | null>(null);
  const [filterId, setFilterId] = useState<string | null>(null);
  const savedBackdropRef = useRef<{ value: string; priority: string } | null>(null);

  useEffect(() => {
    if (!active) {
      setFilterId(null);
      return undefined;
    }
    const el = ref.current;
    if (!el) return undefined;
    let timer: number | undefined;
    const update = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w > 0 && h > 0) setFilterId(registerGlassBucket(w, h, borderRadius).id);
    };
    update();
    const ro = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(update, 120);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      window.clearTimeout(timer);
    };
  }, [active, borderRadius]);

  // 每渲染后重申折射声明：宿主（C 卡）在重渲染时会按其 style 对象重写 backdropFilter，
  // 本 effect 在布局阶段随后覆盖回 url 值，避免被冲掉
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (active && filterId) {
      if (!savedBackdropRef.current) {
        savedBackdropRef.current = {
          value: el.style.getPropertyValue('backdrop-filter'),
          priority: el.style.getPropertyPriority('backdrop-filter'),
        };
      }
      el.style.setProperty('backdrop-filter', `url(#${filterId}) saturate(${GLASS_PARAMS.saturation})`, 'important');
    } else if (savedBackdropRef.current) {
      const saved = savedBackdropRef.current;
      savedBackdropRef.current = null;
      if (saved.value) el.style.setProperty('backdrop-filter', saved.value, saved.priority);
      else el.style.removeProperty('backdrop-filter');
    }
  });

  useEffect(() => {
    return () => {
      const el = ref.current;
      const saved = savedBackdropRef.current;
      if (el && saved) {
        if (saved.value) el.style.setProperty('backdrop-filter', saved.value, saved.priority);
        else el.style.removeProperty('backdrop-filter');
        savedBackdropRef.current = null;
      }
    };
  }, []);

  const style: CSSProperties | undefined =
    active && filterId
      ? ({
          '--glass-bg': `hsl(0 0% 0% / ${glassTintOpacity(groupCardAlpha)})`,
        } as CSSProperties)
      : undefined;
  return { ref, style };
}
