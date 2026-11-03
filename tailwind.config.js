/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        discord: {
          dark: '#1e1f22',
          darker: '#141517',
          sidebar: '#2b2d31',
          chat: '#313338',
          hover: '#35373c',
          accent: '#5865f2',
          green: '#23a55a',
          red: '#f23f43',
          yellow: '#f0b232',
          text: '#dbdee1',
          muted: '#949ba4'
        }
      }
    },
  },
  plugins: [],
}
