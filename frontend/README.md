# Fair Credit Scorer: Web App

> Educational artefact, not for real lending decisions.

The web frontend for the fairness-constrained credit default model. It talks to the FastAPI scoring service in the repository root. The browser never calls that API directly: every request goes through Next.js on the server, behind login.

**Stack:** Next.js 16 (App Router, Cache Components) · TypeScript (strict) · Tailwind CSS 4 · shadcn/ui (Radix) · Motion · next-themes · React Hook Form + Zod · Recharts · Auth.js v5 · Lucide.

## Features

| Page | What it does |
|---|---|
| `/` | Public landing page (signed-in users go straight to `/score`) |
| `/signup` | Create an account: name, email, password with strength meter, confirmation, terms; signs you in on success |
| `/terms`, `/privacy` | Placeholder legal pages |
| `/login` | Email + password with show/hide, inline validation, "Remember me" (30 days, otherwise 12 hours), Google/GitHub buttons that enable when configured |
| `/forgot-password` | Reset-request UI (see *Password reset* below) |
| `/score` | 21-field applicant form with presets, calibrated probability, risk meter, decision, human-review flag, top-5 SHAP factors, DiCE recourse dialog |
| `/decisions` | Last 50 logged decisions with search (also reachable from the top-bar search, shortcut `/`) |
| `/model` | Validation metrics, CI gate status, true-positive rate by age band, model details |

All app routes are protected by `proxy.ts`. Signed-out users are sent to `/login?callbackUrl=…`, and signed-in users are sent from `/`, `/login` and `/signup` to `/score`.

**Accounts.** Anyone can create an account at `/signup`. Accounts are stored in `.data/users.json` (or `USERS_FILE`) with salted scrypt password hashes; duplicate emails are rejected. The optional `AUTH_USER_*` account from the environment also keeps working. The JSON store suits local and single-container use. On Vercel or any multi-instance deployment, replace the three functions in `lib/users.ts` with a database.

## Setup

Requires Node.js 20.9+ and the FastAPI service running (`make serve` in the repo root, default `http://127.0.0.1:8000`).

```bash
cd frontend
npm install
cp .env.example .env.local
npx auth secret                              # writes AUTH_SECRET to .env.local
npm run hash-password -- "choose-a-password" # paste the output into AUTH_USER_PASSWORD_HASH
npm run dev                                  # http://localhost:3000
```

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `AUTH_SECRET` | yes | Encrypts session tokens (`npx auth secret`) |
| `AUTH_URL` | prod | Public URL of the app (optional on Vercel) |
| `AUTH_TRUST_HOST` | Docker/proxy | `true` when behind a reverse proxy or in a container |
| `AUTH_USER_EMAIL` | no | Email allowed to sign in with a password |
| `AUTH_USER_NAME` | no | Display name in the user menu |
| `AUTH_USER_PASSWORD_HASH` | no | `scrypt:…` hash from `npm run hash-password` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | no | Enables Google sign-in |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | no | Enables GitHub sign-in |
| `AUTH_ALLOWED_EMAILS` | no | Restrict OAuth sign-ins to these comma-separated emails (empty = anyone) |
| `USERS_FILE` | no | Path of the JSON account store (default `.data/users.json`) |
| `API_URL` | yes | FastAPI scoring service, server-side only |

OAuth callback URLs: `https://<your-domain>/api/auth/callback/google` and `/api/auth/callback/github`.

## Scripts

```bash
npm run dev         # development server
npm run build       # production build
npm run start       # serve the production build
npm run lint        # ESLint
npm run typecheck   # TypeScript, no emit
```

## Deployment

**Vercel (primary).** Import the repository and set the root directory to `frontend`. Add the environment variables above. `API_URL` must be a URL the Vercel servers can reach, which means the FastAPI service has to be deployed publicly or on a private network that Vercel can access.

**Docker (optional).** The app builds as a standalone Node server:

```bash
docker build -t credit-default-fair-web ./frontend
docker run --rm -p 3000:3000 --env-file frontend/.env.local -e API_URL=http://host.docker.internal:8000 credit-default-fair-web
```

Or run both services from the repo root with `docker compose up --build` (the `web` service reads `frontend/.env.local`).

## Structure

```
app/                 routes: (auth)/login, (auth)/forgot-password, (app)/score|decisions|model,
                     error/loading/not-found boundaries, metadata (icon, Open Graph, robots)
components/ui/       design-system primitives (shadcn/ui + animated number, motion dialog)
components/features/ auth, layout, score, decisions, model, shared
lib/                 schemas (Zod, shared client/server), api (server-only FastAPI client),
                     actions (server actions), labels, password hashing
auth.ts, proxy.ts    Auth.js configuration and route protection
```

## Security notes

- Inputs are validated with Zod in the browser and again in server actions. FastAPI validates a third time.
- Sessions are encrypted JWT cookies (httpOnly, `SameSite=Lax`, `Secure` over HTTPS).
- Security headers (CSP, frame denial, nosniff, referrer and permissions policies, HSTS in production) are set in `next.config.ts`.
- Secrets come only from environment variables; `.env*` files are gitignored.

## Password reset

`/forgot-password` validates the email and shows a privacy-preserving confirmation, but **no email is sent yet**. Connect a mail provider inside `requestPasswordReset` in `lib/actions/auth.ts` to deliver reset links.
