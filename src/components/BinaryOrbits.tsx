import React, { useEffect, useRef } from 'react';

/**
 * BinaryOrbits —— 「深海蓝」预设的动态背景（第四十四轮）。
 *
 * 说明（如实记录）：官方组件来自 React Bits Pro，注册表分发需要 license-key 鉴权（付费），
 * 本环境无密钥、shadcn add 装不上，故按其文档页描述的视觉自实现一个同名同接口的本地版本：
 * 深蓝底上一个倾斜的旋臂星系盘——3 条旋臂、中心星核辉光、内快外慢的差速旋转、星点闪烁。
 * props 接口与官方一致（interactive / clickRipple 接受但在本项目用法里恒为 false，不响应指针）。
 * 实现为 Canvas 2D（约 2600 颗星，远低于官方 WebGL 的 7 万颗，普通设备可流畅跑）；
 * 页面不可见时自动停帧，prefers-reduced-motion 时只画一帧静态图。
 */

interface BinaryOrbitsProps {
  interactive?: boolean;
  clickRipple?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface Star {
  /** 归一化半径 0–1 */
  r: number;
  /** 当前极角（弧度） */
  a: number;
  /** 角速度（差速旋转：内快外慢） */
  speed: number;
  /** 臂内抖动后的横向偏移（已烘焙进绘制时的角度修正） */
  jitter: number;
  /** 基础大小 */
  size: number;
  /** 闪烁相位 */
  phase: number;
  /** 颜色索引：0 白 / 1 粉 / 2 紫 */
  hue: number;
}

const STAR_COLORS = ['255,255,255', '255,194,238', '150,120,255'];
const BG = '#030b1f';

export default function BinaryOrbits({ className, style }: BinaryOrbitsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let running = true;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const stars: Star[] = [];
    const COUNT = 2600;
    const ARMS = 3;
    const TWIST = 3.4;
    for (let i = 0; i < COUNT; i++) {
      const r = Math.pow(Math.random(), 0.62); // 向中心聚集
      const arm = i % ARMS;
      const armCrowd = Math.random() < 0.72; // 72% 的星挤在旋臂上，其余散在盘面
      const baseA = armCrowd
        ? (arm * (Math.PI * 2)) / ARMS + r * TWIST + (Math.random() - 0.5) * 0.42 * (1.1 - r)
        : Math.random() * Math.PI * 2;
      stars.push({
        r,
        a: baseA,
        speed: 0.05 / (0.22 + r * 1.15), // 差速：内层转得快
        jitter: (Math.random() - 0.5) * 0.05,
        size: Math.random() < 0.06 ? 1.9 + Math.random() * 1.1 : 0.6 + Math.random() * 1.1,
        phase: Math.random() * Math.PI * 2,
        hue: r < 0.16 ? 0 : Math.random() < 0.42 ? 1 : Math.random() < 0.5 ? 2 : 0,
      });
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const TILT = Math.cos((62 * Math.PI) / 180); // 俯视倾角 62° → 纵向压扁
    const ROLL = (-8 * Math.PI) / 180;
    const cosR = Math.cos(ROLL);
    const sinR = Math.sin(ROLL);

    let last = performance.now();
    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const cx = w * 0.5;
      const cy = h * 0.52;
      const R = Math.min(w, h) * 0.46;

      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, w, h);

      // 星核辉光（径向渐变，先画在星层之下）
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.42);
      coreGrad.addColorStop(0, 'rgba(190,170,255,0.5)');
      coreGrad.addColorStop(0.35, 'rgba(123,77,255,0.22)');
      coreGrad.addColorStop(1, 'rgba(3,11,31,0)');
      ctx.fillStyle = coreGrad;
      ctx.fillRect(cx - R * 0.42, cy - R * 0.42, R * 0.84, R * 0.84);

      const t = now / 1000;
      for (const s of stars) {
        if (!reduced) s.a += s.speed * dt * 0.55;
        const ang = s.a + s.jitter;
        const px = Math.cos(ang) * s.r * R;
        const py = Math.sin(ang) * s.r * R * TILT;
        const x = cx + px * cosR - py * sinR;
        const y = cy + px * sinR + py * cosR;
        const tw = 0.72 + 0.28 * Math.sin(t * 1.7 + s.phase);
        const coreBoost = s.r < 0.2 ? 1.25 : 1;
        const alpha = Math.min(1, (0.28 + (1 - s.r) * 0.72) * tw * coreBoost);
        ctx.fillStyle = `rgba(${STAR_COLORS[s.hue]},${alpha.toFixed(3)})`;
        ctx.fillRect(x, y, s.size, s.size);
      }

      // 核心亮点
      const dot = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.07);
      dot.addColorStop(0, 'rgba(255,255,255,0.85)');
      dot.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = dot;
      ctx.fillRect(cx - R * 0.07, cy - R * 0.07, R * 0.14, R * 0.14);

      if (running && !reduced) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduced) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(draw);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <div className={className} style={{ background: BG, ...style }} aria-hidden>
      <canvas ref={canvasRef} data-binary-orbits style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}
