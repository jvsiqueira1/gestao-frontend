/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class", "[data-theme='dark']"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./context/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        "border-soft": "var(--border-soft)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--bg)",
        foreground: "var(--fg)",
        "fg-soft": "var(--fg-soft)",
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
        },
        "bg-elev": "var(--bg-elev)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          soft: "var(--accent-soft)",
          ink: "var(--accent-ink)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        success: {
          DEFAULT: "var(--success)",
          foreground: "var(--success-foreground)",
        },
        pos: {
          DEFAULT: "var(--pos)",
          soft: "var(--pos-soft)",
        },
        neg: {
          DEFAULT: "var(--neg)",
          soft: "var(--neg-soft)",
        },
        warn: {
          DEFAULT: "var(--warn)",
          soft: "var(--warn-soft)",
        },
        info: {
          DEFAULT: "var(--info)",
          soft: "var(--info-soft)",
        },
        card: {
          DEFAULT: "var(--bg-elev)",
          foreground: "var(--fg)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
      },
      borderRadius: {
        sm: "var(--r-sm)",
        DEFAULT: "var(--r)",
        md: "var(--r)",
        lg: "var(--r-lg)",
        xl: "var(--r-xl)",
      },
      fontFamily: {
        sans: "var(--font-sans-stack)",
        display: "var(--font-display-stack)",
        mono: "var(--font-mono-stack)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
