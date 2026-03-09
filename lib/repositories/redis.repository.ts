import type { MarketData } from "@/lib/models/market-data.model";
import { redis } from "@/lib/redis";
import type { IMarketDataRepository } from "./IMarketDataRepository";
import { FallbackRepository } from "./fallback.repository";

export class RedisMarketDataRepository implements IMarketDataRepository {
  private fallback = new FallbackRepository();

  async get(): Promise<MarketData | null> {
    try {
      await redis.ping();
      const data = await redis.get("market_data");
      return (data as MarketData) ?? null;
    } catch {
      return null;
    }
  }

  async save(data: MarketData, ttlSeconds = 3600): Promise<void> {
    try {
      await redis.ping();
      await redis.set("market_data", data, { ex: ttlSeconds });
    } catch (error) {
      console.warn("Redis save failed:", error);
    }
  }

  async getLastSparklineUpdate(): Promise<number | null> {
    try {
      const stored = await redis.get("last_sparkline_update");
      return stored ? Number.parseInt(stored as string, 10) : null;
    } catch {
      return null;
    }
  }

  async saveLastSparklineUpdate(timestamp: number): Promise<void> {
    try {
      await redis.set("last_sparkline_update", timestamp.toString());
    } catch (error) {
      console.warn("Redis sparkline timestamp save failed:", error);
    }
  }

  async getFallback(): Promise<MarketData> {
    return this.fallback.getFallback();
  }
}
