/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#1a1a1f",
          secondary: "#23232a",
          tertiary: "#2d2d36",
          elevated: "#343440"
        },
        border: {
          DEFAULT: "#3a3a45",
          light: "#4c4c5c",
          active: "#7c6aff"
        },
        text: {
          primary: "#e8e8f0",
          muted: "#8888a0",
          dim: "#5a5a70"
        },
        accent: {
          DEFAULT: "#7c6aff",
          hover: "#9580ff",
          dark: "#5744e0"
        },
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
        add: "#22c55e",
        erase: "#ef4444"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      }
    },
  },
  plugins: [],
};
