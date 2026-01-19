/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                // 'sans' is the default font for Tailwind, we replace it or extend it
                sans: ['Mali', 'cursive', 'sans-serif'],
            },
            colors: {
                'brand-blue': '#60A5FA',
                'brand-yellow': '#FBBF24',
                'brand-pink': '#F472B6',
                'brand-green': '#34D399',
            }
        },
    },
    plugins: [],
}
