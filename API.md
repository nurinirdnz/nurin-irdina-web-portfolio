# Portfolio REST API

All routes are under `/api`. Responses are JSON. Writes require `Content-Type: application/json` and an `Origin` header exactly matching `APP_ORIGIN`; the browser supplies this header automatically. The browser uses same-origin cookies, with no bearer token or secret embedded in client code.

| Method | Route | Authentication | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | Public | Database connectivity |
| GET | `/portfolio` | Public | Database-backed email and project list |
| POST | `/contact` | Public, throttled | Persist contact message |
| POST | `/admin/login` | Password, throttled | Create an eight-hour cookie session |
| GET | `/admin/session` | Session | Check authentication |
| POST | `/admin/logout` | Session | Revoke session and clear cookie |
| GET | `/admin/messages?page=1` | Session | Page of 20 messages and total count |
| PATCH | `/admin/messages/:id` | Session | Update status |

## Contact

```json
{"name":"Example Visitor","email":"visitor@example.com","message":"I would like to discuss a software project."}
```

Name: 1–100 characters after trimming. Email: valid address, maximum 200 characters. Message: 10–3000 characters after trimming. Extra properties are rejected. A successful write returns HTTP 201 with a generated `id` and confirmation `message`; success means saved to the inbox, not sent by email.

## Login

```json
{"password":"your-generated-admin-password"}
```

HTTP 200 sets `portfolio_session`. The cookie is HttpOnly, SameSite=Strict and scoped to `/api/admin`; it is Secure in production. The password comes from the server's `.env` file, never from a bundled default. There is one owner account and no public registration.

## Message status

```json
{"status":"read"}
```

Supported values: `new`, `read`, `archived`. Updates preserve the message; there is no destructive delete endpoint.

## Errors

- 400: invalid JSON, contact details or status.
- 401: incorrect password, missing or expired session.
- 403: missing or foreign request origin on a write.
- 404: unknown endpoint or message.
- 413: request body exceeds 16 KB.
- 415: write does not use JSON.
- 429: rate limit exceeded.
- 500: unexpected server failure; details are not exposed to visitors.
