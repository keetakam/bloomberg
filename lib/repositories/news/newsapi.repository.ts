import type { NewsArticle } from "@/lib/models/news.model";

const BASE_URL = "https://newsapi.org/v2/everything";

function nDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function formatDate(iso: string): string {
  return iso.replace("T", " ").substring(0, 19);
}

export class NewsApiRepository {
  private apiKey = process.env.NEWSAPI_API_KEY;

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async getNews(ticker: string): Promise<NewsArticle[]> {
    if (!this.apiKey) return [];

    try {
      const from = nDaysAgo(7);
      const url = `${BASE_URL}?q=${encodeURIComponent(ticker)}&sortBy=publishedAt&language=en&from=${from}&apiKey=${this.apiKey}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return [];

      const data = await res.json();
      if (!data.articles || !Array.isArray(data.articles)) return [];

      return data.articles.map(
        (item: {
          title: string;
          description: string;
          url: string;
          publishedAt: string;
        }) => ({
          source: "newsapi" as const,
          title: item.title ?? "",
          summary: item.description ?? "",
          url: item.url ?? "",
          published: formatDate(item.publishedAt),
          ticker: ticker.toUpperCase(),
          sentiment: null,
        })
      );
    } catch (error) {
      console.warn("NewsApiRepository error:", error);
      return [];
    }
  }
}
