# AI新闻导航 - 内容同步更新 任务清单

## [ ] Task 1: 更新 NewsWidget 中的 AI 应用数据
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 更新 src/components/widgets/NewsWidget.tsx 中的 topApps 数据
  - 确保与线上版本一致：Claude（今日最热）、Midjourney、Notion AI、Copilot 等
  - 下载量和增长率数据也要同步
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `human-judgement` TR-1.1: 首页显示的今日最热应用为 Claude
  - `human-judgement` TR-1.2: 热门榜单包含 Midjourney、Notion AI、Copilot
  - `human-judgement` TR-1.3: 所有 AI 应用的下载量和增长率显示正确

## [ ] Task 2: 验证热门话题数据
- **Priority**: P1
- **Depends On**: None
- **Description**: 
  - 检查 TrendingWidget.tsx 中的热门话题数据
  - 确认 #Sora（12.4万）、#Kimi（9.8万）、#可灵（4.5万）、#Suno（3.2万）数据正确
- **Acceptance Criteria Addressed**: AC-2
- **Test Requirements**:
  - `human-judgement` TR-2.1: 热门话题正确显示
  - `human-judgement` TR-2.2: 帖子数量显示正确
  - `human-judgement` TR-2.3: 颜色标签匹配

## [ ] Task 3: 验证盒豚查图标可访问
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 验证盒豚生活.png 已在 public/icon_APP/ 文件夹中
  - 检查 NavWidget.tsx 和 NavPage.tsx 中的图标路径
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `programmatic` TR-3.1: 检查 public/icon_APP/盒豚生活.png 文件存在
  - `programmatic` TR-3.2: 检查 NavWidget.tsx 中的图标路径正确
  - `programmatic` TR-3.3: 检查 NavPage.tsx 中的图标路径正确

## [ ] Task 4: 验证所有链接可跳转
- **Priority**: P1
- **Depends On**: Task 1
- **Description**: 
  - 检查所有 AI 应用的链接是否正确配置
  - 点击测试主要链接
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `human-judgement` TR-4.1: 主要 AI 应用链接可正确打开
  - `human-judgement` TR-4.2: 盒豚查链接可正常跳转
