import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  // Global ignores
  {
    ignores: ['dist/', 'node_modules/', 'coverage/'],
  },

  // Base JS recommended rules
  eslint.configs.recommended,

  // TypeScript strict rules with type-aware linting
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // NestJS-friendly rule overrides
  {
    rules: {
      // NestJS uses empty classes with decorators (modules, etc.)
      '@typescript-eslint/no-extraneous-class': 'off',

      // Controllers/services infer return types from decorators
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // Codebase uses some `any` — warn instead of error
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',

      // Allow unused vars when prefixed with _
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Decorators trigger this — not useful in NestJS
      '@typescript-eslint/no-unsafe-declaration-merging': 'off',

      // NestJS DI uses constructor parameter properties
      '@typescript-eslint/no-unnecessary-condition': 'warn',
    },
  },

  // Prettier — must be last to override formatting rules
  eslintConfigPrettier,
  eslintPluginPrettier,
);
