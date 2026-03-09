import type { NewsArticle } from "@/lib/models/news.model";

const BASE_URL = "https://api.polygon.io/v2/reference/news";

function formatDate(iso: string): string {
  return iso.replace("T", " ").substring(0, 19);
}

export class PolygonRepository {
  private apiKey = process.env.POLYGON_API_KEY;

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async getNews(ticker: string): Promise<NewsArticle[]> {
    if (!this.apiKey) return [];

    try {
      const url = `${BASE_URL}?ticker=${ticker}&limit=20&apiKey=${this.apiKey}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return [];

      const data = await res.json();
      if (!data.results || !Array.isArray(data.results)) return [];

      return data.results.map(
        (item: {
          title: string;
          description: string;
          article_url: string;
          published_utc: string;
        }) => ({
          source: "polygon" as const,
          title: item.title ?? "",
          summary: item.description ?? "",
          url: item.article_url ?? "",
          published: formatDate(item.published_utc),
          ticker: ticker.toUpperCase(),
          sentiment: null,
        })
      );
    } catch (error) {
      console.warn("PolygonRepository error:", error);
      return [];
    }
  }
}
