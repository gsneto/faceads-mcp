# Pratinho Pronto: private single-tenant MCP

Set these only in Railway Variables: `META_ACCESS_TOKEN`, `META_API_VERSION=v24.0`,
`MCP_BASE_URL=https://<public-domain>`, `MCP_SERVER_TOKEN` and `MCP_PERMISSIONS=read`.
The MCP server token must be a separate random secret with at least 32 bytes.
Do not reuse the Meta token as the MCP authentication token.

When `MCP_SERVER_TOKEN` is defined, only its exact Bearer value authenticates HTTP
clients. Missing, incorrect, empty or short secrets fail closed. The Meta token
stays on the server. PostgreSQL, database migrations and the built-in public
OAuth registration flow are unnecessary in this mode. Without this variable,
the original database-backed OAuth behavior and migrations are retained.

Use `https://<public-domain>/mcp` for MCP and `/health` for availability checks.
An OpenAI Responses API client needs `authorization` set to the MCP server token,
and should retain `require_approval: "always"`. Do not put either secret in code,
URLs, prompts, source control, screenshots or logs.

Scope the Meta system-user token to the Pratinho Pronto ad account. The server
accepts an account ID on each call; that argument is not an access-control
boundary. The initial token and server mode should both allow only reading.
The server's write tools remain available for later explicit enablement through
`MCP_PERMISSIONS=readwrite`; that also requires appropriate Meta asset and token
permissions. No campaign changes are part of setup verification.

The existing summary formatter drops ROAS fields and only renders the first
insight row. For the initial report use `execute_api` with `method: "GET"`, an
explicit account and date range, and raw insight fields including `actions`,
`cost_per_action_type`, `action_values` and `purchase_roas`. Follow pagination
with cursors. Missing purchase counts or values mean CPA/ROAS are unavailable,
not zero. These are Meta-attributed results, not checkout-confirmed revenue.

Security checks: `npm run build && npm run test:security`. Tests use invented
tokens and a local HTTP server; they never call Meta or mutate a real campaign.

Dependency review (2026-09-09): SDK 1.30, Prisma 7.10 and rate limiter 8.7;
compatible transitive fixes applied. npm audit still reports advisories in the
Prisma CLI chain (deepmerge-ts/mysql2) and the development-only Puppeteer archive
chain. This is not a clean audit. Do not force a Prisma major downgrade just to
silence it. The single-tenant runtime does not execute Prisma migrations or use
MySQL, and the Docker build skips the optional Puppeteer browser download.
Docker/Railway deployment must still be verified in the target environment.
