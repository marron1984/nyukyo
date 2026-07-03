import { IntakeForm } from "@/components/IntakeForm";

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 md:py-10">
      <header className="mb-6 md:mb-8">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-paper text-lg font-black shadow-card"
              aria-hidden
            >
              受
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-ink">
                入居相談 受付フォーム
              </h1>
              <p className="text-[13px] text-ink-fade mt-1">
                送信内容はスプレッドシートに自動保存されます
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="https://docs.google.com/spreadsheets/d/1y00PmqtKRCsyrvaH8ydO3QbzVbFXGEVA2dpKOUDJMaY/edit?gid=0#gid=0"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border-2 border-brand-line bg-paper px-4 text-sm font-bold text-brand hover:bg-brand-soft hover:border-brand transition-colors"
            >
              <span aria-hidden>📊</span>
              スプレッドシート
              <span aria-hidden className="text-ink-fade">↗</span>
            </a>
            <a
              href="/admin"
              className="min-h-[44px] inline-flex items-center gap-1 rounded-xl border-2 border-brand-line bg-paper px-4 text-sm font-bold text-ink hover:bg-paper-warm transition-colors"
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
