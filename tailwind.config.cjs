/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}', './shared/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#050511',
          900: '#0a0a18',
          800: '#11112a',
        },
        glass: {
          panel: 'rgba(17, 17, 42, 0.55)',
          border: 'rgba(255, 255, 255, 0.10)',
        },
        accent: {
          teal: '#2ef7d0',
          magenta: '#ff2bd6',
          amber: '#ffb020',
        },
      },
      boxShadow: {
        glowTeal: '0 0 28px rgba(46, 247, 208, 0.18)',
        glowMagenta: '0 0 28px rgba(255, 43, 214, 0.16)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}

