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
        bg: "var(--bg)",
        "bg-card": "var(--bg-card)",
        fg: "var(--fg)",
        "fg-muted": "var(--fg-muted)",
        "accent-green": "var(--accent-green)",
        "accent-red": "var(--accent-red)",
        "accent-blue": "var(--accent-blue)",
        border: "var(--border)",
      },
      fontFamily: {
        serif: ['"Source Serif 4"', "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
