// Build-Skript: holt die Praxen-Tabelle als CSV (Google Sheets) und erzeugt data/practices.json.
// Läuft ohne externe Abhängigkeiten (Node >= 18, built-in fetch).
// Fallback: lokale tr_praxen.csv, falls der Online-Abruf fehlschlägt.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const SHEET_ID = "1GOHW-IZV6jaCwYWY9B4etAEMkXIjOIPY4-QNG6YkAfw";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
const LOCAL_CSV = resolve(ROOT, "tr_praxen.csv");
const OUT_FILE = resolve(ROOT, "data", "practices.json");

/**
 * Minimaler, robuster CSV-Parser (RFC-4180-artig).
 * Unterstützt Anführungszeichen, eingebettete Kommas, Zeilenumbrüche und "" als Escape.
 */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  // BOM entfernen
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  // Zeilenenden normalisieren
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  // Letztes Feld/letzte Zeile
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Deutsches Dezimalformat ("50,0851") -> Zahl. */
function parseCoord(value) {
  if (value == null) return null;
  const cleaned = String(value).trim().replace(/\s/g, "").replace(",", ".");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Mehrwertiges Feld ("Erwachsene, Kinder & Jugendliche") -> ["Erwachsene", "Kinder & Jugendliche"]. */
function splitMulti(value, separators = [",", "/"]) {
  if (!value) return [];
  const pattern = new RegExp(`[${separators.map((s) => "\\" + s).join("")}]`);
  return String(value)
    .split(pattern)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function loadCsv() {
  try {
    const res = await fetch(CSV_URL, { redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    // Google liefert bei fehlendem Zugriff eine HTML-Login-Seite statt CSV.
    if (/^\s*</.test(text) || /<html/i.test(text.slice(0, 200))) {
      throw new Error("Kein CSV erhalten (evtl. Tabelle nicht öffentlich).");
    }
    console.log("Datenquelle: Google Sheet (online).");
    return text;
  } catch (err) {
    console.warn(`Online-Abruf fehlgeschlagen: ${err.message}`);
    if (existsSync(LOCAL_CSV)) {
      console.log("Fallback: lokale tr_praxen.csv.");
      return await readFile(LOCAL_CSV, "utf8");
    }
    throw new Error("Keine Datenquelle verfügbar (weder online noch lokal).");
  }
}

function normalizeHeader(h) {
  return h.trim().toLowerCase();
}

async function main() {
  const csv = await loadCsv();
  const rows = parseCsv(csv).filter((r) => r.some((c) => String(c).trim() !== ""));
  if (rows.length < 2) throw new Error("CSV enthält keine Datenzeilen.");

  const headers = rows[0].map((h) => h.trim());
  const hIndex = {};
  headers.forEach((h, i) => (hIndex[normalizeHeader(h)] = i));
  console.log("Erkannte Spalten:", headers.join(" | "));

  const col = (row, name) => {
    const i = hIndex[name];
    return i == null ? "" : (row[i] ?? "").trim();
  };

  const practices = [];
  let skipped = 0;

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const lat = parseCoord(col(row, "lat"));
    const lng = parseCoord(col(row, "lng"));
    const name = col(row, "name");

    if (!name || lat == null || lng == null) {
      skipped++;
      if (name) console.warn(`Übersprungen (ungültige Koordinaten): ${name}`);
      continue;
    }

    practices.push({
      name,
      strasse: col(row, "strasse"),
      plz: col(row, "plz"),
      ort: col(row, "ort"),
      bundesland: col(row, "bundesland"),
      telefon: col(row, "telefon"),
      email: col(row, "email"),
      website: col(row, "website"),
      zielgruppe: splitMulti(col(row, "zielgruppe"), [","]),
      finanzierung: splitMulti(col(row, "finanzierung"), ["/"]),
      lat,
      lng,
    });
  }

  practices.sort((a, b) => a.name.localeCompare(b.name, "de"));

  const output = {
    updatedAt: new Date().toISOString(),
    count: practices.length,
    practices,
  };

  await mkdir(dirname(OUT_FILE), { recursive: true });
  await writeFile(OUT_FILE, JSON.stringify(output, null, 2) + "\n", "utf8");

  console.log(`Fertig: ${practices.length} Praxen geschrieben, ${skipped} übersprungen.`);
  console.log(`Datei: ${OUT_FILE}`);
}

main().catch((err) => {
  console.error("Fehler:", err.message);
  process.exit(1);
});
