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
        sans: ["var(--font-outfit)", "PingFang SC", "Microsoft YaHei", "system-ui", "sans-serif"],
        display: ["var(--font-outfit)", "PingFang SC", "Microsoft YaHei", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
        quantum: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
        qdisplay: ["var(--font-outfit)", "PingFang SC", "system-ui", "sans-serif"],
      },
      colors: {
        brand: "#22d3ee",
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
        lg: "1rem",
        md: "0.75rem",
        sm: "0.5rem",
        xl: "1.125rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        panel: "0 18px 45px rgba(2, 8, 23, 0.55), 0 0 0 1px rgba(255,255,255,0.04)",
        "panel-hover": "0 22px 50px rgba(2, 8, 23, 0.62), 0 0 28px rgba(34, 211, 238, 0.08)",
        glow: "0 0 24px rgba(34, 211, 238, 0.14)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.35s ease-out",
      },
    },
  },
  plugins: [],
};
