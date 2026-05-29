/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FAF7F2",
        blush: "#F8E7E7",
        rose: "#E7B7B7",
        champagne: "#F3E9DD",
        stone: "#CFCAC4",
        onyx: "#2F2A2A",
      },
      fontFamily: {
        sans: ["Inter", "Poppins", "system-ui", "sans-serif"],
        display: ["Playfair Display", "serif"],
      },
      boxShadow: {
        soft: "0 12px 30px rgba(231, 183, 183, 0.25)",
      },
    },
  },
  plugins: [],
};
