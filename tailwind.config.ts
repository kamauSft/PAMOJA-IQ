import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        navy: "var(--navy)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        line: "var(--line)",
        surface: "var(--surface)",
        canvas: "var(--canvas)",
        accent: "var(--accent)",
        due: "var(--due)",
        overdue: "var(--overdue)",
        sisal: "var(--due)",
        leaf: "var(--accent)",
        moss: "var(--accent)",
        clay: "var(--overdue)",
        ivory: "var(--on-navy)",
        paper: "var(--surface)",
      },
      fontFamily: {
        sans: ["var(--font-body)", "sans-serif"],
        serif: ["var(--font-body)", "sans-serif"],
        display: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        body: ["15px", "1.5"],
        small: ["13px", "1.4"],
      },
    },
  },
  plugins: [],
};

export default config;
