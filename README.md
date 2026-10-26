# PrepNest

PrepNest is a personal study and placement workspace built with vanilla HTML, CSS, JavaScript, Node.js, Express, MySQL, Multer, and bcrypt. It has account authentication, a dashboard, PDF storage and reading progress, tasks, revisions, and browser reminders.

Demo link:https://prep-nest-chi.vercel.app/

## Project map

- `server.js` starts Express, serves the app, and registers every API.
- `config/db.js` is the shared MySQL connection pool; configure it through `.env`.
- `controllers/` contains request handlers for accounts, PDFs, dashboard data, and study records.
- `routes/` maps REST endpoints to controllers; `middleware/auth.js` protects private data.
- `database/schema.sql` creates the five relational tables.
- `frontend/` contains all standalone HTML pages, shared CSS, and vanilla JS modules.
- `uploads/` receives PDFs at runtime and is excluded from Git.

## Setup

1. Run `database/schema.sql` in MySQL Workbench or the MySQL CLI.
2. Copy `.env.example` to `.env`, then set your MySQL credentials and session secret.
3. Run `npm install`.
4. Run `npm start` and open `http://localhost:3000`.

## REST API

| Area | Endpoints |
| --- | --- |
| Authentication | `POST /register`, `POST /login`, `POST /logout`, `GET /me` |
| Dashboard | `GET /dashboard` |
| PDFs | `GET /pdf`, `POST /pdf/upload`, `PUT /pdf/progress/:id`, `DELETE /pdf/:id` |
| Tasks | `GET/POST /task`, `PUT/DELETE /task/:id` |
| Revisions | `GET/POST /revision`, `PUT/DELETE /revision/:id` |
| Reminders | `GET/POST /reminder`, `PUT/DELETE /reminder/:id` |

Workspace requests require the login session. PDF upload accepts PDFs only, up to 20 MB.
