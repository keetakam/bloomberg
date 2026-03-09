export type MarketItem = {
  id: string;
  num?: string;
  rmi?: string;
  value: number;
  change: number;
  pctChange: number;
  avat: number;
  time: string;
  ytd: number;
  ytdCur: number;
  sparkline1?: number[];
  sparkline2?: number[];
  sparklineUpdated?: string;
  lastUpdated?: string;
  historicalData10D?: number[];
  volatility?: number;
  isMover?: boolean;
};

export type MarketData = {
  americas: MarketItem[];
  emea: MarketItem[];
  asiaPacific: MarketItem[];
  lastUpdated?: string;
  lastSparklineUpdate?: string;
  isFromRedis?: boolean;
  dataSource?: string;
  [key: string]: MarketItem[] | string | boolean | undefined;
};

export interface FilterState {
  showMovers: boolean;
  showVolatility: boolean;
  showRatios: boolean;
  showFutures: boolean;
  showAvat: boolean;
  show10D: boolean;
  showYTD: boolean;
  showCAD: boolean;
}
