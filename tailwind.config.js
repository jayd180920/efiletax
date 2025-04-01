/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Define custom colors
        primary: {
          DEFAULT: "#85A6A6", // Muted teal/sage
          50: "#f0f4f4",
          100: "#e1e9e9",
          200: "#c3d3d3",
          300: "#a5bdbd",
          400: "#85A6A6", // Primary color
          500: "#6b8c8c",
          600: "#567272",
          700: "#425858",
          800: "#2d3d3d",
          900: "#192121",
        },
        secondary: {
          DEFAULT: "#2f4f4f", // Dark slate gray
          50: "#e6ecec",
          100: "#ccd9d9",
          200: "#99b3b3",
          300: "#668c8c",
          400: "#336666",
          500: "#2f4f4f", // Secondary color
          600: "#264040",
          700: "#1c3030",
          800: "#132020",
          900: "#091010",
        },
        // Override the blue color to use our primary color
        blue: {
          50: "#f0f4f4",
          100: "#e1e9e9",
          200: "#c3d3d3",
          300: "#a5bdbd",
          400: "#85A6A6",
          500: "#6b8c8c",
          600: "#85A6A6", // This is used most often in the app
          700: "#567272",
          800: "#425858",
          900: "#2d3d3d",
        },
      },
    },
  },
  plugins: [],
};
