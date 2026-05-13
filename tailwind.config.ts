import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: "#F5F0E8",
        "ivory-muted": "#C8C2B8",
        obsidian: "#0D0D0D",
        "obsidian-surface": "#141414",
        "obsidian-elevated": "#1C1C1C",
        "border-subtle": "#2A2A2A",
        dark: {
          DEFAULT: "#1A1A1A",
          mid: "#2C2C2C",
          rich: "#151210",
        },
        gold: {
          DEFAULT: "#C9A84C",
          light: "#E2C97E",
          dark: "#A8862E",
          muted: "#8A6F3E",
        },
        cream: {
          DEFAULT: "#FDFAF5",
          dark: "#F0EBE3",
          darker: "#E5DFD5",
        },
        espresso: {
          DEFAULT: "#1A1A1A",
          50: "#2C2C2C",
          100: "#222222",
          200: "#1A1A1A",
          rich: "#151210",
        },
        charcoal: {
          DEFAULT: "#2E2E2E",
          light: "#4A4A4A",
          lighter: "#7A7060",
        },
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Cormorant Garamond", "Georgia", "serif"],
        sans: ["var(--font-montserrat)", "Montserrat", "system-ui", "sans-serif"],
        body: ["var(--font-dm-sans)", "DM Sans", "system-ui", "sans-serif"],
        display: ["var(--font-cormorant)", "serif"],
        accent: ["var(--font-cormorant)", "serif"],
      },
      fontSize: {
        "display-xl": ["clamp(48px,7vw,96px)", { lineHeight: "1.05", letterSpacing: "-0.03em", fontWeight: "700" }],
        "display-lg": ["clamp(36px,5vw,64px)", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "600" }],
        "display-md": ["clamp(28px,4vw,48px)", { lineHeight: "1.15", letterSpacing: "-0.01em", fontWeight: "600" }],
        "display-sm": ["clamp(22px,3vw,32px)", { lineHeight: "1.2", letterSpacing: "0", fontWeight: "500" }],
        "body-lg": ["18px", { lineHeight: "1.75", letterSpacing: "0" }],
        "body-base": ["16px", { lineHeight: "1.7", letterSpacing: "0.01em" }],
        "caption": ["12px", { lineHeight: "1.5", letterSpacing: "0.08em" }],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-left": {
          "0%": { opacity: "0", transform: "translateX(-40px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-right": {
          "0%": { opacity: "0", transform: "translateX(40px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "gold-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "draw-line": {
          "0%": { transform: "scaleX(0)", transformOrigin: "left" },
          "100%": { transform: "scaleX(1)", transformOrigin: "left" },
        },
        "count-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "progress-fill": {
          "0%": { width: "0%" },
          "100%": { width: "100%" },
        },
        ticker: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "underline-sweep": {
          "0%": { transform: "scaleX(0)", transformOrigin: "left" },
          "100%": { transform: "scaleX(1)", transformOrigin: "left" },
        },
        "fade-description": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "fade-in": "fade-in 0.4s ease-out forwards",
        "slide-left": "slide-left 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "slide-right": "slide-right 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        shimmer: "shimmer 2.5s linear infinite",
        "gold-pulse": "gold-pulse 2s ease-in-out infinite",
        "draw-line": "draw-line 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.4s forwards",
        "count-up": "count-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        float: "float 6s ease-in-out infinite",
        ticker: "ticker 32s linear infinite",
        "underline-sweep": "underline-sweep 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "fade-description": "fade-description 0.35s ease-out forwards",
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #C9A84C 0%, #E2C97E 50%, #C9A84C 100%)",
        "gold-shimmer": "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
        "radial-gold": "radial-gradient(ellipse at center, rgba(201,168,76,0.12) 0%, transparent 70%)",
        "hero-overlay": "linear-gradient(to bottom, rgba(13,13,13,0.3) 0%, rgba(13,13,13,0.1) 40%, rgba(13,13,13,0.85) 100%)",
      },
      boxShadow: {
        "gold-subtle": "0 1px 30px rgba(201,175,76,0.08)",
        "gold-glow": "0 8px 40px rgba(201,168,76,0.25)",
        "glass": "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
      },
      transitionTimingFunction: {
        "luxury": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      spacing: {
        section: "clamp(80px, 10vw, 120px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;