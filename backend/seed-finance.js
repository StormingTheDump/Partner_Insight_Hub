/**
 * seed-finance.js
 * Creates and populates finance tables in orders.db.
 * Safe to re-run: clears existing finance data then re-inserts.
 * Does NOT touch the orders table.
 *
 * Target totals (all clients aggregated):
 *   Credit:   total=2,500,000 | avail=1,040,420 | consumed=1,459,580
 *   Payment:  total_bill=2,248,310.39 | settled=2,040,694.17 | pending=207,616.22
 *
 * Split logic: weighted by client volume (Agoda ~32%, AgodaUK ~20%,
 * AgodaEBK ~16%, Barli2b ~12%, Lvzan ~10%, DidaOpaq ~10%).
 * Last client (DidaOpaq) absorbs rounding remainder to guarantee exact totals.
 */

const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "orders.db");
const db = new Database(DB_PATH);

// ─── Create tables ────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS finance_credit_summary (
    client_id        TEXT PRIMARY KEY,
    total_credit     REAL NOT NULL,
    avail_credit     REAL NOT NULL,
    consumed_credit  REAL NOT NULL,
    due_date         TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS finance_payment_progress (
    client_id          TEXT PRIMARY KEY,
    total_bill_amount  REAL NOT NULL,
    settled_amount     REAL NOT NULL,
    pending_amount     REAL NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS finance_unsettled_bills (
    bill_no                  TEXT PRIMARY KEY,
    client_id                TEXT NOT NULL,
    billing_period           TEXT NOT NULL,
    latest_collection_date   TEXT NOT NULL,
    status                   TEXT NOT NULL,
    settlement_date          TEXT,
    contact                  TEXT NOT NULL,
    order_count              INTEGER NOT NULL,
    amount                   REAL NOT NULL
  )
`);

// ─── Clear existing finance data (idempotent re-run) ─────────────────────────

db.exec(`
  DELETE FROM finance_credit_summary;
  DELETE FROM finance_payment_progress;
  DELETE FROM finance_unsettled_bills;
`);

// ─── Credit summary (per-client split, sums verified below) ──────────────────
//
//  client_id  | total_credit | avail_credit | consumed_credit
//  -----------|------------- |------------- |----------------
//  Agoda      |   800,000.00 |   333,000.00 |    467,000.00
//  AgodaUK    |   500,000.00 |   208,000.00 |    292,000.00
//  AgodaEBK   |   400,000.00 |   165,420.00 |    234,580.00  <- absorbs avail/consumed rem.
//  Barli2b    |   300,000.00 |   125,000.00 |    175,000.00
//  Lvzan      |   250,000.00 |   104,000.00 |    146,000.00
//  DidaOpaq   |   250,000.00 |   105,000.00 |    145,000.00
//  -----------|------------- |------------- |----------------
//  TOTAL      | 2,500,000.00 | 1,040,420.00 |  1,459,580.00  ✓

const creditRows = [
  { client_id: "Agoda",    total_credit: 800000.00, avail_credit: 333000.00, consumed_credit: 467000.00, due_date: "2026-06-22" },
  { client_id: "AgodaUK",  total_credit: 500000.00, avail_credit: 208000.00, consumed_credit: 292000.00, due_date: "2026-06-22" },
  { client_id: "AgodaEBK", total_credit: 400000.00, avail_credit: 165420.00, consumed_credit: 234580.00, due_date: "2026-06-22" },
  { client_id: "Barli2b",  total_credit: 300000.00, avail_credit: 125000.00, consumed_credit: 175000.00, due_date: "2026-06-22" },
  { client_id: "Lvzan",    total_credit: 250000.00, avail_credit: 104000.00, consumed_credit: 146000.00, due_date: "2026-06-22" },
  { client_id: "DidaOpaq", total_credit: 250000.00, avail_credit: 105000.00, consumed_credit: 145000.00, due_date: "2026-06-22" },
];

// Verify sums (dev guard)
const creditCheck = creditRows.reduce((a, r) => ({
  total: a.total + r.total_credit,
  avail: a.avail + r.avail_credit,
  consumed: a.consumed + r.consumed_credit,
}), { total: 0, avail: 0, consumed: 0 });

if (Math.abs(creditCheck.total - 2500000) > 0.01)
  throw new Error(`Credit total mismatch: ${creditCheck.total}`);
if (Math.abs(creditCheck.avail - 1040420) > 0.01)
  throw new Error(`Credit avail mismatch: ${creditCheck.avail}`);
if (Math.abs(creditCheck.consumed - 1459580) > 0.01)
  throw new Error(`Credit consumed mismatch: ${creditCheck.consumed}`);

const insertCredit = db.prepare(
  `INSERT INTO finance_credit_summary (client_id, total_credit, avail_credit, consumed_credit, due_date)
   VALUES (@client_id, @total_credit, @avail_credit, @consumed_credit, @due_date)`
);
db.transaction(() => creditRows.forEach(r => insertCredit.run(r)))();

// ─── Payment progress (per-client split, sums verified below) ────────────────
//
//  client_id  | total_bill_amount | settled_amount | pending_amount
//  -----------|------------------ |--------------- |--------------
//  Agoda      |     720,000.00    |   653,827.00   |   66,173.00
//  AgodaUK    |     450,000.00    |   408,484.17   |   41,515.83
//  AgodaEBK   |     350,000.00    |   317,769.00   |   32,231.00
//  Barli2b    |     280,000.00    |   254,249.00   |   25,751.00
//  Lvzan      |     230,000.00    |   208,847.00   |   21,153.00
//  DidaOpaq   |     218,310.39    |   197,518.00   |   20,792.39  <- absorbs rem.
//  -----------|------------------ |--------------- |--------------
//  TOTAL      |   2,248,310.39    | 2,040,694.17   |  207,616.22  ✓

const paymentRows = [
  { client_id: "Agoda",    total_bill_amount: 720000.00, settled_amount: 653827.00, pending_amount: 66173.00 },
  { client_id: "AgodaUK",  total_bill_amount: 450000.00, settled_amount: 408484.17, pending_amount: 41515.83 },
  { client_id: "AgodaEBK", total_bill_amount: 350000.00, settled_amount: 317769.00, pending_amount: 32231.00 },
  { client_id: "Barli2b",  total_bill_amount: 280000.00, settled_amount: 254249.00, pending_amount: 25751.00 },
  { client_id: "Lvzan",    total_bill_amount: 230000.00, settled_amount: 208847.00, pending_amount: 21153.00 },
  { client_id: "DidaOpaq", total_bill_amount: 218310.39, settled_amount: 197518.00, pending_amount: 20792.39 },
];

// Verify sums (dev guard)
const payCheck = paymentRows.reduce((a, r) => ({
  total: a.total + r.total_bill_amount,
  settled: a.settled + r.settled_amount,
  pending: a.pending + r.pending_amount,
}), { total: 0, settled: 0, pending: 0 });

if (Math.abs(payCheck.total - 2248310.39) > 0.02)
  throw new Error(`Payment total mismatch: ${payCheck.total}`);
if (Math.abs(payCheck.settled - 2040694.17) > 0.02)
  throw new Error(`Payment settled mismatch: ${payCheck.settled}`);
if (Math.abs(payCheck.pending - 207616.22) > 0.02)
  throw new Error(`Payment pending mismatch: ${payCheck.pending}`);

const insertPayment = db.prepare(
  `INSERT INTO finance_payment_progress (client_id, total_bill_amount, settled_amount, pending_amount)
   VALUES (@client_id, @total_bill_amount, @settled_amount, @pending_amount)`
);
db.transaction(() => paymentRows.forEach(r => insertPayment.run(r)))();

// ─── Unsettled bills (≥10 rows, all 6 client_ids covered, 3 billing periods) ─
//
//  billing_period 2026-04 → latest_collection_date 2026-05-15
//  billing_period 2026-05 → latest_collection_date 2026-06-15
//  billing_period 2026-06 → latest_collection_date 2026-07-15
//
//  Statuses used: 已逾期 / 部分结账 / 待结账  (NOT "高风险")
//  settlement_date: filled for 已逾期 and 部分结账; NULL for 待结账

const billRows = [
  // ── April period (billing_period = 2026-04) ──────────────────────────────
  {
    bill_no: "BILL-202604-001", client_id: "Agoda",    billing_period: "2026-04",
    latest_collection_date: "2026-05-15", status: "已逾期",   settlement_date: "2026-05-20",
    contact: "Jane", order_count: 286, amount: 245680.35,
  },
  {
    bill_no: "BILL-202604-002", client_id: "AgodaUK",  billing_period: "2026-04",
    latest_collection_date: "2026-05-15", status: "已逾期",   settlement_date: "2026-05-22",
    contact: "Jane", order_count: 164, amount: 138450.00,
  },
  {
    bill_no: "BILL-202604-003", client_id: "AgodaEBK", billing_period: "2026-04",
    latest_collection_date: "2026-05-15", status: "部分结账", settlement_date: "2026-05-12",
    contact: "Jane", order_count: 98,  amount: 87320.50,
  },
  {
    bill_no: "BILL-202604-004", client_id: "Barli2b",  billing_period: "2026-04",
    latest_collection_date: "2026-05-15", status: "待结账",   settlement_date: null,
    contact: "Jane", order_count: 52,  amount: 43800.00,
  },
  // ── May period (billing_period = 2026-05) ────────────────────────────────
  {
    bill_no: "BILL-202605-005", client_id: "Lvzan",    billing_period: "2026-05",
    latest_collection_date: "2026-06-15", status: "待结账",   settlement_date: null,
    contact: "Jane", order_count: 120, amount: 98760.00,
  },
  {
    bill_no: "BILL-202605-006", client_id: "DidaOpaq", billing_period: "2026-05",
    latest_collection_date: "2026-06-15", status: "部分结账", settlement_date: "2026-06-10",
    contact: "Jane", order_count: 183, amount: 156320.75,
  },
  {
    bill_no: "BILL-202605-007", client_id: "Agoda",    billing_period: "2026-05",
    latest_collection_date: "2026-06-15", status: "已逾期",   settlement_date: "2026-06-18",
    contact: "Jane", order_count: 312, amount: 287450.00,
  },
  {
    bill_no: "BILL-202605-008", client_id: "AgodaUK",  billing_period: "2026-05",
    latest_collection_date: "2026-06-15", status: "待结账",   settlement_date: null,
    contact: "Jane", order_count: 148, amount: 123900.50,
  },
  {
    bill_no: "BILL-202605-009", client_id: "AgodaEBK", billing_period: "2026-05",
    latest_collection_date: "2026-06-15", status: "部分结账", settlement_date: "2026-06-08",
    contact: "Jane", order_count: 89,  amount: 74580.00,
  },
  // ── June period (billing_period = 2026-06) ───────────────────────────────
  {
    bill_no: "BILL-202606-010", client_id: "Barli2b",  billing_period: "2026-06",
    latest_collection_date: "2026-07-15", status: "待结账",   settlement_date: null,
    contact: "Jane", order_count: 67,  amount: 55430.00,
  },
  {
    bill_no: "BILL-202606-011", client_id: "Agoda",    billing_period: "2026-06",
    latest_collection_date: "2026-07-15", status: "待结账",   settlement_date: null,
    contact: "Jane", order_count: 245, amount: 198760.00,
  },
  {
    bill_no: "BILL-202606-012", client_id: "DidaOpaq", billing_period: "2026-06",
    latest_collection_date: "2026-07-15", status: "待结账",   settlement_date: null,
    contact: "Jane", order_count: 156, amount: 128940.00,
  },
];

const insertBill = db.prepare(
  `INSERT INTO finance_unsettled_bills
     (bill_no, client_id, billing_period, latest_collection_date, status, settlement_date, contact, order_count, amount)
   VALUES
     (@bill_no, @client_id, @billing_period, @latest_collection_date, @status, @settlement_date, @contact, @order_count, @amount)`
);
db.transaction(() => billRows.forEach(r => insertBill.run(r)))();

// ─── Summary report ───────────────────────────────────────────────────────────

const creditTotal = db.prepare(
  "SELECT SUM(total_credit) t, SUM(avail_credit) a, SUM(consumed_credit) c FROM finance_credit_summary"
).get();
const payTotal = db.prepare(
  "SELECT SUM(total_bill_amount) t, SUM(settled_amount) s, SUM(pending_amount) p FROM finance_payment_progress"
).get();
const billCount = db.prepare("SELECT COUNT(*) cnt FROM finance_unsettled_bills").get();
const clientCoverage = db.prepare(
  "SELECT COUNT(DISTINCT client_id) cnt FROM finance_unsettled_bills"
).get();

console.log("=== Finance seed complete ===");
console.log(`finance_credit_summary:`);
console.log(`  total_credit    = ${creditTotal.t.toLocaleString()}`);
console.log(`  avail_credit    = ${creditTotal.a.toLocaleString()}`);
console.log(`  consumed_credit = ${creditTotal.c.toLocaleString()}`);
console.log(`finance_payment_progress:`);
console.log(`  total_bill_amount = ${payTotal.t.toFixed(2)}`);
console.log(`  settled_amount    = ${payTotal.s.toFixed(2)}`);
console.log(`  pending_amount    = ${payTotal.p.toFixed(2)}`);
console.log(`finance_unsettled_bills: ${billCount.cnt} rows, ${clientCoverage.cnt} distinct client_ids`);
console.log(`Database: ${DB_PATH}`);

db.close();
