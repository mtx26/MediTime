export default {
  plugins: {
    '@fullhuman/postcss-purgecss': {
      content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
      defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || [],
      safelist: {
        standard: [/^btn-/, /^text-/, /^bg-/, /^modal-/, /^fade/, /^show/], // Common Bootstrap patterns to be safe
        deep: [],
        greedy: [],
      },
    },
  },
};
