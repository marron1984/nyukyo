import { IntakeForm } from "@/components/IntakeForm";

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">入居相談 受付フォーム</h1>
          <p className="mt-1 text-sm text-slate-600">
            送信内容はスプレッドシートに自動記録されます。
          </p>
        </div>
        <a
          href="/admin"
          className="text-xs text-slate-500 hover:text-slate-900 underline underline-offset-2"
        >
          管理画面
        </a>
      </header>
      <IntakeForm />
    </main>
  );
}
