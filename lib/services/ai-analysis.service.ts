import type { AIChatRequest } from "@/lib/models/ai.model";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import type { CoreMessage } from "ai";

export class AIAnalysisService {
  buildSystemPrompt(marketData: Record<string, unknown> | undefined): string {
    const sanitized = marketData ? JSON.stringify(marketData).slice(0, 5000) : "{}";
    return `คุณคือนักวิเคราะห์การเงิน AI สำหรับ Bloomberg Terminal
ตอบเป็นภาษาไทยเสมอ ให้คำอธิบายที่กระชับ ตรงประเด็น และเป็นมืออาชีพ
ข้อมูลตลาดปัจจุบัน: ${sanitized}
ห้ามให้คำแนะนำการลงทุนหรือแนะนำให้ซื้อ/ขายหลักทรัพย์โดยตรง`;
  }

  buildMessages(request: AIChatRequest): CoreMessage[] {
    const systemPrompt = this.buildSystemPrompt(request.marketData);
    return [
      { role: "system", content: systemPrompt } as CoreMessage,
      ...request.messages.map((m) => ({ role: m.role, content: m.content }) as CoreMessage),
    ];
  }

  streamResponse(messages: CoreMessage[]) {
    const openrouter = createOpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.BLOOMBERG_AI_KEY,
      compatibility: "compatible",
    });

    return streamText({
      model: openrouter(process.env.BLOOMBERG_AI_MODEL ?? "google/gemini-flash-1.5"),
      messages,
      temperature: 0.7,
      maxTokens: 500,
    });
  }
}
