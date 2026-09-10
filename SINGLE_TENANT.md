# Meta Ads Desktop: MCP local

O aplicativo desktop guarda `META_ACCESS_TOKEN` com `safeStorage` do Electron,
define `META_API_VERSION=v24.0` e inicia o servidor em uma porta aleatória de
`127.0.0.1`. A cada execução ele gera um `MCP_SERVER_TOKEN` temporário e separado.
O token da Meta nunca é usado para autenticar o transporte MCP.

When `MCP_SERVER_TOKEN` is defined, only its exact Bearer value authenticates HTTP
clients. Missing, incorrect, empty or short secrets fail closed. The Meta token
stays on the server. PostgreSQL, database migrations and the built-in public
OAuth registration flow are unnecessary in this mode. Without this variable,
the original database-backed OAuth behavior and migrations are retained.

O painel é o cliente desse MCP local. Não existe URL pública, mensalidade de
hospedagem ou porta aberta na rede. Não coloque credenciais em código, URLs,
prompts, controle de versão, capturas de tela ou logs.

Scope the Meta system-user token to only the ad accounts that should be accessible. The server
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
O caminho desktop empacotado é validado com o health check local antes da entrega.
