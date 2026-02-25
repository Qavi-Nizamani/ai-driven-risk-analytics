import type { Linter } from "eslint";

export const baseEslintConfig: Linter.Config = {
  env: {
    es2021: true,
    node: true
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module"
  },
  plugins: ["@typescript-eslint", "import", "node"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:node/recommended",
    "prettier"
  ],
  rules: {
    "node/no-unsupported-features/es-syntax": "off",
    "@typescript-eslint/no-explicit-any": "error"
  },
  ignorePatterns: ["dist", "node_modules"]
};

