"use client";

import { useEffect, useState } from "react";
import { getStoredApiKey, setStoredApiKey } from "@/lib/apiKey";

export function ApiKeyModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [key, setKey] = useState("");
  const [show, setShow] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{
    kind: "ok" | "ng" | "info";
    msg: string;
  } | null>(null);

  useEffect(() => {
    if (open) {
      setKey(getStoredApiKey());
      setStatus(null);
    }
  }, [open]);

  function save() {
    setStoredApiKey(key.trim());
    setStatus({ kind: "ok", msg: "保存しました" });
    onSaved?.();
  }

  function clear() {
    if (!confirm("保存されているAPIキーを削除しますか？")) return;
    setKey("");
    setStoredApiKey("");
    setStatus({ kind: "info", msg: "削除しました" });
    onSaved?.();
  }

  async function test() {
    if (!key.trim()) {
      setStatus({ kind: "ng", msg: "キーを入力してください" });
      return;
    }
    setTesting(true);
    setStatus({ kind: "info", msg: "接続テスト中…" });
    try {
      const res = await fetch("/api/intake/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-anthropic-api-key": key.trim(),
        },
        body: JSON.stringify({ text: "テスト：78歳男性、要介護2" }),
      });
      const raw = await res.text();
      let json: { ok?: boolean; error?: string } = {};
      try {
        json = JSON.parse(raw);
      } catch {
        setStatus({
          kind: "ng",
          msg: `サーバが不正な応答 (HTTP ${res.status}): ${raw.slice(0, 200)}`,
        });
        return;
      }
      if (res.ok && json.ok) {
        setStatus({ kind: "ok", msg: "✓ 接続OK。AIから応答が返りました" });
      } else {
        setStatus({
          kind: "ng",
          msg: json?.error ?? `失敗 (HTTP ${res.status})`,
        });
      }
    } catch (e) {
      setStatus({ kind: "ng", msg: (e as Error).message });
    } finally {
      setTesting(false);
    }
  }

  if (!open) return null;

  const statusColor =
    status?.kind === "ok"
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : status?.kind === "ng"
        ? "text-rose-700 bg-rose-50 border-rose-200"
        : "text-slate-700 bg-slate-50 border-slate-200";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Anthropic API キーの設定
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            AI抽出機能を使うには Anthropic の API キーが必要です。キーは<strong>このブラウザの localStorage に保存</strong>され、AI抽出のリクエスト時にのみ送信されます。
            <br />
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-700 underline hover:text-sky-900"
            >
              Anthropic Console で発行 →
            </a>
          </p>

          <label className="block">
            <span className="text-xs font-medium text-slate-700">APIキー</span>
            <div className="mt-1 flex gap-2">
              <input
                type={show ? "text" : "password"}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="sk-ant-api03-..."
                className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-700 hover:bg-slate-100"
              >
                {show ? "隠す" : "表示"}
              </button>
            </div>
          </label>

          {status && (
            <div
              className={`rounded-md border px-3 py-2 text-xs ${statusColor}`}
            >
              {status.msg}
            </div>
          )}

          <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900 leading-relaxed">
            ⚠️ 共有PCでは「クリア」を忘れずに。APIキーは利用量に応じて課金されます。
          </div>
        </div>

        <div className="border-t border-slate-200 px-6 py-3 flex flex-wrap justify-between gap-2 bg-slate-50">
          <button
            type="button"
            onClick={clear}
            className="rounded-md border border-rose-300 bg-white px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50"
          >
            保存済みキーを削除
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={test}
              disabled={testing || !key.trim()}
              className="inline-flex items-center gap-1.5 rounded-md border border-sky-300 bg-white px-3 py-1.5 text-sm text-sky-800 hover:bg-sky-50 disabled:opacity-50"
            >
              {testing && (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-sky-700 border-t-transparent" />
              )}
              接続テスト
            </button>
            <button
              type="button"
              onClick={save}
              className="rounded-md bg-sky-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-sky-700"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
