/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	  ],
  theme: {
  	extend: {
  		keyframes: {
  			'tooltip-top': {
  				'0%': {
  					opacity: 0,
  					transform: 'translateY(4px)'
  				},
  				'100%': {
  					opacity: 1,
  					transform: 'translateY(0)'
  				}
  			},
  			'tooltip-bottom': {
  				'0%': {
  					opacity: 0,
  					transform: 'translateY(-4px)'
  				},
  				'100%': {
  					opacity: 1,
  					transform: 'translateY(0)'
  				}
  			},
  			'tooltip-left': {
  				'0%': {
  					opacity: 0,
  					transform: 'translateX(4px)'
  				},
  				'100%': {
  					opacity: 1,
  					transform: 'translateX(0)'
  				}
  			},
  			'tooltip-right': {
  				'0%': {
  					opacity: 0,
  					transform: 'translateX(-4px)'
  				},
  				'100%': {
  					opacity: 1,
  					transform: 'translateX(0)'
  				}
  			}
  		},
  		animation: {
  			'tooltip-top': 'tooltip-top 0.2s ease-out',
  			'tooltip-bottom': 'tooltip-bottom 0.2s ease-out',
  			'tooltip-left': 'tooltip-left 0.2s ease-out',
  			'tooltip-right': 'tooltip-right 0.2s ease-out'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}