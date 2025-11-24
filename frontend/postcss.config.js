import purgecss from '@fullhuman/postcss-purgecss';

export default {
  plugins: [
    purgecss.default({
      content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
      defaultExtractor: (content) => content.match(/[\w-/:]+/g) || [],
      safelist: {
        standard: [/^btn-/, /^text-/, /^bg-/, /^modal-/, /^fade/, /^show/, /^react-calendar/], // Common Bootstrap patterns to be safe
        deep: [/^react-calendar/],
        greedy: [],
      },
    }),
  ],
};
