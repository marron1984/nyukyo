"use client";

import { useEffect, useMemo, useState } from "react";
import { Toast, type ToastState } from "@/components/Toast";

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

const STATUS_OPTIONS = ["新規", "対応中", "保留", "完了", "キャンセル"] as const;

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

type SortKey = "c0" | "c1" | "c2" | "c3" | "c4" | "c9" | "c14" | "c8" | null;
type SortDir = "asc" | "desc";

const STATUS_COLOR: Record<string, string> = {
  新規: "bg-sky-100 text-sky-800 border-sky-200",
  対応中: "bg-amber-100 text-amber-800 border-amber-200",
  保留: "bg-slate-100 text-slate-700 border-slate-200",
  完了: "bg-emerald-100 text-emerald-800 border-emerald-200",
  キャンセル: "bg-rose-100 text-rose-800 border-rose-200",
};

function statusBadge(status: string) {
  const cls = STATUS_COLOR[status] ?? "bg-slate-100 text-slate-700 border-slate-200";
  return `inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`;
}

function toDate(s: string): Date | null {
  if (!s) return null;
  const m = String(s).match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function csvEscape(v: string): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function AdminClient() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [careLevel, setCareLevel] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [detail, setDetail] = useState<Row | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [updatingRow, setUpdatingRow] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/list", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "取得に失敗しました");
        return;
      }
      setRows((data.rows as Row[]) ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
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
      setToast({ kind: "error", message: d.error ?? "削除に失敗しました" });
      return;
    }
    setDetail(null);
    setToast({ kind: "success", message: "削除しました" });
    load();
  }

  async function updateCells(rowNumber: number, cells: Record<string, string>) {
    setUpdatingRow(rowNumber);
    try {
      const res = await fetch("/api/admin/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowNumber, cells }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setToast({ kind: "error", message: d.error ?? "更新に失敗しました" });
        return false;
      }
      setRows((prev) =>
        prev
          ? prev.map((r) =>
              r._rowNumber === rowNumber ? ({ ...r, ...cells } as Row) : r,
            )
          : prev,
      );
      return true;
    } finally {
      setUpdatingRow(null);
    }
  }

  async function quickStatusChange(r: Row, newStatus: string) {
    if (newStatus === r.c2) return;
    const ok = await updateCells(r._rowNumber, { c2: newStatus });
    if (ok) setToast({ kind: "success", message: `ステータスを「${newStatus}」に更新` });
  }

  const filtered = useMemo(() => {
    if (!rows) return [];
    const qq = q.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;
    let result = rows.filter((r) => {
      if (careLevel && !String(r.c9 ?? "").includes(careLevel)) return false;
      if (status && !String(r.c2 ?? "").includes(status)) return false;
      if (from || to) {
        const d = toDate(r.c1);
        if (!d) return false;
        if (from && d < from) return false;
        if (to && d > to) return false;
      }
      if (!qq) return true;
      const hay = Object.values(r)
        .map((x) => String(x ?? "").toLowerCase())
        .join(" ");
      return hay.includes(qq);
    });

    if (sortKey) {
      const numeric = sortKey === "c0" || sortKey === "c4";
      const dateKey = sortKey === "c1";
      result = [...result].sort((a, b) => {
        const av = a[sortKey] ?? "";
        const bv = b[sortKey] ?? "";
        let cmp = 0;
        if (numeric) {
          const an = Number(String(av).replace(/[^0-9.-]/g, ""));
          const bn = Number(String(bv).replace(/[^0-9.-]/g, ""));
          cmp = (isNaN(an) ? -Infinity : an) - (isNaN(bn) ? -Infinity : bn);
        } else if (dateKey) {
          const ad = toDate(String(av))?.getTime() ?? 0;
          const bd = toDate(String(bv))?.getTime() ?? 0;
          cmp = ad - bd;
        } else {
          cmp = String(av).localeCompare(String(bv), "ja");
        }
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [rows, q, careLevel, status, dateFrom, dateTo, sortKey, sortDir]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!rows) return counts;
    for (const r of rows) {
      const s = String(r.c2 ?? "").trim() || "（未設定）";
      counts[s] = (counts[s] ?? 0) + 1;
    }
    return counts;
  }, [rows]);

  function toggleSort(key: NonNullable<SortKey>) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function sortIcon(key: NonNullable<SortKey>) {
    if (sortKey !== key) return <span className="text-slate-300">⇅</span>;
    return <span className="text-sky-600">{sortDir === "asc" ? "▲" : "▼"}</span>;
  }

  function exportCsv() {
    const header = ["行番号", ...COLUMN_HEADERS];
    const lines = [header.map(csvEscape).join(",")];
    for (const r of filtered) {
      const cells = [String(r._rowNumber)];
      for (let i = 0; i < COLUMN_HEADERS.length; i++) {
        cells.push(String((r as unknown as Record<string, string>)[`c${i}`] ?? ""));
      }
      lines.push(cells.map(csvEscape).join(","));
    }
    const bom = "﻿";
    const blob = new Blob([bom + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ts = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `nyukyo_${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToast({ kind: "success", message: `${filtered.length}件をCSVに書き出しました` });
  }

  function resetFilters() {
    setQ("");
    setCareLevel("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
    setSortKey(null);
  }

  const sortableHeaders: { key: NonNullable<SortKey>; label: string; cls?: string }[] = [
    { key: "c0", label: "No." },
    { key: "c1", label: "問い合わせ日" },
    { key: "c2", label: "ステータス" },
    { key: "c3", label: "名前" },
    { key: "c4", label: "年齢" },
    { key: "c9", label: "介護度" },
    { key: "c14", label: "費用" },
    { key: "c8", label: "キーパーソン" },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">入居相談 管理画面</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {rows ? `全 ${rows.length} 件` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportCsv}
            disabled={!rows || filtered.length === 0}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100 disabled:opacity-50"
          >
            CSV出力
          </button>
          <button
            onClick={load}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100"
          >
            再読み込み
          </button>
          <a
            href="https://docs.google.com/spreadsheets/d/1y00PmqtKRCsyrvaH8ydO3QbzVbFXGEVA2dpKOUDJMaY/edit?gid=0#gid=0"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
          >
            <span aria-hidden>📊</span>
            スプレッドシート
            <span aria-hidden className="text-emerald-600">↗</span>
          </a>
          <a
            href="/"
            className="rounded-md bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-700"
          >
            受付フォームへ
          </a>
        </div>
      </header>

      {rows && rows.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {Object.entries(statusCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([s, n]) => (
              <button
                key={s}
                onClick={() => setStatus(status === s ? "" : s)}
                className={`${statusBadge(s)} ${status === s ? "ring-2 ring-sky-400" : ""} cursor-pointer hover:opacity-80`}
                title={`ステータス「${s}」で絞り込み`}
              >
                {s}：{n}
              </button>
            ))}
        </div>
      )}

      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <input
            placeholder="🔍 フリーワード検索（全列対象）"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 min-w-[240px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm"
          >
            <option value="">ステータス: すべて</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
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
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <span>問合せ日</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs"
            />
            <span>〜</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs"
            />
          </div>
          <button
            onClick={resetFilters}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
          >
            条件クリア
          </button>
          <span className="ml-auto text-xs text-slate-500">
            {rows ? `${filtered.length} / ${rows.length} 件` : ""}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* PC: テーブル */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-left text-xs text-slate-700 sticky top-0">
            <tr>
              {sortableHeaders.map((h) => (
                <th key={h.key} className="px-2 py-2">
                  <button
                    onClick={() => toggleSort(h.key)}
                    className="inline-flex items-center gap-1 hover:text-sky-700"
                  >
                    {h.label} {sortIcon(h.key)}
                  </button>
                </th>
              ))}
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
              <tr key={r._rowNumber} className="border-t border-slate-100 hover:bg-sky-50/40 transition-colors">
                <td className="px-2 py-2 whitespace-nowrap text-slate-500">{r.c0}</td>
                <td className="px-2 py-2 whitespace-nowrap">{r.c1}</td>
                <td className="px-2 py-2 whitespace-nowrap">
                  <select
                    value={r.c2 || ""}
                    onChange={(e) => quickStatusChange(r, e.target.value)}
                    disabled={updatingRow === r._rowNumber}
                    className={`${statusBadge(r.c2)} cursor-pointer outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-50 bg-transparent`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {[...new Set([r.c2 || "新規", ...STATUS_OPTIONS])].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-2 font-medium text-slate-900">{r.c3}</td>
                <td className="px-2 py-2">{r.c4}</td>
                <td className="px-2 py-2">{r.c9}</td>
                <td className="px-2 py-2 whitespace-nowrap">{r.c14}</td>
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

      {/* モバイル: カード */}
      <div className="md:hidden space-y-2">
        {loading && (
          <p className="rounded-md bg-white p-4 text-center text-sm text-slate-500 shadow-sm">読み込み中…</p>
        )}
        {!loading && rows && filtered.length === 0 && (
          <p className="rounded-md bg-white p-4 text-center text-sm text-slate-500 shadow-sm">該当データがありません</p>
        )}
        {filtered.map((r) => (
          <button
            key={r._rowNumber}
            onClick={() => setDetail(r)}
            className="w-full text-left rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-sky-400"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500">No.{r.c0} · {r.c1}</span>
              <span className={statusBadge(r.c2)}>{r.c2 || "—"}</span>
            </div>
            <div className="mt-1 text-base font-semibold text-slate-900">
              {r.c3 || "(無名)"} <span className="text-xs font-normal text-slate-500">{r.c4} {r.c5}</span>
            </div>
            <div className="mt-0.5 text-xs text-slate-600">
              {r.c9} · {r.c14}
            </div>
          </button>
        ))}
      </div>

      {detail && (
        <DetailModal
          row={detail}
          onClose={() => setDetail(null)}
          onDelete={() => remove(detail)}
          onSave={async (cells) => {
            const ok = await updateCells(detail._rowNumber, cells);
            if (ok) {
              setToast({ kind: "success", message: "更新しました" });
              setDetail((d) => (d ? ({ ...d, ...cells } as Row) : d));
            }
            return ok;
          }}
        />
      )}
    </main>
  );
}

function DetailModal({
  row,
  onClose,
  onDelete,
  onSave,
}: {
  row: Row;
  onClose: () => void;
  onDelete: () => void;
  onSave: (cells: Record<string, string>) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {};
    for (let i = 0; i < COLUMN_HEADERS.length; i++) {
      const k = `c${i}`;
      o[k] = String((row as unknown as Record<string, string>)[k] ?? "");
    }
    return o;
  });
  const [saving, setSaving] = useState(false);

  function buildText(src: Record<string, string>): string {
    const lines: string[] = [];
    for (let i = 0; i < COLUMN_HEADERS.length; i++) {
      const v = src[`c${i}`];
      if (v === undefined || v === null || v === "") continue;
      lines.push(`【${COLUMN_HEADERS[i]}】\n${v}`);
    }
    return lines.join("\n\n");
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(buildText(draft));
      alert("コピーしました");
    } catch {
      alert("コピーに失敗しました");
    }
  }

  async function save() {
    setSaving(true);
    const changed: Record<string, string> = {};
    for (let i = 0; i < COLUMN_HEADERS.length; i++) {
      const k = `c${i}`;
      const orig = String((row as unknown as Record<string, string>)[k] ?? "");
      if (draft[k] !== orig) changed[k] = draft[k];
    }
    if (Object.keys(changed).length === 0) {
      setSaving(false);
      setEditing(false);
      return;
    }
    const ok = await onSave(changed);
    setSaving(false);
    if (ok) setEditing(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{draft.c3 || "(無名)"} の詳細</h2>
            <p className="text-xs text-slate-500">行 {row._rowNumber} · No.{draft.c0}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">✕</button>
        </div>

        <div className="overflow-auto px-6 py-4 flex-1">
          {!editing ? (
            <pre className="whitespace-pre-wrap rounded-md bg-slate-50 p-4 text-xs text-slate-800 border border-slate-200">
              {buildText(draft)}
            </pre>
          ) : (
            <div className="space-y-3">
              {COLUMN_HEADERS.map((label, i) => {
                const k = `c${i}`;
                const isLong = label === "ADL詳細" || label === "その他、備考";
                return (
                  <label key={k} className="block">
                    <span className="text-xs font-medium text-slate-600">{label}</span>
                    {isLong ? (
                      <textarea
                        rows={4}
                        value={draft[k] ?? ""}
                        onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                        className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    ) : (
                      <input
                        value={draft[k] ?? ""}
                        onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                        className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 px-6 py-3 flex flex-wrap justify-end gap-2 bg-slate-50">
          {!editing ? (
            <>
              <button onClick={copy} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100">
                テンプレ形式でコピー
              </button>
              <button onClick={() => setEditing(true)} className="rounded-md bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-700">
                編集
              </button>
              <button onClick={onDelete} className="rounded-md bg-rose-600 px-3 py-1.5 text-sm text-white hover:bg-rose-700">
                削除
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  const o: Record<string, string> = {};
                  for (let i = 0; i < COLUMN_HEADERS.length; i++) {
                    const k = `c${i}`;
                    o[k] = String((row as unknown as Record<string, string>)[k] ?? "");
                  }
                  setDraft(o);
                  setEditing(false);
                }}
                disabled={saving}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-1.5 text-sm text-white hover:bg-sky-700 disabled:opacity-60"
              >
                {saving && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                保存
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
