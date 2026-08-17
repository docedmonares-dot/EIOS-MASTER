# EIOS Enterprise Platform

Unified workspace for the EIOS API, web application, and PostgreSQL schema.

## Production prerequisites

- Node.js 24 LTS-compatible runtime
- PostgreSQL 15 or newer
- HTTPS reverse proxy

## Configuration

1. Copy `backend/.env.example` to `backend/.env` and supply production secrets.
2. Copy `frontend/eios-master-app/.env.example` to `.env.production` and set the public API and Socket URLs.
3. Never commit either populated environment file.

## Database migrations

For a new database, run from `backend`:

```powershell
npm run db:migrate
```

For a database that already contains all migrations but predates the migration journal, take a verified backup and run once:

```powershell
npm run db:migrations:baseline
```

Check state at any time with `npm run db:migrations:status`. Applied migration checksums are immutable; changing an applied SQL file causes the runner to stop.

## Build and verification

```powershell
cd backend
npm ci
npm test

cd ..\frontend\eios-master-app
npm ci
npm run test:geographic
npm run build
```

Start the API with `npm start` from `backend`. Serve the frontend `dist` directory through the client HTTPS web server and route API traffic to the configured backend origin.

## Launch checks

- System Administrator can open Administration and System Health.
- Survey Designer can create, preview, publish, deploy, and assign a survey.
- Enumerator can select the complete Geographic Master hierarchy, save offline, and synchronize.
- Operations and Analytics show the synchronized deployment and response.
- Old sessions are rejected after a password reset or password change.
