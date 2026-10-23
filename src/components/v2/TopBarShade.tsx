import React from 'react';
import { useDisplayPrefs } from '../../store/displayPrefs';

/**
 * 吸顶栏遮挡带（第五十九轮）：顶栏背后的糊化层，滚动时挡住透进顶栏区域的卡片。
 * 第六十二轮起本带无任何底色（原深色 tint 已删），只保留模糊。
 * 第六十三轮：改由 App 在内容容器层统一渲染一份（不再塞在各吸顶栏内部）——
 * 几何见 index.css .topbar-shade：position:fixed 全幅铺满视口上/左/右三边，
 * 高度按「页面上垫 + 栏高 + 30px 渐隐」推导（主页栏带 -mt-1，用 --home 变体减 4px）。
 * backdrop 模糊只能走内联——样式表里的标准 backdrop-filter 会被 Lightning CSS
 * 删得只剩 -webkit- 形式，而单剩 -webkit- 形式在 Chromium 里不生效（r59 探针
 * 实证），故与第五十八轮 GlassSurface 的 url() 滤镜同理，写在元素行内样式上。
 * 第八十轮：玻璃档下本带只用 blur、去掉 saturate(150%)——用户实测玻璃档滚动时
 * 本带整带吹白（发白区域与本带足迹逐像素吻合、连卡间空隙一起白，判定为本带
 * backdrop 在滚动重绘时采样含 SVG 折射卡的幕布快照所致）；saturate 会把快照里
 * 本已过亮的颜色继续往粉白色推，是配方里唯一可摘的放大项，本带的职责（糊住
 * 透上来的内容）只靠 blur 即成立。暗夜/白天档幕布里没有折射卡，保持原配方。
 * 层独立（translateZ(0)）在 index.css .topbar-shade 里，与本处配方调整配套。
 */
export default function TopBarShade({ variant = 'sub' }: { variant?: 'home' | 'sub' }) {
  const { theme } = useDisplayPrefs();
  const backdrop = theme === 'glass' ? 'blur(18px)' : 'blur(18px) saturate(150%)';
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
