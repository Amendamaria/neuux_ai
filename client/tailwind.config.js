/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}", "./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        neu: {
          teal: "#07c0c9",
          dark1: "#071018",
          dark2: "#08282a",
          dark3: "#0e3b3b",
        },
      },
      borderRadius: { xl2: "18px" },
      fontSize: {
        "hero-lg": ["88px", { lineHeight: "0.95" }],
        "hero-sm": ["64px", { lineHeight: "0.95" }],
      },
    },
  },
  plugins: [],
};
