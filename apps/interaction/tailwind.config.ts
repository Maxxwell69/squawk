import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        parchment: {
          DEFAULT: "#f4e4c1",
          dark: "#c4a574",
        },
        squawk: {
          ink: "#1a1528",
          gold: "#e8b84a",
          sea: "#1e3a4f",
          rust: "#8b3a2f",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        panel: "0 12px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
      },
    },
  },
  plugins: [],
} satisfies Config;
