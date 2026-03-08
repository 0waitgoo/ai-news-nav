# AI新闻导航 - 内容同步更新 产品需求文档

## Overview
- **Summary**: 检查并同步更新本地代码与线上版本 https://news.hiitun01.top/ 的内容一致性
- **Purpose**: 确保本地开发版本与线上生产版本内容保持一致
- **Target Users**: 开发者维护人员

## Goals
- 确认 NewsWidget 中的 AI 应用数据与线上版本一致
- 确认 TrendingWidget 中的热门话题数据与线上版本一致
- 确认盒豚查图标路径正确（已完成）
- 确认所有链接可访问

## Non-Goals (Out of Scope)
- 不添加新功能
- 不修改 UI 样式
- 不更新技术架构

## Background & Context
- 线上版本显示内容：Claude（今日最热，+38%，3.1亿）、Midjourney（+52%）、Notion AI（+33%）、Copilot（+28%）
- 热门话题：#Sora（12.4万）、#Kimi（9.8万）、#可灵（4.5万）、#Suno（3.2万）
- 盒豚查图标已复制到 public/icon_APP/ 目录

## Functional Requirements
- **FR-1**: 验证 NewsWidget 数据显示与线上版本一致
- **FR-2**: 验证 TrendingWidget 热门话题数据正确
- **FR-3**: 验证盒豚查图标可正常访问
- **FR-4**: 验证所有 AI 应用链接正确

## Non-Functional Requirements
- **NFR-1**: 页面加载无明显延迟
- **NFR-2**: 无 404 资源加载错误

## Constraints
- **Technical**: React + TypeScript + Vite
- **Dependencies**: 无外部 API

## Acceptance Criteria

### AC-1: NewsWidget 数据验证
- **Given**: 用户访问首页
- **When**: 查看今日最热和热门榜单
- **Then**: 显示 Claude（+38%，3.1亿）、Midjourney（+52%）、Notion AI（+33%）、Copilot（+28%）
- **Verification**: `human-judgment`

### AC-2: 热门话题验证
- **Given**: 用户查看热门话题组件
- **Then**: 显示 #Sora（12.4万）、#Kimi（9.8万）、#可灵（4.5万）、#Suno（3.2万）
- **Verification**: `human-judgment`

### AC-3: 盒豚查图标验证
- **Given**: 用户访问 AI 导航页面
- **Then**: 盒豚查图标正常显示
- **Verification**: `programmatic`

### AC-4: 链接可访问性
- **Given**: 用户点击 AI 应用
- **Then**: 正确打开对应网站
- **Verification**: `human-judgment`

## Open Questions
- [ ] 今日最热应用是否需要固定为 Claude（目前是随机每日更换）？
