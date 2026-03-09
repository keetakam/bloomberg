import { rateLimit } from "@/app/api/ai/rate-limit";
import type { AIChatRequest } from "@/lib/models/ai.model";
import { AIAnalysisService } from "@/lib/services/ai-analysis.service";
import type { NextRequest } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  messages: z
    .array(
      z.object({ role: z.enum(["user", "assistant", "system"]), content: z.string().max(4000) })
    )
    .max(20),
  marketData: z.record(z.any()).optional(),
});

export class AIController {
  constructor(private service = new AIAnalysisService()) {}

  async chat(req: NextRequest): Promise<Response> {
    try {
      // Rate limiting
      const rateLimitResult = await rateLimit(req, { maxRequests: 20, windowInSeconds: 60 });
      if (!rateLimitResult.success) {
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded. Please try again later.",
            reset: rateLimitResult.reset,
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "X-RateLimit-Limit": rateLimitResult.limit.toString(),
              "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
              "X-RateLimit-Reset": rateLimitResult.reset.toString(),
            },
          }
        );
      }

      // Origin check
      const origin = req.headers.get("origin") || "";
      if (!this.isOriginAllowed(origin)) {
        return new Response(JSON.stringify({ error: "Unauthorized origin" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Validate request
      const body = await req.json();
      const parsed = requestSchema.safeParse(body);
      if (!parsed.success) {
        return new Response(
          JSON.stringify({ error: "Invalid request format", details: parsed.error.errors }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const chatRequest: AIChatRequest = parsed.data;
      const messages = this.service.buildMessages(chatRequest);
      const result = this.service.streamResponse(messages);

      const response = result.toDataStreamResponse({
        getErrorMessage: (error) => {
          console.error("[AI Stream Error]", error);
          return error instanceof Error ? error.message : "An error occurred";
        },
      });
      response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString());
      response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString());
      response.headers.set("X-RateLimit-Reset", rateLimitResult.reset.toString());

      return response;
    } catch (error) {
      console.error("AIController.chat error:", error);
      return new Response(JSON.stringify({ error: "Failed to generate AI response" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  private isOriginAllowed(origin: string): boolean {
    const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || "";
    const allowedOrigins = allowedOriginsEnv
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);

    if (process.env.VERCEL_URL) {
      const vercelUrl = `https://${process.env.VERCEL_URL}`;
      if (!allowedOrigins.includes(vercelUrl)) allowedOrigins.push(vercelUrl);
    }

    if (process.env.NODE_ENV === "development" && allowedOrigins.length === 0) {
      allowedOrigins.push("http://localhost:3000");
    }

    return allowedOrigins.length === 0 || allowedOrigins.includes(origin);
  }
}
