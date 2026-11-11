import js from '@eslint/js';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';
import securityPlugin from 'eslint-plugin-security';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

const sharedRules = {
  'import/no-dynamic-require': 'off',
  'prettier/prettier': 'error',
  'security/detect-object-injection': 'off',
  'security/detect-non-literal-fs-filename': 'warn',
  'security/detect-non-literal-regexp': 'warn',
  'security/detect-eval-with-expression': 'error',
  'security/detect-unsafe-regex': 'warn',
  'security/detect-child-process': 'warn',
};

export default defineConfig([
  {
    ignores: ['dist/**', 'node_modules/**', 'src/db/migrations/**'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [...tseslint.configs.recommended],
    plugins: {
      import: importPlugin,
      prettier: prettierPlugin,
      security: securityPlugin,
    },
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...sharedRules,
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [js.configs.recommended],
    plugins: {
      import: importPlugin,
      prettier: prettierPlugin,
      security: securityPlugin,
    },
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      ...sharedRules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
]);
