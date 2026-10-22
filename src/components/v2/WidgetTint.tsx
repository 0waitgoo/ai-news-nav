import type { WidgetTint } from '../../store/localStore';

/**
 * A 型小组件的专属底色层（第二十三轮；第三十六轮水印改为居中 Emoji）：
 * - 一层低透明度线性渐变（from 约 16% → to 约 9% → 约 3%）叠在卡片深色玻璃底之上、内容之下
 * - 一枚大号 Emoji 字符居中作水印，低透明度、轻微倾斜，不拦截点击
 * 整体绝对定位铺满卡片、pointer-events-none；卡片内容需以 relative 层级盖在其上。
 * data-widget-tint 记色板 id，供自测断言逐卡底色与持久化；
 * data-widget-watermark 记水印字符，供自测断言居中 Emoji 水印。
 */
export default function WidgetTintLayer({
  tint,
  emoji,
}: {
  tint: WidgetTint;
  /** 水印字符：由各卡片按语义传入的 Emoji（如 📰 / 🔥 / 🏆 / 📋） */
  emoji: string;
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
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          data-widget-watermark={emoji}
          className="select-none"
          style={{
            fontSize: 'clamp(96px, 28cqw, 168px)',
            lineHeight: 1,
            opacity: 0.16,
            transform: 'rotate(-8deg)',
            fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
          }}
        >
          {emoji}
        </span>
      </div>
    </div>
  );
}
