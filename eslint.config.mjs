// eslint.config.mjs
import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";
import importPlugin from "eslint-plugin-import"; // ES module import

export default defineConfig([
  {
    // Apply to all JS files
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js, import: importPlugin }, // add import plugin
    extends: ["js/recommended"],
    languageOptions: { globals: globals.node },
    rules: {
      // Turn off dynamic require warning for Sequelize dynamic imports
      "import/no-dynamic-require": "off",

      // Optional: relax CommonJS warnings if needed
      "global-require": "off",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-unexpected-multiline": "error",
    },
  },
  {
    // Ensure CommonJS files are parsed correctly
    files: ["**/*.js"],
    languageOptions: { sourceType: "commonjs" },
  },
]);
