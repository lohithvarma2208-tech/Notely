import type { Config } from "tailwindcss";

/** Semantic token via CSS variable (set in globals.css per theme). */
const v = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // theme-aware neutrals — values live in globals.css :root / .dark
        ink: {
          50: v("--ink-50"),
          100: v("--ink-100"),
          200: v("--ink-200"),
          300: v("--ink-300"),
          400: v("--ink-400"),
          500: v("--ink-500"),
          600: v("--ink-600"),
          700: v("--ink-700"),
          800: v("--ink-800"),
          900: v("--ink-900"),
          950: v("--ink-950"),
        },
        paper: v("--paper"),
        cream: v("--cream"),
        // static brand palette (works on both themes)
        accent: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        mint: {
          50: "#effdf5",
          100: "#d9fbe8",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        hand: ["var(--font-hand)", "cursive"],
        hand2: ["var(--font-hand2)", "cursive"],
        hand3: ["var(--font-hand3)", "cursive"],
        script: ["var(--font-script)", "cursive"],
        admin: ["var(--font-admin)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(2,6,23,0.04), 0 8px 24px -12px rgba(2,6,23,0.10)",
        lift: "0 2px 4px rgba(2,6,23,0.05), 0 16px 40px -16px rgba(2,6,23,0.16)",
      },
    },
  },
  plugins: [],
};
export default config;
