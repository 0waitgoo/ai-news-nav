# AI Trend & Nav · AI 网站导航

面向中文用户的 AI 资讯与工具导航站，聚合三大块内容：

- **AI 网站导航**：按场景分类整理的 AI 工具与网站目录，一键直达。
- **AI 资讯**：AI 行业新闻列表与详情阅读，数据由服务端定时抓取更新。
- **AI 软件排行榜**：数据来自 [Product Hunt](https://www.producthunt.com)，展示评分、评价数与热度指标，由 GitHub Actions 每周自动更新。

另有音乐、壁纸等个性化小组件，整体采用 Bento 网格 + 深色氛围背景的仪表盘式界面。站点已部署上线并持续运行。

**在线访问**：https://news.hiitun01.top

## 技术栈

- React 19 + Vite 6 + TypeScript
- Tailwind CSS 4、Motion、Lucide 图标
- Express 服务端（资讯接口），部署于 Vercel（含每日 Cron 调用）

## 自动更新机制

`.github/workflows/update-ranking.yml` 每周一 02:00 (UTC) 运行 `scripts/update-ranking.js`，从 Product Hunt 拉取最新排行数据、生成 `api/ranking-data.js` 并自动提交；也可在仓库的 Actions 页面手动触发。

## 本地运行

```bash
npm install
npm run dev        # 前端开发服务器（端口 3000）
npm run server     # 资讯接口服务（可选）
```

复制 `.env.example` 为 `.env.local` 并填入 `GEMINI_API_KEY` 后，可启用 AI 相关功能。

## 维护者

由 [@0waitgoo](https://github.com/0waitgoo) 创建并独立维护。欢迎提交 Issue 与 Pull Request。

## 许可证

[MIT](LICENSE)
