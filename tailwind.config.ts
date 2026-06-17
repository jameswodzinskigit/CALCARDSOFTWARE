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
                            brand: {
                                        50: '#f0fdf4',
                                        500: '#22c55e',
                                        600: '#16a34a',
                                        700: '#15803d',
                            },
                            cal: {
                                        gold:        '#f59e0b',
                                        'gold-dark': '#d97706',
                                        blue:        '#3b82f6',
                                        green:       '#10b981',
                            },
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
                  },
                  borderRadius: {
                            lg: "var(--radius)",
                            md: "calc(var(--radius) - 2px)",
                            sm: "calc(var(--radius) - 4px)",
                  },
                  fontFamily: {
                            sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                  },
                  boxShadow: {
                            'card':       '0 4px 24px rgba(0, 0, 0, 0.5)',
                            'card-hover': '0 12px 40px rgba(0, 0, 0, 0.6)',
                            'glow-sm':    '0 0 12px rgba(16, 185, 129, 0.15)',
                            'glow':       '0 0 24px rgba(16, 185, 129, 0.2)',
                            'glow-gold':  '0 4px 20px rgba(245, 158, 11, 0.25)',
                  },
                  animation: {
                            'fade-in':  'fadeIn 0.25s ease-out',
                            'slide-up': 'slideUp 0.35s ease-out',
                  },
                  keyframes: {
                            fadeIn: {
                                        '0%':   { opacity: '0' },
                                        '100%': { opacity: '1' },
                            },
                            slideUp: {
                                        '0%':   { opacity: '0', transform: 'translateY(8px)' },
                                        '100%': { opacity: '1', transform: 'translateY(0)' },
                            },
                  },
                  backgroundImage: {
                            'cal-gradient':     'linear-gradient(135deg, #f59e0b 0%, #3b82f6 50%, #10b981 100%)',
                            'card-gradient':    'linear-gradient(145deg, #0f1320 0%, #0c0f1a 100%)',
                            'sidebar-gradient': 'linear-gradient(180deg, #090c16 0%, #060810 100%)',
                  },
          },
    },
    plugins: [require("tailwindcss-animate")],
};
export default config;
