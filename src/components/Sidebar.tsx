import React from 'react';
import { Compass, Wrench } from 'lucide-react';

/**
 * 顶栏 LOGO（第六十四轮）：用户提供的 public/logo.svg（白色图形），置于顶栏最左端，
 * 高度与图标行视觉齐平（28–30px、宽按 808.79:639.01 比例自动），点击回主页视图。
 * 主页与子页面两处顶栏共用同一组件渲染，位置/尺寸不漂移。
 */
export function TopLogo({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="杂盒 ZaBox · 回到主页"
      aria-label="杂盒 ZaBox · 回到主页"
      className="shrink-0 flex items-center justify-center transition-opacity duration-300 opacity-90 hover:opacity-100"
    >
      <img src="/logo.svg" alt="" draggable={false} className="h-7 sm:h-[30px] w-auto block select-none" />
    </button>
  );
}

/**
 * 顶部页面导航（导航 / 工具两图标，含选中态）。
 * 第四十三轮：资讯（报纸）图标从顶栏移除——资讯页降为 AI 资讯小组件的下级功能页，
 * 入口只保留小组件内的「进入资讯页」；三页（主页/资讯/AI导航）共用同一套顶栏渲染，位置不再漂移。
 * 第六十一轮：指南针旁新增「工具」入口（PDF 格式转换工具页），同一 TopNav 组件渲染，
 * 所有页面的顶栏自动同步出现，图标组位置不变。
 * 第六十四轮：按用户要求全部按钮去底色——不再有主页钮的紫色渐变填充、选中态的白底、
 * hover 底色，只剩白色图标本体；选中/未选中改用不透明度区分（当前页纯白、其余 55%）。
 * 第六十七轮：「主页」（房子）按钮按用户要求删除——回主页统一点左上角 LOGO（第六十四轮已实现）；
 * 主页上没有任何导航钮高亮是预期结果，子页面上当前页图标仍照常纯白高亮。
 */
export function TopNav({ onPageChange, currentPage }: { onPageChange: (page: string) => void; currentPage: string }) {
  return (
    <nav className="flex items-center gap-1.5 sm:gap-2">
      <NavItem
        icon={<Compass size={20} />}
        label="AI 导航"
        active={currentPage === 'nav'}
        onClick={() => onPageChange('nav')}
      />
      <NavItem
        icon={<Wrench size={20} />}
        label="工具"
        active={currentPage === 'tools'}
        onClick={() => onPageChange('tools')}
      />
    </nav>
  );
}

export default function Sidebar({ onPageChange, currentPage }: { onPageChange: (page: string) => void, currentPage: string }) {
  return (
    <div className="flex items-center justify-center gap-4 py-4 w-full shrink-0">
      <TopNav onPageChange={onPageChange} currentPage={currentPage} />
    </div>
  );
}

function NavItem({ icon, active = false, onClick, label }: { icon: React.ReactNode, active?: boolean, onClick?: () => void, label?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`p-2 sm:p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center ${active
        ? 'text-white'
        : 'text-white/55 hover:text-white'}`}
    >
      {icon}
    </button>
  );
}
