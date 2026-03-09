import type { ForexCalendarResponse } from "@/lib/models/forex-factory.model";

export async function fetchForexCalendar(impact = "all"): Promise<ForexCalendarResponse> {
  const res = await fetch(`/api/forex-factory?impact=${impact}`);
  if (!res.ok) throw new Error("Failed to fetch Forex Factory calendar");
  return res.json();
}
