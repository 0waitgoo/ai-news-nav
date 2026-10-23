import { ChevronRight, Wrench } from 'lucide-react';
import { TOOL_DEFS, type ToolTabId } from '../pages/tools/toolDefs';
import { requestToolTab } from '../../store/toolNav';
import type { WidgetTint } from '../../store/localStore';
import { Card, CardIconBadge } from './Card';

/**
 * A 型 · 文件工具卡（第六十八轮，用户在组件规范 Q4 拍板）：
 * 卡面摆 6 个工具的图标+名称（与工具页 tab 同一套共享定义 toolDefs），
 * 点某个图标先记下直达意图（toolNav）再跳工具页，工具页挂载时消费、对应 tab 直接选中；
 * 点卡面其他区域只进工具页（默认第一个工具）。
 * 排布按占位折算（6 个必须全在、全可点、不裁切）：
 * - 2 栏 × 1x：一排 6 个；
 * - 2 栏 × 2x：3 列 × 2 行（瓷砖放大）；
 * - 1 栏 × 1x：3 列 × 2 行（紧凑）；
 * - 1 栏 × 2x：2 列 × 3 行（瓷砖放大）。
 * 手机单列由 HomePage 传 colSpan=1 进来，走 1 栏排布、全宽显示。
 */
export default function FileToolsCard({
  onNavigate,
  delay = 0,
  colSpan = 2,
  heightUnits = 1,
  tint,
}: {
  onNavigate: (page: string) => void;
  delay?: number;
  /** 右键布局宽度（决定排布列数） */
  colSpan?: 1 | 2;
  /** 右键布局高度：2x 时瓷砖放大排布 */
  heightUnits?: 1 | 2;
  /** 专属底色（由 HomePage 按 widgetTints 分配传入） */
  tint?: WidgetTint;
}) {
  const openTool = (id: ToolTabId) => {
    requestToolTab(id);
    onNavigate('tools');
  };

  const gridCls =
    colSpan === 2
      ? heightUnits === 2
        ? 'grid-cols-3'
        : 'grid-cols-6'
      : heightUnits === 2
        ? 'grid-cols-2'
        : 'grid-cols-3';
  /** 2x 或宽卡用大瓷砖；1 栏 × 1x 高度只剩百余像素，瓷砖改横排（图标+名称同行）才不溢出 */
  const compact = colSpan === 1 && heightUnits === 1;
  const roomy = !compact;

  return (
    <Card
      title="文件工具"
      icon={
        <CardIconBadge className="bg-indigo-500 text-white">
          <Wrench size={14} />
        </CardIconBadge>
      }
      right={
        <span className="flex items-center gap-0.5 text-[11px] text-white/40 shrink-0">
          打开工具页 <ChevronRight size={12} />
        </span>
      }
      onClick={() => onNavigate('tools')}
      delay={delay}
      tint={tint}
      watermark="🧰"
    >
      <div data-tools-grid className={`flex-1 min-h-0 grid ${gridCls} gap-2`}>
        {TOOL_DEFS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              data-tool-link={t.id}
              aria-label={t.label}
              onClick={(e) => {
                e.stopPropagation();
                openTool(t.id);
              }}
              className={`min-h-0 min-w-0 flex items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06] px-1 hover:bg-white/[0.09] hover:border-white/[0.12] transition-colors ${
                compact ? 'flex-row gap-1.5 py-1' : 'flex-col gap-1.5 py-2'
              }`}
            >
              <span
                className={`flex items-center justify-center bg-indigo-500 text-white shadow-[0_1px_4px_rgba(0,0,0,0.3)] ring-1 ring-black/20 shrink-0 ${
                  compact ? 'w-7 h-7 rounded-lg' : 'w-10 h-10 rounded-xl'
                }`}
              >
                <Icon size={compact ? 14 : 19} />
              </span>
              <span className={`leading-tight text-white/75 whitespace-nowrap ${compact ? 'text-[11px]' : 'text-center text-xs'}`}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
