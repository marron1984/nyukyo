import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 機能的なカラー
        ink: {
          DEFAULT: "#14181f",
          soft: "#333c4b",
          fade: "#525d6e",
          mute: "#8b94a3",
        },
        paper: {
          DEFAULT: "#ffffff",
          off: "#fafaf7",
          warm: "#f5f3ed",
        },
        // プライマリ (深紺)
        brand: {
          DEFAULT: "#1e3a5f",
          deep: "#16294a",
          soft: "#e8eef5",
          line: "#c7d4e3",
        },
        // アクセント (山吹色)
        yolk: {
          DEFAULT: "#e8b923",
          deep: "#c79b15",
          soft: "#fff4ce",
        },
        // ステータスカラー(機能色)
        status: {
          new: "#2563eb",      // 青
          newBg: "#dbeafe",
          progress: "#d97706", // 橙
          progressBg: "#fed7aa",
          hold: "#6b7280",     // 灰
          holdBg: "#e5e7eb",
          done: "#059669",     // 緑
          doneBg: "#d1fae5",
          cancel: "#dc2626",   // 朱
          cancelBg: "#fee2e2",
        },
      },
      fontFamily: {
        sans: [
          '"Noto Sans JP"',
          "-apple-system",
          "BlinkMacSystemFont",
          "Helvetica Neue",
          "Hiragino Sans",
          "sans-serif",
        ],
        mincho: [
          '"Shippori Mincho B1"',
          '"Hiragino Mincho ProN"',
          "serif",
        ],
        display: [
          '"Inter Tight"',
          "Inter",
          '"Noto Sans JP"',
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(20,30,55,0.05), 0 1px 2px 0 rgba(20,30,55,0.03)",
        soft: "0 4px 12px -2px rgba(20,30,55,0.08), 0 2px 4px -1px rgba(20,30,55,0.04)",
        lift: "0 12px 32px -8px rgba(20,30,55,0.15), 0 4px 8px -2px rgba(20,30,55,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
