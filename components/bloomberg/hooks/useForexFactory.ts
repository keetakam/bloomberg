"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchForexCalendar } from "../api/forex-factory-api";

export function useForexFactory(impact = "all", enabled = true) {
  return useQuery({
    queryKey: ["forexFactory", impact],
    queryFn: () => fetchForexCalendar(impact),
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    gcTime: 30 * 60 * 1000,
  });
}
