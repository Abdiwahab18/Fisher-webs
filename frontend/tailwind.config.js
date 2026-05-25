export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        oceanBlue: '#0277BD',
        aqua: '#00BCD4',
        lightBg: '#F5F7FA',
        successGreen: '#28a745',
      },
      animation: {
        slideIn: 'slideIn 0.3s ease-in-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(400px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
