import requests
import feedparser
import datetime
import json
import os

SAVE_PATH = "ai_news.json"
HTML_OUTPUT = "ai_news.html"
RETENTION_DAYS = 3

RSS_URLS = [
    "https://www.36kr.com/feed",
    "https://www.qbitai.com/feed",
]

def fetch_rss_news():
    news_list = []
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    for rss_url in RSS_URLS:
        try:
            feed = feedparser.parse(rss_url)
            source = "36氪" if "36kr" in rss_url else "量子位"

            for entry in feed.entries[:15]:
                if "AI" in entry.title or "人工智能" in entry.title or "大模型" in entry.title or "GPT" in entry.title or "Sora" in entry.title or "Claude" in entry.title or "Kimi" in entry.title or "Gemini" in entry.title or "Midjourney" in entry.title or "Suno" in entry.title or "视频生成" in entry.title or "图像生成" in entry.title:
                    news = {
                        "title": entry.title,
                        "link": entry.link,
                        "source": source,
                        "publish_time": entry.published if hasattr(entry, 'published') else now_str,
                        "crawl_time": now_str,
                        "summary": entry.summary[:200] if hasattr(entry, 'summary') else ""
                    }
                    if news["title"]:
                        news_list.append(news)
        except Exception as e:
            print(f"❌ 获取 {rss_url} 失败：{e}")

    print(f"✅ 从RSS获取到 {len(news_list)} 条AI新闻")
    return news_list

def save_news(news_list):
    existing = []
    if os.path.exists(SAVE_PATH):
        with open(SAVE_PATH, "r", encoding="utf-8") as f:
            existing = json.load(f)

    exist_keys = {(n["title"], n["link"]) for n in existing}
    new_news = [n for n in news_list if (n["title"], n["link"]) not in exist_keys]

    all_news = existing + new_news
    cutoff = (datetime.datetime.now() - datetime.timedelta(days=RETENTION_DAYS)).strftime("%Y-%m-%d")
    all_news = [n for n in all_news if n["crawl_time"].split()[0] >= cutoff]

    with open(SAVE_PATH, "w", encoding="utf-8") as f:
        json.dump(all_news, f, ensure_ascii=False, indent=2)

    print(f"📥 新增 {len(new_news)} 条，当前总新闻：{len(all_news)}")

def build_html():
    if not os.path.exists(SAVE_PATH):
        print("⚠️ 无新闻数据")
        return

    with open(SAVE_PATH, "r", encoding="utf-8") as f:
        news = json.load(f)

    news.sort(key=lambda x: x["crawl_time"], reverse=True)

    html = f"""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>AI 新闻（仅保留3天）</title>
<style>
body{{font-family:PingFang SC,Microsoft YaHei,sans-serif;max-width:1000px;margin:30px auto;padding:0 20px;background:#f6f7f9}}
.header{{text-align:center;margin-bottom:30px}}
.news{{background:#fff;border-radius:12px;padding:18px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,.04)}}
.title{{font-size:16px;font-weight:500;margin:0 0 8px 0}}
.title a{{color:#222;text-decoration:none}}
.title a:hover{{color:#007bff}}
.meta{{font-size:12px;color:#888;margin-bottom:8px}}
.summary{{font-size:14px;color:#444;line-height:1.6;margin:0}}
</style>
</head>
<body>
<div class="header">
<h2>AI 新闻 · 自动更新（仅3天）</h2>
<p>更新时间：{datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}</p>
</div>
"""

    for n in news:
        html += f'''
<div class="news">
<div class="meta">{n['source']} · {n['publish_time'][:10] if n['publish_time'] else ''}</div>
<div class="title"><a href="{n['link']}" target="_blank">{n['title']}</a></div>
<div class="summary">{n['summary'][:100] if n['summary'] else '暂无简介'}</div>
</div>
'''

    html += "</body></html>"

    with open(HTML_OUTPUT, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"🌐 HTML 已生成：{HTML_OUTPUT}")

def main():
    print("🚀 开始获取 AI 新闻...")
    news = fetch_rss_news()
    if news:
        save_news(news)
        build_html()
    else:
        print("⚠️ 未获取到任何新闻")

if __name__ == "__main__":
    main()
