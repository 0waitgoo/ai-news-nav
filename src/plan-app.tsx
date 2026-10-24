import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import PlanPage from './components/pages/PlanPage';
import PlanSyncBar from './components/v2/PlanSyncBar';
import { useLocalStore } from './store/localStore';
import './index.css';
import { applyDisplayPrefs, loadDisplayPrefs } from './store/displayPrefs';

// 首帧先落本机显示偏好（与网站版 main.tsx 同款，避免闪一帧）
applyDisplayPrefs(loadDisplayPrefs());

/**
 * 桌面计划应用入口（第一百一十六轮）：只渲染计划全窗页 + 同步条，
 * 与网站计划组件同一份源码（PlanPage + store），网站改计划、CI 重打安装包即一起更新。
 * AI 整理需线上接口，桌面版 v1 暂不可用（核心待办/长期计划均为本地数据，不受影响）。
 */
function PlanApp() {
  const store = useLocalStore();
  return (
    <div className="relative min-h-screen w-full text-white bg-black">
      <PlanSyncBar store={store} />
      <div className="px-3 sm:px-4 py-3">
        <PlanPage store={store} />
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PlanApp />
  </StrictMode>,
);
