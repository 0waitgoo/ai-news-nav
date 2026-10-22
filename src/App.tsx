import React, { useEffect, useState, Suspense } from 'react';
import { TopNav } from './components/Sidebar';
import BackgroundMenu from './components/v2/BackgroundMenu';
import HomePage from './components/v2/HomePage';
import TopBarShade from './components/v2/TopBarShade';
import BinaryOrbits from './components/BinaryOrbits';
import DarkVeil from './components/DarkVeil';
import { backgroundPresetOf, useLocalStore } from './store/localStore';
import { loadBgImage } from './store/bgImageDb';
import { applyDisplayPrefs, useDisplayPrefs } from './store/displayPrefs';

const NewsPage = React.lazy(() => import('./components/pages/NewsPage'));
const NavPage = React.lazy(() => import('./components/pages/NavPage'));
const ToolsPage = React.lazy(() => import('./components/pages/ToolsPage'));

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  // 全站共用一份本地 store（App 持有，传给 HomePage）：背景设置也在这里读
  const store = useLocalStore();
  const background = store.data.background;
  const preset = backgroundPresetOf(background.presetId);

  // 本机显示偏好（第四十二轮）：外观模式 + 编组卡底框透明度，写到 <html> 供样式层消费。
  // 白天模式的最终定义（第五十八轮收敛）：与暗夜完全相同、只有 B/C/组合卡卡面变白底深字——
  // 背景层不因主题做任何区分渲染（旧版「白天压白遮罩洗浅背景」已撤除，见下方遮罩注释）。
  const displayPrefs = useDisplayPrefs();
  useEffect(() => {
    applyDisplayPrefs(displayPrefs);
  }, [displayPrefs]);

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
      case 'tools':
        return <ToolsPage />;
      default:
        return <HomePage onNavigate={handlePageChange} store={store} />;
    }
  };

  const showLocalImage = background.kind === 'local' && !!localUrl;
  // 「深海蓝」预设换成 Binary Orbits 动态背景（第四十四轮）：只在该预设被选中时挂载，
  // 底色用与组件一致的深蓝 #030b1f 兜底（组件加载前/画布外不露其他预设色）
  const showOceanDynamics = background.kind === 'preset' && background.presetId === 'ocean';

  return (
    <div className="relative min-h-screen w-full text-white bg-black">
      {/* 全页固定背景层：底层永远是当前预设（纯 CSS），本地图片就绪后淡入覆盖其上，
          再压深色遮罩保证卡片文字可读；默认预设额外保留 DarkVeil 纹理层，维持原观感 */}
      <div
        className="fixed inset-0 z-0 overflow-hidden transition-all duration-700"
        style={{ background: showOceanDynamics ? '#030b1f' : preset.css }}
      >
        {showOceanDynamics && <BinaryOrbits interactive={false} clickRipple={false} className="absolute inset-0" />}
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
        {/* 遮罩：三档外观一律压黑保文字可读。白天旧版曾改压白（bg-white/55）洗浅整个背景，
            用户实测「整个页面被一层白雾罩住发灰发白」后于第五十八轮撤除——白天只让编组卡
            卡面变白（index.css 作用域规则），背景层与暗夜像素级一致，不叠任何白色 veil */}
        <div
          className={`absolute inset-0 bg-black/50 ${showLocalImage ? 'backdrop-blur-[6px]' : ''}`}
        ></div>
        {/* DarkVeil Background（仅默认预设：三档外观都在，背景层不随主题变的口径下与暗夜一致） */}
        {background.kind === 'preset' && background.presetId === 'violet' && (
          <div className="absolute inset-0 z-1">
            <DarkVeil hueShift={0} noiseIntensity={0} scanlineIntensity={0} speed={1} scanlineFrequency={0} warpAmount={2} />
          </div>
        )}
      </div>

      {/* Main Content */}
      {/* h-dvh 固定视口高度：让内部 overflow-y-auto 容器成为真正的滚动区，position: sticky 吸顶才有可依附的滚动容器 */}
      <div className="relative z-10 flex flex-col h-dvh w-full p-3 sm:p-4 md:p-6 gap-4 sm:gap-6 max-w-[1600px] mx-auto">
        {/* 子页面顶栏与主页吸顶栏同款渲染（第四十三轮修漂移）：同样的 4 栏 grid 左半——
            背景按钮 + 导航图标组，位置/间距/高亮与主页完全一致，不再用旧的居中导航行；
            右半（搜索/数据）是主页专属，子页面留空占位保持左半位置不变 */}
        {(currentPage === 'news' || currentPage === 'nav' || currentPage === 'tools') && (
          /* 不带主页那条的 -mt-1：主页吸顶栏在滚动容器内、边距折叠后净偏移与此处不同，
             实测去掉后三页图标组 Y 坐标一致（均为主页基准） */
          <div className="sticky top-0 z-50 pt-1 pb-2 shrink-0">
            {/* 遮挡带与主页顶栏同款（第五十九轮），样式见 index.css .topbar-shade */}
            <TopBarShade />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-center">
              <div className="col-span-1 lg:col-span-2 flex items-center justify-start gap-2 min-w-0">
                <BackgroundMenu store={store} />
                <TopNav onPageChange={handlePageChange} currentPage={currentPage} />
              </div>
              <div className="col-span-1 lg:col-span-2" />
            </div>
          </div>
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
