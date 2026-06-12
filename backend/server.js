const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, "orders.db");

app.use(cors());
app.use(express.json());

app.get("/api/orders", (req, res) => {
  try {
    const db = new Database(DB_PATH, { readonly: true });

    const page     = Math.max(1, parseInt(req.query.page)     || 1);
    const pageSize = Math.min(200, Math.max(1, parseInt(req.query.pageSize) || 50));
    const clientId  = (req.query.client_id  || "").trim();
    const startDate = (req.query.start_date || "").trim();
    const endDate   = (req.query.end_date   || "").trim();
    const refsRaw   = (req.query.refs       || "").trim();
    const refs = refsRaw ? refsRaw.split(",").map(s => s.trim()).filter(Boolean) : [];

    const conditions = [];
    const params = [];

    if (clientId)  { conditions.push("client_id = ?");                              params.push(clientId); }
    if (startDate) { conditions.push("substr(channel_create_time,1,10) >= ?");      params.push(startDate); }
    if (endDate)   { conditions.push("substr(channel_create_time,1,10) <= ?");      params.push(endDate); }
    if (refs.length > 0) {
      const ph = refs.map(() => "?").join(",");
      conditions.push(`(client_ref IN (${ph}) OR dida_ref IN (${ph}))`);
      params.push(...refs, ...refs);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const total      = db.prepare(`SELECT COUNT(*) as cnt FROM orders ${where}`).get(...params).cnt;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage   = Math.min(page, totalPages);
    const offset     = (safePage - 1) * pageSize;

    const rows = db.prepare(
      `SELECT * FROM orders ${where} ORDER BY channel_create_time DESC LIMIT ? OFFSET ?`
    ).all(...params, pageSize, offset);

    db.close();
    res.json({
      data: rows,
      pagination: { page: safePage, pageSize, total, totalPages },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to query orders", detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
  console.log(`  GET http://localhost:${PORT}/api/orders?page=1&pageSize=50`);
});
