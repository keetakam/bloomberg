import type { NewsArticle } from "@/lib/models/news.model";

const BASE_URL = "https://finnhub.io/api/v1";

function formatDate(unix: number): string {
  const d = new Date(unix * 1000);
  return d.toISOString().replace("T", " ").substring(0, 19);
}

function nDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

export class FinnhubRepository {
  private apiKey = process.env.FINNHUB_API_KEY;

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async getNews(ticker: string): Promise<NewsArticle[]> {
    if (!this.apiKey) return [];

    try {
      const from = nDaysAgo(7);
      const to = new Date().toISOString().split("T")[0];
      const url = `${BASE_URL}/company-news?symbol=${ticker}&from=${from}&to=${to}&token=${this.apiKey}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return [];

      const data = await res.json();
      if (!Array.isArray(data)) return [];

      return data.map(
        (item: { headline: string; summary: string; url: string; datetime: number }) => ({
          source: "finnhub" as const,
          title: item.headline ?? "",
          summary: item.summary ?? "",
          url: item.url ?? "",
          published: formatDate(item.datetime),
          ticker: ticker.toUpperCase(),
          sentiment: null,
        })
      );
    } catch (error) {
      console.warn("FinnhubRepository error:", error);
      return [];
    }
  }
}
