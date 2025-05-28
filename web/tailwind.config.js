/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
  important: true,
  theme: {
    extend: {
      colors: {
        background: "rgb(247,247,247)",
        primary: "rgb(156,39,176)",
        card: "rgb(237,237,237)",
        title: "rgb(71,71,71)",
        foreground: "var(--foreground)",
        footer: "rgb(240,240,240)",
        head: "rgb(120,120,120)",
        red: "#F44336",
        orange: "#FF9800",
        lime: "#CDDC39",
        green: "#4CAF50",
        indigo: "#3F51B5",
      },
    },
  },
  plugins: [],
}

