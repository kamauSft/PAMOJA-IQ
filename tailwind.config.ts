import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        sisal: "var(--sisal)",
        leaf: "var(--leaf)",
        moss: "var(--leaf)",
        clay: "var(--clay)",
        ivory: "var(--ivory)",
        paper: "var(--paper)",
        muted: "var(--muted)",
      },
      fontFamily: {
        sans: ["var(--font-body)", "sans-serif"],
        serif: ["var(--font-display)", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 10px 28px color-mix(in srgb, var(--ink) 7%, transparent)",
      },
    },
  },
  plugins: [],
};

export default config;
