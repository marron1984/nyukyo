"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "ログインに失敗しました");
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-20">
      <h1 className="text-xl font-bold text-slate-900 mb-6">管理画面ログイン</h1>
      <form onSubmit={submit} className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">パスワード</span>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </label>
        {error && <p className="text-sm text-rose-700">{error}</p>}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? "確認中…" : "ログイン"}
        </button>
      </form>
    </main>
  );
}
