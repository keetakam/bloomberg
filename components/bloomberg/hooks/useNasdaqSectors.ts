import { useQuery } from "@tanstack/react-query";

type NasdaqStock = { symbol: string; name: string; marketCap: number };

async function fetchSectors(): Promise<string[]> {
  const res = await fetch("/api/sectors");
  const data = await res.json();
  return data.sectors as string[];
}

async function fetchTickersBySector(sector: string): Promise<NasdaqStock[]> {
  const res = await fetch(`/api/sectors?sector=${encodeURIComponent(sector)}`);
  const data = await res.json();
  return data.tickers as NasdaqStock[];
}

export function useNasdaqSectors() {
  return useQuery({
    queryKey: ["nasdaq-sectors"],
    queryFn: fetchSectors,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useNasdaqTickers(sector: string | null) {
  return useQuery({
    queryKey: ["nasdaq-tickers", sector],
    queryFn: () => fetchTickersBySector(sector as string),
    enabled: !!sector,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
