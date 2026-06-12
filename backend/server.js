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

// ─── Finance: summary (credit + payment progress) ────────────────────────────
// GET /api/finance/summary?client_id=Agoda   → single client
// GET /api/finance/summary?client_id=all     → aggregate all clients

app.get("/api/finance/summary", (req, res) => {
  try {
    const db = new Database(DB_PATH, { readonly: true });
    const clientId = (req.query.client_id || "all").trim();
    const all = clientId === "all" || clientId === "全部渠道" || clientId === "";

    let credit, payment;

    if (all) {
      credit = db.prepare(`
        SELECT
          SUM(total_credit)     AS total_credit,
          SUM(avail_credit)     AS avail_credit,
          SUM(consumed_credit)  AS consumed_credit,
          MAX(due_date)         AS due_date
        FROM finance_credit_summary
      `).get();

      payment = db.prepare(`
        SELECT
          SUM(total_bill_amount) AS total_bill_amount,
          SUM(settled_amount)    AS settled_amount,
          SUM(pending_amount)    AS pending_amount
        FROM finance_payment_progress
      `).get();
    } else {
      credit = db.prepare(`
        SELECT total_credit, avail_credit, consumed_credit, due_date
        FROM finance_credit_summary WHERE client_id = ?
      `).get(clientId);

      payment = db.prepare(`
        SELECT total_bill_amount, settled_amount, pending_amount
        FROM finance_payment_progress WHERE client_id = ?
      `).get(clientId);
    }

    if (!credit || !payment) {
      db.close();
      return res.status(404).json({ error: "No finance data for client_id", client_id: clientId });
    }

    const progress_ratio = payment.total_bill_amount > 0
      ? Math.round((payment.settled_amount / payment.total_bill_amount) * 10000) / 10000
      : 0;

    db.close();
    res.json({
      credit: {
        total_credit:    credit.total_credit,
        avail_credit:    credit.avail_credit,
        consumed_credit: credit.consumed_credit,
        due_date:        credit.due_date,
      },
      payment_progress: {
        total_bill_amount: payment.total_bill_amount,
        settled_amount:    payment.settled_amount,
        pending_amount:    payment.pending_amount,
        progress_ratio,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to query finance summary", detail: err.message });
  }
});

// ─── Finance: unsettled bills list ───────────────────────────────────────────
// GET /api/finance/unsettled-bills?client_id=Agoda
// GET /api/finance/unsettled-bills?client_id=all

app.get("/api/finance/unsettled-bills", (req, res) => {
  try {
    const db = new Database(DB_PATH, { readonly: true });
    const clientId = (req.query.client_id || "all").trim();
    const all = clientId === "all" || clientId === "全部渠道" || clientId === "";

    const rows = all
      ? db.prepare(`SELECT * FROM finance_unsettled_bills ORDER BY billing_period DESC, bill_no`).all()
      : db.prepare(`SELECT * FROM finance_unsettled_bills WHERE client_id = ? ORDER BY billing_period DESC, bill_no`).all(clientId);

    db.close();
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to query unsettled bills", detail: err.message });
  }
});

// ─── Finance: single bill detail (includes finance_contacts) ─────────────────
// GET /api/finance/unsettled-bills/:bill_no

const FINANCE_CONTACTS = ["jason@dida.com", "lea@dida.com", "lumino@dida.com", "neo@dida.com"];

app.get("/api/finance/unsettled-bills/:bill_no", (req, res) => {
  try {
    const db = new Database(DB_PATH, { readonly: true });
    const row = db.prepare(
      `SELECT * FROM finance_unsettled_bills WHERE bill_no = ?`
    ).get(req.params.bill_no);
    db.close();

    if (!row) return res.status(404).json({ error: "Bill not found" });
    res.json({ ...row, finance_contacts: FINANCE_CONTACTS });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to query bill detail", detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
  console.log(`  GET http://localhost:${PORT}/api/orders?page=1&pageSize=50`);
  console.log(`  GET http://localhost:${PORT}/api/finance/summary?client_id=all`);
  console.log(`  GET http://localhost:${PORT}/api/finance/unsettled-bills?client_id=all`);
  console.log(`  GET http://localhost:${PORT}/api/finance/unsettled-bills/:bill_no`);
});
