import type { IntakeForm } from "./schema";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function fmtYen(n: number | undefined | null | string): string {
  if (n === undefined || n === null || n === "") return "";
  const num = typeof n === "number" ? n : Number(n);
  if (Number.isNaN(num)) return String(n);
  return `${num.toLocaleString("ja-JP")}円まで`;
}

export function formatIntakeMessage(f: IntakeForm): string {
  const debt =
    f.hasDebt === "あり"
      ? `あり${f.debtNote ? `（${f.debtNote}）` : ""}`
      : "なし";

  return [
    `【問い合わせ日】${fmtDate(f.inquiryDate)}`,
    `【顧客名（イニシャル可）】${f.customerName}`,
    `【年齢】${f.age ? `${f.age}歳` : ""}`,
    `【性別】${f.gender}`,
    `【介護度】${f.careLevel}`,
    `【費用】${fmtYen(f.budgetYen as number)}`,
    ``,
    `【ADL】`,
    `座位：${f.adlSitting}`,
    `立位：${f.adlStanding}`,
    `排泄：${f.adlToilet}`,
    `食事：${f.adlMeal}`,
    `意思疎通：${f.adlCommunication}`,
    ``,
    `【ADL詳細】`,
    f.adlDetail,
    ``,
    `【借金の有無】${debt}`,
    ``,
    `【現在の詳細状況】`,
    f.situation,
    ``,
    `【エント】${f.ent}`,
    ``,
    `【その他】`,
    f.others,
    ``,
    `【キーパーソン】${f.keyPerson}`,
    `【御社名】${f.companyName}`,
    `【ご担当者名】${f.contactPerson}`,
  ].join("\n");
}
