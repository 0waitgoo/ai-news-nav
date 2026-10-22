import React from 'react';
import { Home, Compass } from 'lucide-react';

/**
 * 顶部页面导航（首页 / 导航两图标，含选中态）。
 * 第四十三轮：资讯（报纸）图标从顶栏移除——资讯页降为 AI 资讯小组件的下级功能页，
 * 入口只保留小组件内的「进入资讯页」；三页（主页/资讯/AI导航）共用同一套顶栏渲染，位置不再漂移。
 */
export function TopNav({ onPageChange, currentPage }: { onPageChange: (page: string) => void; currentPage: string }) {
  return (
    <nav className="flex items-center gap-1.5 sm:gap-2">
      <NavItem
        icon={<Home size={20} />}
        active={currentPage === 'home'}
        onClick={() => onPageChange('home')}
        isHome
      />
      <NavItem
        icon={<Compass size={20} />}
        active={currentPage === 'nav'}
        onClick={() => onPageChange('nav')}
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

function NavItem({ icon, active = false, onClick, isHome = false }: { icon: React.ReactNode, active?: boolean, onClick?: () => void, isHome?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`p-2 sm:p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center ${isHome
        ? 'bg-gradient-to-br from-indigo-500/30 to-purple-500/30 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/30'
        : active
        ? 'bg-white/15 text-white shadow-inner border border-white/10'
        : 'text-white/50 hover:text-white hover:bg-white/10'}`}
    >
      {icon}
    </button>
  );
}
