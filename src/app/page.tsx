import { IntakeForm } from "@/components/IntakeForm";

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">入居相談 受付フォーム</h1>
          <p className="mt-1 text-sm text-slate-600">
            送信内容はスプレッドシートに自動記録されます。
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <a
            href="https://docs.google.com/spreadsheets/d/1y00PmqtKRCsyrvaH8ydO3QbzVbFXGEVA2dpKOUDJMaY/edit?gid=0#gid=0"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100 shadow-sm"
          >
            <span aria-hidden>📊</span>
            スプレッドシートを開く
            <span aria-hidden className="text-emerald-600">↗</span>
          </a>
          <a
            href="/admin"
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 shadow-sm"
          >
            管理画面 →
          </a>
        </div>
      </header>
      <IntakeForm />
    </main>
  );
}
