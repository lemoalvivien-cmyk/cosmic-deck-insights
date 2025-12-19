import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        serif: ["Cormorant Garamond", "Georgia", "serif"],
        sans: ["Nunito Sans", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        mystic: {
          gold: "hsl(var(--mystic-gold))",
          violet: "hsl(var(--mystic-violet))",
          lavender: "hsl(var(--mystic-lavender))",
        },
        celestial: {
          blue: "hsl(var(--celestial-blue))",
        },
        aurora: {
          pink: "hsl(var(--aurora-pink))",
        },
        ethereal: {
          cream: "hsl(var(--ethereal-cream))",
        },
        starlight: "hsl(var(--starlight))",
        // Mystic Premium - Background scale
        "mp-bg": {
          900: "hsl(var(--mp-bg-900))",
          800: "hsl(var(--mp-bg-800))",
          700: "hsl(var(--mp-bg-700))",
          600: "hsl(var(--mp-bg-600))",
        },
        // Mystic Premium - Surfaces
        "mp-surface": {
          glass: "hsl(var(--mp-surface-glass))",
          border: "hsl(var(--mp-surface-border))",
        },
        // Mystic Premium - Brand colors
        "mp-brand": {
          violet: "hsl(var(--mp-brand-violet))",
          violet2: "hsl(var(--mp-brand-violet2))",
          gold: "hsl(var(--mp-brand-gold))",
          gold2: "hsl(var(--mp-brand-gold2))",
        },
      },
      borderRadius: {
        xl: "var(--radius-xl)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        glow: "var(--shadow-glow)",
        gold: "var(--shadow-gold)",
        // Mystic Premium shadows
        "mp-card": "var(--mp-shadow-card)",
        "mp-glow-v": "var(--mp-shadow-glow-v)",
        "mp-glow-g": "var(--mp-shadow-glow-g)",
      },
      backgroundImage: {
        "gradient-celestial": "var(--gradient-celestial)",
        "gradient-mystic": "var(--gradient-mystic)",
        "gradient-gold": "var(--gradient-gold)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
        },
        "pulse-gold": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsl(var(--mystic-gold) / 0.4)" },
          "50%": { boxShadow: "0 0 20px 10px hsl(var(--mystic-gold) / 0)" },
        },
        "card-flip": {
          "0%": { transform: "rotateY(0deg)" },
          "100%": { transform: "rotateY(180deg)" },
        },
        shuffle: {
          "0%, 100%": { transform: "translateX(0) rotate(0deg)" },
          "25%": { transform: "translateX(-5px) rotate(-2deg)" },
          "75%": { transform: "translateX(5px) rotate(2deg)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.9)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        float: "float 6s ease-in-out infinite",
        twinkle: "twinkle 3s ease-in-out infinite",
        "pulse-gold": "pulse-gold 2s ease-in-out infinite",
        "spin-slow": "spin 20s linear infinite",
        "card-flip": "card-flip 0.6s ease-in-out forwards",
        shuffle: "shuffle 0.3s ease-in-out",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "scale-in": "scale-in 0.4s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
