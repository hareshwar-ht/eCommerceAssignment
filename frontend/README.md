# ShopHub Frontend

React 19 + Vite + TypeScript + TailwindCSS v4 + shadcn/ui SPA.

## Setup

```bash
npm install
npm run dev       # http://localhost:5173
```

**Requires** backend at `http://localhost:8000` (set via `VITE_API_URL` in `.env`).

> The `ERR_CONNECTION_REFUSED` on startup (refresh-token check) is expected when the backend is offline — the app gracefully stays logged out.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Type-check + production build |
| `npm run test` | Run all tests |
| `npm run test:coverage` | Coverage report |
| `npm run lint` | ESLint |

## Architecture

```
src/
├── api/          # Axios client, interceptors, token management
├── features/     # Domain logic (auth, dashboard)
├── components/   # Shared UI (layout + shadcn primitives)
├── providers/    # AuthProvider (session state)
├── routes/       # Router + ProtectedRoute / GuestRoute guards
├── hooks/        # useAuth
├── types/        # Shared TypeScript interfaces
└── test/         # Vitest + Testing Library (25 tests)
```

**Auth:** Access token in memory only. Refresh token in HTTP-only cookie. Silent session restore on boot.  
**Routing:** All pages lazy-loaded (`React.lazy`) for code splitting.
