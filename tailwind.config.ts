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
                // Legacy alias so existing pages don't break
                espresso: {
                    DEFAULT: "#1A1A1A",
                    50: "#2C2C2C",
                    100: "#222222",
                    200: "#1A1A1A",
                },
                dark: {
                    DEFAULT: "#1A1A1A",
                    mid: "#2C2C2C",
                },
                gold: {
                    DEFAULT: "#C9A84C",
                    light: "#E2C97E",
                    pale: "#FDF6E3",
                    dark: "#B08D30",
                    50: "#FDF6E3",
                    100: "#F0E4C3",
                    200: "#E2CB8A",
                    300: "#E2C97E",
                    400: "#C9A84C",
                    500: "#B08D30",
                },
                cream: {
                    DEFAULT: "#FDFAF5",
                    dark: "#F0EBE3",
                    darker: "#E5DFD5",
                },
                "off-white": "#F5F0E8",
                charcoal: {
                    DEFAULT: "#2E2E2E",
                    light: "#4A4A4A",
                    lighter: "#7A7060",
                },
                "rose-gold": {
                    DEFAULT: "#B76E79",
                    light: "#D4949C",
                    dark: "#9A525C",
                },
            },
            fontFamily: {
                display: ["var(--font-playfair)", "serif"],
                body: ["var(--font-dm-sans)", "sans-serif"],
                accent: ["var(--font-cormorant)", "serif"],
            },
            keyframes: {
                "fade-up": {
                    "0%": { opacity: "0", transform: "translateY(30px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                shimmer: {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                },
                "gold-pulse": {
                    "0%, 100%": { opacity: "1" },
                    "50%": { opacity: "0.7" },
                },
            },
            animation: {
                "fade-up": "fade-up 0.6s ease-out forwards",
                shimmer: "shimmer 2s linear infinite",
                "gold-pulse": "gold-pulse 2s ease-in-out infinite",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};

export default config;
