# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## Secrets & Vault (Supabase) — Namenskonvention

Server-seitige Secrets (API-Keys, OAuth-Provider-Keys) liegen **ausschließlich im Supabase
Vault** (`vault.secrets`, gelesen über `vault.decrypted_secrets`) — **nie** in `.env`, **nie**
im Frontend, **nie** im Git. Anlegen: `select vault.create_secret('<wert>', '<name>', '<beschreibung>')`.
Cron/Edge-Functions lesen über `select decrypted_secret from vault.decrypted_secrets where name = '<name>'`
(Muster: Migrationen `035`/`051`).

**Konvention:** `lowercase_snake_case`, sprechender Name (kein `UPPER_ENV_STYLE`).

| Vault-Name | Zweck | Genutzt von |
|---|---|---|
| `app_supabase_url` | Projekt-URL für interne HTTP-Aufrufe | Cron-Wrapper (035/037/049/051) |
| `app_service_role_key` | Service-Role-Key für Cron→Edge-Aufrufe | Cron-Wrapper |
| `nango_secret_key` | Nango managed-OAuth Secret Key (Mailbox-Verbindungen Outlook/Google) | AI-SDR Sending-Layer (Slice 3, geplant) |
| `langfuse_secret_key` *(geplant)* | Langfuse Prompt-/Tracing-Key (EU-Region) | `lib/ai.ts` / AI-Functions |
| `gemini_api_key` *(geplant)* | Google-Gemini LLM + Embeddings | `lib/ai.ts` / RAG |

**Frontend-ENV (`.env.local`, nur öffentliche Werte):** z.B. `VITE_NANGO_PUBLIC_KEY` für die
Nango-Connect-UI — der **Secret** Key gehört nie hierher. Neue Integration → Zeile in dieser
Tabelle ergänzen (Konvention aus `docs/integrations_masterplan.md`).

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
