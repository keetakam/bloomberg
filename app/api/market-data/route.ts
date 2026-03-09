import { MarketDataController } from "@/lib/controllers/market-data.controller";
import "@/lib/market-data-refresh"; // ensure scheduler is initialized

const controller = new MarketDataController();

export const GET = () => controller.get();
export const POST = (req: Request) => controller.update(req);
