import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const HISTORY_KEY = "intelliflow:chat_history";
const MAX_CHATS = 10;

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const history = await redis.get(HISTORY_KEY) || [];
      return res.status(200).json({ history });
    } catch {
      return res.status(200).json({ history: [] });
    }
  }

  if (req.method === "POST") {
    try {
      const { chat } = req.body || {};
      if (!chat || !chat.messages || !chat.messages.length) {
        return res.status(400).json({ error: "Invalid chat" });
      }
      const existing = await redis.get(HISTORY_KEY) || [];
      const newChat = {
        id: Date.now().toString(),
        assistantType: chat.assistantType || "founder",
        title: chat.messages[0]?.content?.slice(0, 60) || "Conversation",
        messages: chat.messages.slice(0, 50),
        savedAt: new Date().toISOString(),
      };
      const updated = [newChat, ...existing].slice(0, MAX_CHATS);
      await redis.set(HISTORY_KEY, updated);
      return res.status(200).json({ ok: true, id: newChat.id });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { id } = req.body || {};
      if (!id) {
        await redis.del(HISTORY_KEY);
        return res.status(200).json({ ok: true, deleted: "all" });
      }
      const existing = await redis.get(HISTORY_KEY) || [];
      const updated = existing.filter(c => c.id !== id);
      await redis.set(HISTORY_KEY, updated);
      return res.status(200).json({ ok: true, deleted: id });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
