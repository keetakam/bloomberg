export type AIMessageRole = "user" | "assistant" | "system";

export type AIMessage = {
  role: AIMessageRole;
  content: string;
};

export type AIChatRequest = {
  messages: AIMessage[];
  marketData?: Record<string, unknown>;
};

export type AIChatResponse = {
  response: string;
};
