import React, { useEffect, useRef } from 'react';

/**
 * ContourTide —— 背景预设「等高潮汐」（第九十二轮，自研实现，如实记录）。
 *
 * React Bits Pro 的 Contour Tide 组件需付费授权（license-key）才能拿到源码，本项目
 * 不绕授权：按其文档页公开的参数面板数值自研 Canvas 2D 同款观感——黑底之上由
 * 银白粒子排成的等高线式波纹，随时间涌动，带涌浪、雾化地平线与点击涟漪。
 *
 * 定版参数（2026-10-24 用户拍板，逐项对齐）：
 * Preset Silver / Background #0a0a0a / Water #6E6E80（低处粒子色）/ Crest #FFFFFF（浪尖色）
 * Density 1.30（粒子密度）/ Particle Size 3.00（粒子直径基数 px）/ Wave Height 1.95（浪高）
 * Choppiness 1.05（浪形碎度）/ Wavelength 1.85（波长）/ Wind Angle 94°（风向）
 * Horizon 0.27（地平线位置：其上粒子雾化隐去）/ Fog 2.10（雾强）/ Glow 1.10（浪尖辉光）
 * Foam 0.80（浪尖泛白强度）/ Speed 0.75（涌动速度）/ Parallax 0.65（鼠标视差）
 * Swell 0.80 / Swell Radius 2.85（涌浪强度/半径）/ Seed 16（粒子抖动种子）
 * Interactive 开 / Click Ripples 开（经 window 级监听实现：背景层本身 pointer-events-none、
 * 不挡任何点按，坐标按视口映射）/ Paused 关。
 *
 * 性能规矩与既有动态背景一致：DPR 封顶 1.5（第九十七轮约定）、标签页隐藏停帧、
 * prefers-reduced-motion 只画一帧。诊断计数在 canvas.__tideFrames / __tideRipples（供自测）。
 */

interface ContourTideProps {
  className?: string;
  style?: React.CSSProperties;
}

const BG = '#0a0a0a';
const WATER: [number, number, number] = [110, 110, 128]; // #6E6E80
const CREST: [number, number, number] = [255, 255, 255];
const SEED = 16;
const DENSITY = 1.3;
const PARTICLE_SIZE = 3.0;
const WAVE_HEIGHT = 1.95;
const CHOPPINESS = 1.05;
const WAVELENGTH = 1.85;
const WIND_ANGLE = (94 * Math.PI) / 180;
const HORIZON = 0.27;
const FOG = 2.1;
const GLOW = 1.1;
const FOAM = 0.8;
const SPEED = 0.75;
const PARALLAX = 0.65;
const SWELL = 0.8;
const SWELL_RADIUS = 2.85;

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

interface Ripple {
  x: number;
  y: number;
  t0: number;
}

const BUCKETS = 12;

export default function ContourTide({ className, style }: ContourTideProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let running = true;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let frames = 0;
    let elapsed = 0;
    let lastNow = performance.now();
    const mouse = { x: -9999, y: -9999, nx: 0, ny: 0 };
    const ripples: Ripple[] = [];
    let rippleTotal = 0;

    let baseX = new Float32Array(0);
    let baseY = new Float32Array(0);
    let count = 0;
    const bucketPts: number[][] = Array.from({ length: BUCKETS }, () => []);

    const buildParticles = () => {
      const spacing = 26 / DENSITY;
      const rand = mulberry32(SEED);
      const xs: number[] = [];
      const ys: number[] = [];
      for (let gy = -1; gy * spacing < h + spacing; gy++) {
        for (let gx = -1; gx * spacing < w + spacing; gx++) {
          xs.push(gx * spacing + (rand() - 0.5) * spacing * 0.55 + (gy % 2 ? spacing * 0.5 : 0));
          ys.push(gy * spacing + (rand() - 0.5) * spacing * 0.55);
        }
      }
      count = xs.length;
      baseX = new Float32Array(xs);
      baseY = new Float32Array(ys);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      buildParticles();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const dirX = Math.cos(WIND_ANGLE);
    const dirY = Math.sin(WIND_ANGLE);
    const perpX = -dirY;
    const perpY = dirX;
    const waveK = (Math.PI * 2) / (WAVELENGTH * 92); // 波长参数 → 像素波长

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.nx = w > 0 ? mouse.x / w - 0.5 : 0;
      mouse.ny = h > 0 ? mouse.y / h - 0.5 : 0;
    };
    const onDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      ripples.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, t0: elapsed });
      if (ripples.length > 6) ripples.shift();
      rippleTotal++;
      (canvas as unknown as { __tideRipples?: number }).__tideRipples = rippleTotal;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });

    const draw = () => {
      const now = performance.now();
      elapsed += Math.min(0.05, (now - lastNow) / 1000);
      lastNow = now;
      const t = elapsed;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, w, h);

      const parX = mouse.nx * PARALLAX * 26;
      const parY = mouse.ny * PARALLAX * 18;
      const horizonY = h * HORIZON;
      const swellCx = w * (0.66 + 0.05 * Math.sin(t * 0.11));
      const swellCy = h * (0.6 + 0.05 * Math.cos(t * 0.09));
      const swellR = SWELL_RADIUS * 130;
      const speedT = t * SPEED * 1.7;

      for (let b = 0; b < BUCKETS; b++) bucketPts[b].length = 0;

      for (let i = 0; i < count; i++) {
        const x = baseX[i];
        const y = baseY[i];
        const sx = x + parX;
        const sy = y + parY;
        // 主浪（沿风向）+ 碎浪（斜向高频，Choppiness 调制相位）
        const ph1 = (sx * dirX + sy * dirY) * waveK - speedT;
        const chop = 1 + CHOPPINESS * 0.45 * Math.sin(ph1 * 0.5);
        let hh = Math.sin(ph1 * chop) * 0.62;
        hh += Math.sin((sx * perpX + sy * perpY) * waveK * 1.62 + speedT * 0.8 + ph1 * 0.35) * 0.38;
        // 涌浪：自涌浪中心扩散的径向波
        const sdx = sx - swellCx;
        const sdy = sy - swellCy;
        const sd = Math.sqrt(sdx * sdx + sdy * sdy);
        hh += SWELL * Math.exp(-(sd * sd) / (2 * swellR * swellR)) * Math.sin(sd * 0.045 - t * 1.6) * 0.9;
        // 点击涟漪：扩散圆环
        for (let r = 0; r < ripples.length; r++) {
          const rp = ripples[r];
          const age = t - rp.t0;
          if (age < 0 || age > 2.6) continue;
          const rdx = sx - rp.x;
          const rdy = sy - rp.y;
          const rd = Math.sqrt(rdx * rdx + rdy * rdy);
          const ring = age * 150;
          const dd = rd - ring;
          hh += Math.exp(-(dd * dd) / (2 * 24 * 24)) * (1 - age / 2.6) * Math.sin(dd * 0.3) * 1.1;
        }
        // 鼠标隆起（交互）
        const mdx = sx - mouse.x;
        const mdy = sy - mouse.y;
        hh += Math.exp(-(mdx * mdx + mdy * mdy) / (2 * 95 * 95)) * 0.55;

        // 归一化浪高 0–1：Wave Height 放大对比；等高线感来自量化分桶
        let norm = 0.5 + hh * 0.5 * (WAVE_HEIGHT / 1.55);
        // 雾：地平线以上快速隐去；画面上方整体更淡（远）
        if (y < horizonY) norm *= Math.exp(-(horizonY - y) * 0.0035 * FOG);
        norm *= 0.5 + 0.5 * Math.min(1, Math.max(0, y / (h * 0.9)));
        if (norm <= 0.03) continue;
        if (norm > 1) norm = 1;
        const b = Math.min(BUCKETS - 1, Math.floor(norm * BUCKETS));
        bucketPts[b].push(x, y, norm);
      }
      // 过期涟漪清理
      for (let r = ripples.length - 1; r >= 0; r--) {
        if (t - ripples[r].t0 > 2.6) ripples.splice(r, 1);
      }

      for (let b = 0; b < BUCKETS; b++) {
        const pts = bucketPts[b];
        if (pts.length === 0) continue;
        const f = b / (BUCKETS - 1);
        const cr = Math.round(WATER[0] + (CREST[0] - WATER[0]) * f);
        const cg = Math.round(WATER[1] + (CREST[1] - WATER[1]) * f);
        const cb = Math.round(WATER[2] + (CREST[2] - WATER[2]) * f);
        const isCrest = b >= BUCKETS - 2;
        // 浪尖辉光：先铺一圈大而淡的光点（Glow），再画实心粒子
        if (isCrest) {
          ctx.fillStyle = `rgba(255, 255, 255, ${(0.05 + 0.05 * FOAM) * GLOW})`;
          ctx.beginPath();
          for (let j = 0; j < pts.length; j += 3) {
            const r = (PARTICLE_SIZE / 2) * (0.6 + 1.15 * pts[j + 2]) * 2.4;
            ctx.moveTo(pts[j] + r, pts[j + 1]);
            ctx.arc(pts[j], pts[j + 1], r, 0, Math.PI * 2);
          }
          ctx.fill();
        }
        ctx.fillStyle = `rgb(${cr}, ${cg}, ${cb})`;
        ctx.beginPath();
        for (let j = 0; j < pts.length; j += 3) {
          const r = (PARTICLE_SIZE / 2) * (0.5 + 1.05 * pts[j + 2]);
          ctx.moveTo(pts[j] + r, pts[j + 1]);
          ctx.arc(pts[j], pts[j + 1], r, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      (canvas as unknown as { __tideFrames?: number }).__tideFrames = ++frames;
      if (running && !reduced) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduced) {
        running = true;
        lastNow = performance.now();
        raf = requestAnimationFrame(draw);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
    };
  }, []);

  return (
    <div className={className} style={{ background: BG, ...style }} aria-hidden>
      <canvas ref={canvasRef} data-contour-tide style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}
