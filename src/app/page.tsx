import { IntakeForm } from "@/components/IntakeForm";

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 md:py-10">
      <header className="mb-6 md:mb-8">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-paper font-mincho font-bold"
              aria-hidden
            >
              受
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-ink">
                入居相談 受付フォーム
              </h1>
              <p className="text-xs text-ink-fade mt-0.5">
                送信内容はスプレッドシートに自動保存されます
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="https://docs.google.com/spreadsheets/d/1y00PmqtKRCsyrvaH8ydO3QbzVbFXGEVA2dpKOUDJMaY/edit?gid=0#gid=0"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-line bg-paper px-3 py-2 text-xs font-medium text-brand hover:bg-brand-soft hover:border-brand transition-colors"
            >
              <span aria-hidden>📊</span>
              スプレッドシート
              <span aria-hidden className="text-ink-fade">↗</span>
            </a>
            <a
              href="/admin"
              className="inline-flex items-center gap-1 rounded-lg border border-brand-line bg-paper px-3 py-2 text-xs font-medium text-ink hover:bg-paper-warm transition-colors"
            >
              管理画面 →
            </a>
          </div>
        </div>
      </header>
      <IntakeForm />
    </main>
  );
}
