# Frontend

React 19 + TypeScript + Vite 8 single-page application.

## Development

```bash
npm install
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

## Build

```bash
npm run build   # outputs to dist/
npm run preview # preview the production build locally
```

## Key dependencies

| Package | Purpose |
|---|---|
| `react-router-dom` | Client-side routing |
| `@tanstack/react-query` | Server state, caching, mutations |
| `axios` | HTTP client (with 401 interceptor) |
| `tailwindcss` v4 | Utility-first CSS |
| `lucide-react` | Icon set |

See the [root README](../README.md) for full project documentation.
