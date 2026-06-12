// 1000 条渠道匹配模拟数据
// DidaHotelID(number), clientId(string), clientHotelId(string), updatedAt(string)

const CLIENT_IDS = ["Agoda", "AgodaUK", "AgodaEBK", "Lvzan", "Barli2b", "DidaOpaq"];

const HOTEL_NAME_PREFIXES = [
  "Grand", "Royal", "Plaza", "Palace", "Hilton", "Marriott", "Hyatt",
  "Sheraton", "Westin", "InterContinental", "Radisson", "Holiday",
  "Novotel", "Ibis", "Mercure", "Sofitel", "Pullman", "Crowne",
];

function pad(n: number, len = 6) {
  return String(n).padStart(len, "0");
}

function randomDate(start: Date, end: Date) {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().replace("T", " ").slice(0, 19);
}

const START = new Date("2024-01-01");
const END   = new Date("2026-06-12");

export type MappingRow = {
  id: number;
  didaHotelId: number;
  clientId: string;
  clientHotelId: string;
  updatedAt: string;
};

export const mappingData: MappingRow[] = Array.from({ length: 1000 }, (_, i) => {
  const didaId = 10000 + i * 3 + Math.floor(Math.random() * 3);
  const clientId = CLIENT_IDS[i % CLIENT_IDS.length];
  const prefix = HOTEL_NAME_PREFIXES[i % HOTEL_NAME_PREFIXES.length];
  const clientHotelId = `${prefix.slice(0, 1)}${pad(i + 1, 5)}`;
  return {
    id: i + 1,
    didaHotelId: didaId,
    clientId,
    clientHotelId,
    updatedAt: randomDate(START, END),
  };
});
