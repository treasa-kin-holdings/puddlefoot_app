import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                "nature-green": "var(--nature-green)",
                "nature-green-light": "var(--nature-green-light)",
                "hedgehog-blue": "var(--hedgehog-blue)",
                "hedgehog-white": "var(--hedgehog-white)",
                "accent-orange": "var(--accent-orange)",
                "accent-blue": "var(--accent-blue)",
            },
            fontFamily: {
                heading: ["var(--font-heading)"],
                body: ["var(--font-body)"],
            },
            borderRadius: {
                lg: "var(--radius-lg)",
                md: "var(--radius-md)",
                sm: "var(--radius-sm)",
            },
        },
    },
    plugins: [],
};
export default config;
