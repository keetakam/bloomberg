import { MarketDataService } from "@/lib/services/market-data.service";
import scheduler from "./scheduler";

const service = new MarketDataService();

async function refreshMarketData(): Promise<void> {
  console.log("Starting market data refresh from Alpha Vantage...");
  await service.refreshFromAlphaVantage();
}

// Register the task with the scheduler — runs every 24 hours
scheduler.register(
  "market-data-refresh",
  "Alpha Vantage Market Data Refresh",
  24,
  refreshMarketData
);

export default refreshMarketData;
