/**
 * Centralized query keys for React Query
 * This helps maintain consistency and enables proper cache invalidation
 */

export const queryKeys = {
  marketData: {
    all: ["marketData"] as const,
    base: () => [...queryKeys.marketData.all] as const,
    list: () => [...queryKeys.marketData.base(), "list"] as const,
    region: (region: string) => [...queryKeys.marketData.list(), { region }] as const,
    detail: (id: string) => [...queryKeys.marketData.base(), { id }] as const,
  },
  news: {
    all: ["news"] as const,
    sources: () => [...queryKeys.news.all, "sources"] as const,
    byTicker: (ticker: string, source?: string, sentiment?: string) =>
      [
        ...queryKeys.news.all,
        "byTicker",
        { ticker, source: source ?? "all", sentiment: sentiment ?? "all" },
      ] as const,
  },
  marketMovers: {
    all: ["marketMovers"] as const,
    list: () => [...queryKeys.marketMovers.all, "list"] as const,
  },
  volatility: {
    all: ["volatility"] as const,
    list: () => [...queryKeys.volatility.all, "list"] as const,
  },
};
