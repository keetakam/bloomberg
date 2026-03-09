import { MarketDataService } from "@/lib/services/market-data.service";
import { NextResponse } from "next/server";

export class MarketDataController {
  constructor(private service = new MarketDataService()) {}

  async get(): Promise<NextResponse> {
    try {
      const data = await this.service.getMarketData();
      return NextResponse.json(data, {
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
      });
    } catch (error) {
      console.error("MarketDataController.get error:", error);
      return NextResponse.json({ error: "Failed to fetch market data" }, { status: 500 });
    }
  }

  async update(request: Request): Promise<NextResponse> {
    try {
      const body = await request.json();

      if (body.action !== "update") {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
      }

      await this.service.updateMarketData();
      return NextResponse.json({ success: true, message: "Market data updated successfully" });
    } catch (error) {
      console.error("MarketDataController.update error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update market data" },
        { status: 200 }
      );
    }
  }

  async seed(): Promise<NextResponse> {
    try {
      const result = await this.service.seedMarketData();
      return NextResponse.json({
        success: true,
        message: "Market data processed successfully!",
        timestamp: new Date().toISOString(),
        source: result.source,
      });
    } catch (error) {
      console.error("MarketDataController.seed error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to process market data",
          details: String(error),
          fallbackUsed: true,
        },
        { status: 200 }
      );
    }
  }

  initScheduler(): NextResponse {
    // Scheduler registration is handled by importing market-data-refresh
    return NextResponse.json({
      status: "Scheduler initialized",
      message: "Market data refresh scheduler is running",
    });
  }
}
