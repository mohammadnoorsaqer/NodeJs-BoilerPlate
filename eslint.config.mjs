import js from '@eslint/js';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';
import securityPlugin from 'eslint-plugin-security';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: {
      js,
      import: importPlugin,
      prettier: prettierPlugin,
      security: securityPlugin, // <-- added security plugin
    },
    languageOptions: { globals: globals.node },
    rules: {
      'import/no-dynamic-require': 'off', // Sequelize dynamic require
      'global-require': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-unexpected-multiline': 'error',

      // Prettier rules
      'prettier/prettier': 'error',

      // Security plugin recommended rules
      'security/detect-object-injection': 'off',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-eval-with-expression': 'error',
      'security/detect-unsafe-regex': 'warn',
      'security/detect-child-process': 'warn',
    },
  },
  {
    files: ['**/*.js'],
    languageOptions: { sourceType: 'commonjs' },
  },
]);
