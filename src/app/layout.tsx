import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "入居相談 受付フォーム",
  description: "顧客入居相談の受付フォーム",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-slate-50 text-slate-900 min-h-screen">{children}</body>
    </html>
  );
}
