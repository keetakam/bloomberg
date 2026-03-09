import type { NewsSentiment, NewsSource } from "@/lib/models/news.model";
import { NewsService } from "@/lib/services/news.service";
import { NextResponse } from "next/server";

export class NewsController {
  constructor(private service = new NewsService()) {}

  sources(): NextResponse {
    return NextResponse.json({ status: "success", sources: this.service.getSources() });
  }

  async getNews(request: Request): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get("ticker");

    if (!ticker) {
      return NextResponse.json({ status: "error", message: "ticker is required" }, { status: 400 });
    }

    const source = searchParams.get("source") as NewsSource | null;
    const sentiment = searchParams.get("sentiment") as NewsSentiment | null;

    try {
      const { articles, cached } = await this.service.getNews(
        ticker,
        source ?? undefined,
        sentiment ?? undefined
      );
      return NextResponse.json(
        {
          status: "success",
          ticker: ticker.toUpperCase(),
          cached,
          count: articles.length,
          data: articles,
        },
        { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" } }
      );
    } catch (error) {
      console.error("NewsController.getNews error:", error);
      return NextResponse.json(
        { status: "error", message: "Failed to fetch news" },
        { status: 500 }
      );
    }
  }
}
