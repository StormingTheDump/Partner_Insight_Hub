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
    const rows = db.prepare("SELECT * FROM orders").all();
    db.close();
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to query orders", detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
  console.log(`  GET http://localhost:${PORT}/api/orders`);
});
