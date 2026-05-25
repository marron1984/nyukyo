import { IntakeForm } from "@/components/IntakeForm";

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-4 md:px-8 py-6 md:py-10">
      {/* トップピル群 */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <span className="pill">
          <span aria-hidden>●</span>
          Intake Form / 受付
        </span>
        <div className="flex gap-2">
          <a
            href="https://docs.google.com/spreadsheets/d/1y00PmqtKRCsyrvaH8ydO3QbzVbFXGEVA2dpKOUDJMaY/edit?gid=0#gid=0"
            target="_blank"
            rel="noopener noreferrer"
            className="pill pill-yolk hover:bg-ink hover:text-paper transition-colors"
          >
            記録簿 ↗
          </a>
          <a
            href="/admin"
            className="pill hover:bg-ink hover:text-paper transition-colors"
          >
            ADMIN →
          </a>
        </div>
      </div>

      {/* 巨大ヒーロー */}
      <header className="mb-12 md:mb-16">
        <h1 className="display-xl text-[clamp(3.5rem,11vw,9rem)] text-ink">
          NYUKYO
          <br />
          INTAKE.
        </h1>
        <div className="mt-4 md:mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-end">
          <p className="mincho-xl text-2xl md:text-4xl">
            入居相談を、<br />正確に、丁寧に。
          </p>
          <p className="text-xs md:text-sm text-ink-fade leading-relaxed font-sans md:text-right">
            お問い合わせ内容を順にご記入ください。
            <br />
            送信内容は記録簿に自動保存されます。
          </p>
        </div>
        {/* 黒い帯 */}
        <div className="mt-8 h-px bg-ink" />
      </header>

      <IntakeForm />
    </main>
  );
}
