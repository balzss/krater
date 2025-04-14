import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    // Include paths to all your components and pages
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Extend Tailwind's default colors, fonts, etc.
      colors: {
        // Example custom colors for light and dark modes
        background: {
          light: '#ffffff',
          dark: '#1a1a1a',
        },
        foreground: {
          light: '#171717',
          dark: '#ededed',
        },
        // Add more custom colors as needed
      },
      fontFamily: {
        // Example custom font families
        'geist-sans': ['Geist Sans', 'sans-serif'],
        'geist-mono': ['Geist Mono', 'monospace'],
        // Add more custom fonts
      },
      // Add other theme extensions (spacing, screens, etc.)
    },
  },
  plugins: [], // Add Tailwind plugins here
}

export default config
