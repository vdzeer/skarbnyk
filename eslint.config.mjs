import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-plugin-prettier/recommended'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    // The house rules from the app playbook (airbnb + prettier), spelled out
    // by hand: eslint-config-airbnb peers on eslint 8 and would force every
    // install to pass --legacy-peer-deps.
    rules: {
      'prettier/prettier': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ForOfStatement',
          message: 'Use map, filter or reduce instead of for…of.',
        },
        {
          selector: 'ForInStatement',
          message: 'Use Object.keys or Object.entries instead of for…in.',
        },
      ],
      'no-await-in-loop': 'error',
      'no-nested-ternary': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'react/no-array-index-key': 'error',
      'import/no-default-export': 'error',
      '@typescript-eslint/no-shadow': 'error',
    },
  },
  {
    // Next.js reads these files by their default export.
    files: [
      'src/app/**/page.tsx',
      'src/app/**/layout.tsx',
      'src/app/**/not-found.tsx',
      'src/app/**/error.tsx',
      'src/app/manifest.ts',
      '*.config.{js,mjs,ts}',
    ],
    rules: { 'import/no-default-export': 'off' },
  },
  {
    files: ['jest.config.js', '.prettierrc.js'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  // `rules-tests/` is its own workspace with its own gate (`npm run test:rules`).
  globalIgnores([
    '.next/**',
    'out/**',
    'coverage/**',
    'next-env.d.ts',
    'rules-tests/**',
  ]),
])
