/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        black: "#050810",
        navy: {
          DEFAULT: "#0a0f1e",
          light: "#0f1629",
          card: "#0f1629",
        },
        card: "#0f1629",
        border: "#1a2540",
        teal: {
          DEFAULT: "#00d4c8",
          dim: "rgba(0, 212, 200, 0.06)",
          glow: "rgba(0, 212, 200, 0.15)",
        },
        cgreen: "#00c896",
        cred: "#ff4d6a",
        cyellow: "#f5a623",
        cblue: "#4d9eff",
        corange: "#f5a623",
        "text-primary": "#f0f4ff",
        "text-secondary": "#8892a4",
        muted: "#4a5568",
      },
      fontFamily: {
        display: ["Syne", "system-ui", "sans-serif"],
        body: ["Cabinet Grotesk", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
        label: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      keyframes: {
        "pulse-blue": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-out-right": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(100%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "border-grow": {
          "0%": { height: "0%" },
          "100%": { height: "100%" },
        },
      },
      animation: {
        "pulse-blue": "pulse-blue 2s ease-in-out infinite",
        "fade-up": "fade-up 0.5s ease-out forwards",
        "slide-in-right": "slide-in-right 0.3s ease-out forwards",
        "slide-out-right": "slide-out-right 0.3s ease-in forwards",
        shimmer: "shimmer 1.5s ease-in-out infinite",
        "border-grow": "border-grow 0.3s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
