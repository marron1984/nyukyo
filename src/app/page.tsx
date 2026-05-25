import { IntakeForm } from "@/components/IntakeForm";

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:py-16">
      <header className="mb-10 md:mb-14">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="hanko mt-1" aria-hidden>
              受
            </div>
            <div>
              <p className="font-mincho text-xs tracking-widest text-shu uppercase">
                Intake&nbsp;Form
              </p>
              <h1 className="font-mincho text-3xl md:text-4xl font-bold leading-tight tracking-wide text-sumi mt-1">
                入居相談 受付
              </h1>
              <p className="mt-2 text-xs text-sumi-fade leading-relaxed">
                ご相談内容を順にご記入ください。送信内容は記録簿に保存されます。
              </p>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end gap-1.5 shrink-0">
            <a
              href="https://docs.google.com/spreadsheets/d/1y00PmqtKRCsyrvaH8ydO3QbzVbFXGEVA2dpKOUDJMaY/edit?gid=0#gid=0"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 border border-sumi bg-transparent px-3 py-1.5 text-xs text-sumi hover:bg-sumi hover:text-nama transition-colors"
            >
              記録簿を開く
              <span aria-hidden>↗</span>
            </a>
            <a
              href="/admin"
              className="inline-flex items-center gap-1 text-xs text-sumi-fade hover:text-sumi underline underline-offset-4 decoration-kraft-deep"
            >
              管理画面 →
            </a>
          </div>
        </div>

        {/* モバイル時のリンク行 */}
        <div className="mt-6 flex md:hidden flex-wrap gap-2">
          <a
            href="https://docs.google.com/spreadsheets/d/1y00PmqtKRCsyrvaH8ydO3QbzVbFXGEVA2dpKOUDJMaY/edit?gid=0#gid=0"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-1.5 border border-sumi bg-transparent px-3 py-2 text-xs text-sumi"
          >
            記録簿を開く ↗
          </a>
          <a
            href="/admin"
            className="inline-flex flex-1 items-center justify-center border border-kraft-deep bg-transparent px-3 py-2 text-xs text-sumi-soft"
          >
            管理画面 →
          </a>
        </div>

        <div className="mt-6 h-px bg-kraft" />
      </header>
      <IntakeForm />
    </main>
  );
}
