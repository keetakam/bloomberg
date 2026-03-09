import type { NewsArticle } from "@/lib/models/news.model";
import { redis } from "@/lib/redis";
import { NewsService } from "@/lib/services/news.service";
import { turso } from "@/lib/turso";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import scheduler from "./scheduler";

const DIGEST_TICKERS = [
  "AAPL",
  "TSLA",
  "NVDA",
  "GOOGL",
  "MSFT",
  "AMZN",
  "META",
  "SPY",
  "QQQ",
  "BTC",
];
const SNAPSHOT_KEY = "news_digest_snapshot";
const DIGEST_KEY = "news_digest_latest";

export type NewsDigest = {
  summary: string;
  generatedAt: string;
  newArticleCount: number;
  tickers: string[];
};

const newsService = new NewsService();

async function generateNewsDigest(): Promise<void> {
  console.log("[NewsDigest] Starting 4-hour news digest...");

  // 1. Fetch news for all tickers
  const fetchResults = await Promise.allSettled(
    DIGEST_TICKERS.map((ticker) => newsService.getNews(ticker))
  );

  const allArticles: NewsArticle[] = fetchResults.flatMap((r) =>
    r.status === "fulfilled" ? r.value.articles : []
  );

  // 2. Deduplicate by URL
  const seenUrls = new Set<string>();
  const uniqueArticles = allArticles.filter((a) => {
    if (seenUrls.has(a.url)) return false;
    seenUrls.add(a.url);
    return true;
  });

  // 3. Compare with previous snapshot to find new articles
  let prevUrls: string[] = [];
  try {
    prevUrls = (await redis.get<string[]>(SNAPSHOT_KEY)) ?? [];
  } catch {
    // No previous snapshot — first run
  }

  const prevUrlSet = new Set(prevUrls);
  const newArticles = uniqueArticles.filter((a) => !prevUrlSet.has(a.url));

  console.log(`[NewsDigest] Total: ${uniqueArticles.length} articles, New: ${newArticles.length}`);

  // 4. Save current snapshot (URLs only to save Redis space), TTL 6h
  try {
    await redis.set(
      SNAPSHOT_KEY,
      uniqueArticles.map((a) => a.url),
      { ex: 60 * 60 * 6 }
    );
  } catch (err) {
    console.error("[NewsDigest] Failed to save snapshot:", err);
  }

  if (newArticles.length === 0) {
    console.log("[NewsDigest] No new articles — skipping AI summary");
    return;
  }

  // 5. Build prompt from new headlines (limit to 30 to avoid token overflow)
  const headlineList = newArticles
    .slice(0, 30)
    .map((a, i) => `${i + 1}. [${a.source.toUpperCase()}] ${a.title}`)
    .join("\n");

  const prompt = `คุณคือนักวิเคราะห์ข่าวการเงิน Bloomberg
สรุปข่าวสำคัญจากรายการข้างล่างนี้ที่เกิดขึ้นใน 4 ชั่วโมงที่ผ่านมา:

${headlineList}

กรุณาสรุปเป็นภาษาไทย ไม่เกิน 150 คำ เน้นข่าวที่มีผลกระทบต่อตลาดและนักลงทุน จัดเป็นข้อๆ`;

  // 6. Generate AI summary
  try {
    const openrouter = createOpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.BLOOMBERG_AI_KEY,
      compatibility: "compatible",
    });

    const { text } = await generateText({
      model: openrouter(process.env.BLOOMBERG_AI_MODEL ?? "google/gemini-flash-1.5"),
      prompt,
      maxTokens: 400,
      temperature: 0.4,
    });

    const digest: NewsDigest = {
      summary: text,
      generatedAt: new Date().toISOString(),
      newArticleCount: newArticles.length,
      tickers: DIGEST_TICKERS,
    };

    // TTL slightly longer than interval so digest is always available
    await redis.set(DIGEST_KEY, digest, { ex: 60 * 60 * 5 });
    console.log(`[NewsDigest] Summary saved — ${newArticles.length} new articles analyzed`);

    // Persist to Turso for historical archive
    try {
      await turso.execute({
        sql: "INSERT INTO news_digests (summary, tickers, article_count, generated_at) VALUES (?, ?, ?, ?)",
        args: [text, DIGEST_TICKERS.join(","), newArticles.length, new Date().toISOString()],
      });
      console.log("[NewsDigest] Persisted to Turso");
    } catch (err) {
      console.error("[NewsDigest] Turso persist failed:", err);
    }
  } catch (err) {
    console.error("[NewsDigest] AI summary failed:", err);
  }
}

// Register: runs every 4 hours
scheduler.register("news-digest", "4-Hour News Digest", 4, generateNewsDigest);

export default generateNewsDigest;
