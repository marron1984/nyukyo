import type { IntakeForm } from "./schema";
import { CARE_LEVELS, GENDERS } from "./schema";

// 「【ラベル】値」または「【ラベル】\n複数行」をすべて拾うパーサ
function extractSections(text: string): Map<string, string> {
  const map = new Map<string, string>();
  const re = /【([^】]+)】([^\n]*)\n?([\s\S]*?)(?=【[^】]+】|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const label = m[1].trim();
    const inline = (m[2] ?? "").trim();
    const rest = (m[3] ?? "").trim();
    const value = inline && rest ? `${inline}\n${rest}` : inline || rest;
    map.set(label, value.trim());
  }
  return map;
}

function parseDate(s: string): string {
  // 例: "2026年5月21日" / "2026/5/21" / "2026-05-21"
  const m1 = s.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if (m1) {
    const [, y, mo, d] = m1;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const m2 = s.match(/(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
  if (m2) {
    const [, y, mo, d] = m2;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return "";
}

function parseAge(s: string): number | undefined {
  const m = s.match(/\d+/);
  return m ? Number(m[0]) : undefined;
}

function parseYen(s: string): number | undefined {
  const m = s.replace(/[, ]/g, "").match(/\d+/);
  return m ? Number(m[0]) : undefined;
}

function parseGender(s: string): IntakeForm["gender"] {
  for (const g of GENDERS) if (s.includes(g)) return g;
  return "男性";
}

function parseCareLevel(s: string): IntakeForm["careLevel"] {
  const cleaned = s.replace(/\s/g, "");
  for (const c of CARE_LEVELS) if (cleaned.includes(c)) return c;
  return "要介護1";
}

function parseAdlBlock(block: string): {
  adlSitting: string;
  adlStanding: string;
  adlToilet: string;
  adlMeal: string;
  adlCommunication: string;
} {
  const out = {
    adlSitting: "",
    adlStanding: "",
    adlToilet: "",
    adlMeal: "",
    adlCommunication: "",
  };
  const mapKey: Record<string, keyof typeof out> = {
    座位: "adlSitting",
    立位: "adlStanding",
    排泄: "adlToilet",
    食事: "adlMeal",
    意思疎通: "adlCommunication",
  };
  for (const line of block.split(/\r?\n/)) {
    const m = line.match(/^\s*([^：:]+)\s*[：:]\s*(.+?)\s*$/);
    if (!m) continue;
    const key = mapKey[m[1].trim()];
    if (key) out[key] = m[2].trim();
  }
  return out;
}

function parseDebt(s: string): { hasDebt: IntakeForm["hasDebt"]; debtNote: string } {
  const trimmed = s.trim();
  if (/^なし/.test(trimmed)) return { hasDebt: "なし", debtNote: "" };
  if (/^あり/.test(trimmed)) {
    const note = trimmed.replace(/^あり[\s（(]*/, "").replace(/[)）\s]*$/, "");
    return { hasDebt: "あり", debtNote: note };
  }
  return { hasDebt: "なし", debtNote: "" };
}

export type ParseResult = Partial<IntakeForm> & { _unmatched: string[] };

export function parseIntakeText(text: string): ParseResult {
  const sections = extractSections(text);
  const get = (k: string) => sections.get(k) ?? "";
  const unmatched: string[] = [];

  const adl = parseAdlBlock(get("ADL"));
  const debt = parseDebt(get("借金の有無"));

  const result: ParseResult = {
    inquiryDate: parseDate(get("問い合わせ日")) || undefined,
    customerName: get("顧客名（イニシャル可）") || get("顧客名") || undefined,
    age: parseAge(get("年齢")) as IntakeForm["age"],
    gender: get("性別") ? parseGender(get("性別")) : undefined,
    careLevel: get("介護度") ? parseCareLevel(get("介護度")) : undefined,
    budgetYen: parseYen(get("費用")) as IntakeForm["budgetYen"],
    ...adl,
    adlDetail: get("ADL詳細"),
    hasDebt: debt.hasDebt,
    debtNote: debt.debtNote,
    situation: get("現在の詳細状況"),
    ent: get("エント") || "未確認",
    others: get("その他"),
    keyPerson: get("キーパーソン"),
    companyName: get("御社名") || "未確認",
    contactPerson: get("ご担当者名") || "未確認",
    _unmatched: unmatched,
  };

  const known = new Set([
    "問い合わせ日",
    "顧客名（イニシャル可）",
    "顧客名",
    "年齢",
    "性別",
    "介護度",
    "費用",
    "ADL",
    "ADL詳細",
    "借金の有無",
    "現在の詳細状況",
    "エント",
    "その他",
    "キーパーソン",
    "御社名",
    "ご担当者名",
  ]);
  for (const label of sections.keys()) {
    if (!known.has(label)) unmatched.push(label);
  }

  return result;
}
