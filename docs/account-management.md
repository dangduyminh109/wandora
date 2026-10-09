# Account management

## User flows

- `/profile`: view account metadata; edit name, phone and bio; change password with current-password verification and confirmation. Login email is managed by administrators.
- `/login`: password visibility control and link to `/forgot-password`.
- `/forgot-password`: generic acknowledgement for known, unknown and locked accounts. Active accounts receive a reset email.
- `/reset-password#token=...`: set and confirm a new password. The token is in the fragment so it does not enter server URL logs. The page uses `no-referrer` metadata.
- `/admin/users`: edit name/email/role/status; lock/unlock with confirmation. The current admin cannot lock or demote themselves.

## API

| Endpoint                         | Access         | Purpose                                        |
| -------------------------------- | -------------- | ---------------------------------------------- |
| GET/PATCH `/api/account/profile` | Authenticated  | Read/update own profile; name, phone, bio only |
| POST `/api/account/password`     | Authenticated  | Change password and sign out                   |
| POST `/api/auth/forgot-password` | Public         | Request an emailed recovery link               |
| POST `/api/auth/reset-password`  | Recovery token | Consume token and set password                 |
| GET/PATCH `/api/users/:id`       | Admin          | Read/edit account; whitelisted fields only     |

All mutations require the configured same Origin. API schemas validate independently of client forms. Public user projections exclude password hashes, session versions and reset token hashes.

## Sessions and concurrency

Every new user has an opaque `authVersion`. Legacy users/sessions default to `legacy`. Redis session records capture this version at login. Protected requests and refresh compare it with the current database version and reject locked accounts. Password changes, resets, email/role/status changes rotate it, invalidating all older sessions; unlocking cannot revive old sessions. Expired Redis records are removed by their TTL.

Account mutations are serialized through an `AccountPolicy` node lock in a Neo4j transaction. Admin permission is checked again inside the transaction, and the last active admin cannot be removed. This also makes consuming a reset token atomic: concurrent requests cannot both succeed.

Recovery tokens use 32 random bytes; only SHA-256 hashes are stored. Tokens expire after 15 minutes, are single-use, and are replaced by a later request. Password or sensitive admin changes remove outstanding recovery tokens. Reset does not unlock an account. Failed SMTP delivery removes the token created by that request.

Recovery requests have a per-email limit of 5 per 15 minutes and an application-wide cap of 100 per hour. Responses have a minimum duration of 800ms; SMTP latency beyond that can still affect response timing. Password change attempts are limited to 10 per 15 minutes per account. Success sends a password-change notification without including the password.

## Mailpit local

Run `docker compose --env-file .env.local up -d mailpit`. SMTP defaults to `127.0.0.1:1025`, sender `no-reply@wandora.local`. Open `http://localhost:8025` for the test inbox. Mailpit captures messages locally and does not send real email. Ports bind to loopback.

For real delivery, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` and a HTTPS `APP_URL`. External SMTP requires TLS (465 or STARTTLS). Keep credentials out of Git. Do not deploy the test inbox publicly.

## Validation

`npm run test:accounts` uses the local app, Neo4j, Redis and Mailpit. It creates disposable users, checks profile isolation, duplicate email/self-protection, password verification and session revocation, email delivery, expired/replaced tokens, concurrent single-use reset, and lock/unlock/role enforcement. It removes only the users created by that test and their sessions. Do not run against a production database.

Security reference: [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).
