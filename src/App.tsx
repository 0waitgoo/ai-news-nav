import React, { useState, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import HomePage from './components/v2/HomePage';
import DarkVeil from './components/DarkVeil';

const NewsPage = React.lazy(() => import('./components/pages/NewsPage'));
const NavPage = React.lazy(() => import('./components/pages/NavPage'));

export default function App() {
  const [bgImage, setBgImage] = useState('https://picsum.photos/seed/bg/2564/1920');
  const [currentPage, setCurrentPage] = useState('home');

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handlePageChange} />;
      case 'news':
        return <NewsPage />;
      case 'nav':
        return <NavPage />;
      default:
        return <HomePage onNavigate={handlePageChange} />;
    }
  };

  return (
    <div className="relative min-h-screen w-full text-white bg-black">
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 z-0 transition-all duration-1000 ease-in-out"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[8px]"></div>
        {/* DarkVeil Background */}
        <div className="absolute inset-0 z-1">
          <DarkVeil
            hueShift={0}
            noiseIntensity={0}
            scanlineIntensity={0}
            speed={1}
            scanlineFrequency={0}
            warpAmount={2}
          />
        </div>
      </div>

      {/* Main Content */}
      {/* h-dvh 固定视口高度：让内部 overflow-y-auto 容器成为真正的滚动区，position: sticky 吸顶才有可依附的滚动容器 */}
      <div className="relative z-10 flex flex-col h-dvh w-full p-3 sm:p-4 md:p-6 gap-4 sm:gap-6 max-w-[1600px] mx-auto">
        {/* 主页的导航图标已并入 HomePage 吸顶栏左半（一行对齐）；资讯/导航页没有搜索栏，仍用独立的居中导航行 */}
        {(currentPage === 'news' || currentPage === 'nav') && (
          <Sidebar onPageChange={handlePageChange} currentPage={currentPage} />
        )}
        <main className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto pb-20 sm:pb-6">
            <Suspense fallback={<div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            </div>}>
              {renderCurrentPage()}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
