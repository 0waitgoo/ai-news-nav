import React from 'react';
import type { NavGroup } from '../../data/groups';
import type { ComboItem, LocalStore } from '../../store/localStore';
import { StackCardFrame, StackGroupIcon, StackSiteTiles } from './GroupStackCard';

/**
 * C 卡组合卡（第二十一轮）：两个文件夹式编组合并成一张卡，占一个网格位。
 * - 顶部左右双 tab 头：各显示该组的头图标（与普通 C 卡同规则）+ 组名；当前 tab 高亮、另一个变暗
 * - 顶部两个文件夹小角：左块对齐左 tab、右块对齐右 tab，颜色各自 = 对应组的 tabColor，常驻不随 tab 切换变化（第三十三轮）
 * - 下方瓷砖区 = 当前 tab 组的站点，排版规则与普通 C 卡完全一致（StackSiteTiles，含第二十二轮 2x 五列网格）
 * - 点另一个 tab 标题 = 切换（activeGroupId 落盘持久化）；点瓷砖 = 打开站点；
 *   点卡身空白处（tab 头与瓷砖以外的区域）= 打开组合弹窗（ComboPanel）
 * - 按住任一 tab 头拖动 = 把该组拖出组合（拖影为该组的普通 C 卡面，落点即独立卡位置，组合随之解散）；
 *   尺寸与拆分走主页右键菜单（尺寸存 groupLayouts 的 combo key）
 */
export default function ComboCard({
  combo,
  groups,
  store,
  onOpen,
  delay = 0,
  colSpan = 1,
  heightUnits = 1,
}: {
  combo: ComboItem;
  /** 按 combo.groupIds 顺序解析出的两个组：[左, 右] */
  groups: [NavGroup, NavGroup];
  store: LocalStore;
  onOpen: (combo: ComboItem) => void;
  delay?: number;
  colSpan?: 1 | 2;
  heightUnits?: 1 | 2;
}) {
  const active = groups.find((g) => g.id === combo.activeGroupId) ?? groups[0];

  const switchTab = (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation();
    if (groupId !== active.id) store.setComboActive(combo.id, groupId);
  };

  return (
    <StackCardFrame
      tabColor={active.tabColor ?? ''}
      tabEars={[groups[0].tabColor ?? '', groups[1].tabColor ?? '']}
      onClick={() => onOpen(combo)}
      delay={delay}
      ariaLabel={`组合卡：${groups[0].name} 与 ${groups[1].name}`}
      rootProps={{ 'data-combo-card': combo.id }}
    >
      {/* 双 tab 头：左右各一个组（头图标 + 组名），当前高亮、另一个变暗；中间一条竖分隔 */}
      <div className="flex items-stretch gap-1 min-w-0">
        {groups.map((g, i) => {
          const isActive = g.id === active.id;
          return (
            <React.Fragment key={g.id}>
              {i === 1 && <div className="w-px bg-white/10 shrink-0 my-1" />}
              <button
                type="button"
                data-combo-tab={g.id}
                data-combo-tab-active={isActive ? 'true' : 'false'}
                data-combo-tab-drag=""
                data-combo-id={combo.id}
                data-group-id={g.id}
                onClick={(e) => switchTab(e, g.id)}
                title={g.name}
                className={`flex-1 flex items-center gap-2 min-w-0 px-1.5 py-1 rounded-[10px] transition-all ${
                  isActive ? 'bg-white/[0.07] opacity-100' : 'opacity-45 hover:opacity-75'
                }`}
              >
                <StackGroupIcon group={g} size={26} />
                <span className="flex-1 min-w-0 font-bold text-[14px] tracking-tight truncate text-left">{g.name}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* 口线：与普通 C 卡一致 */}
      <div className="mt-3 h-px bg-white/[0.08] shrink-0" />

      {/* 瓷砖区：当前 tab 组的站点，规则与普通 C 卡一致 */}
      <StackSiteTiles group={active} colSpan={colSpan} heightUnits={heightUnits} />
    </StackCardFrame>
  );
}
