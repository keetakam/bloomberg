import type { MarketData } from "@/lib/models/market-data.model";

export interface IMarketDataRepository {
  get(): Promise<MarketData | null>;
  save(data: MarketData, ttlSeconds?: number): Promise<void>;
  getFallback(): Promise<MarketData>;
}
