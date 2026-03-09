export type ForexImpact = "high" | "medium" | "low" | "holiday" | "unknown";

export interface ForexEvent {
  date: string;
  time: string;
  currency: string;
  impact: ForexImpact;
  event: string;
  actual: string;
  forecast: string;
  previous: string;
}

export interface ForexCalendarResponse {
  status: "success" | "error";
  count: number;
  data: ForexEvent[];
  message?: string;
}
