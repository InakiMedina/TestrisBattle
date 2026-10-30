# Backend

## Requirements

- Node.js and npm
- A MongoDB instance, local or hosted

## Setup

From the repository root, install the backend dependencies:

```powershell
cd backend
npm install
```

Create a local `.env` from the example:

```powershell
Copy-Item .env.example .env
```

Set `MONGODB_URL` in `.env` to your MongoDB connection string. `PORT` defaults to
`8000` and `NODE_ENV` defaults to `development`; both can be changed in `.env`.

## Start in development

From the `backend` directory, run:

```powershell
npm run dev
```

The server listens on the configured port (by default, `http://localhost:8000`).
Swagger UI is available at `http://localhost:8000/docs`.

## Other scripts

- `npm run build` compiles the TypeScript.
- `npm start` starts the compiled server.
