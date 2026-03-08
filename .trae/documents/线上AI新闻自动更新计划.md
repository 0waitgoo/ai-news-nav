# 线上AI新闻自动更新方案

## 目标

部署一个永久线上自动运行的爬虫服务，定期抓取AI新闻，无需本地运行，无需手动操作。

## 方案：Railway 部署 Node.js 爬虫服务

### 推荐理由

* **Railway** 提供免费额度（500小时/月），足够个人使用

* 支持定时任务自动执行

* 一次配置永久运行

* 可对接Vercel或直接提供服务

## 实现步骤

### 步骤1：将Python爬虫转为Node.js

* 修改 `server/index.js`，添加RSS抓取功能

* 36氪RSS: <https://www.36kr.com/feed>

* 量子位RSS: <https://www.qbitai.com/feed>

* 保持与现有API兼容

### 步骤2：配置定时任务

* Railway 自带的定时任务 (Railway Timers)

* 每6小时自动抓取最新AI新闻

### 步骤3：Railway 部署

1. 连接GitHub仓库到Railway
2. Railway自动部署server/index.js
3. 配置环境变量（如需要）
4. 启动定时任务

### 步骤4：配置Vercel（可选）

* 如果需要，修改Vercel的API配置指向Railway服务

* 或者保持现有Vercel，Railway作为备用数据源

## 预计效果

* 爬虫服务7×24小时线上运行

* 每6小时自动抓取最新AI新闻

* 用户访问网站时获取最新内容

* 完全自动化，无需任何手动操作

## 成本

* Railway 免费额度：500小时/月

* 预计月使用量：约30小时（每6小时运行1次）

* 费用：免费

