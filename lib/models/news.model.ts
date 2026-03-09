export type NewsSentiment = "bullish" | "bearish" | "neutral" | null;
export type NewsSource = "finnhub" | "alphavantage" | "eodhd" | "polygon" | "newsapi";

export interface NewsArticle {
  source: NewsSource;
  title: string;
  summary: string;
  url: string;
  published: string; // "YYYY-MM-DD HH:mm:ss"
  ticker: string;
  sentiment: NewsSentiment;
}

export interface NewsResponse {
  status: "success" | "error";
  ticker: string;
  cached: boolean;
  count: number;
  data: NewsArticle[];
}

export interface NewsSourceInfo {
  id: NewsSource;
  name: string;
  available: boolean;
}

export interface NewsSourcesResponse {
  status: "success";
  sources: NewsSourceInfo[];
}
