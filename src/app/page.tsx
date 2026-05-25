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
        <a
          href="/admin"
          className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 shadow-sm"
        >
          管理画面 →
        </a>
      </header>
      <IntakeForm />
    </main>
  );
}
