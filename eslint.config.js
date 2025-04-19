export default [
  {
    files: ["**/*.js", "**/*.jsx"],
    ignores: ["node_modules/**"],
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
      "semi": ["error", "always"],
      "quotes": ["error", "double"],
    },
  },
];