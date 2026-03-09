import type { NewsArticle, NewsSentiment } from "@/lib/models/news.model";

const BASE_URL = "https://www.alphavantage.co/query";

// Parse Alpha Vantage date format: "20240301T143000"
function parseAvDate(raw: string): string {
  try {
    const year = raw.slice(0, 4);
    const month = raw.slice(4, 6);
    const day = raw.slice(6, 8);
    const hour = raw.slice(9, 11);
    const min = raw.slice(11, 13);
    const sec = raw.slice(13, 15);
    return `${year}-${month}-${day} ${hour}:${min}:${sec}`;
  } catch {
    return raw;
  }
}

function mapSentiment(label: string): NewsSentiment {
  const l = (label ?? "").toLowerCase();
  if (l.includes("bullish")) return "bullish";
  if (l.includes("bearish")) return "bearish";
  if (l.includes("neutral")) return "neutral";
  return null;
}

export class AlphaVantageNewsRepository {
  private apiKey = process.env.ALPHA_VANTAGE_API_KEY;

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async getNews(ticker: string): Promise<NewsArticle[]> {
    if (!this.apiKey) return [];

    try {
      const url = `${BASE_URL}?function=NEWS_SENTIMENT&tickers=${ticker}&apikey=${this.apiKey}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return [];

      const data = await res.json();
      if (!data.feed || !Array.isArray(data.feed)) return [];

      return data.feed.map(
        (item: {
          title: string;
          summary: string;
          url: string;
          time_published: string;
          overall_sentiment_label: string;
        }) => ({
          source: "alphavantage" as const,
          title: item.title ?? "",
          summary: item.summary ?? "",
          url: item.url ?? "",
          published: parseAvDate(item.time_published),
          ticker: ticker.toUpperCase(),
          sentiment: mapSentiment(item.overall_sentiment_label),
        })
      );
    } catch (error) {
      console.warn("AlphaVantageNewsRepository error:", error);
      return [];
    }
  }
}
