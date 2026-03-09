import { initSchema } from "@/lib/turso-schema";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await initSchema();
    return NextResponse.json({ status: "ok", message: "Turso schema initialized" });
  } catch (error) {
    console.error("[turso-init] Error:", error);
    return NextResponse.json(
      { error: "Failed to initialize schema", detail: String(error) },
      { status: 500 }
    );
  }
}
