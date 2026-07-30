import defaultTheme from 'tailwindcss/defaultTheme';

export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        soft: '0 24px 80px rgba(15, 23, 42, 0.08)',
      },
      backgroundImage: {
        'soft-gradient': 'radial-gradient(circle at top, rgba(255,255,255,0.15), transparent 55%)',
      },
    },
  },
  plugins: [],
};
