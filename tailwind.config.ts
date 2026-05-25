import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0a0a0a",
          soft: "#2a2a2a",
          fade: "#6b6b6b",
          mute: "#9a9a9a",
        },
        paper: {
          DEFAULT: "#ffffff",
          off: "#f7f5f0",
        },
        yolk: {
          DEFAULT: "#F4C430",
          deep: "#D9A91A",
          wash: "#FFF5D1",
        },
        line: "#0a0a0a",
      },
      fontFamily: {
        display: [
          '"Inter Tight"',
          "Inter",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mincho: [
          '"Shippori Mincho B1"',
          '"Hiragino Mincho ProN"',
          "serif",
        ],
        sans: [
          '"Noto Sans JP"',
          "-apple-system",
          "BlinkMacSystemFont",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      letterSpacing: {
        tightest: "-0.04em",
        tight: "-0.02em",
        wider: "0.1em",
        widest: "0.2em",
      },
    },
  },
  plugins: [],
};

export default config;
