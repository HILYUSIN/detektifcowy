import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Obsidian Noir Design System
        "deep-black":            "#0d0d0d",
        "background":            "#131313",
        "panel-gray":            "#1a1a1a",
        "surface-container":     "#201f1f",
        "surface-container-high":"#2a2a2a",
        "border-gray":           "#2a2a2a",
        "surface-variant":       "#353534",
        "signature-red":         "#d63031",
        "inverse-primary":       "#93000a",
        "error-container":       "#93000a",
        "gold-win":              "#f9ca24",
        "paper-white":           "#f5f0e8",
        "ui-text-off-white":     "#f5f5f5",
        "on-surface":            "#e5e2e1",
        "muted-gray":            "#888888",
        "tertiary-container":    "#00b894",
      },
      fontFamily: {
        chivo:     ["Chivo", "sans-serif"],
        franklin:  ["Libre Franklin", "sans-serif"],
        serif:     ["Source Serif 4", "serif"],
        mono:      ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        "headline-xl": ["48px", { lineHeight: "1.1", fontWeight: "900" }],
        "headline-lg": ["32px", { lineHeight: "1.2", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "1.3", fontWeight: "700" }],
        "headline-lg-mobile": ["24px", { lineHeight: "1.3", fontWeight: "700" }],
        "body-lg":     ["18px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-md":     ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        "doc-text":    ["16px", { lineHeight: "1.7", fontWeight: "400" }],
        "mono-label":  ["12px", { lineHeight: "1.4", fontWeight: "500" }],
        "label-bold":  ["12px", { lineHeight: "1.4", fontWeight: "700" }],
      },
      borderRadius: {
        DEFAULT: "2px",
        lg:      "4px",
        xl:      "8px",
        full:    "12px",
      },
      spacing: {
        "gutter-sm":   "16px",
        "gutter-md":   "24px",
        "margin-edge": "32px",
      },
      maxWidth: {
        container: "1200px",
      },
      boxShadow: {
        "glow-red":  "0 0 15px rgba(214,48,49,0.3)",
        "glow-red-lg":"0 0 25px rgba(214,48,49,0.4)",
        "glow-gold": "0 0 15px rgba(249,202,36,0.4)",
        "card":      "0 10px 40px rgba(0,0,0,0.4)",
        "stamp-gold": "0 0 20px rgba(249,202,36,0.4), inset 0 0 20px rgba(249,202,36,0.1)",
      },
      backgroundImage: {
        "gradient-red-black": "linear-gradient(90deg, #d63031 0%, #0d0d0d 100%)",
        "gradient-red-black-diag": "linear-gradient(135deg, #d63031 0%, #0d0d0d 100%)",
        "gradient-red-black-vert": "linear-gradient(180deg, #d63031 0%, #1a1a1a 100%)",
        "noise": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E\")",
      },
      animation: {
        "ping-slow":  "ping 2s cubic-bezier(0,0,0.2,1) infinite",
        "float-up":   "floatUp 3s ease-in-out infinite",
        "stamp-in":   "stampIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275) forwards",
      },
      keyframes: {
        floatUp: {
          "0%":   { transform: "translateY(0) scale(0)", opacity: "0" },
          "50%":  { opacity: "1" },
          "100%": { transform: "translateY(-100px) scale(1)", opacity: "0" },
        },
        stampIn: {
          "0%":   { transform: "scale(0) rotate(-15deg)", opacity: "0" },
          "80%":  { transform: "scale(1.1) rotate(-15deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(-15deg)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
