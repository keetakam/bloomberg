import type { NewsArticle } from "@/lib/models/news.model";

const BASE_URL = "https://eodhd.com/api/news";

export class EodhdRepository {
  private apiKey = process.env.EODHD_API_KEY;

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async getNews(ticker: string): Promise<NewsArticle[]> {
    if (!this.apiKey) return [];

    try {
      const url = `${BASE_URL}?s=${ticker}.US&fmt=json&limit=20&api_token=${this.apiKey}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return [];

      const data = await res.json();
      if (!Array.isArray(data)) return [];

      return data.map((item: { title: string; content: string; link: string; date: string }) => ({
        source: "eodhd" as const,
        title: item.title ?? "",
        summary: item.content ?? "",
        url: item.link ?? "",
        published: item.date ?? "",
        ticker: ticker.toUpperCase(),
        sentiment: null,
      }));
    } catch (error) {
      console.warn("EodhdRepository error:", error);
      return [];
    }
  }
}
