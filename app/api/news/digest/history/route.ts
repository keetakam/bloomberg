import { turso } from "@/lib/turso";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 50);

  try {
    const result = await turso.execute({
      sql: "SELECT id, summary, tickers, article_count, generated_at FROM news_digests ORDER BY generated_at DESC LIMIT ?",
      args: [limit],
    });

    const digests = result.rows.map((row) => ({
      id: row[0],
      summary: row[1],
      tickers: (row[2] as string).split(","),
      newArticleCount: row[3],
      generatedAt: row[4],
    }));

    return NextResponse.json({ digests });
  } catch (error) {
    console.error("[digest/history] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch digest history", detail: String(error) },
      { status: 500 }
    );
  }
}
