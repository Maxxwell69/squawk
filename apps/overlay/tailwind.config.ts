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
      keyframes: {
        "squawk-bob": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        "chaos-shake": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-2deg)" },
          "75%": { transform: "rotate(2deg)" },
        },
        "hype-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(232, 184, 74, 0)" },
          "50%": { boxShadow: "0 0 24px 4px rgba(232, 184, 74, 0.45)" },
        },
      },
      animation: {
        "squawk-bob": "squawk-bob 3s ease-in-out infinite",
        "chaos-shake": "chaos-shake 0.35s ease-in-out infinite",
        "hype-pulse": "hype-pulse 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
