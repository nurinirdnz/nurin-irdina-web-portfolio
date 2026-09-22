# Nurin Irdina — Full-Stack Portfolio

[![CI](https://github.com/nurinirdnz/nurin-irdina-web-portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/nurinirdnz/nurin-irdina-web-portfolio/actions/workflows/ci.yml)

**Live:** [nurin-irdina-portfolio.onrender.com](https://nurin-irdina-portfolio.onrender.com)

A full-stack personal portfolio showcasing my software projects, technical skills, education, leadership experience, and professional journey.

The application includes a responsive portfolio frontend, an Express REST API, persistent SQLite storage, a contact form, and a password-protected admin inbox.

## Features

- Light/dark theme toggle with system-preference detection and no flash-of-wrong-theme
- Seven software and AI project showcases, each with a labeled architecture summary
- Public résumé page (`resume.html`) with verified content, print/PDF-friendly
- Education, work, leadership, and volunteering timeline
- Scroll-reveal animations, hover states, and active-section navigation, all respecting `prefers-reduced-motion`
- Project information loaded from SQLite through a REST API
- Contact form with server-side validation
- Optional email notification for new contact messages (reply-to set to the sender)
- Persistent contact-message storage
- Password-protected admin inbox
- Message status management
- Login and contact-form rate limiting
- Secure session cookies
- Mobile, keyboard, and reduced-motion support
- Automated GitHub Actions checks
- Dependabot dependency monitoring

## Technology Stack

### Frontend

- HTML5
- CSS3 (design tokens, no build step)
- Vanilla JavaScript (dependency-free — no animation or scroll libraries)

### Backend

- Node.js 24
- Express 5
- SQLite
- Zod validation
- Helmet security headers

### Testing and tooling

- Node.js test runner
- Supertest
- npm audit
- GitHub Actions
- Dependabot
- Docker
- Render (deployment, via `render.yaml` blueprint)

## Getting Started

### Requirements

Install [Node.js](https://nodejs.org/) version 24 or newer.

### Installation

Clone the repository:

```sh
git clone https://github.com/nurinirdnz/nurin-irdina-web-portfolio.git
cd nurin-irdina-web-portfolio
```

Install the locked dependencies:

```sh
npm ci
```

Create the local environment configuration:

```sh
npm run setup
```

The setup command creates a private `.env` file and displays a randomly generated admin password. Save this password securely.

Start the application:

```sh
npm start
```

Open:

- Portfolio: http://localhost:3000
- Admin inbox: http://localhost:3000/admin

This application must run through its Node.js server. Opening `index.html` directly will not provide API or database functionality.

## Environment Configuration

The application uses the following environment variables:

| Variable         | Purpose                                                  |
| ---------------- | --------------------------------------------------------- |
| `PORT`           | Server port; defaults to `3000`                          |
| `APP_ORIGIN`     | Exact public application origin without a trailing slash |
| `ADMIN_PASSWORD` | Private admin password with at least 16 characters       |
| `DATABASE_PATH`  | Path to the SQLite database                              |
| `NODE_ENV`       | Use `development` locally and `production` when deployed |
| `TRUST_PROXY`    | Number of trusted reverse proxies; normally `0` locally  |
| `NOTIFY_EMAIL`   | Optional — email address that receives new contact-form messages |
| `BREVO_SENDER_EMAIL` | Optional — the "from" address, verified as a sender in [Brevo](https://brevo.com) |
| `BREVO_API_KEY`  | Optional — Brevo API key (Settings → SMTP & API → API Keys)       |

Leave the three notification variables blank to disable email notifications entirely —
messages still save to the database and remain visible in `/admin` either way.

Example development configuration:

```env
PORT=3000
APP_ORIGIN=http://localhost:3000
ADMIN_PASSWORD=
DATABASE_PATH=backend/data/portfolio.sqlite
NODE_ENV=development
TRUST_PROXY=0
```

Run `npm run setup` instead of manually entering an admin password.

If you change the local port, update both values:

```env
PORT=3001
APP_ORIGIN=http://localhost:3001
```

The `.env` file is excluded from Git and must never be committed.

## Available Commands

```sh
npm start        # Start the production-style server
npm run dev      # Start the server with automatic restarts
npm run setup    # Generate the private local environment file
npm run check    # Validate JavaScript syntax
npm test         # Run the integration test suite
npm run build    # Rebuild bundled frontend dependencies
npm run db:seed  # Update project records without deleting messages
```

## Project Structure

```text
frontend/
  index.html              Main portfolio page
  resume.html             Public résumé page
  admin.html              Private admin inbox
  styles.css              Portfolio styles (Elegant Evening design tokens)
  admin.css               Admin interface styles
  js/
    theme.js               Light/dark theme toggle (blocking, pre-paint)
    app.js                 Project loading and contact form
    admin.js                Authentication and inbox management
    effects.js               Scroll reveal, mobile nav, active-section tracking
  assets/                  Public portfolio assets
  vendor/                  Locally vendored dependencies (kept for reference/CI)

backend/
  src/
    server.mjs             Server startup and configuration
    app.mjs                 API routes and security middleware
    database.mjs             SQLite schema and initialization
  seed/
    portfolio.json          Portfolio project content
  test/
    api.test.mjs             Integration tests
  setup.mjs                 Local environment generator
  seed.mjs                   Database seed updater

private/                   Original résumé PDF (private contact/reference details;
                            excluded from Git and Docker; never served by the app)

render.yaml                Render deployment blueprint

.github/
  workflows/
    ci.yml                  Automated checks and tests
  dependabot.yml             Dependency-update monitoring
```

## Contact and Admin Workflow

Contact-form submissions are validated by the server and saved in SQLite.

The private admin inbox allows the portfolio owner to:

- Sign in using the configured admin password
- View submitted messages
- Navigate through paginated results
- Mark messages as new, read, or archived
- Sign out and revoke the active session

Messages are stored in the database and are not automatically emailed.

## API

The application provides the following main endpoints:

| Method  | Endpoint                  | Purpose                               |
| ------- | -------------------------- | --------------------------------------- |
| `GET`   | `/api/health`             | Check application and database health |
| `GET`   | `/api/portfolio`          | Retrieve portfolio project data       |
| `POST`  | `/api/contact`            | Submit a contact message              |
| `POST`  | `/api/admin/login`        | Create an admin session               |
| `GET`   | `/api/admin/session`      | Check the current admin session       |
| `GET`   | `/api/admin/messages`     | Retrieve contact messages             |
| `PATCH` | `/api/admin/messages/:id` | Update a message status               |
| `POST`  | `/api/admin/logout`       | Revoke the admin session              |

See [API.md](API.md) for request formats and response details.

## Security

The application includes:

- Server-side Zod validation
- Parameterized SQLite queries
- Bounded JSON request bodies
- Same-origin validation for write requests
- Login and contact-form rate limiting
- HttpOnly and SameSite session cookies
- Secure cookies in production
- Cryptographically random session tokens
- Hashed session-token storage
- Eight-hour session expiration
- Helmet security headers
- Content Security Policy
- HTML escaping for submitted content
- Disabled caching for private API responses
- Automated production dependency audits

Current security verification:

- All integration tests pass
- No known production dependency vulnerabilities
- Private configuration and runtime data are excluded from Git

## Private Files

The following files are intentionally excluded from the repository and from the Docker image:

- `.env` and environment variants
- SQLite database and WAL files
- `node_modules`
- npm credentials
- Private keys and certificates
- Logs and coverage output
- `private/` — the original résumé PDF, which contains a home address, phone number,
  and reference contact details not meant to be public

The public interface serves `resume.html` instead — a résumé page built from the same
verified content, with personal contact/reference details intentionally omitted.

## Docker

Generate the local environment file first:

```sh
npm run setup
```

Build and run the application:

```sh
docker compose up --build -d
```

Stop the container:

```sh
docker compose down
```

The SQLite database is stored in a named Docker volume and survives ordinary container replacement.

## Deployment

### Render (current live host)

This repo includes `render.yaml`, a Blueprint that deploys the Docker image directly:

1. Render dashboard → **New** → **Blueprint** → select this repository.
2. Set the two secrets it prompts for: `APP_ORIGIN` (your assigned `https://*.onrender.com`
   URL, or a custom domain) and `ADMIN_PASSWORD` (16+ characters).
3. Deploy. Render auto-redeploys on every push to `main`.

Render's free tier has no persistent disk, so `backend/data/portfolio.sqlite` resets on
each redeploy — contact-form messages won't survive a redeploy on the free plan. Upgrading
to a paid instance type with an attached disk removes this limitation.

### Other hosts

Deploy this project to any host that supports:

- Node.js 24 or newer
- Persistent writable storage (if message persistence matters)
- HTTPS
- Long-running Node.js services or Docker containers

Production configuration should include:

```env
NODE_ENV=production
APP_ORIGIN=https://your-domain.example
ADMIN_PASSWORD=use-a-long-random-password
DATABASE_PATH=backend/data/portfolio.sqlite
```

Set `TRUST_PROXY=1` only when the application is behind exactly one trusted reverse proxy.

This is not a static-only website because the contact form, database, and admin inbox require the Node.js server.

## Author

**Nurin Irdina Safiah**

- GitHub: [@nurinirdnz](https://github.com/nurinirdnz)
- LinkedIn: [nurinirdinaz](https://www.linkedin.com/in/nurinirdinaz/)
- Email: [nurinirdnz@gmail.com](mailto:nurinirdnz@gmail.com)
