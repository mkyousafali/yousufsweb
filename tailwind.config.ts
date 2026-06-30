import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'os-bg': '#0a0a0f',
        'os-surface': '#111118',
        'os-surface-2': '#16161f',
        'os-border': '#1e1e2e',
        'os-accent': '#00d4ff',
        'os-accent2': '#7c3aed',
        'os-accent3': '#f59e0b',
        'os-text': '#e2e8f0',
        'os-muted': '#64748b',
        'os-window': '#13131f',
        'os-taskbar': '#0d0d1a',
        'os-titlebar': '#0f0f1a',
        'os-danger': '#ef4444',
        'os-success': '#22c55e',
        'os-warn': '#f59e0b'
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
        sans: ['"Inter"', '"SF Pro Display"', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'os-window': '0 25px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)',
        'os-glow': '0 0 20px rgba(0,212,255,0.25)',
        'os-glow-lg': '0 0 40px rgba(0,212,255,0.3)',
        'os-glow-accent2': '0 0 30px rgba(124,58,237,0.35)',
        'os-taskbar': '0 -4px 24px rgba(0,0,0,0.6)'
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'type-cursor': 'typeCursor 1.1s step-end infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'slide-in-right': 'slideInRight 0.35s ease-out',
        'slide-in-left': 'slideInLeft 0.35s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scan-line': 'scanLine 4s linear infinite',
        'float': 'float 6s ease-in-out infinite'
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.7', filter: 'brightness(1.3)' }
        },
        typeCursor: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' }
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(32px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-32px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))'
      },
      backgroundSize: {
        grid: '48px 48px'
      }
    }
  },
  plugins: []
} satisfies Config;
