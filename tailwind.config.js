module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: {
      navy: { 950: '#050d1a', 900: '#08152b', 800: '#0d2040', 700: '#142e57', 600: '#1d3f73' },
      brand: { DEFAULT: '#ff9f1c', dark: '#e58a00', light: '#ffe2b0' },
    },
    fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'] },
  } },
  plugins: [],
}
