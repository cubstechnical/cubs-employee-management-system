module.exports = {
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx}",
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lightformsborder: "var(--lightformsborder)",
        lightsurfacesborder: "var(--lightsurfacesborder)",
        lightsurfacescontent: "var(--lightsurfacescontent)",
        "lightsurfaceslight-200": "var(--lightsurfaceslight-200)",
        "lightsurfaceslight-50": "var(--lightsurfaceslight-50)",
        lightsurfacesprimary: "var(--lightsurfacesprimary)",
        "lighttextdefault-text": "var(--lighttextdefault-text)",
        "lighttextinverse-text": "var(--lighttextinverse-text)",
        lightutilityprimary: "var(--lightutilityprimary)",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        "text-sm-normal-400": "var(--text-sm-normal-400-font-family)",
        "text-xs-medium-500": "var(--text-xs-medium-500-font-family)",
        "text-xs-semibold-600": "var(--text-xs-semibold-600-font-family)",
        "web-heading-m-semibold": "var(--web-heading-m-semibold-font-family)",
        "web-text-m-regular": "var(--web-text-m-regular-font-family)",
        "web-text-m-semibold": "var(--web-text-m-semibold-font-family)",
        sans: [
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"',
        ],
      },
      boxShadow: { "shadow-l1": "var(--shadow-l1)" },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
  },
  plugins: [],
  darkMode: ["class"],
};
