const SUPABASE_URL = process.env.https://fivenrdkveorbfvqhwtn.supabase.co;
const SUPABASE_KEY = process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpdmVucmRrdmVvcmJmdnFod3RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NzUyMTksImV4cCI6MjA5MjI1MTIxOX0.M1QiwszdhNAaphgswkJgtmg4ONn5fJbYLQjYzsqj2eo;
export default async function handler(req, res) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: "Missing SUPABASE_URL or SUPABASE_KEY" });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const base = `${SUPABASE_URL}/rest/v1/bookings?id=eq.main`;
  const headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
  };

  if (req.method === "GET") {
    const r = await fetch(base, { headers });
    const rows = await r.json();
    return res.status(200).json(rows[0]?.data || {});
  }

  if (req.method === "POST") {
    await fetch(base, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ data: req.body, updated_at: new Date() }),
    });
    return res.status(200).json({ ok: true });
  }
}
