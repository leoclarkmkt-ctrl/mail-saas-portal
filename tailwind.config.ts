import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0A2540",
        accent: "#00D4FF",
        neon: "#00FF9F"
      }
    }
  },
  plugins: []
};

export default config;
