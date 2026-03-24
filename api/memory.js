import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const MEMORY_KEY = "intelliflow:memory";
const MAX_MEMORIES = 100;

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const memories = await redis.get(MEMORY_KEY) || [];
      return res.status(200).json({ memories });
    } catch {
      return res.status(200).json({ memories: [] });
    }
  }

  if (req.method === "POST") {
    try {
      const { memory } = req.body || {};
      if (!memory || typeof memory !== "string" || memory.trim().length < 5) {
        return res.status(400).json({ error: "Invalid memory" });
      }
      const existing = await redis.get(MEMORY_KEY) || [];
      const updated = [
        { text: memory.trim(), savedAt: new Date().toISOString() },
        ...existing,
      ].slice(0, MAX_MEMORIES);
      await redis.set(MEMORY_KEY, updated);
      return res.status(200).json({ ok: true, count: updated.length });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      await redis.del(MEMORY_KEY);
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
