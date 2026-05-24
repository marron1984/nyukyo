"use client";

import { useEffect, useMemo, useState } from "react";

const COLUMN_HEADERS = [
  "No.",
  "問い合わせ日",
  "ステータス",
  "名前",
  "年齢",
  "性別",
  "入居場所",
  "連絡先",
  "キーパーソン",
  "介護度",
  "ADL詳細",
  "希望物件",
  "エント希望",
  "借金有無",
  "費用",
  "その他、備考",
] as const;

type Row = {
  _rowNumber: number;
  c0: string;
  c1: string;
  c2: string;
  c3: string;
  c4: string;
  c5: string;
  c6: string;
  c7: string;
  c8: string;
  c9: string;
  c10: string;
  c11: string;
  c12: string;
  c13: string;
  c14: string;
  c15: string;
};

export function AdminClient() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [careLevel, setCareLevel] = useState("");
  const [status, setStatus] = useState("");
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
    if (!confirm(`「${r.c3 || "(無名)"}」の行を削除します。よろしいですか？`)) return;
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
      if (careLevel && !String(r.c9 ?? "").includes(careLevel)) return false;
      if (status && !String(r.c2 ?? "").includes(status)) return false;
      if (!qq) return true;
      const hay = Object.values(r)
        .map((x) => String(x ?? "").toLowerCase())
        .join(" ");
      return hay.includes(qq);
    });
  }, [rows, q, careLevel, status]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
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
          placeholder="フリーワード検索（全列対象）"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 min-w-[240px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
        />
        <input
          placeholder="ステータスで絞り込み"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
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
          <thead className="bg-slate-100 text-left text-xs text-slate-600">
            <tr>
              <th className="px-2 py-2">No.</th>
              <th className="px-2 py-2">問い合わせ日</th>
              <th className="px-2 py-2">ステータス</th>
              <th className="px-2 py-2">名前</th>
              <th className="px-2 py-2">年齢</th>
              <th className="px-2 py-2">介護度</th>
              <th className="px-2 py-2">費用</th>
              <th className="px-2 py-2">キーパーソン</th>
              <th className="px-2 py-2 text-right">操作</th>
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
                <td className="px-2 py-2 whitespace-nowrap text-slate-500">{r.c0}</td>
                <td className="px-2 py-2 whitespace-nowrap">{r.c1}</td>
                <td className="px-2 py-2 whitespace-nowrap">{r.c2}</td>
                <td className="px-2 py-2 font-medium text-slate-900">{r.c3}</td>
                <td className="px-2 py-2">{r.c4}</td>
                <td className="px-2 py-2">{r.c9}</td>
                <td className="px-2 py-2">{r.c14}</td>
                <td className="px-2 py-2">{r.c8}</td>
                <td className="px-2 py-2 text-right">
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

function DetailModal({
  row,
  onClose,
  onDelete,
}: {
  row: Row;
  onClose: () => void;
  onDelete: () => void;
}) {
  const lines: string[] = [];
  for (let i = 0; i < COLUMN_HEADERS.length; i++) {
    const key = `c${i}` as keyof Row;
    const v = row[key];
    if (v === undefined || v === null || v === "") continue;
    lines.push(`【${COLUMN_HEADERS[i]}】\n${v}`);
  }
  const text = lines.join("\n\n");

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
          <h2 className="text-lg font-semibold text-slate-900">{row.c3 || "(無名)"} の詳細</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">✕</button>
        </div>
        <pre className="whitespace-pre-wrap rounded-md bg-slate-50 p-4 text-xs text-slate-800">{text}</pre>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={copy} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100">テンプレ形式でコピー</button>
          <button onClick={onDelete} className="rounded-md bg-rose-600 px-3 py-1.5 text-sm text-white hover:bg-rose-700">削除</button>
        </div>
      </div>
    </div>
  );
}
