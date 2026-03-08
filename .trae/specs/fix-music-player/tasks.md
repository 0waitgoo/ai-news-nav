# 修复音乐播放器 - 实现计划

## [ ] 任务 1: 改进音频播放逻辑
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 修复 FloatingPlayer 和 MusicPage 中的音频播放逻辑
  - 确保音频元素正确加载和播放
  - 简化播放逻辑，避免复杂的 oncanplay 回调
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-4
- **Test Requirements**:
  - `programmatic` TR-1.1: 音频元素正确设置 src 属性
  - `programmatic` TR-1.2: 播放/暂停逻辑正确执行
  - `human-judgement` TR-1.3: 点击播放按钮后音乐可以播放
- **Notes**: 使用简单直接的播放逻辑

## [ ] 任务 2: 创建备用音乐数据服务
- **Priority**: P0
- **Depends On**: 任务 1
- **Description**:
  - 创建备用音乐数据源，使用之前的静态数据
  - 在网易云 API 失败时自动使用备用数据
  - 保持原有的音乐数据格式
- **Acceptance Criteria Addressed**: AC-3, AC-5
- **Test Requirements**:
  - `programmatic` TR-2.1: 备用音乐数据正确加载
  - `programmatic` TR-2.2: API 失败时自动切换到备用数据
  - `human-judgement` TR-2.3: 即使 API 失败，用户仍能播放音乐
- **Notes**: 备用数据使用之前的 Pixabay 音乐

## [ ] 任务 3: 修复 FloatingPlayer 组件
- **Priority**: P0
- **Depends On**: 任务 1, 任务 2
- **Description**:
  - 更新 FloatingPlayer 组件，使用备用音乐数据
  - 改进错误处理和加载状态
  - 确保音频播放功能正常工作
- **Acceptance Criteria Addressed**: AC-1, AC-3, AC-5
- **Test Requirements**:
  - `programmatic` TR-3.1: FloatingPlayer 正确加载备用数据
  - `programmatic` TR-3.2: 播放按钮正确控制播放状态
  - `human-judgement` TR-3.3: FloatingPlayer 可以正常播放音乐
- **Notes**: 保持原有的 UI 布局

## [ ] 任务 4: 修复 MusicPage 组件
- **Priority**: P0
- **Depends On**: 任务 1, 任务 2
- **Description**:
  - 更新 MusicPage 组件，使用备用音乐数据
  - 改进错误处理和加载状态
  - 确保歌曲列表和播放功能正常工作
- **Acceptance Criteria Addressed**: AC-2, AC-3, AC-5
- **Test Requirements**:
  - `programmatic` TR-4.1: MusicPage 正确加载备用数据
  - `programmatic` TR-4.2: 歌曲列表正确显示
  - `human-judgement` TR-4.3: 点击歌曲播放按钮可以播放音乐
- **Notes**: 保持原有的网格布局

## [ ] 任务 5: 测试和验证
- **Priority**: P1
- **Depends On**: 任务 3, 任务 4
- **Description**:
  - 全面测试 FloatingPlayer 和 MusicPage 的播放功能
  - 验证错误处理和备用数据功能
  - 确保用户体验流畅
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3, AC-4, AC-5
- **Test Requirements**:
  - `human-judgement` TR-5.1: 所有播放功能正常工作
  - `human-judgement` TR-5.2: 错误处理正确显示
  - `human-judgement` TR-5.3: 备用数据正常使用
- **Notes**: 在不同场景下测试
