import { type Client, createClient } from "@libsql/client";

let _turso: Client | null = null;

export const turso = new Proxy({} as Client, {
  get(_, prop) {
    if (!_turso) {
      if (!process.env.TURSO_DATABASE_URL) {
        throw new Error("TURSO_DATABASE_URL is not set");
      }
      _turso = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
    }
    const val = (_turso as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === "function" ? (val as (...args: unknown[]) => unknown).bind(_turso) : val;
  },
});
