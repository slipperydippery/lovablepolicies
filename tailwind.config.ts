import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: {
  			DEFAULT: '1rem',
  			tablet: '2rem',
  			desktop: '4rem',
  		},
  		screens: {
  			'2xl': '1400px',
  			desktop: '1312px',
  			'desktop-lg': '1552px',
  			'desktop-xl': '1792px',
  		}
  	},
  	screens: {
  		'mobile': '320px',
  		'mobile-lg': '414px',
  		'tablet': '768px',
  		'tablet-lg': '1024px',
  		'laptop': '1366px',
  		'desktop': '1440px',
  		'desktop-lg': '1680px',
  		'desktop-xl': '1920px',
  		// Keep Tailwind defaults
  		'sm': '640px',
  		'md': '768px',
  		'lg': '1024px',
  		'xl': '1280px',
  		'2xl': '1536px',
  	},
	extend: {
		spacing: {
			'sp-4': '4px',
			'sp-8': '8px',
			'sp-12': '12px',
			'sp-16': '16px',
			'sp-24': '24px',
			'sp-32': '32px',
			'sp-40': '40px',
			'sp-48': '48px',
			'sp-64': '64px',
			'sp-96': '96px',
			'sp-128': '128px',
		},
		colors: {
			/* ========================================
			   TIER 1: PRIMITIVES
			   Full color scales for edge cases
			   ======================================== */
			blue: {
				50: 'hsl(var(--color-blue-50))',
				100: 'hsl(var(--color-blue-100))',
				200: 'hsl(var(--color-blue-200))',
				300: 'hsl(var(--color-blue-300))',
				400: 'hsl(var(--color-blue-400))',
				500: 'hsl(var(--color-blue-500))',
				600: 'hsl(var(--color-blue-600))',
				700: 'hsl(var(--color-blue-700))',
				800: 'hsl(var(--color-blue-800))',
				900: 'hsl(var(--color-blue-900))',
			},
			green: {
				50: 'hsl(var(--color-green-50))',
				100: 'hsl(var(--color-green-100))',
				200: 'hsl(var(--color-green-200))',
				300: 'hsl(var(--color-green-300))',
				400: 'hsl(var(--color-green-400))',
				500: 'hsl(var(--color-green-500))',
				600: 'hsl(var(--color-green-600))',
				700: 'hsl(var(--color-green-700))',
				800: 'hsl(var(--color-green-800))',
				900: 'hsl(var(--color-green-900))',
			},
			red: {
				50: 'hsl(var(--color-red-50))',
				100: 'hsl(var(--color-red-100))',
				200: 'hsl(var(--color-red-200))',
				300: 'hsl(var(--color-red-300))',
				400: 'hsl(var(--color-red-400))',
				500: 'hsl(var(--color-red-500))',
				600: 'hsl(var(--color-red-600))',
				700: 'hsl(var(--color-red-700))',
				800: 'hsl(var(--color-red-800))',
				900: 'hsl(var(--color-red-900))',
			},
			orange: {
				50: 'hsl(var(--color-orange-50))',
				100: 'hsl(var(--color-orange-100))',
				200: 'hsl(var(--color-orange-200))',
				300: 'hsl(var(--color-orange-300))',
				400: 'hsl(var(--color-orange-400))',
				500: 'hsl(var(--color-orange-500))',
				600: 'hsl(var(--color-orange-600))',
				700: 'hsl(var(--color-orange-700))',
				800: 'hsl(var(--color-orange-800))',
				900: 'hsl(var(--color-orange-900))',
			},
			yellow: {
				50: 'hsl(var(--color-yellow-50))',
				100: 'hsl(var(--color-yellow-100))',
				200: 'hsl(var(--color-yellow-200))',
				300: 'hsl(var(--color-yellow-300))',
				400: 'hsl(var(--color-yellow-400))',
				500: 'hsl(var(--color-yellow-500))',
				600: 'hsl(var(--color-yellow-600))',
				700: 'hsl(var(--color-yellow-700))',
				800: 'hsl(var(--color-yellow-800))',
				900: 'hsl(var(--color-yellow-900))',
			},
			purple: {
				50: 'hsl(var(--color-purple-50))',
				100: 'hsl(var(--color-purple-100))',
				200: 'hsl(var(--color-purple-200))',
				300: 'hsl(var(--color-purple-300))',
				400: 'hsl(var(--color-purple-400))',
				500: 'hsl(var(--color-purple-500))',
				600: 'hsl(var(--color-purple-600))',
				700: 'hsl(var(--color-purple-700))',
				800: 'hsl(var(--color-purple-800))',
				900: 'hsl(var(--color-purple-900))',
			},
			grey: {
				50: 'hsl(var(--color-grey-50))',
				100: 'hsl(var(--color-grey-100))',
				200: 'hsl(var(--color-grey-200))',
				300: 'hsl(var(--color-grey-300))',
				400: 'hsl(var(--color-grey-400))',
				500: 'hsl(var(--color-grey-500))',
				600: 'hsl(var(--color-grey-600))',
				700: 'hsl(var(--color-grey-700))',
				800: 'hsl(var(--color-grey-800))',
				900: 'hsl(var(--color-grey-900))',
			},

			/* ========================================
			   TIER 2: SEMANTICS
			   Functional tokens - use these in components
			   ======================================== */
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',

			// Brand
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
			accent: {
				DEFAULT: 'hsl(var(--accent))',
				foreground: 'hsl(var(--accent-foreground))'
			},

			// Feedback (NUXT-UI aligned)
			success: {
				DEFAULT: 'hsl(var(--success))',
				hover: 'hsl(var(--success-hover))',
				active: 'hsl(var(--success-active))',
				foreground: 'hsl(var(--success-foreground))'
			},
			warning: {
				DEFAULT: 'hsl(var(--warning))',
				foreground: 'hsl(var(--warning-foreground))'
			},
			error: {
				DEFAULT: 'hsl(var(--error))',
				hover: 'hsl(var(--error-hover))',
				active: 'hsl(var(--error-active))',
				foreground: 'hsl(var(--error-foreground))'
			},
			info: {
				DEFAULT: 'hsl(var(--info))',
				foreground: 'hsl(var(--info-foreground))'
			},

			// Backward compatibility
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},

			// Surfaces
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
			surface: {
				DEFAULT: 'hsl(var(--surface))',
				foreground: 'hsl(var(--surface-foreground))'
			},

			// Containers
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},

			// Text hierarchy
			text: {
				primary: 'hsl(var(--text-primary))',
				secondary: 'hsl(var(--text-secondary))',
				tertiary: 'hsl(var(--text-tertiary))',
				disabled: 'hsl(var(--text-disabled))',
				inverse: 'hsl(var(--text-inverse))',
				link: 'hsl(var(--text-link))',
				'link-hover': 'hsl(var(--text-link-hover))',
			},

			// Interactive states
			state: {
				hover: 'hsl(var(--state-hover))',
				active: 'hsl(var(--state-active))',
				focus: 'hsl(var(--state-focus))',
				selected: 'hsl(var(--state-selected))',
				'disabled-bg': 'hsl(var(--state-disabled-bg))',
				'disabled-fg': 'hsl(var(--state-disabled-fg))',
			},

			// Status indicators
			status: {
				online: 'hsl(var(--status-online))',
				offline: 'hsl(var(--status-offline))',
				busy: 'hsl(var(--status-busy))',
				away: 'hsl(var(--status-away))',
				idle: 'hsl(var(--status-idle))',
			},

			/* ========================================
			   TIER 3: COMPONENT TOKENS
			   Complex interactive states
			   ======================================== */
			sidebar: {
				DEFAULT: 'hsl(var(--sidebar-background))',
				foreground: 'hsl(var(--sidebar-foreground))',
				primary: 'hsl(var(--sidebar-primary))',
				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
				accent: 'hsl(var(--sidebar-accent))',
				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
				border: 'hsl(var(--sidebar-border))',
				ring: 'hsl(var(--sidebar-ring))'
			},
			btn: {
				primary: {
					DEFAULT: 'hsl(var(--btn-primary))',
					hover: 'hsl(var(--btn-primary-hover))',
					active: 'hsl(var(--btn-primary-active))',
					foreground: 'hsl(var(--btn-primary-foreground))'
				},
				secondary: {
					bg: 'hsl(var(--btn-secondary-bg))',
					border: 'hsl(var(--btn-secondary-border))',
					'border-hover': 'hsl(var(--btn-secondary-border-hover))',
					'border-active': 'hsl(var(--btn-secondary-border-active))',
					'bg-active': 'hsl(var(--btn-secondary-bg-active))',
					foreground: 'hsl(var(--btn-secondary-foreground))'
				},
				flat: {
					color: 'hsl(var(--btn-flat-color))',
					'color-hover': 'hsl(var(--btn-flat-color-hover))',
					'color-active': 'hsl(var(--btn-flat-color-active))',
				'focus-outline': 'hsl(var(--btn-flat-focus-outline))'
				}
			},
			tooltip: 'hsl(var(--tooltip-bg))',
		},
		boxShadow: {
			'btn-focus': 'var(--btn-focus-ring)',
			'input': 'var(--input-shadow)',
			'input-focus': 'var(--input-focus-ring)',
			'input-hover': 'var(--input-hover-ring)',
			'checkbox': 'var(--checkbox-shadow)',
			'btn-inset': 'var(--btn-inset-shadow)',
		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		},
  		fontFamily: {
  			sans: [
  				'Inter',
  				'ui-sans-serif',
  				'system-ui',
  				'sans-serif',
  				'Apple Color Emoji',
  				'Segoe UI Emoji',
  				'Segoe UI Symbol',
  				'Noto Color Emoji'
  			],
  			heading: [
  				'Bricolage Grotesque',
  				'ui-sans-serif',
  				'system-ui',
  				'sans-serif'
  			],
  			serif: [
  				'ui-serif',
  				'Georgia',
  				'Cambria',
  				'Times New Roman',
  				'Times',
  				'serif'
  			],
  			mono: [
  				'ui-monospace',
  				'SFMono-Regular',
  				'Menlo',
  				'Monaco',
  				'Consolas',
  				'Liberation Mono',
  				'Courier New',
  				'monospace'
  			]
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
