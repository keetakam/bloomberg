import { AIController } from "@/lib/controllers/ai.controller";
import type { NextRequest } from "next/server";

export const maxDuration = 30;

const controller = new AIController();

export const POST = (req: NextRequest) => controller.chat(req);
