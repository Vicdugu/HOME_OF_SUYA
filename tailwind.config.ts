import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#0A0A0A",
          red: "#C41E3A",
          "red-dark": "#8B0000",
          "red-light": "#E8374F",
          gold: "#D4AF37",
          "gold-light": "#F0D060",
          "gold-dark": "#A88820",
        },
        surface: {
          dark: "#111111",
          card: "#1A1A1A",
          border: "#2A2A2A",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #C41E3A 0%, #8B0000 50%, #0A0A0A 100%)",
        "gold-gradient":
          "linear-gradient(90deg, #D4AF37 0%, #F0D060 50%, #D4AF37 100%)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

export default config;
