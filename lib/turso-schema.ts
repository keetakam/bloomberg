import { turso } from "./turso";

/**
 * Creates all Turso tables if they don't exist.
 * Call once via GET /api/turso-init
 */
export async function initSchema(): Promise<void> {
  await turso.executeMultiple(`
    CREATE TABLE IF NOT EXISTS news_digests (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      summary     TEXT    NOT NULL,
      tickers     TEXT    NOT NULL,
      article_count INTEGER NOT NULL,
      generated_at TEXT   NOT NULL
    );

    CREATE TABLE IF NOT EXISTS news_articles (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      ticker       TEXT    NOT NULL,
      source       TEXT    NOT NULL,
      title        TEXT    NOT NULL,
      summary      TEXT,
      url          TEXT    NOT NULL UNIQUE,
      sentiment    TEXT,
      published    TEXT    NOT NULL,
      fetched_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_news_articles_ticker ON news_articles(ticker);
    CREATE INDEX IF NOT EXISTS idx_news_articles_published ON news_articles(published DESC);
    CREATE INDEX IF NOT EXISTS idx_news_digests_generated ON news_digests(generated_at DESC);
  `);

  console.log("[Turso] Schema initialized");
}
