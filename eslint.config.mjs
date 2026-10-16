/**
 * ESLint (flat config) pour le SDK Scell.
 * Remplace l'ancien .eslintrc.cjs, qui n'est plus lu à partir d'ESLint 9.
 */
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import globals from 'globals';

export default [
  { ignores: ['dist/**', 'node_modules/**', '**/*.js', '**/*.cjs', '**/*.mjs'] },
  js.configs.recommended,
  ...tsPlugin.configs['flat/recommended-type-checked'],
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.es2021 },
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-require-imports': 'warn',
      // Allow require() for dynamic imports in Node.js (e.g., crypto module)
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/strict-boolean-expressions': 'off',

      // General rules
      'no-console': 'warn',
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
];
