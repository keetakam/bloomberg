import type { MarketData, MarketItem } from "@/lib/models/market-data.model";

const REGIONS = ["americas", "emea", "asiaPacific"] as const;

/**
 * Fetches all market data from the API
 */
export async function fetchAllMarketData(): Promise<MarketData> {
  const response = await fetch("/api/market-data");

  if (!response.ok) {
    throw new Error(`Failed to fetch market data: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetches market data for a specific region
 * @param region The region to fetch data for (americas, emea, asiaPacific)
 */
export async function fetchRegionMarketData(region: string): Promise<MarketItem[]> {
  const allData = await fetchAllMarketData();
  return (allData[region] as MarketItem[]) || [];
}

/**
 * Fetches market data for a specific market item by ID
 * @param id The ID of the market item to fetch
 */
export async function fetchMarketItemById(id: string): Promise<MarketItem | null> {
  const allData = await fetchAllMarketData();
  for (const region of REGIONS) {
    const item = allData[region].find((i) => i.id === id);
    if (item) return item;
  }
  return null;
}

/**
 * Fetches market movers (items with >1% price change)
 */
export async function fetchMarketMovers(): Promise<MarketItem[]> {
  const allData = await fetchAllMarketData();
  return REGIONS.flatMap((region) =>
    allData[region].filter((item) => Math.abs(item.pctChange) > 1.0)
  ).sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange));
}

/**
 * Fetches high-volatility market items
 */
export async function fetchVolatileMarkets(): Promise<MarketItem[]> {
  const allData = await fetchAllMarketData();
  return REGIONS.flatMap((region) => allData[region].filter((item) => item.avat > 1.5)).sort(
    (a, b) => b.avat - a.avat
  );
}

/**
 * Triggers a manual refresh of the market data
 */
export async function refreshMarketData(): Promise<{ success: boolean }> {
  const response = await fetch("/api/market-data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "update" }),
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh market data: ${response.status}`);
  }

  return response.json();
}
