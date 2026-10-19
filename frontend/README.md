# Frontend

The TestrisBattle frontend is a **Single-Page Application (SPA)** built with Angular. Angular bootstraps the app once in the browser, and Angular Router switches between player pages without full-page reloads.

## Project Overview

TestrisBattle is a real-time, one-versus-one Tetris Battle game. Both players compete simultaneously and can see their own board and their opponent's board. Players clear lines and earn points using classic Tetris gameplay. For every 1,000 points earned, a player receives a random ability roll that can be used to disrupt the opponent.

The game includes six special abilities:

- **Push:** changes the position of the opponent's pieces.
- **Shuffle:** randomizes the opponent's upcoming pieces.
- **Block:** adds an obstacle to the opponent's board.
- **Negative Gravity:** temporarily slows the opponent's falling pieces.
- **Positive Gravity:** temporarily speeds up the opponent's falling pieces.
- **Chaos:** causes a special disruption to the opponent's board.

Abilities have different probabilities of appearing. More powerful or harder-to-obtain abilities have lower probabilities, so abilities such as Chaos are rarer. Players can also choose visual themes or backgrounds for a match; these are cosmetic and do not affect gameplay.

The frontend communicates with the backend through an API and WebSockets for real-time multiplayer updates. MongoDB is intended for persistent data, and AWS will provide cloud infrastructure. The project's goal is to combine classic Tetris skill with real-time competition, random events, and tactical abilities.

## Team

1. Erick Alejandro Contreras Salas
2. Iñaki Medina Munguía
3. Lilia Alejandra Padilla Hernández

## Technology

The planned full-project stack is:

| Category | Technology |
| --- | --- |
| Frontend framework | Angular |
| Programming language | TypeScript |
| Game framework | Phaser |
| Real-time communication | Socket.IO over WebSockets |
| Database | MongoDB |
| Cloud infrastructure | AWS |
| Other third-party services | To be determined |

The current frontend package uses Angular 21, TypeScript 5.9, RxJS 7.8, SCSS, Vitest 4 with jsdom, and npm 11.13. Phaser and Socket.IO are part of the planned project stack but are not currently listed as frontend package dependencies.

## Structure

```text
frontend/
├── angular.json                 # Angular CLI build, serve, and test configuration
├── package.json                 # Dependencies and npm scripts
├── public/                      # Static assets copied to the build
├── src/
│   ├── index.html               # SPA document shell
│   ├── main.ts                  # Angular application bootstrap
│   ├── styles.scss              # Global styles
│   └── app/
│       ├── app.config.ts        # Application providers and router setup
│       ├── app.routes.ts        # Top-level routes
│       ├── app.ts               # Root application component
│       ├── core/                # App-wide core services and infrastructure
│       ├── shared/              # Reusable UI components
│       └── features/
│           ├── player/pages/    # Practice, leaderboard, and profile pages
│           └── admin/           # Reserved for admin features
├── tsconfig.json                # Shared TypeScript configuration
├── tsconfig.app.json            # Application TypeScript configuration
└── tsconfig.spec.json           # Test TypeScript configuration
```

The current player routes are `/practice`, `/leaderboard`, and `/profile`. The `core`, `shared`, and `features/admin` directories are currently scaffolding for future work. Environment-specific files and nested feature route files have not been added yet.

## Run Locally

From the repository root, run these commands in order:

```bash
cd frontend
npm install
npm run start
```

Open `http://localhost:4200/`. The development server reloads when source files change. Stop it with `Ctrl+C` before running other commands in that terminal.

## Build And Test

Run these from `frontend/`:

```bash
npm run build
npm run test
```

`npm run build` creates the production build under `dist/`. `npm run test` runs the unit tests with Vitest. The current `package.json` does not yet define a lint script, so `npm run lint` is not available.

## Planned Root Commands

The following are proposed root-level Makefile targets, not npm scripts. They can be used after a root `Makefile` and a frontend lint script are added:

```makefile
.PHONY: install start build lint test clean

install:
	cd frontend && npm install

start:
	cd frontend && npm run start

build:
	cd frontend && npm run build

lint:
	cd frontend && npm run lint

test:
	cd frontend && npm run test

clean:
	rm -rf frontend/dist frontend/node_modules
```
