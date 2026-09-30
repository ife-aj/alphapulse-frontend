/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Local: /api. Production: https://YOUR-BACKEND.onrender.com/api. */
  readonly VITE_API_BASE_URL?: string
}
