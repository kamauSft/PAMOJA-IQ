import * as XLSX from "xlsx";
import { canonicalPhone } from "./auth";

const BOOKS = "pamoja-public-books";

export function loadBooks() {
  try {
    return JSON.parse(localStorage.getItem(BOOKS) || "null");
  } catch {
    return null;
  }
}

export function saveBooks(rows) {
  localStorage.setItem(BOOKS, JSON.stringify({ rows, savedAt: new Date().toISOString() }));
}

function amount(value) {
  if (value === "" || value === null || value === undefined) return 0;
  const number = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(number) ? number : 0;
}

export function kes(value) {
  return `KES ${Math.round(Number(value) || 0).toLocaleString("en-KE")}`;
}

export async function readWorkbook(file) {
  const name = file.name.toLowerCase();
  if (!name.endsWith(".xlsx")) return { ok: false, message: "Upload the Excel template, a .xlsx file." };
  const book = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const members = XLSX.utils.sheet_to_json(book.Sheets.Members ?? {}, { defval: "" });
  const contributions = XLSX.utils.sheet_to_json(book.Sheets.Contributions ?? {}, { defval: "" });
  const paid = new Map();
  for (const row of contributions) {
    const memberNo = String(row["Member No"] ?? "").trim();
    if (!memberNo) continue;
    let total = 0;
    let octoberBlank = true;
    for (const [key, value] of Object.entries(row)) {
      if (!/^\d{4}-\d{2}$/.test(key)) continue;
      const figure = amount(value);
      total += figure;
      if (key.endsWith("-10") && figure > 0) octoberBlank = false;
    }
    paid.set(memberNo, { total, october: octoberBlank ? "Still to pay" : "Recorded" });
  }
  const rows = [];
  for (const row of members) {
    const memberNo = String(row["Member No"] ?? "").trim();
    const fullName = String(row["Full Name"] ?? "").trim();
    if (!memberNo || !fullName) continue;
    const record = paid.get(memberNo);
    rows.push({
      memberNo,
      name: fullName,
      phone: canonicalPhone(row.Phone),
      phoneLabel: String(row.Phone ?? ""),
      role: String(row.Role ?? "Member"),
      savings: record?.total ?? 0,
      october: record?.october ?? "Still to pay",
    });
  }
  if (rows.length === 0) return { ok: false, message: "No members were found. Use the Members sheet in the template." };
  return { ok: true, rows };
}
