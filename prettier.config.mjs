export default {
    plugins: ["prettier-plugin-astro"],
    tabWidth: 4,
    singleAttributePerLine: false,
    overrides: [
        {
            files: "*.astro",
            options: {
                parser: "astro",
            },
        },
    ],
};
