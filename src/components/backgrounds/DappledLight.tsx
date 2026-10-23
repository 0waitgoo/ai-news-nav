import React, { useEffect, useRef } from 'react';

/**
 * DappledLight —— 背景预设「斑驳光影」（第九十二轮，自研实现，如实记录）。
 *
 * React Bits Pro 的 Dappled Light 组件需付费授权（license-key）才能拿到源码，本项目
 * 不绕授权：按其文档页公开的参数面板数值自研 Canvas 2D 同款观感——蓝调天光从左上
 * 透过叶冠洒落，叶影斑驳、随微风轻晃，带云影调制与颗粒。
 *
 * 定版参数（2026-10-24 用户拍板，逐项对齐）：
 * Preset Olive / Plant Olive（橄榄叶：细长椭圆叶）/ Placement Top Left（光自左上入射）
 * Light #99bfff / Shadow #000000 / Background #0A0A0A / Scale 1.36（叶层尺度）
 * Density 1.24（叶片密度）/ Depth 0.85（远近两层叶影的视差深度）/ Softness 1.00（影边缘柔化）
 * Shadow Strength 0.94（叶影不透明度）/ Window Angle 31°（光束倾角）/ Window Size 1.07
 * Intensity 0.54（光强）/ Bloom 0.47（左上辉光）/ Wind 0.70 / Wind Speed 1.25（晃动幅度/速度）
 * Clouds 0.49（云影调制）/ Grain 0.64（颗粒）/ Seed 9（叶形排布随机种子，固定保证每次同款）
 * Breeze 开（光强与叶影带呼吸感）/ Intro 关 / Paused 关。
 *
 * 性能规矩与既有动态背景一致：DPR 封顶 1.5（第九十七轮约定）、标签页隐藏停帧、
 * prefers-reduced-motion 只画一帧。诊断计数在 canvas.__dappledFrames（供自测）。
 */

interface DappledLightProps {
  className?: string;
  style?: React.CSSProperties;
}

const BG = '#0A0A0A';
const LIGHT = '153, 191, 255'; // #99bfff
const SEED = 9;
const SCALE = 1.36;
const DENSITY = 1.24;
const DEPTH = 0.85;
const SOFTNESS = 1.0;
const SHADOW_STRENGTH = 0.94;
const WINDOW_SIZE = 1.07;
const INTENSITY = 0.54;
const BLOOM = 0.47;
const WIND = 0.7;
const WIND_SPEED = 1.25;
const CLOUDS = 0.49;
const GRAIN = 0.64;
const MARGIN = 110; // 叶层比视口多出的边距：晃动时不露边

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function DappledLight({ className, style }: DappledLightProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let running = true;
    /* 第一百零三轮：与 DarkVeil 同口径的绘制节流——30fps 上限 + 滚动冻结 200ms。
     * 本组件相位全部由绝对时间 t 驱动，跳帧无相位跳变、单帧画面不变；
     * reduced-motion 的静态单帧不受节流影响（见 draw 开头豁免）。 */
    let lastDraw = 0;
    let lastScrollAt = -Infinity;
    const onScroll = () => { lastScrollAt = performance.now(); };
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    let w = 0;
    let h = 0;
    let dpr = 1;
    let frames = 0;
    let shadowFar: HTMLCanvasElement | null = null;
    let shadowNear: HTMLCanvasElement | null = null;
    let grainPattern: CanvasPattern | null = null;
    let lightGrad: CanvasGradient | null = null;
    let bloomGrad: CanvasGradient | null = null;
    let cloudGrad: CanvasGradient | null = null;

    /** 生成一层叶影（离屏）：簇状分布的细长橄榄叶，整层按 Softness 高斯柔化。
     *  scaleMul：近层叶更大；alphaMul：近层影更实。图层按设备像素绘制（含 MARGIN 边距）。 */
    const makeLeafLayer = (rand: () => number, scaleMul: number) => {
      const lw = Math.max(2, Math.ceil((w + MARGIN * 2) * dpr));
      const lh = Math.max(2, Math.ceil((h + MARGIN * 2) * dpr));
      const sharp = document.createElement('canvas');
      sharp.width = lw;
      sharp.height = lh;
      const g = sharp.getContext('2d');
      if (!g) return sharp;
      g.scale(dpr, dpr);
      const cssW = w + MARGIN * 2;
      const cssH = h + MARGIN * 2;
      // 簇心：叶片绕簇心散开，像从枝头垂下的叶团
      const clusters = 12 + Math.floor(rand() * 6);
      const centers: Array<{ x: number; y: number }> = [];
      for (let i = 0; i < clusters; i++) {
        centers.push({ x: rand() * cssW, y: rand() * cssH * 0.92 });
      }
      const leafLen = 52 * SCALE * scaleMul;
      const count = Math.floor(((cssW * cssH) / 24000) * DENSITY * (scaleMul > 1 ? 0.85 : 1));
      for (let i = 0; i < count; i++) {
        const c = centers[Math.floor(rand() * centers.length)];
        const spread = 130 * scaleMul * (0.5 + rand() * 0.5);
        const x = c.x + (rand() + rand() - 1) * spread;
        const y = c.y + (rand() + rand() - 1) * spread * 0.72;
        const len = leafLen * (0.55 + rand() * 0.8);
        const wid = len * (0.3 + rand() * 0.1);
        const rot = rand() * Math.PI * 2;
        g.save();
        g.translate(x, y);
        g.rotate(rot);
        g.fillStyle = `rgba(0, 0, 0, ${(0.42 + rand() * 0.5).toFixed(3)})`;
        g.beginPath();
        g.ellipse(0, 0, len / 2, wid / 2, 0, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
      // 柔化：整层重绘到新画布并施加 blur（半径随 Softness 与 DPR）
      const soft = document.createElement('canvas');
      soft.width = lw;
      soft.height = lh;
      const sg = soft.getContext('2d');
      if (!sg) return sharp;
      sg.filter = `blur(${Math.max(1, Math.round(5 * SOFTNESS * scaleMul * dpr))}px)`;
      sg.drawImage(sharp, 0, 0);
      sg.filter = 'none';
      return soft;
    };

    const buildGrain = () => {
      const size = 160;
      const c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      const g = c.getContext('2d');
      if (!g) return;
      const img = g.createImageData(size, size);
      const rand = mulberry32(SEED * 31 + 7);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.floor(rand() * 255);
        img.data[i] = v;
        img.data[i + 1] = v;
        img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      grainPattern = ctx.createPattern(c, 'repeat');
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      const rand = mulberry32(SEED);
      shadowFar = makeLeafLayer(rand, 0.78);
      shadowNear = makeLeafLayer(rand, 1.18);
      buildGrain();
      // 光场：自左上入射的大半径径向光（Window Size 放大半径），中心略偏出画面左上
      const diag = Math.hypot(w, h);
      lightGrad = ctx.createRadialGradient(w * -0.06, h * -0.16, 0, w * -0.06, h * -0.16, diag * 0.78 * WINDOW_SIZE);
      lightGrad.addColorStop(0, `rgba(${LIGHT}, 0.95)`);
      lightGrad.addColorStop(0.45, `rgba(${LIGHT}, 0.42)`);
      lightGrad.addColorStop(1, `rgba(${LIGHT}, 0)`);
      bloomGrad = ctx.createRadialGradient(w * 0.02, h * -0.08, 0, w * 0.02, h * -0.08, diag * 0.42);
      bloomGrad.addColorStop(0, `rgba(${LIGHT}, 0.8)`);
      bloomGrad.addColorStop(1, `rgba(${LIGHT}, 0)`);
      cloudGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, diag * 0.5);
      cloudGrad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
      cloudGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = (now: number) => {
      if (!reduced && (now - lastDraw < 1000 / 30 || now - lastScrollAt < 200)) {
        if (running) raf = requestAnimationFrame(draw);
        return;
      }
      lastDraw = now;
      const t = now / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, w, h);

      // 微风：光强呼吸（Breeze）+ 云影缓移调制
      const breeze = 0.5 + 0.5 * Math.sin(t * 0.55 * WIND_SPEED + Math.sin(t * 0.23) * 1.4);
      const cloudDim = 1 - CLOUDS * 0.22 * (0.5 + 0.5 * Math.sin(t * 0.07 + 1.9));

      // 天光底（31° 倾角以光心偏左上近似：光场沿左上→右下衰减）
      if (lightGrad) {
        ctx.globalAlpha = INTENSITY * (0.86 + 0.14 * breeze) * cloudDim;
        ctx.fillStyle = lightGrad;
        ctx.fillRect(0, 0, w, h);
      }
      // 云影：一团大而软的暗影缓慢漂过光区
      if (cloudGrad) {
        const cxp = w * (0.3 + 0.22 * Math.sin(t * 0.05 + 0.6));
        const cyp = h * (0.06 + 0.1 * Math.cos(t * 0.043));
        ctx.save();
        ctx.translate(cxp, cyp);
        ctx.globalAlpha = CLOUDS * 0.38;
        ctx.fillStyle = cloudGrad;
        ctx.fillRect(-w, -h, w * 2, h * 2);
        ctx.restore();
      }
      // 叶影两层（远层动得慢、近层动得多 = Depth 视差），风向晃动沿 31° 光束方向
      const ang = (31 * Math.PI) / 180;
      const swayX = Math.cos(ang);
      const swayY = Math.sin(ang);
      const layers: Array<{ img: HTMLCanvasElement | null; depth: number; alpha: number }> = [
        { img: shadowFar, depth: 1 - DEPTH * 0.55, alpha: 0.72 },
        { img: shadowNear, depth: 1, alpha: 1 },
      ];
      for (const layer of layers) {
        if (!layer.img) continue;
        const s = Math.sin(t * 0.6 * WIND_SPEED * layer.depth + layer.depth * 2.1) * 9 * WIND * layer.depth;
        const s2 = Math.cos(t * 0.43 * WIND_SPEED * layer.depth) * 5 * WIND * layer.depth;
        ctx.globalAlpha = SHADOW_STRENGTH * layer.alpha;
        ctx.drawImage(
          layer.img,
          -MARGIN + s * swayX - s2 * swayY,
          -MARGIN + s * swayY + s2 * swayX,
          w + MARGIN * 2,
          h + MARGIN * 2,
        );
      }
      // 左上辉光（Bloom）
      if (bloomGrad) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = BLOOM * 0.34 * (0.85 + 0.15 * breeze) * cloudDim;
        ctx.fillStyle = bloomGrad;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
      }
      // 颗粒
      if (grainPattern) {
        const jx = Math.floor(Math.random() * 160);
        const jy = Math.floor(Math.random() * 160);
        ctx.save();
        ctx.translate(-jx, -jy);
        ctx.globalAlpha = 0.028 + GRAIN * 0.075;
        ctx.fillStyle = grainPattern;
        ctx.fillRect(0, 0, w + 160, h + 160);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      (canvas as unknown as { __dappledFrames?: number }).__dappledFrames = ++frames;
      if (running && !reduced) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduced) {
        running = true;
        raf = requestAnimationFrame(draw);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      document.removeEventListener('scroll', onScroll, { capture: true });
    };
  }, []);

  return (
    <div className={className} style={{ background: BG, ...style }} aria-hidden>
      <canvas ref={canvasRef} data-dappled-light style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}
