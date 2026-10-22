import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { applyDisplayPrefs, loadDisplayPrefs } from './store/displayPrefs';

// 首帧渲染前先把本机显示偏好（主题/底框透明度）落到 <html>，避免白天模式用户先闪一帧暗夜
applyDisplayPrefs(loadDisplayPrefs());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
