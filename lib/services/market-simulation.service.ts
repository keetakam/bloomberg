import { generateRandomSparkline } from "@/lib/alpha-vantage";
import type { MarketData, MarketItem } from "@/lib/models/market-data.model";
import type { RedisMarketDataRepository } from "@/lib/repositories/redis.repository";

const SPARKLINE_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

export class MarketSimulationService {
  constructor(private redisRepo?: RedisMarketDataRepository) {}

  async generateUpdates(data: MarketData): Promise<MarketData> {
    try {
      const yearStartValues = this.initYearStartValues(data);
      const marketSentiment = Math.random() * 2 - 1;
      const regionFactors = {
        americas: marketSentiment * 0.7 + (Math.random() * 0.6 - 0.3),
        emea: marketSentiment * 0.7 + (Math.random() * 0.6 - 0.3),
        asiaPacific: marketSentiment * 0.7 + (Math.random() * 0.6 - 0.3),
      };

      const shouldUpdateSparklines = await this.checkSparklineUpdate();

      const regions = ["americas", "emea", "asiaPacific"] as const;
      const updatedData = regions.reduce<MarketData>(
        (acc, region) => {
          acc[region] = data[region].map((item) =>
            this.updateItem(
              item,
              regionFactors[region],
              marketSentiment,
              yearStartValues,
              shouldUpdateSparklines
            )
          );
          return acc;
        },
        { ...data }
      );

      updatedData.lastSparklineUpdate = shouldUpdateSparklines
        ? new Date().toISOString()
        : data.lastSparklineUpdate || new Date().toISOString();

      return updatedData;
    } catch (error) {
      console.error("Error in generateUpdates:", error);
      return data;
    }
  }

  private initYearStartValues(data: MarketData): Record<string, number> {
    const yearStartValues: Record<string, number> = {};
    for (const region of ["americas", "emea", "asiaPacific"] as const) {
      for (const item of data[region]) {
        if (typeof item.value === "number" && typeof item.ytd === "number") {
          yearStartValues[item.id] = item.value / (1 + item.ytd / 100);
        } else {
          yearStartValues[item.id] = item.value * 0.9;
        }
      }
    }
    return yearStartValues;
  }

  private async checkSparklineUpdate(): Promise<boolean> {
    const currentTime = Date.now();
    let lastUpdate = currentTime - SPARKLINE_UPDATE_INTERVAL - 1;

    if (this.redisRepo) {
      const stored = await this.redisRepo.getLastSparklineUpdate();
      if (stored) lastUpdate = stored;
    }

    const shouldUpdate = currentTime - lastUpdate >= SPARKLINE_UPDATE_INTERVAL;

    if (shouldUpdate && this.redisRepo) {
      await this.redisRepo.saveLastSparklineUpdate(currentTime);
    }

    return shouldUpdate;
  }

  private updateItem(
    item: MarketItem,
    regionFactor: number,
    marketSentiment: number,
    yearStartValues: Record<string, number>,
    shouldUpdateSparklines: boolean
  ): MarketItem {
    try {
      const individualFactor = Math.random() * 0.8 - 0.4;
      const combinedFactor = marketSentiment * 0.4 + regionFactor * 0.4 + individualFactor * 0.2;

      let volatilityMultiplier = 1.0;
      if (
        item.id.includes("IBOVESPA") ||
        item.id.includes("HANG SENG") ||
        item.id.includes("CSI 300")
      ) {
        volatilityMultiplier = 1.5;
      } else if (item.id.includes("S&P 500") || item.id.includes("DOW JONES")) {
        volatilityMultiplier = 0.8;
      }

      const changePercent = combinedFactor * 0.2 * volatilityMultiplier;
      const newChange = item.value * (changePercent / 100);
      const newValue = item.value + newChange;
      const cumulativeChange = item.change + newChange;
      const newPctChange = (cumulativeChange / (item.value - item.change)) * 100;

      const currentHour = new Date().getHours();
      const volumeMultiplier = currentHour < 10 || currentHour > 15 ? 1.5 : 1.0;
      const newAvat = item.avat + (Math.random() * 2 - 1) * volumeMultiplier;

      const yearStartValue = yearStartValues[item.id];
      const newYtd = ((newValue - yearStartValue) / yearStartValue) * 100;
      const currencyFactor = 1 + (Math.random() * 0.1 - 0.05);
      const newYtdCur = newYtd * currencyFactor;

      let sparkline1 = item.sparkline1 || generateRandomSparkline();
      let sparkline2 = item.sparkline2 || generateRandomSparkline();
      let sparklineUpdated = item.sparklineUpdated || new Date().toISOString();

      if (shouldUpdateSparklines) {
        sparkline1 = [
          ...sparkline1.slice(1),
          Math.min(1, Math.max(0, sparkline1[sparkline1.length - 1] + (Math.random() * 0.2 - 0.1))),
        ];
        sparkline2 = [
          ...sparkline2.slice(1),
          Math.min(1, Math.max(0, sparkline2[sparkline2.length - 1] + (Math.random() * 0.2 - 0.1))),
        ];
        sparklineUpdated = new Date().toISOString();
      }

      return {
        ...item,
        value: Number.parseFloat(newValue.toFixed(2)),
        change: Number.parseFloat(cumulativeChange.toFixed(2)),
        pctChange: Number.parseFloat(newPctChange.toFixed(2)),
        avat: Number.parseFloat(newAvat.toFixed(2)),
        time: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        ytd: Number.parseFloat(newYtd.toFixed(2)),
        ytdCur: Number.parseFloat(newYtdCur.toFixed(2)),
        sparkline1,
        sparkline2,
        sparklineUpdated,
        lastUpdated: new Date().toISOString(),
      };
    } catch {
      return {
        ...item,
        sparkline1: item.sparkline1 || generateRandomSparkline(),
        sparkline2: item.sparkline2 || generateRandomSparkline(),
        time: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        lastUpdated: new Date().toISOString(),
      };
    }
  }
}
