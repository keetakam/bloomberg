import type { NewsArticle, NewsResponse, NewsSourcesResponse } from "@/lib/models/news.model";

export async function fetchNews(
  ticker: string,
  source?: string,
  sentiment?: string
): Promise<NewsResponse> {
  const params = new URLSearchParams({ ticker });
  if (source && source !== "all") params.set("source", source);
  if (sentiment && sentiment !== "all") params.set("sentiment", sentiment);

  const res = await fetch(`/api/news?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch news: ${res.status}`);
  return res.json();
}

export async function fetchNewsSources(): Promise<NewsSourcesResponse> {
  const res = await fetch("/api/news?sources");
  if (!res.ok) throw new Error(`Failed to fetch news sources: ${res.status}`);
  return res.json();
}
