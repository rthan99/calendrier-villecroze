const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  "";
const BOOKINGS_TABLE = process.env.SUPABASE_BOOKINGS_TABLE || "member_bookings";

function jsonHeaders() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
  };
}

function parseIncomingBookings(body) {
  const payload =
    typeof body === "string" ? JSON.parse(body || "{}") : body || {};
  const raw = payload && typeof payload === "object" ? payload.bookings ?? payload : {};
  return raw && typeof raw === "object" ? raw : {};
}

function buildMemberRows(bookingsByDate) {
  const byMember = new Map();
  for (const [date, entries] of Object.entries(bookingsByDate || {})) {
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      if (!entry || typeof entry !== "object") continue;
      if (typeof entry.familyId !== "string" || typeof entry.memberId !== "string") continue;
      const memberKey = `${entry.familyId}:${entry.memberId}`;
      if (!byMember.has(memberKey)) {
        byMember.set(memberKey, {
          member_key: memberKey,
          family_id: entry.familyId,
          member_id: entry.memberId,
          dates: {},
          updated_at: new Date().toISOString(),
        });
      }
      const row = byMember.get(memberKey);
      const guests =
        typeof entry.guests === "number" && !Number.isNaN(entry.guests)
          ? Math.max(0, Math.floor(entry.guests))
          : 0;
      const dateData = { guests };
      if (entry.status === "maybe") dateData.status = "maybe";
      row.dates[date] = dateData;
    }
  }
  return Array.from(byMember.values());
}

function rebuildBookingsByDate(rows) {
  const bookings = {};
  for (const row of rows || []) {
    if (!row || typeof row !== "object") continue;
    const familyId = row.family_id;
    const memberId = row.member_id;
    const dates = row.dates;
    if (typeof familyId !== "string" || typeof memberId !== "string") continue;
    if (!dates || typeof dates !== "object") continue;
    for (const [date, meta] of Object.entries(dates)) {
      if (!bookings[date]) bookings[date] = [];
      const guests =
        meta && typeof meta.guests === "number" && !Number.isNaN(meta.guests)
          ? Math.max(0, Math.floor(meta.guests))
          : 0;
      const entry = { familyId, memberId, guests };
      if (meta && meta.status === "maybe") entry.status = "maybe";
      bookings[date].push(entry);
    }
  }
  return bookings;
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
      const url = `${SUPABASE_URL}/rest/v1/${BOOKINGS_TABLE}?select=family_id,member_id,dates`;
      const r = await fetch(url, { headers: jsonHeaders() });
      if (!r.ok) {
        const text = await r.text();
        return res.status(r.status).json({ error: "Supabase GET failed", text });
      }
      const rows = await r.json();
      return res.status(200).json({ bookings: rebuildBookingsByDate(rows) });
    }

    if (req.method === "POST") {
      const bookingsByDate = parseIncomingBookings(req.body);
      const rows = buildMemberRows(bookingsByDate);
      const clearUrl = `${SUPABASE_URL}/rest/v1/${BOOKINGS_TABLE}?member_key=not.is.null`;
      const clearRes = await fetch(clearUrl, {
        method: "DELETE",
        headers: {
          ...jsonHeaders(),
          Prefer: "return=minimal",
        },
      });
      if (!clearRes.ok) {
        const text = await clearRes.text();
        return res
          .status(clearRes.status)
          .json({ error: "Supabase clear failed", text, table: BOOKINGS_TABLE });
      }

      if (rows.length > 0) {
        const writeUrl = `${SUPABASE_URL}/rest/v1/${BOOKINGS_TABLE}?on_conflict=member_key`;
        const writeRes = await fetch(writeUrl, {
          method: "POST",
          headers: {
            ...jsonHeaders(),
            Prefer: "resolution=merge-duplicates,return=minimal",
          },
          body: JSON.stringify(rows),
        });
        if (!writeRes.ok) {
          const text = await writeRes.text();
          return res
            .status(writeRes.status)
            .json({ error: "Supabase POST failed", text, table: BOOKINGS_TABLE });
        }
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
