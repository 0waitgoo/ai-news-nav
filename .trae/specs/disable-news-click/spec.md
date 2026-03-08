# 禁用新闻卡片跳转 Spec

## Why
用户点击新闻卡片时当前会跳转或弹窗，但用户希望点击后没有任何行为，保持在当前页面。

## What Changes
- 禁用 NewsWidget 的点击跳转行为
- 移除 handleAppClick 的调用
- 阻止事件冒泡避免触发父元素的事件

## Impact
- Affected code: src/components/widgets/NewsWidget.tsx

## MODIFIED Requirements
### Requirement: 新闻卡片点击行为
点击新闻卡片时**不执行任何操作**，不跳转也不弹窗。

#### Scenario: 用户点击新闻卡片
- **WHEN** 用户点击 NewsWidget 组件区域
- **THEN** 页面保持不变，无任何跳转或弹窗
