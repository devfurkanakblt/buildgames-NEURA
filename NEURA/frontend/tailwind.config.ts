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
                border: "hsl(var(--border))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                // Stitch design tokens
                "background-dark": "#050B18",
                "surface-dark": "#0f1623",
                "surface": "#0f2022",
                primary: {
                    DEFAULT: "#00f2ff",
                    cyan: "#00f2ff",
                    purple: "#667eea",
                },
                secondary: {
                    DEFAULT: "#0bda50",
                },
                success: {
                    DEFAULT: "#0bda50",
                },
                danger: {
                    DEFAULT: "#f83600",
                },
                glass: {
                    DEFAULT: "rgba(255, 255, 255, 0.05)",
                    border: "rgba(255, 255, 255, 0.1)",
                },
                "neural-dark": "#050B18",
            },
            fontFamily: {
                display: ["Space Grotesk", "sans-serif"],
                sans: ["Space Grotesk", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "neural-dark": "linear-gradient(135deg, #050B18 0%, #0f1623 100%)",
                "holographic": "linear-gradient(135deg, #00f2ff 0%, #0066ff 50%, #00f2ff 100%)",
                "success-gradient": "linear-gradient(135deg, #0bda50 0%, #00f2fe 100%)",
                "danger-gradient": "linear-gradient(135deg, #f83600 0%, #f9d423 100%)",
            },
            boxShadow: {
                neon: "0 0 10px rgba(0,242,255,0.3), 0 0 20px rgba(0,242,255,0.1)",
                "neon-green": "0 0 10px rgba(11,218,80,0.3), 0 0 20px rgba(11,218,80,0.1)",
            },
            animation: {
                "glitch": "glitch 0.3s cubic-bezier(.25,.46,.45,.94) both",
                "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "float": "float 3s ease-in-out infinite",
                "blob": "blob 7s infinite",
            },
            keyframes: {
                glitch: {
                    "0%, 100%": { transform: "translate(0)" },
                    "33%": { transform: "translate(-2px, 2px)" },
                    "66%": { transform: "translate(2px, -2px)" },
                },
                "pulse-glow": {
                    "0%, 100%": { opacity: "1", boxShadow: "0 0 20px rgba(0,242,255,0.4)" },
                    "50%": { opacity: "0.8", boxShadow: "0 0 40px rgba(0,242,255,0.7)" },
                },
                float: {
                    "0%, 100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-10px)" },
                },
                blob: {
                    "0%": { transform: "translate(0px,0px) scale(1)" },
                    "33%": { transform: "translate(30px,-50px) scale(1.1)" },
                    "66%": { transform: "translate(-20px,20px) scale(0.9)" },
                    "100%": { transform: "translate(0px,0px) scale(1)" },
                },
            },
            backdropBlur: { xs: "2px" },
            borderRadius: {
                "DEFAULT": "0.5rem",
                "lg": "1rem",
                "xl": "1.5rem",
                "2xl": "2rem",
                "full": "9999px",
            },
        },
    },
    plugins: [],
};

export default config;
