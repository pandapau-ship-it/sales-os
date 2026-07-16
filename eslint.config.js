import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Der `_`-Präfix ist im Projekt die bewusste Markierung für „absichtlich ungenutzt":
      // Stub-Signaturen, die den späteren Vertrag schon festhalten (z.B. lib/storage.ts,
      // lib/realtime.ts → Phase 5). Die Konvention hier deklarieren, statt sie an ~15
      // Stellen zu umgehen.
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
    },
  },
  {
    // shadcn-Primitive sind Fremdcode und laut CLAUDE.md nicht editierbar. Ihr Stil
    // (button.tsx exportiert Button + buttonVariants) ist vom Generator vorgegeben und
    // würde bei jedem `npx shadcn add` zurückkommen — hier gilt die Regel daher nicht.
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
