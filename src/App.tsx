import React, { useEffect, useState, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import HomePage from './components/v2/HomePage';
import DarkVeil from './components/DarkVeil';
import { backgroundPresetOf, useLocalStore } from './store/localStore';
import { loadBgImage } from './store/bgImageDb';

const NewsPage = React.lazy(() => import('./components/pages/NewsPage'));
const NavPage = React.lazy(() => import('./components/pages/NavPage'));

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  // 全站共用一份本地 store（App 持有，传给 HomePage）：背景设置也在这里读
  const store = useLocalStore();
  const background = store.data.background;
  const preset = backgroundPresetOf(background.presetId);

  // 本地背景图：kind='local' 时从 IndexedDB 读 Blob 生成 object URL；读不到（换设备导入等）回落预设
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [localReady, setLocalReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;
    setLocalReady(false);
    if (background.kind === 'local') {
      void loadBgImage().then((blob) => {
        if (cancelled || !blob) return;
        url = URL.createObjectURL(blob);
        setLocalUrl(url);
      });
    } else {
      setLocalUrl(null);
    }
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
    // localStamp 变化 = 用户刚换了本地图（kind 可能同为 'local'），也要重读
  }, [background.kind, background.localStamp]);

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handlePageChange} store={store} />;
      case 'news':
        return <NewsPage />;
      case 'nav':
        return <NavPage />;
      default:
        return <HomePage onNavigate={handlePageChange} store={store} />;
    }
  };

  const showLocalImage = background.kind === 'local' && !!localUrl;

  return (
    <div className="relative min-h-screen w-full text-white bg-black">
      {/* 全页固定背景层：底层永远是当前预设（纯 CSS），本地图片就绪后淡入覆盖其上，
          再压深色遮罩保证卡片文字可读；默认预设额外保留 DarkVeil 纹理层，维持原观感 */}
      <div className="fixed inset-0 z-0 overflow-hidden transition-all duration-700" style={{ background: preset.css }}>
        {showLocalImage && (
          <img
            src={localUrl}
            alt=""
            onLoad={() => setLocalReady(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
              localReady ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
        <div className={`absolute inset-0 bg-black/50 ${showLocalImage ? 'backdrop-blur-[6px]' : ''}`}></div>
        {/* DarkVeil Background（仅默认预设） */}
        {background.kind === 'preset' && background.presetId === 'violet' && (
          <div className="absolute inset-0 z-1">
            <DarkVeil hueShift={0} noiseIntensity={0} scanlineIntensity={0} speed={1} scanlineFrequency={0} warpAmount={2} />
          </div>
        )}
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
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                </div>
              }
            >
              {renderCurrentPage()}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
