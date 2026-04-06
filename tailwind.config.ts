import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          900: "#0A0F1C"
        },
        primary: {
          DEFAULT: "#4F46E5", // Indigo 600
          hover: "#4338CA",
          light: "#EEF2FF"
        },
        background: {
          DEFAULT: "#F9FAFB",
          card: "rgba(255, 255, 255, 0.8)"
        }
      },
      fontFamily: {
        display: ["var(--font-syne)"],
        body: ["var(--font-dm-sans)"],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.05)",
        "glass-sm": "0 4px 12px 0 rgba(31, 38, 135, 0.03)",
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
