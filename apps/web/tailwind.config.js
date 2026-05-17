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
      fontFamily: {
        quantum: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
        qdisplay: ["var(--font-space)", "var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: "#165DFF",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        cardForeground: "hsl(var(--card-foreground))",
        primary: "hsl(var(--primary))",
        primaryForeground: "hsl(var(--primary-foreground))",
        muted: "hsl(var(--muted))",
        mutedForeground: "hsl(var(--muted-foreground))",
        border: "hsl(var(--border))",
        ring: "hsl(var(--ring))",
        accent: "hsl(var(--accent))",
        accentForeground: "hsl(var(--accent-foreground))",
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "quantum-float": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)", opacity: "0.35" },
          "33%": { transform: "translate(6%, -4%) scale(1.05)", opacity: "0.5" },
          "66%": { transform: "translate(-5%, 5%) scale(0.96)", opacity: "0.3" },
        },
        "quantum-mesh-spin": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.4s ease-out",
      },
    },
  },
  plugins: [],
};
