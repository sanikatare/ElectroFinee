/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ef: {
          primary: '#009150',
          dark: '#009150',
          forest: '#007540',
          cardTop: '#007A43',
          cardBottom: '#005C32',
          cardBorder: '#34D399',
          mint: '#A7F3D0',
          mintDark: '#009150',
          mintSoft: '#E6F4EE',
          canvas: '#F3F8F5',
          orange: '#DE6D2C',
          amber: '#F59E0B',
          blueLine: '#1D9BF0'
        },
        juris: {
          dark: '#009150',
          card: '#007540',
          surface: '#007540',
          surfaceLight: '#009150',
          surfaceBorder: '#00A85D',
          
          bg: '#FFFFFF',
          bgSecondary: '#F3F8F5',
          bgMuted: '#E6F4EE',
          
          border: '#CFE3D8',
          borderDark: '#A8CBB8',
          
          textPrimary: '#0A291B',
          textBody: '#1C4532',
          textMuted: '#466E5B',
          textSubtle: '#688F7C',
          
          riskLow: '#009150',
          riskLowBg: '#E6F4EE',
          riskLowBorder: '#86EFAC',
          
          riskMod: '#D97706',
          riskModBg: '#FFFBEB',
          riskModBorder: '#FDE68A',
          
          riskHigh: '#DC2626',
          riskHighBg: '#FEF2F2',
          riskHighBorder: '#FECACA',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 2px 8px -2px rgba(0, 145, 80, 0.08), 0 1px 3px 0 rgba(0, 145, 80, 0.05)',
        'elevated': '0 16px 36px -6px rgba(0, 145, 80, 0.14), 0 4px 12px -2px rgba(0, 145, 80, 0.07)',
        'dropdown': '0 14px 30px -5px rgba(0, 145, 80, 0.14), 0 8px 10px -6px rgba(0, 145, 80, 0.06)',
        'teal-glass': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.25), 0 12px 28px -6px rgba(0, 70, 38, 0.35)',
      }
    },
  },
  plugins: [],
}
