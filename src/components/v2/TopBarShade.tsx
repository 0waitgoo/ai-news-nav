import React from 'react';

/**
 * 吸顶栏遮挡带（第五十九轮）：顶栏背后的全宽糊化层，滚动时挡住透进顶栏区域的卡片。
 * 几何/tint/渐隐 mask 在 index.css 的 .topbar-shade；backdrop 模糊只能走内联——
 * 样式表里的标准 backdrop-filter 会被 Lightning CSS 删得只剩 -webkit- 形式，
 * 而单剩 -webkit- 形式在 Chromium 里不生效（r59 探针实证），故与第五十八轮
 * GlassSurface 的 url() 滤镜同理，写在元素行内样式上。
 */
export default function TopBarShade() {
  return (
    <div
      aria-hidden
      className="topbar-shade"
      style={{
        backdropFilter: 'blur(18px) saturate(150%)',
        WebkitBackdropFilter: 'blur(18px) saturate(150%)',
      }}
    />
  );
}
