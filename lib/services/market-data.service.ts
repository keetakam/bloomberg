import type { MarketData, MarketItem } from "@/lib/models/market-data.model";
import type { IMarketDataRepository } from "@/lib/repositories/IMarketDataRepository";
import { AlphaVantageRepository } from "@/lib/repositories/alpha-vantage.repository";
import { FallbackRepository } from "@/lib/repositories/fallback.repository";
import { RedisMarketDataRepository } from "@/lib/repositories/redis.repository";
import { MarketSimulationService } from "./market-simulation.service";

const REGIONS = ["americas", "emea", "asiaPacific"] as const;

export class MarketDataService {
  private redisRepo: RedisMarketDataRepository;
  private alphaVantageRepo: IMarketDataRepository;
  private fallbackRepo: IMarketDataRepository;
  private simulation: MarketSimulationService;

  constructor() {
    this.redisRepo = new RedisMarketDataRepository();
    this.alphaVantageRepo = new AlphaVantageRepository();
    this.fallbackRepo = new FallbackRepository();
    this.simulation = new MarketSimulationService(this.redisRepo);
  }

  async getMarketData(): Promise<MarketData & { isFromRedis: boolean; lastFetched: string }> {
    const cached = await this.redisRepo.get();

    if (cached) {
      return { ...cached, isFromRedis: true, lastFetched: new Date().toISOString() };
    }

    const fallback = await this.fallbackRepo.getFallback();
    return { ...fallback, isFromRedis: false, lastFetched: new Date().toISOString() };
  }

  async updateMarketData(): Promise<void> {
    const current = (await this.redisRepo.get()) ?? (await this.fallbackRepo.getFallback());
    const updated = await this.simulation.generateUpdates(current);
    updated.lastUpdated = new Date().toISOString();
    await this.redisRepo.save(updated, 3600);
  }

  async seedMarketData(): Promise<{ source: string }> {
    const alphaData = await this.alphaVantageRepo.get();

    if (alphaData) {
      const dataWithTimestamp = { ...alphaData, lastUpdated: new Date().toISOString() };
      await this.redisRepo.save(dataWithTimestamp, 3600);
      return { source: alphaData.dataSource || "alpha-vantage" };
    }

    const fallback = await this.fallbackRepo.getFallback();
    await this.redisRepo.save(fallback, 3600);
    return { source: "fallback" };
  }

  async refreshFromAlphaVantage(): Promise<void> {
    const existing = (await this.redisRepo.get()) as
      | (MarketData & { lastFullRefresh?: string })
      | null;

    if (existing && !this.shouldRefresh(existing)) {
      console.log("Recent market data found in Redis, skipping refresh");
      return;
    }

    const data = await this.alphaVantageRepo.get();
    if (!data) throw new Error("Not enough data received from Alpha Vantage");

    const stamped = {
      ...data,
      lastUpdated: new Date().toISOString(),
      lastFullRefresh: new Date().toISOString(),
    };
    await this.redisRepo.save(stamped, 48 * 60 * 60);
    console.log("Market data successfully refreshed and stored in Redis");
  }

  getMarketMovers(data: MarketData, threshold = 1.0): MarketItem[] {
    return REGIONS.flatMap((region) =>
      data[region].filter((item) => Math.abs(item.pctChange) > threshold)
    ).sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange));
  }

  getVolatileMarkets(data: MarketData, threshold = 1.5): MarketItem[] {
    return REGIONS.flatMap((region) => data[region].filter((item) => item.avat > threshold)).sort(
      (a, b) => b.avat - a.avat
    );
  }

  private shouldRefresh(data: { lastFullRefresh?: string }): boolean {
    if (!data.lastFullRefresh) return true;
    const hoursSince = (Date.now() - new Date(data.lastFullRefresh).getTime()) / (1000 * 60 * 60);
    return hoursSince > 23;
  }
}
