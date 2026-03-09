import { MarketDataController } from "@/lib/controllers/market-data.controller";

const controller = new MarketDataController();

export const GET = () => controller.seed();
