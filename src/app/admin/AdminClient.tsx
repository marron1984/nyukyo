"use client";

import { useEffect, useMemo, useState } from "react";
import type { IntakeForm } from "@/lib/schema";
import { formatIntakeMessage } from "@/lib/format";

type Row = IntakeForm & {
  _rowNumber: number;
  timestamp: string;
};

export function AdminClient() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [careLevel, setCareLevel] = useState("");
  const [detail, setDetail] = useState<Row | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/list", { cache: "no-store" });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "取得に失敗しました");
      return;
    }
    setRows((data.rows as Row[]) ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function remove(r: Row) {
    if (!confirm(`「${r.customerName}」の行を削除します。よろしいですか？`)) return;
    const res = await fetch("/api/admin/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rowNumber: r._rowNumber }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "削除に失敗しました");
      return;
    }
    setDetail(null);
    load();
  }

  const filtered = useMemo(() => {
    if (!rows) return [];
    const qq = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (careLevel && r.careLevel !== careLevel) return false;
      if (!qq) return true;
      const hay = [
        r.customerName,
        r.keyPerson,
        r.companyName,
        r.contactPerson,
        r.situation,
        r.others,
      ]
        .map((x) => String(x ?? "").toLowerCase())
        .join(" ");
      return hay.includes(qq);
    });
  }, [rows, q, careLevel]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">入居相談 管理画面</h1>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100"
          >
            再読み込み
          </button>
          <a
            href="/"
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100"
          >
            受付フォームへ
          </a>
        </div>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          placeholder="顧客名 / キーパーソン / 状況などで検索"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 min-w-[240px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
        />
        <select
          value={careLevel}
          onChange={(e) => setCareLevel(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
        >
          <option value="">介護度: すべて</option>
          {["自立", "要支援1", "要支援2", "要介護1", "要介護2", "要介護3", "要介護4", "要介護5"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <span className="text-xs text-slate-500">
          {rows ? `${filtered.length} / ${rows.length} 件` : ""}
        </span>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
            <tr>
              <th className="px-3 py-2">受付日時</th>
              <th className="px-3 py-2">問い合わせ日</th>
              <th className="px-3 py-2">顧客名</th>
              <th className="px-3 py-2">年齢</th>
              <th className="px-3 py-2">性別</th>
              <th className="px-3 py-2">介護度</th>
              <th className="px-3 py-2">費用上限</th>
              <th className="px-3 py-2">キーパーソン</th>
              <th className="px-3 py-2 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} className="px-3 py-6 text-center text-slate-500">読み込み中…</td></tr>
            )}
            {!loading && rows && filtered.length === 0 && (
              <tr><td colSpan={9} className="px-3 py-6 text-center text-slate-500">該当データがありません</td></tr>
            )}
            {filtered.map((r) => (
              <tr key={r._rowNumber} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-500">
                  {formatTs(r.timestamp)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{formatInquiryDate(r.inquiryDate)}</td>
                <td className="px-3 py-2 font-medium text-slate-900">{r.customerName}</td>
                <td className="px-3 py-2">{r.age || ""}</td>
                <td className="px-3 py-2">{r.gender}</td>
                <td className="px-3 py-2">{r.careLevel}</td>
                <td className="px-3 py-2">{r.budgetYen ? `${Number(r.budgetYen).toLocaleString()}円` : ""}</td>
                <td className="px-3 py-2">{r.keyPerson}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => setDetail(r)}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-100"
                  >
                    詳細
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detail && (
        <DetailModal
          row={detail}
          onClose={() => setDetail(null)}
          onDelete={() => remove(detail)}
        />
      )}
    </main>
  );
}

function formatTs(s: string | undefined): string {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return String(s);
  const z = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${z(d.getMonth() + 1)}/${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`;
}

function formatInquiryDate(s: string | undefined): string {
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const [y, m, d] = s.slice(0, 10).split("-");
    return `${y}/${m}/${d}`;
  }
  return s;
}

function DetailModal({
  row,
  onClose,
  onDelete,
}: {
  row: Row;
  onClose: () => void;
  onDelete: () => void;
}) {
  const text = formatIntakeMessage(row);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      alert("コピーしました");
    } catch {
      alert("コピーに失敗しました");
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{row.customerName} の詳細</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">✕</button>
        </div>
        <pre className="whitespace-pre-wrap rounded-md bg-slate-50 p-4 text-xs text-slate-800">
{text}
        </pre>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={copy} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100">テンプレ形式でコピー</button>
          <button onClick={onDelete} className="rounded-md bg-rose-600 px-3 py-1.5 text-sm text-white hover:bg-rose-700">削除</button>
        </div>
      </div>
    </div>
  );
}
