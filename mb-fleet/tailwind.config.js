/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Bleu Fleetly — couleur de marque
        brand: {
          50: "#eef4ff",
          100: "#dbe6ff",
          200: "#bcd2ff",
          300: "#8fb4ff",
          400: "#5b8bfb",
          500: "#2f6bf0",
          600: "#1d51d6",
          700: "#1a41ab",
          800: "#1b3a8a",
          900: "#1c356e",
        },
        // Cyan Signal — accent temps réel / GPS
        signal: {
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
        },
        // Sidebar / surfaces foncées
        ink: {
          900: "#0b1424",
          800: "#0f1b2d",
          700: "#1c2a40",
          600: "#33415c",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
        display: ['"Space Grotesk"', "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,28,49,.04), 0 4px 16px rgba(16,28,49,.06)",
      },
    },
  },
  plugins: [],
};
