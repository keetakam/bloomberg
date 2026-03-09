"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchNews, fetchNewsSources } from "../api/news-api";
import { queryKeys } from "../api/query-keys";

export function useNewsSources() {
  return useQuery({
    queryKey: queryKeys.news.sources(),
    queryFn: fetchNewsSources,
    staleTime: 60 * 60 * 1000, // sources don't change often
    refetchOnWindowFocus: false,
  });
}

export function useNewsData(ticker: string, source?: string, sentiment?: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.news.byTicker(ticker, source, sentiment),
    queryFn: () => fetchNews(ticker, source, sentiment),
    enabled: enabled && ticker.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 min (cache is on server for 15 min)
    refetchOnWindowFocus: false,
    gcTime: 30 * 60 * 1000,
  });
}
