import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Remap gray → dark navy: every bg-gray-* / border-gray-* / text-gray-* picks up the premium palette
        gray: {
          50:  '#f8fafc',
          100: '#eef2f7',
          200: '#dce3ee',
          300: '#b4c0d3',
          400: '#8492a8',
          500: '#586480',
          600: '#3a4260',
          700: '#252d42',
          800: '#161c2c',
          900: '#0c0f1a',
          950: '#060810',
        },
        // CAL accent palette — blue/teal for premium digital-agency aesthetic
        cal: {
          blue:        '#3b82f6',
          'blue-dim':  '#1d4ed8',
          'blue-glow': 'rgba(59,130,246,0.15)',
          teal:        '#0ea5e9',
          gold:        '#f59e0b',
          navy:        '#0c0f1a',
        },
        // brand remapped to blue (was green)
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(59,130,246,0.25), 0 4px 16px rgba(0,0,0,0.4)',
        'glow-teal': '0 0 20px rgba(14,165,233,0.25), 0 4px 16px rgba(0,0,0,0.4)',
        'card':      '0 2px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
        'card-hover':'0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
