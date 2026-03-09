import { marketData as staticData } from "@/components/bloomberg/lib/marketData";
import { generateRandomSparkline } from "@/lib/alpha-vantage";
import type { MarketData, MarketItem } from "@/lib/models/market-data.model";
import type { IMarketDataRepository } from "./IMarketDataRepository";

export class FallbackRepository implements IMarketDataRepository {
  async get(): Promise<MarketData | null> {
    return null;
  }

  async save(): Promise<void> {
    // no-op: fallback is read-only static data
  }

  async getFallback(): Promise<MarketData> {
    const now = new Date().toISOString();
    const regions = ["americas", "emea", "asiaPacific"] as const;

    const result = regions.reduce<MarketData>(
      (acc, region) => {
        acc[region] = (staticData[region] as MarketItem[]).map((item) => ({
          id: item.id || `item-${Math.random().toString(36).substring(2, 9)}`,
          num: item.num || "",
          rmi: item.rmi || "",
          value: item.value || 0,
          change: item.change || 0,
          pctChange: item.pctChange || 0,
          avat: item.avat || 0,
          time: new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          ytd: item.ytd || 0,
          ytdCur: item.ytdCur || 0,
          sparkline1: generateRandomSparkline(),
          sparkline2: generateRandomSparkline(),
          lastUpdated: now,
          sparklineUpdated: now,
        }));
        return acc;
      },
      { ...staticData, americas: [], emea: [], asiaPacific: [] } as MarketData
    );

    result.lastUpdated = now;
    result.lastSparklineUpdate = now;
    result.isFromRedis = false;
    result.dataSource = "fallback";

    return result;
  }
}
