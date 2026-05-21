import { IntakeForm } from "@/components/IntakeForm";

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">入居相談 受付フォーム</h1>
        <p className="mt-1 text-sm text-slate-600">
          送信内容はスプレッドシートに自動記録され、LINE Worksにも通知されます。
        </p>
      </header>
      <IntakeForm />
    </main>
  );
}
