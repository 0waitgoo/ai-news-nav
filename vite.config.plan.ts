import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

/**
 * 桌面计划应用构建配置（第一百一十六轮）：只编 plan.html 入口（计划全窗页 + 同步条），
 * 产物 dist-plan 供 Tauri 壳打包；base 用相对路径，本地文件协议下资源可达。
 * 网站版构建（vite.config.ts）不受影响。
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    base: './',
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist-plan',
      emptyOutDir: true,
      rollupOptions: {
        input: path.resolve(__dirname, 'plan.html'),
      },
    },
    server: {
      port: 5174,
    },
  };
});
