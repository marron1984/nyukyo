import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nama: {
          DEFAULT: "#F5F1E8",
          deep: "#EDE5D2",
          paper: "#FBF8F1",
        },
        sumi: {
          DEFAULT: "#1a1a1a",
          soft: "#3d3d3d",
          fade: "#6b6b6b",
        },
        shu: {
          DEFAULT: "#b8403a",
          deep: "#9c2f2a",
          soft: "#e8c9c6",
          wash: "#f7eceb",
        },
        kraft: {
          DEFAULT: "#d4c9b3",
          deep: "#b8a888",
        },
      },
      fontFamily: {
        mincho: ['"Shippori Mincho B1"', '"Hiragino Mincho ProN"', "serif"],
        sans: [
          '"Noto Sans JP"',
          "-apple-system",
          "BlinkMacSystemFont",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      letterSpacing: {
        wide: "0.05em",
        wider: "0.1em",
        widest: "0.2em",
      },
    },
  },
  plugins: [],
};

export default config;
