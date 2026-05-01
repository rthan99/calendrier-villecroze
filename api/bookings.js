const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  "";

function jsonHeaders() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res
      .status(500)
      .json({ error: "Missing SUPABASE_URL or SUPABASE_KEY env vars" });
  }

  try {
    if (req.method === "GET") {
      const url = `${SUPABASE_URL}/rest/v1/bookings?id=eq.main&select=data`;
      const r = await fetch(url, { headers: jsonHeaders() });
      if (!r.ok) {
        const text = await r.text();
        return res.status(r.status).json({ error: "Supabase GET failed", text });
      }
      const rows = await r.json();
      return res.status(200).json(rows[0]?.data || {});
    }

    if (req.method === "POST") {
      const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const url = `${SUPABASE_URL}/rest/v1/bookings?on_conflict=id`;
      const r = await fetch(url, {
        method: "POST",
        headers: {
          ...jsonHeaders(),
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify([
          {
            id: "main",
            data: payload,
            updated_at: new Date().toISOString(),
          },
        ]),
      });
      if (!r.ok) {
        const text = await r.text();
        return res.status(r.status).json({ error: "Supabase POST failed", text });
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({
      error: "Unexpected API error",
      details: err instanceof Error ? err.message : String(err),
    });
  }
}
