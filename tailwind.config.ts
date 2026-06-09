import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "./src/app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        glow: "0 0 0 1px rgba(174, 221, 255, 0.12), 0 24px 60px rgba(4, 18, 44, 0.35)"
      },
      colors: {
        ink: {
          950: "#04111f",
          900: "#071a2c",
          800: "#0d2740",
          700: "#123558"
        },
        aurora: {
          100: "#d7f6ff",
          300: "#7fe3ff",
          500: "#28b8ff",
          700: "#1268d9",
          900: "#0b2d60"
        },
        frost: {
          50: "rgba(255,255,255,0.06)",
          100: "rgba(255,255,255,0.1)",
          200: "rgba(255,255,255,0.18)"
        }
      },
      backgroundImage: {
        "hero-radial": "radial-gradient(circle at top, rgba(67, 150, 255, 0.45), transparent 35%), radial-gradient(circle at 20% 20%, rgba(55, 234, 194, 0.2), transparent 24%), linear-gradient(180deg, rgba(3, 10, 26, 1), rgba(5, 18, 34, 1))"
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"]
      }
    }
  },
  plugins: []
};

export default config;
