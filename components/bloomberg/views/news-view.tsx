"use client";

import type { ForexImpact } from "@/lib/models/forex-factory.model";
import type { NewsSentiment, NewsSource } from "@/lib/models/news.model";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
import { memo, useMemo, useRef, useState } from "react";
import { queryKeys } from "../api/query-keys";
import { BloombergButton } from "../core/bloomberg-button";
import { useForexFactory } from "../hooks/useForexFactory";
import { useNewsData, useNewsSources } from "../hooks/useNewsData";
import { useNewsDigest } from "../hooks/useNewsDigest";
import { useNewsTranslation } from "../hooks/useNewsTranslation";
import { bloombergColors } from "../lib/theme-config";
import { type Language, translations } from "../lib/translations";

const SOURCE_LABELS: Record<string, string> = {
  all: "All",
  finnhub: "Finnhub",
  alphavantage: "AlphaVantage",
  eodhd: "EODHD",
  polygon: "Polygon",
  newsapi: "NewsAPI",
  forexfactory: "ForexFactory",
};

const FOREX_IMPACT_COLOR: Record<ForexImpact, string> = {
  high: "#ef4444",
  medium: "#f97316",
  low: "#eab308",
  holiday: "#6b7280",
  unknown: "#6b7280",
};

const FOREX_IMPACT_LABEL: Record<ForexImpact, string> = {
  high: "HIGH",
  medium: "MED",
  low: "LOW",
  holiday: "HOL",
  unknown: "?",
};

const FOREX_IMPACT_OPTIONS = [
  { value: "all", label: "All Impact" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const SENTIMENT_OPTIONS = [
  { value: "all", label: "All" },
  { value: "bullish", label: "Bull" },
  { value: "bearish", label: "Bear" },
  { value: "neutral", label: "Neutral" },
];

const SENTIMENT_COLOR: Record<string, string> = {
  bullish: "#4ade80",
  bearish: "#f87171",
  neutral: "#9ca3af",
};

const SENTIMENT_LABEL: Record<string, string> = {
  bullish: "BULL",
  bearish: "BEAR",
  neutral: "NEUT",
};

function SentimentDot({ sentiment }: { sentiment: NewsSentiment }) {
  if (!sentiment) return null;
  return (
    <span
      className="text-[10px] font-bold tracking-wider"
      style={{ color: SENTIMENT_COLOR[sentiment] }}
    >
      {SENTIMENT_LABEL[sentiment]}
    </span>
  );
}

function SentimentBar({ articles }: { articles: { sentiment: NewsSentiment }[] }) {
  const counts = { bullish: 0, bearish: 0, neutral: 0 };
  for (const a of articles) {
    if (a.sentiment === "bullish") counts.bullish++;
    else if (a.sentiment === "bearish") counts.bearish++;
    else if (a.sentiment === "neutral") counts.neutral++;
  }
  return (
    <span className="text-[10px] tabular-nums">
      <span style={{ color: SENTIMENT_COLOR.bullish }}>▲{counts.bullish}</span>
      <span className="mx-1 opacity-30">·</span>
      <span style={{ color: SENTIMENT_COLOR.bearish }}>▼{counts.bearish}</span>
      <span className="mx-1 opacity-30">·</span>
      <span style={{ color: SENTIMENT_COLOR.neutral }}>●{counts.neutral}</span>
    </span>
  );
}

function formatPublished(dateStr: string): string {
  try {
    const d = new Date(dateStr.replace(" ", "T"));
    const diffMs = Date.now() - d.getTime();
    const diffH = Math.floor(diffMs / 3600000);
    if (diffH < 1) return `${Math.floor(diffMs / 60000)}m`;
    if (diffH < 24) return `${diffH}h`;
    return `${Math.floor(diffH / 24)}d`;
  } catch {
    return dateStr;
  }
}

interface NewsViewProps {
  isDarkMode: boolean;
  onBack: () => void;
  language?: Language;
}

function NewsView({ isDarkMode, onBack, language = "th" }: NewsViewProps) {
  const colors = isDarkMode ? bloombergColors.dark : bloombergColors.light;
  const t = translations[language];
  const queryClient = useQueryClient();

  const [tickerInput, setTickerInput] = useState("AAPL");
  const [ticker, setTicker] = useState("AAPL");
  const [source, setSource] = useState<string>("all");
  const [sentiment, setSentiment] = useState<string>("all");
  const [translateEnabled, setTranslateEnabled] = useState(false);
  const [forexImpact, setForexImpact] = useState("high");
  const inputRef = useRef<HTMLInputElement>(null);

  const isForexFactory = source === "forexfactory";

  const { data: sourcesData } = useNewsSources();
  const { data, isLoading, isFetching, error } = useNewsData(
    ticker,
    source === "all" || isForexFactory ? undefined : source,
    sentiment === "all" ? undefined : sentiment,
    !isForexFactory
  );
  const {
    data: forexData,
    isLoading: forexLoading,
    isFetching: forexFetching,
    refetch: forexRefetch,
  } = useForexFactory(forexImpact, isForexFactory);

  const handleSearch = () => {
    const v = tickerInput.trim().toUpperCase();
    if (v) setTicker(v);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.news.all });
  };

  const articles = data?.data ?? [];
  const availableSources = sourcesData?.sources ?? [];
  const { data: digest } = useNewsDigest({ enabled: !isForexFactory });

  const titles = useMemo(() => articles.map((a) => a.title), [articles]);
  const { translationMap, isTranslating } = useNewsTranslation(titles, translateEnabled);

  return (
    <div
      className="min-h-screen font-mono flex flex-col text-xs"
      style={{ background: colors.background, color: colors.text }}
    >
      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center gap-2 px-2 py-1 border-b"
        style={{ background: colors.surface, borderColor: colors.border }}
      >
        <BloombergButton color="default" onClick={onBack}>
          <ArrowLeft className="h-3 w-3 mr-1" />
          BACK
        </BloombergButton>

        <span className="font-bold" style={{ color: colors.accent }}>
          NEWS
        </span>

        <input
          ref={inputRef}
          type="text"
          value={tickerInput}
          onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="TICKER"
          className="w-20 px-2 py-0.5 border rounded-none bg-transparent focus:outline-none"
          style={{ borderColor: colors.border, color: colors.text }}
        />

        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="px-1 py-0.5 border rounded-none bg-transparent focus:outline-none"
          style={{ borderColor: colors.border, color: colors.text, background: colors.surface }}
        >
          <option value="all">All Sources</option>
          {availableSources.map((s) => (
            <option key={s.id} value={s.id} disabled={!s.available}>
              {SOURCE_LABELS[s.id] ?? s.id}
              {!s.available ? " ✕" : ""}
            </option>
          ))}
          <option value="forexfactory">ForexFactory</option>
        </select>

        <select
          value={sentiment}
          onChange={(e) => setSentiment(e.target.value)}
          className="px-1 py-0.5 border rounded-none bg-transparent focus:outline-none"
          style={{ borderColor: colors.border, color: colors.text, background: colors.surface }}
        >
          {SENTIMENT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {!isForexFactory && (
          <BloombergButton color="accent" onClick={handleSearch} disabled={isLoading}>
            GO
          </BloombergButton>
        )}

        {isForexFactory ? (
          <select
            value={forexImpact}
            onChange={(e) => setForexImpact(e.target.value)}
            className="px-1 py-0.5 border rounded-none bg-transparent focus:outline-none"
            style={{ borderColor: colors.border, color: colors.text, background: colors.surface }}
          >
            {FOREX_IMPACT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : (
          <BloombergButton
            color={translateEnabled ? "accent" : "default"}
            onClick={() => setTranslateEnabled((v) => !v)}
          >
            TH
          </BloombergButton>
        )}

        <div className="ml-auto flex items-center gap-3">
          {!isForexFactory && articles.length > 0 && <SentimentBar articles={articles} />}
          {isForexFactory ? (
            <span style={{ color: colors.textSecondary }}>{forexData?.count ?? 0} events</span>
          ) : (
            data && (
              <span style={{ color: colors.textSecondary }}>
                {articles.length} articles
                {data.cached && <span className="ml-1 opacity-50">· cached</span>}
                {isTranslating && <span className="ml-1 opacity-60">· แปล...</span>}
              </span>
            )
          )}
          <BloombergButton
            color="default"
            onClick={isForexFactory ? () => forexRefetch() : handleRefresh}
            disabled={isForexFactory ? forexFetching : isFetching}
          >
            <RefreshCw
              className={`h-3 w-3 ${(isForexFactory ? forexFetching : isFetching) ? "animate-spin" : ""}`}
            />
          </BloombergButton>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Digest */}
        {digest && (
          <div className="px-3 py-2 border-b" style={{ borderColor: colors.border }}>
            <div className="flex items-baseline justify-between mb-1">
              <span className="font-bold" style={{ color: colors.accent }}>
                ⚡ {t.digestTitle}
              </span>
              <span style={{ color: colors.textSecondary }} suppressHydrationWarning>
                {new Date(digest.generatedAt).toLocaleTimeString()} ·{" "}
                {t.digestNewArticles(digest.newArticleCount)}
              </span>
            </div>
            <p className="leading-relaxed whitespace-pre-line opacity-80">{digest.summary}</p>
          </div>
        )}

        {/* ForexFactory Calendar */}
        {isForexFactory && (
          <div>
            {forexLoading && (
              <div className="divide-y" style={{ borderColor: colors.border }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                  <div key={i} className="px-3 py-2 animate-pulse flex gap-3">
                    <div className="h-2 w-12 rounded" style={{ background: colors.border }} />
                    <div className="h-2 w-8 rounded" style={{ background: colors.border }} />
                    <div className="h-2 w-48 rounded" style={{ background: colors.border }} />
                  </div>
                ))}
              </div>
            )}

            {!forexLoading && (!forexData || forexData.data.length === 0) && (
              <div className="py-16 text-center" style={{ color: colors.textSecondary }}>
                No events found
              </div>
            )}

            {!forexLoading && forexData && forexData.data.length > 0 && (
              <div>
                {/* Header */}
                <div
                  className="grid gap-2 px-3 py-1.5 text-[10px] font-bold border-b sticky top-0"
                  style={{
                    background: colors.surface,
                    borderColor: colors.border,
                    color: colors.textSecondary,
                    gridTemplateColumns: "80px 60px 45px 50px 1fr 60px 60px 60px",
                  }}
                >
                  <span>DATE</span>
                  <span>TIME</span>
                  <span>CCY</span>
                  <span>IMPACT</span>
                  <span>EVENT</span>
                  <span className="text-right">ACTUAL</span>
                  <span className="text-right">FCST</span>
                  <span className="text-right">PREV</span>
                </div>

                <div className="divide-y" style={{ borderColor: colors.border }}>
                  {forexData.data.map((ev) => (
                    <div
                      key={`${ev.date}-${ev.time}-${ev.currency}-${ev.event}`}
                      className="grid gap-2 px-3 py-1.5 hover:opacity-80"
                      style={{ gridTemplateColumns: "80px 60px 45px 50px 1fr 60px 60px 60px" }}
                    >
                      <span style={{ color: colors.textSecondary }}>{ev.date}</span>
                      <span style={{ color: colors.textSecondary }}>{ev.time}</span>
                      <span className="font-bold">{ev.currency}</span>
                      <span
                        className="text-[10px] font-bold"
                        style={{ color: FOREX_IMPACT_COLOR[ev.impact] }}
                      >
                        {FOREX_IMPACT_LABEL[ev.impact]}
                      </span>
                      <span className="truncate">{ev.event}</span>
                      <span
                        className="text-right font-mono"
                        style={{
                          color: ev.actual !== "-" ? colors.positive : colors.textSecondary,
                        }}
                      >
                        {ev.actual}
                      </span>
                      <span
                        className="text-right font-mono"
                        style={{ color: colors.textSecondary }}
                      >
                        {ev.forecast}
                      </span>
                      <span
                        className="text-right font-mono"
                        style={{ color: colors.textSecondary }}
                      >
                        {ev.previous}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!isForexFactory && error && (
          <div className="px-3 py-2 text-red-400 border-b" style={{ borderColor: colors.border }}>
            Failed to load news
          </div>
        )}

        {!isForexFactory && isLoading && (
          <div className="divide-y" style={{ borderColor: colors.border }}>
            {Array.from({ length: 6 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
              <div key={i} className="px-3 py-2.5 animate-pulse space-y-1.5">
                <div className="h-2 w-1/4 rounded" style={{ background: colors.border }} />
                <div className="h-3 w-3/4 rounded" style={{ background: colors.border }} />
                <div className="h-2 w-full rounded" style={{ background: colors.border }} />
              </div>
            ))}
          </div>
        )}

        {!isForexFactory && !isLoading && articles.length === 0 && !error && (
          <div className="py-16 text-center" style={{ color: colors.textSecondary }}>
            No articles · <span style={{ color: colors.accent }}>{ticker}</span>
          </div>
        )}

        {!isForexFactory && !isLoading && articles.length > 0 && (
          <div className="divide-y" style={{ borderColor: colors.border }}>
            {articles.map((article) => (
              <div key={`${article.source}-${article.url}`} className="px-3 py-2.5">
                {/* Meta row */}
                <div
                  className="flex items-center gap-2 mb-1"
                  style={{ color: colors.textSecondary }}
                >
                  <span className="opacity-60">
                    {SOURCE_LABELS[article.source] ?? article.source}
                  </span>
                  {article.sentiment && (
                    <>
                      <span className="opacity-30">·</span>
                      <SentimentDot sentiment={article.sentiment} />
                    </>
                  )}
                  <span className="ml-auto opacity-60" suppressHydrationWarning>
                    {formatPublished(article.published)}
                  </span>
                </div>

                {/* Title + link */}
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold leading-snug" style={{ color: colors.text }}>
                    {translateEnabled
                      ? (translationMap.get(article.title) ?? article.title)
                      : article.title}
                  </p>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 mt-0.5 opacity-40 hover:opacity-80 transition-opacity"
                    style={{ color: colors.accent }}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                {article.summary && (
                  <p className="mt-0.5 leading-relaxed line-clamp-2 opacity-50">
                    {article.summary}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(NewsView);
