import React from 'react';

/**
 * 吸顶栏遮挡带（第五十九轮）：顶栏背后的糊化层，滚动时挡住透进顶栏区域的卡片。
 * 第六十二轮起本带无任何底色（原深色 tint 已删），只保留模糊。
 * 第六十三轮：改由 App 在内容容器层统一渲染一份（不再塞在各吸顶栏内部）——
 * 几何见 index.css .topbar-shade：position:fixed 全幅铺满视口上/左/右三边，
 * 高度按「页面上垫 + 栏高 + 30px 渐隐」推导（主页栏带 -mt-1，用 --home 变体减 4px）。
 * backdrop 模糊只能走内联——样式表里的标准 backdrop-filter 会被 Lightning CSS
 * 删得只剩 -webkit- 形式，而单剩 -webkit- 形式在 Chromium 里不生效（r59 探针
 * 实证），故写在元素行内样式上。
 * 层独立（translateZ(0)）在 index.css .topbar-shade 里。
 * （历史：第八十/八十三轮曾为已删除的液态玻璃档单独收敛本带配方——只 blur、
 * 垫极淡中性底等；第一百零二轮玻璃整体删除后，那些玻璃专属分支与规则一并
 * 移除，本带回到两档统一配方 blur(18px) saturate(150%)，即原暗夜/白天配方。）
 */
export default function TopBarShade({ variant = 'sub' }: { variant?: 'home' | 'sub' }) {
  const backdrop = 'blur(18px) saturate(150%)';
  return (
    <div
      aria-hidden
      className={variant === 'home' ? 'topbar-shade topbar-shade--home' : 'topbar-shade'}
      style={{
        backdropFilter: backdrop,
        WebkitBackdropFilter: backdrop,
      }}
    />
  );
}
