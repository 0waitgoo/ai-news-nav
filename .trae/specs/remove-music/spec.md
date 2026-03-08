# 删除音乐功能规范

## Why
音乐播放功能存在跨域问题无法正常播放，需要移除所有音乐相关内容以保持应用简洁可用。

## What Changes
- 删除 MusicPage 音乐页面组件
- 删除 MusicWidget 音乐小部件组件
- 删除 FloatingPlayer 悬浮播放器组件
- 删除 neteaseMusic 网易云音乐 API 服务
- 删除 Sidebar 中的音乐导航项
- 删除 BentoGrid 中的音乐小部件
- 删除 App.tsx 中的音乐页面路由和导入

## Impact
- Affected specs: 移除音乐相关功能
- Affected code:
  - src/components/pages/MusicPage.tsx
  - src/components/widgets/MusicWidget.tsx
  - src/components/FloatingPlayer.tsx
  - src/services/neteaseMusic.ts
  - src/App.tsx
  - src/components/Sidebar.tsx
  - src/components/BentoGrid.tsx

## ADDED Requirements
无

## MODIFIED Requirements
无

## REMOVED Requirements
### Requirement: 音乐播放功能
**Reason**: 网易云音乐 API 存在跨域限制导致无法播放
**Migration**: 完全移除音乐相关功能

### Requirement: 音乐小部件
**Reason**: 音乐功能已被移除
**Migration**: 从主页网格布局中移除

### Requirement: 音乐导航
**Reason**: 音乐功能已被移除
**Migration**: 从侧边栏导航中移除
