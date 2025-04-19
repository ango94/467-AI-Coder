import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import babelParser from "@babel/eslint-parser";

export default [
  {
    files: ["**/*.js", "**/*.jsx"],
    ignores: ["node_modules/**"],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true, // Enable JSX parsing
        },
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks, // Explicitly define the react-hooks plugin
    },
    rules: {
      "react/jsx-uses-react": "error",
      "react/jsx-uses-vars": "error",
      "react/react-in-jsx-scope": "off", // Not needed for React 17+
      "react-hooks/rules-of-hooks": "error", // Enforce rules of hooks
      "react-hooks/exhaustive-deps": "warn", // Warn about missing dependencies in hooks
    },
  },
];