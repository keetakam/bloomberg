import { fetchAllMarketData as fetchFromAlphaVantage } from "@/lib/alpha-vantage";
import type { MarketData } from "@/lib/models/market-data.model";
import type { IMarketDataRepository } from "./IMarketDataRepository";
import { FallbackRepository } from "./fallback.repository";

export class AlphaVantageRepository implements IMarketDataRepository {
  private fallback = new FallbackRepository();

  async get(): Promise<MarketData | null> {
    try {
      const data = await fetchFromAlphaVantage();
      const total = data.americas.length + data.emea.length + data.asiaPacific.length;
      if (total < 5) return null;
      return data;
    } catch {
      return null;
    }
  }

  async save(): Promise<void> {
    // no-op: Alpha Vantage is read-only external source
  }

  async getFallback(): Promise<MarketData> {
    return this.fallback.getFallback();
  }
}
