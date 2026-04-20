/**
 * Vercel Serverless Function: stockage partagé des réservations.
 * Clé persistée: process.env.BOOKINGS_KV_KEY || "villecroze:bookings:v1"
 */
const { kv } = require("@vercel/kv");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const kvKey = process.env.BOOKINGS_KV_KEY || "villecroze:bookings:v1";

  try {
    if (req.method === "GET") {
      const out = await kv.get(kvKey);
      if (!out || typeof out !== "object") {
        res.status(200).json({ version: 5, bookings: {} });
        return;
      }
      res.status(200).json(out);
      return;
    }

    if (req.method === "POST") {
      const body = req.body && typeof req.body === "object" ? req.body : {};
      const safe = {
        version: 5,
        bookings: body.bookings && typeof body.bookings === "object" ? body.bookings : {},
      };

      await kv.set(kvKey, safe);
      res.status(200).json({ ok: true });
      return;
    }

    res.setHeader("Allow", "GET,POST,OPTIONS");
    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    res.status(500).json({
      error: "Internal error",
      message: err instanceof Error ? err.message : String(err),
    });
  }
};
