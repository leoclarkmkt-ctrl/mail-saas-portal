import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0A2540",
        accent: "#00D4FF",
        neon: "#00FF9F",
        cta: "#FF6B35",
        navy: "#001F3F",
        surface: "#F6F8FB"
      }
    }
  },
  plugins: []
};

export default config;
