/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', 'class'],
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./context/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			primary: {
  				'50': '#e0f7fa',
  				'100': '#b2ebf2',
  				'200': '#80deea',
  				'300': '#4dd0e1',
  				'400': '#26c6da',
  				'500': '#00bcd4',
  				'600': '#00acc1',
  				'700': '#0097a7',
  				'800': '#00838f',
  				'900': '#006064',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				'50': '#f5f5f5',
  				'100': '#e0e0e0',
  				'200': '#bdbdbd',
  				'300': '#9e9e9e',
  				'400': '#757575',
  				'500': '#616161',
  				'600': '#545454',
  				'700': '#424242',
  				'800': '#303030',
  				'900': '#212121',
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			accent: {
  				'50': '#fffde7',
  				'100': '#fff9c4',
  				'200': '#fff59d',
  				'300': '#fff176',
  				'400': '#ffee58',
  				'500': '#ffeb3b',
  				'600': '#fdd835',
  				'700': '#fbc02d',
  				'800': '#f9a825',
  				'900': '#f57f17',
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			neutral: {
  				light: '#f8f9fa',
  				medium: '#e9ecef',
  				dark: '#dee2e6'
  			},
  			text: {
  				primary: '#212529',
  				secondary: '#6c757d',
  				muted: '#adb5bd',
  				white: '#ffffff'
  			},
  			feedback: {
  				success: '#28a745',
  				error: '#dc3545',
  				warning: '#ffc107',
  				info: '#17a2b8'
  			},
  			sidebar: {
  				background: '#2c3e50',
  				foreground: '#ffffff',
  				primary: '#00bcd4',
  				'primary-foreground': '#ffffff',
  				accent: '#34495e',
  				'accent-foreground': '#ffffff',
  				border: '#dee2e6',
  				ring: '#00bcd4'
  			},
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
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
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
  			},
  			appbg: 'hsl(var(--app-background))'
  		},
  		fontFamily: {
  			sans: [
  				'Roboto',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'Segoe UI',
  				'Helvetica',
  				'Arial',
  				'sans-serif'
  			]
  		},
  		fontSize: {
  			base: '16px'
  		},
  		lineHeight: {
  			base: '1.6'
  		},
  		borderRadius: {
  			sm: 'calc(var(--radius) - 4px)',
  			md: 'calc(var(--radius) - 2px)',
  			lg: 'var(--radius)',
  			full: '9999px'
  		},
  		boxShadow: {
  			sm: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.14)',
  			md: '0 3px 6px rgba(0,0,0,0.12), 0 3px 6px rgba(0,0,0,0.18)',
  			lg: '0 10px 20px rgba(0,0,0,0.15), 0 6px 6px rgba(0,0,0,0.19)'
  		},
  		spacing: {
  			xxs: '0.25rem',
  			xs: '0.5rem',
  			sm: '0.75rem',
  			md: '1rem',
  			lg: '1.5rem',
  			xl: '2rem',
  			xxl: '3rem'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}; 