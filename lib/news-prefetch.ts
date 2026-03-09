import type { NewsArticle } from "@/lib/models/news.model";
import { NewsService } from "@/lib/services/news.service";
import { turso } from "@/lib/turso";
import scheduler from "./scheduler";

/**
 * Popular tickers to pre-fetch news for.
 * Add/remove tickers here to control what gets pre-cached.
 */
const POPULAR_TICKERS = [
  "AAPL",
  "TSLA",
  "NVDA",
  "GOOGL",
  "MSFT",
  "AMZN",
  "META",
  "SPY",
  "QQQ",
  "BTC",
];

const service = new NewsService();

async function persistArticles(articles: NewsArticle[]): Promise<number> {
  if (articles.length === 0) return 0;

  let saved = 0;
  for (const a of articles) {
    try {
      const result = await turso.execute({
        sql: `INSERT OR IGNORE INTO news_articles (ticker, source, title, summary, url, sentiment, published)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          a.ticker,
          a.source,
          a.title,
          a.summary ?? null,
          a.url,
          a.sentiment ?? null,
          a.published,
        ],
      });
      if (result.rowsAffected > 0) saved++;
    } catch {
      // Skip individual failures — UNIQUE constraint or connection issue
    }
  }
  return saved;
}

async function prefetchPopularNews(): Promise<void> {
  console.log(`[NewsPrefetch] Pre-fetching news for ${POPULAR_TICKERS.length} tickers...`);

  const results = await Promise.allSettled(
    POPULAR_TICKERS.map((ticker) => service.getNews(ticker))
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  // Collect all new (non-cached) articles and persist to Turso
  const newArticles: NewsArticle[] = results.flatMap((r) =>
    r.status === "fulfilled" && !r.value.cached ? r.value.articles : []
  );

  const saved = await persistArticles(newArticles);
  console.log(
    `[NewsPrefetch] Done — ${succeeded} cached, ${failed} failed, ${saved}/${newArticles.length} new articles saved to Turso`
  );
}

// Register: runs every 15 minutes (0.25 hours)
scheduler.register("news-prefetch", "Popular Tickers News Prefetch", 0.25, prefetchPopularNews);

export default prefetchPopularNews;
