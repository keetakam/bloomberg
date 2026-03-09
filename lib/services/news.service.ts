import type {
  NewsArticle,
  NewsSentiment,
  NewsSource,
  NewsSourceInfo,
} from "@/lib/models/news.model";
import { redis } from "@/lib/redis";
import { AlphaVantageNewsRepository } from "@/lib/repositories/news/alpha-vantage-news.repository";
import { EodhdRepository } from "@/lib/repositories/news/eodhd.repository";
import { FinnhubRepository } from "@/lib/repositories/news/finnhub.repository";
import { NewsApiRepository } from "@/lib/repositories/news/newsapi.repository";
import { PolygonRepository } from "@/lib/repositories/news/polygon.repository";

const CACHE_TTL = Number(process.env.NEWS_CACHE_TTL ?? 900);

export class NewsService {
  private finnhub = new FinnhubRepository();
  private alphaVantage = new AlphaVantageNewsRepository();
  private eodhd = new EodhdRepository();
  private polygon = new PolygonRepository();
  private newsapi = new NewsApiRepository();

  getSources(): NewsSourceInfo[] {
    return [
      { id: "finnhub", name: "Finnhub", available: this.finnhub.isAvailable() },
      { id: "alphavantage", name: "Alpha Vantage", available: this.alphaVantage.isAvailable() },
      { id: "eodhd", name: "EODHD", available: this.eodhd.isAvailable() },
      { id: "polygon", name: "Polygon", available: this.polygon.isAvailable() },
      { id: "newsapi", name: "NewsAPI", available: this.newsapi.isAvailable() },
    ];
  }

  async getNews(
    ticker: string,
    source?: NewsSource,
    sentiment?: NewsSentiment
  ): Promise<{ articles: NewsArticle[]; cached: boolean }> {
    const cacheKey = `news_${ticker.toUpperCase()}_${source ?? "all"}_${sentiment ?? "all"}`;

    // Try cache first
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        let articles = cached as NewsArticle[];
        if (sentiment) articles = articles.filter((a) => a.sentiment === sentiment);
        return { articles, cached: true };
      }
    } catch {
      // Cache miss or Redis unavailable — continue to fetch
    }

    // Fetch from sources
    const articles = await this.fetchFromSources(ticker, source);

    // Sort by published date descending
    articles.sort((a, b) => b.published.localeCompare(a.published));

    // Cache the full result (before sentiment filter)
    try {
      await redis.set(cacheKey, articles, { ex: CACHE_TTL });
    } catch {
      // Non-critical — continue without caching
    }

    const filtered = sentiment ? articles.filter((a) => a.sentiment === sentiment) : articles;
    return { articles: filtered, cached: false };
  }

  private async fetchFromSources(ticker: string, source?: NewsSource): Promise<NewsArticle[]> {
    const repos: Array<{ source: NewsSource; fetch: () => Promise<NewsArticle[]> }> = [
      { source: "finnhub", fetch: () => this.finnhub.getNews(ticker) },
      { source: "alphavantage", fetch: () => this.alphaVantage.getNews(ticker) },
      { source: "eodhd", fetch: () => this.eodhd.getNews(ticker) },
      { source: "polygon", fetch: () => this.polygon.getNews(ticker) },
      { source: "newsapi", fetch: () => this.newsapi.getNews(ticker) },
    ];

    const targets = source ? repos.filter((r) => r.source === source) : repos;
    const results = await Promise.allSettled(targets.map((r) => r.fetch()));

    return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  }
}
