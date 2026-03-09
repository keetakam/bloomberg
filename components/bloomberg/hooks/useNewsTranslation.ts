import { useQueries } from "@tanstack/react-query";

async function translateText(text: string): Promise<string> {
  if (!text?.trim()) return text;
  const res = await fetch(`/api/translate?q=${encodeURIComponent(text)}`);
  if (!res.ok) return text;
  const data = await res.json();
  return data.result ?? text;
}

/**
 * Translates an array of headlines EN→TH via /api/translate (server-side proxy).
 * Results are cached indefinitely per session.
 */
export function useNewsTranslation(titles: string[], enabled: boolean) {
  const results = useQueries({
    queries: enabled
      ? titles.map((title) => ({
          queryKey: ["translate", "en-th", title],
          queryFn: () => translateText(title),
          staleTime: Number.POSITIVE_INFINITY,
          gcTime: Number.POSITIVE_INFINITY,
          retry: 1,
        }))
      : [],
  });

  const translationMap = new Map<string, string>();
  if (enabled) {
    results.forEach((r, i) => {
      if (r.data) translationMap.set(titles[i], r.data);
    });
  }

  return {
    translationMap,
    isTranslating: enabled && results.some((r) => r.isLoading),
  };
}
