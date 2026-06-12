const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "orders.db");
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    client_ref          TEXT NOT NULL UNIQUE,
    dida_ref            TEXT NOT NULL UNIQUE,
    channel_status      TEXT NOT NULL,
    dida_hotel_id       TEXT NOT NULL,
    client_hotel_id     TEXT NOT NULL,
    dida_hotel_name     TEXT NOT NULL,
    price               TEXT NOT NULL,
    client_id           TEXT NOT NULL,
    channel_create_time TEXT NOT NULL,
    checkin_date        TEXT NOT NULL,
    checkout_date       TEXT NOT NULL
  )
`);

db.exec("DELETE FROM orders");

const HOTEL_NAMES = [
  "AmericInn by Wyndham Duluth South Black Woods Event Center",
  "Radisson Blu Hotel, Hasselt",
  "Outbound Sedona",
  "Princess Royale Oceanfront Resort",
  "Carbon Hotel - Different Hotels",
  "The Island House",
  "Relais Spa Val d'Europe",
  "Buffalo Lodge",
  "Jaz in the City Amsterdam",
  "The Story Hotel Pera",
  "Casati Hotel – Adults Only",
  "Mercure Istanbul Altunizade",
  "L Abbaye De Talloires",
  "BlueSotel Krabi Ao Nang Beach",
  "Row NYC",
  "Hotel Saranda Butrinti, Affiliated by Meliá",
  "Hotel Andreas Hofer",
  "Novotel Paris Charles de Gaulle Airport",
  "COMO Point Yamu, Phuket",
  "Medina Belisaire &Thalasso",
  "Belton Woods Hotel, Spa & Golf Resort",
  "Craigmonie Hotel Inverness by Compass Hospitality",
  "Row NYC",
  "Aminess Younique Gaia Green Villas",
  "Hotel Offenbacher Hof",
  "NH Trieste",
  "Plaza Beach Hotel Beachfront Resort"
];

const CLIENT_IDS = ["Agoda", "AgodaUK", "AgodaEBK", "Barli2b", "Lvzan", "DidaOpaq"];
const STATUSES = ["Confirmed", "Canceled", "Failed"];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pad(n, len) {
  return String(n).padStart(len, "0");
}

function pickStatus() {
  const r = Math.random();
  if (r < 0.80) return "Confirmed";
  if (r < 0.95) return "Canceled";
  return "Failed";
}

function randDateTime(year) {
  const month = randInt(1, 12);
  const daysInMonth = new Date(year, month, 0).getDate();
  const day = randInt(1, daysInMonth);
  const hour = randInt(0, 23);
  const min = randInt(0, 59);
  const sec = randInt(0, 59);
  return {
    str: `${year}-${pad(month, 2)}-${pad(day, 2)} ${pad(hour, 2)}:${pad(min, 2)}:${pad(sec, 2)}`,
    dateStr: `${year}-${pad(month, 2)}-${pad(day, 2)}`,
    ts: new Date(year, month - 1, day).getTime()
  };
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1, 2);
  const day = pad(d.getDate(), 2);
  return `${y}-${m}-${day}`;
}

function randPrice() {
  const dollars = randInt(50, 2000);
  const cents = randInt(0, 99);
  return `$${dollars}.${pad(cents, 2)}`;
}

const year = new Date().getFullYear();

const usedClientRefs = new Set();
const usedDidaRefs = new Set();

function uniqueSixDigit() {
  let n;
  do { n = pad(randInt(100000, 999999), 6); } while (usedClientRefs.has(n));
  usedClientRefs.add(n);
  return n;
}

function uniqueEightDigit() {
  let n;
  do { n = pad(randInt(10000000, 99999999), 8); } while (usedDidaRefs.has(n));
  usedDidaRefs.add(n);
  return n;
}

const insert = db.prepare(`
  INSERT INTO orders
    (client_ref, dida_ref, channel_status, dida_hotel_id, client_hotel_id,
     dida_hotel_name, price, client_id, channel_create_time, checkin_date, checkout_date)
  VALUES
    (@client_ref, @dida_ref, @channel_status, @dida_hotel_id, @client_hotel_id,
     @dida_hotel_name, @price, @client_id, @channel_create_time, @checkin_date, @checkout_date)
`);

const insertMany = db.transaction((rows) => {
  for (const row of rows) insert.run(row);
});

const rows = [];
for (let i = 0; i < 1000; i++) {
  const createDt = randDateTime(year);
  const checkinOffset = randInt(0, 90);
  const checkin = addDays(createDt.dateStr, checkinOffset);
  const stayNights = randInt(1, 14);
  const checkout = addDays(checkin, stayNights);

  const hotelIdLen = randInt(1, 7);
  const hotelIdMax = Math.pow(10, hotelIdLen) - 1;
  const hotelIdMin = hotelIdLen === 1 ? 0 : Math.pow(10, hotelIdLen - 1);
  const dida_hotel_id = String(randInt(hotelIdMin, hotelIdMax));

  const clientHotelIdLen = randInt(1, 6);
  const chMax = Math.pow(10, clientHotelIdLen) - 1;
  const chMin = clientHotelIdLen === 1 ? 0 : Math.pow(10, clientHotelIdLen - 1);
  const client_hotel_id = "A" + String(randInt(chMin, chMax));

  rows.push({
    client_ref: "Agoda-" + uniqueSixDigit(),
    dida_ref: uniqueEightDigit(),
    channel_status: pickStatus(),
    dida_hotel_id,
    client_hotel_id,
    dida_hotel_name: HOTEL_NAMES[randInt(0, HOTEL_NAMES.length - 1)],
    price: randPrice(),
    client_id: CLIENT_IDS[randInt(0, CLIENT_IDS.length - 1)],
    channel_create_time: createDt.str,
    checkin_date: checkin,
    checkout_date: checkout
  });
}

insertMany(rows);

const count = db.prepare("SELECT COUNT(*) as cnt FROM orders").get();
const statusDist = db.prepare("SELECT channel_status, COUNT(*) as cnt FROM orders GROUP BY channel_status").all();

console.log(`Seeded ${count.cnt} rows into orders table.`);
console.log("Status distribution:");
statusDist.forEach(r => console.log(`  ${r.channel_status}: ${r.cnt}`));
console.log(`Database: ${DB_PATH}`);

db.close();
