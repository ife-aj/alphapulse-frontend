# AlphaPulse frontend

React + TypeScript + Vite client for the AlphaPulse API (the NestJS service in
the sibling `../alphapulse` directory).

Batch 1 covers the foundation: authentication, routing, the API client, and the
dashboard shell. Markets, watchlists, portfolios and realtime are not built yet —
their routes and navigation entries exist as placeholders.

## Requirements

- Node.js 20.19+ (or 22.12+) — whatever the installed Vite version requires
- The AlphaPulse backend running locally (default `http://localhost:3000`)

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

`cp` is a POSIX shell command; on PowerShell use `Copy-Item .env.example .env`.

The app starts on <http://localhost:5173> and redirects `/` to `/app`, which
bounces a signed-out visitor to `/login`.

## Scripts

| Command           | What it does                                     |
| ----------------- | ------------------------------------------------ |
| `npm run dev`     | Vite dev server with HMR on port 5173            |
| `npm run build`   | Type-check the project (`tsc -b`) and bundle       |
| `npm run preview` | Serve the production build on port 4173           |
| `npm run lint`    | ESLint over the whole project                     |

## Configuration

Two variables, both documented in `.env.example`:

- `VITE_API_BASE_URL` — API base URL. Defaults to `/api`, a same-origin path
  that the dev server proxies. **Keep it relative**: the backend enables no
  CORS (`../alphapulse/src/main.ts`), so an absolute cross-origin URL is blocked
  by the browser. To use one, CORS has to be enabled server-side first.
- `API_PROXY_TARGET` — where the dev/preview server forwards `/api`. No `VITE_`
  prefix, so it never reaches the browser bundle.

Frontend environment files are for public configuration only. Every
`VITE_`-prefixed value is inlined into the browser bundle. Backend secrets — a
Supabase service-role key in particular — must never appear here or anywhere
else in this repository. `.env` is git-ignored; `.env.example` holds
placeholders only.

## Architecture

```
src/
  api/          Typed fetch wrapper and the auth endpoints
    client.ts     base URL, ApiError, bearer header, 401 handling
    auth.ts       login / register / me, mirroring the controller exactly
    types.ts      wire types copied from the backend DTOs
  auth/         Session ownership and route access
    AuthProvider.tsx   the only place a session is created or destroyed
    AuthContext.ts     context + useAuth
    guards.tsx         RequireAuth / RequireAnonymous
    session.ts         localStorage persistence (access token + expiry only)
    validation.ts      client mirrors of the backend DTO constraints
    useAuthForm.ts     small controlled-form hook
  components/   Reusable presentation: buttons, fields, alerts, brand, icons
  layout/       The authenticated shell: sidebar, top bar, mobile navigation
  pages/        Route components
```

### How authentication works

- `POST /auth/login` and `POST /auth/register` return `{ user, session }`;
  `GET /auth/me` returns `{ user }` and requires `Authorization: Bearer …`.
- **Only the access token and its expiry are persisted.** The refresh token is
  deliberately dropped: the backend has no refresh endpoint, so storing it would
  be keeping a credential nothing can use.
- On startup a stored token is verified against `GET /auth/me`. The guarded
  content is never rendered while that is in flight, so a signed-out visitor
  never sees a flash of the dashboard.
- A `401` clears the session and returns the user to `/login`. Any other failure
  keeps the session and offers a retry, so a backend outage is not mistaken for
  a signed-out state.
- **Logout is local.** The backend exposes no logout route and no revocation
  endpoint, so signing out clears the token, the cached profile and every other
  cached response, and nothing is sent to the server.
