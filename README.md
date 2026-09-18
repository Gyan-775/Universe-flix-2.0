# Universe-flix

Universe-flix is an API-first cinematic discovery app. Browsing does not require signup, login, email, or an account. Personalization uses an anonymous browser session only.

## Backend setup

1. Create a PostgreSQL database named `universeflix`.
2. Copy `server/.env.example` to `server/.env`.
3. Set `DATABASE_URL` and `TMDB_READ_ACCESS_TOKEN`.
4. Install dependencies:

```powershell
npm.cmd --prefix server install
```

5. Apply the schema:

```powershell
npm.cmd --prefix server run migrate
```

6. Start the API:

```powershell
npm.cmd --prefix server run dev
```

The public catalog remains usable when PostgreSQL is not configured. Session persistence and recommendations require `DATABASE_URL`; the frontend keeps a local anonymous fallback for taste data.

## Frontend

```powershell
npm.cmd --prefix client install
npm.cmd --prefix client run dev
```

Open `http://localhost:5173/`. The Vite `/api` proxy targets `http://localhost:5000`.

## Public APIs

- `GET /api/health`
- `GET /api/movies`
- `GET /api/movies/:id`
- `GET /api/movies/:id/similar`
- `GET /api/universes`
- `GET /api/universes/:slug/movies`
- `GET /api/genres`
- `GET /api/session`
- `GET /api/session/profile`
- `POST /api/session/taste`
- `POST /api/session/interaction`
- `GET /api/recommendations`

No endpoint requires authentication.
