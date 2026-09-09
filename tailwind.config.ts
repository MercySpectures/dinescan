import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#F0F4F8",
          100: "#D9E2EC",
          800: "#102A43",
          900: "#070B14",
          950: "#03060D"
        },
        primary: {
          DEFAULT: "#10B981",
          hover: "#059669",
          light: "#ECFDF5"
        },
        darkBg: "#0B0F19",
        darkCard: "#111827",
        darkBorder: "#1F2937"
      },
      fontFamily: {
        display: ["var(--font-syne)"],
        body: ["var(--font-dm-sans)"],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.08)",
        "glass-sm": "0 4px 12px 0 rgba(0, 0, 0, 0.04)",
        card: "0 1px 3px rgba(0,0,0,0.02), 0 10px 40px -10px rgba(0,0,0,0.05)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-pattern": "linear-gradient(to right bottom, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.4))",
      },
      animation: {
        "fade-up": "fadeUp 500ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-in": "scaleIn 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "float": "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" }
        }
      }
    }
  },
  plugins: []
};

export default config;
