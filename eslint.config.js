import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '.claude', 'archive']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // react-three-fiber's whole model is imperative mutation inside
    // useFrame (camera/mesh refs are mutated every frame by design -- see
    // https://r3f.docs.pmnd.rs/api/hooks#useframe). The newer
    // react-hooks/immutability rule doesn't know about that execution model
    // and flags it as a render-time mutation, so it's disabled just for the
    // three.js scene layer rather than papering over it with inline
    // disables on every frame callback.
    files: ['src/components/three/**/*.{js,jsx}'],
    rules: {
      'react-hooks/immutability': 'off',
    },
  },
])
