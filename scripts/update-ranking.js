#!/usr/bin/env node
/**
 * 软件榜数据自动更新脚本（第九十五轮重写）
 *
 * 数据来源：Product Hunt（https://www.producthunt.com）真实榜单数据。
 * 取数路径：官方 GraphQL API（需 PRODUCT_HUNT_TOKEN，配置在仓库 Secrets），
 * 取本周（ISO 周）发布产品按真实 votesCount 排序。
 * 无 token / API 失败时直接退出（exit 1），绝不写入任何兜底/编造数据，
 * 仓库里保留上一版数据文件，GitHub Actions 会标红提醒人工介入。
 * （第九十五轮实测：PH 网页端已不内嵌产品票数，抓页面拿不到可靠 votes，
 *   故不设网页抓取兜底，避免把讨论帖票数误安到产品头上。）
 *
 * 历史教训（第九十五轮审计）：旧脚本在无 token 时会把写死的 FALLBACK_DATA
 * （「1.8亿票」「4.8 分」等编造数字）落盘冒充 Product Hunt 数据，已整段删除。
 *
 * 使用方法：node scripts/update-ranking.js
 * 可选环境变量：PRODUCT_HUNT_TOKEN=<redacted> Hunt API token（GitHub Actions Secret）
 */

import fs from 'fs';
import { env } from 'node:process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRODUCT_HUNT_API = 'https://api.producthunt.com/v2/api/graphql';
const PRODUCT_HUNT_TOKEN = env['PRODUCT_HUNT_TOKEN'] || '';

// AI 相关话题/分类的关键词（沿用旧口径：榜单只收 AI 相关产品，过滤后不足时放宽用全部）
const AI_KEYWORDS = ['AI', 'artificial intelligence', 'machine learning', 'chatbot', 'GPT', 'LLM', 'generative'];

/** 本周一 00:00 UTC（ISO 周起点） */
function startOfWeekUTC(from = new Date()) {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const dow = (d.getUTCDay() + 6) % 7; // 周一 = 0
  d.setUTCDate(d.getUTCDate() - dow);
  return d;
}

function isAIProduct(product) {
  const text = `${product.name} ${product.tagline || ''} ${(product.topics || []).join(' ')}`.toLowerCase();
  return AI_KEYWORDS.some((keyword) => text.includes(keyword.toLowerCase()));
}

/** 统一收口：过滤 → 同名去重 → AI 筛选 → 按真实票数降序 → 取前 20（rank 为排序序号） */
function finalize(products, method) {
  let list = products.filter((p) => p && p.name && typeof p.votes === 'number');
  const seen = new Set();
  list = list.filter((p) => (seen.has(p.name) ? false : (seen.add(p.name), true)));

  const aiList = list.filter(isAIProduct);
  const chosen = aiList.length >= 6 ? aiList : list;
  if (aiList.length < 6) {
    console.log(`⚠️ AI 相关产品仅 ${aiList.length} 条，放宽口径使用全部 ${list.length} 条`);
  }

  const items = [...chosen]
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 20)
    .map((p, i) => {
      const item = {
        rank: i + 1,
        name: p.name,
        tagline: p.tagline || '',
        votes: p.votes,
        url: p.url || 'https://www.producthunt.com/',
      };
      if (typeof p.commentsCount === 'number') item.commentsCount = p.commentsCount;
      if (Array.isArray(p.topics) && p.topics.length) item.topics = p.topics;
      return item;
    });

  return {
    items,
    meta: {
      source: 'Product Hunt',
      period: 'week',
      method,
      generatedAt: new Date().toISOString(),
    },
  };
}

/* ---------------- 路径 1：GraphQL API（有 token 时） ---------------- */

const GET_POSTS_QUERY = `
  query GetWeekPosts($first: Int!, $postedAfter: DateTime) {
    posts(first: $first, order: POPULARITY, postedAfter: $postedAfter) {
      edges {
        node {
          name
          tagline
          url
          website
          votesCount
          commentsCount
          topics { edges { node { name } } }
        }
      }
    }
  }
`;

async function fetchViaGraphQL() {
  if (!PRODUCT_HUNT_TOKEN) {
    console.log('ℹ️ 未设置 PRODUCT_HUNT_TOKEN，跳过 GraphQL 路径');
    return null;
  }
  console.log('🚀 正在从 Product Hunt GraphQL API 获取本周数据...');
  const res = await fetch(PRODUCT_HUNT_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PRODUCT_HUNT_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      query: GET_POSTS_QUERY,
      variables: { first: 50, postedAfter: startOfWeekUTC().toISOString() },
    }),
  });
  if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  if (data.errors) throw new Error(`GraphQL error: ${JSON.stringify(data.errors)}`);
  const posts = (data.data?.posts?.edges || []).map((e) => e.node);
  console.log(`✅ GraphQL 返回 ${posts.length} 条`);
  return posts.map((p) => ({
    name: p.name,
    tagline: p.tagline || '',
    votes: p.votesCount || 0,
    url: p.website || p.url,
    commentsCount: p.commentsCount || 0,
    topics: (p.topics?.edges || []).map((e) => e.node.name),
  }));
}

/* ---------------- 主流程 ---------------- */

function generateDataFile({ items, meta }) {
  return `// AI软件排行榜 - Product Hunt 本周真实榜单（自动生成，请勿手改）
// 数据来源: Product Hunt (https://www.producthunt.com)，votes 为源站真实票数
// 更新周期: 每周一由 GitHub Actions 运行 scripts/update-ranking.js 更新
// 取数路径: ${meta.method}，生成时间: ${meta.generatedAt}

export const softwareRankingData = ${JSON.stringify(items, null, 2)};

export const rankingMeta = ${JSON.stringify(meta, null, 2)};
`;
}

async function main() {
  console.log('🚀 开始更新软件榜数据（Product Hunt 本周真实票数）...');
  let result = null;

  try {
    const viaApi = await fetchViaGraphQL();
    if (viaApi && viaApi.length) result = finalize(viaApi, 'graphql');
  } catch (e) {
    console.error('❌ GraphQL 路径失败:', e.message);
  }

  if (!result || result.items.length === 0) {
    console.error('❌ 未能取得真实榜单数据：不写入任何数据，保留上一版文件，等待人工处理。');
    console.error('   若为 token 问题：请在仓库 Settings → Secrets 配置 PRODUCT_HUNT_TOKEN 后手动重跑 workflow。');
    process.exit(1);
  }

  const outputPath = path.join(__dirname, '../api/ranking-data.js');
  fs.writeFileSync(outputPath, generateDataFile(result), 'utf8');
  console.log(`✅ 已写入 ${result.items.length} 条真实榜单（路径: ${result.meta.method}）→ ${outputPath}`);
  console.log(`   第 1 名: ${result.items[0].name}（${result.items[0].votes} 票）`);
}

main().catch((e) => {
  console.error('❌ 更新失败:', e);
  process.exit(1);
});
