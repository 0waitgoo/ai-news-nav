import React from 'react';
import { Home, Compass, Newspaper } from 'lucide-react';

/**
 * 顶部页面导航（资讯 / 首页 / 导航三图标，含选中态）。
 * 主页吸顶栏的左半直接用 TopNav；资讯/导航页仍用 Sidebar 的居中行包装。
 */
export function TopNav({ onPageChange, currentPage }: { onPageChange: (page: string) => void; currentPage: string }) {
  return (
    <nav className="flex items-center gap-1.5 sm:gap-2">
      <NavItem
        icon={<Newspaper size={20} />}
        active={currentPage === 'news'}
        onClick={() => onPageChange('news')}
      />
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
