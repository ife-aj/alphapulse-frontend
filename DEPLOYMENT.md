# Netlify deployment

Import this repository into Netlify. `netlify.toml` configures the build,
`dist` output directory, Node 24, and the SPA route fallback.

Set `VITE_API_BASE_URL=https://YOUR-BACKEND.onrender.com/api` using the actual
Render service address. This is a build-time variable: rebuild after changing it.
No provider or Supabase keys belong in Netlify frontend variables.

Set the resulting Netlify origin in the backend Render `CORS_ORIGINS` setting
and redeploy the backend. Socket.IO derives its backend origin from the API URL.

Check login, watchlists, portfolio and holding mutations, REST valuations,
live portfolio updates, and refreshing a nested URL directly in the browser.
