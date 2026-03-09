import type { NewsDigest } from "@/lib/news-digest";
import { useQuery } from "@tanstack/react-query";

async function fetchDigest(): Promise<NewsDigest | null> {
  const res = await fetch("/api/news/digest");
  if (!res.ok) return null;
  const data = await res.json();
  return data.digest as NewsDigest | null;
}

export function useNewsDigest({ enabled = true } = {}) {
  return useQuery({
    queryKey: ["news", "digest"],
    queryFn: fetchDigest,
    enabled,
    staleTime: 1000 * 60 * 10, // re-check every 10 minutes
    refetchInterval: 1000 * 60 * 10,
  });
}
