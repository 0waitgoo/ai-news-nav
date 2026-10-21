import React from 'react';
import type { WidgetTint } from '../../store/localStore';

/**
 * A 型小组件的专属底色层（第二十三轮）：
 * - 一层低透明度线性渐变（from 约 16% → to 约 9% → 约 3%）叠在卡片深色玻璃底之上、内容之下
 * - 一枚同色大号水印图标压在右下、溢出裁切，不透明度约 9%
 * 整体绝对定位铺满卡片、pointer-events-none 不拦截任何点击；卡片内容需以 relative 层级盖在其上。
 * data-widget-tint 记色板 id，供自测断言逐卡底色与持久化。
 */
export default function WidgetTintLayer({
  tint,
  icon,
}: {
  tint: WidgetTint;
  /** 水印图标节点：由各卡片传入自己标题同源的 lucide 图标（大号、低描边） */
  icon: React.ReactNode;
}) {
  return (
    <div
      aria-hidden
      data-widget-tint={tint.id}
      className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none"
    >
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(140deg, ${tint.from}29 0%, ${tint.to}17 52%, ${tint.to}0a 100%)`,
        }}
      />
      <div
        className="absolute -right-7 -bottom-10 -rotate-12"
        style={{ color: tint.to, opacity: 0.09 }}
      >
        {icon}
      </div>
    </div>
  );
}
