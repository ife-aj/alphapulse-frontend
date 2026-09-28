/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Base URL for the AlphaPulse API, without a trailing slash.
   *
   * Defaults to `/api` (see `src/api/client.ts`), which the Vite dev server
   * proxies to the NestJS backend. The backend enables no CORS, so a
   * same-origin path is the only value that works from a browser.
   */
  readonly VITE_API_BASE_URL?: string
}
