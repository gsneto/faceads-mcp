/**
 * HTTP Server Transport para MCP
 *
 * Expõe o MCP server via Streamable HTTP transport (POST /mcp, GET /mcp, DELETE /mcp).
 * Suporta multi-tenant via headers X-Meta-Access-Token e X-Meta-Ad-Account-Id.
 */

import express from 'express';
import type { Request, Response } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { randomUUID } from 'node:crypto';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { withAuthContext, type AuthContext } from '../utils/auth-context.js';
import { apiKeyAuth, getApiKeyInfo, isApiKeyAuthEnabled } from '../middleware/auth.js';
import { usageLogger } from '../middleware/usage-logger.js';
import { isDatabaseConfigured, getPrisma } from '../db/prisma.js';
import { decryptToken } from '../db/crypto.js';
import { adminRouter } from '../routes/admin.js';
import { oauthRouter } from '../routes/oauth.js';
import { scopeToPermission } from '../auth/oauth-utils.js';

interface HttpServerOptions {
  port: number;
  createServer: () => Server;
}

/**
 * Cria e inicia o HTTP server com Express.
 */
export async function startHttpServer(options: HttpServerOptions): Promise<void> {
  const { port, createServer } = options;
  const app = express();
  const BASE_URL = process.env.MCP_BASE_URL || `http://localhost:${port}`;

  // ── Middleware global ──
  app.use(express.json());

  // CORS para clientes web
  app.use((_req: Request, res: Response, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-Meta-Access-Token, X-Meta-Ad-Account-Id, Mcp-Session-Id, Authorization');
    res.header('Access-Control-Expose-Headers', 'Mcp-Session-Id');
    if (_req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  // Usage logging
  app.use(usageLogger());

  // ── Public routes (BEFORE apiKeyAuth) ──

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'fb-marketing-mcp',
      timestamp: new Date().toISOString(),
      apiKeyAuthEnabled: isApiKeyAuthEnabled(),
      activeSessions: sessions.size,
    });
  });

  // OAuth Protected Resource Metadata (RFC 9728)
  app.get('/.well-known/oauth-protected-resource', (_req: Request, res: Response) => {
    res.json({
      resource: BASE_URL,
      authorization_servers: [BASE_URL],
      bearer_methods_supported: ['header'],
      scopes_supported: ['ads_read', 'ads_management'],
    });
  });

  // OAuth Authorization Server Metadata (RFC 8414)
  app.get('/.well-known/oauth-authorization-server', (_req: Request, res: Response) => {
    res.json({
      issuer: BASE_URL,
      authorization_endpoint: `${BASE_URL}/oauth/authorize`,
      token_endpoint: `${BASE_URL}/oauth/token`,
      registration_endpoint: `${BASE_URL}/oauth/register`,
      scopes_supported: ['ads_read', 'ads_management'],
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      token_endpoint_auth_methods_supported: ['client_secret_post'],
      code_challenge_methods_supported: ['S256'],
    });
  });

  // OAuth routes (register, authorize, token)
  if (isDatabaseConfigured()) {
    app.use('/oauth', oauthRouter);
    console.log('  OAuth 2.0: /oauth/* (database-backed)');
  }

  // ── API key auth (after public routes) ──
  app.use(apiKeyAuth());

  // Rate limiting (por API key ou IP)
  const freeLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    limit: 100,
    keyGenerator: (req: Request) => {
      const keyInfo = getApiKeyInfo(req);
      return keyInfo?.key ?? ipKeyGenerator(req.ip ?? '0.0.0.0');
    },
    skip: (req: Request) => {
      const keyInfo = getApiKeyInfo(req);
      // Pro e Enterprise sem rate limit
      return keyInfo?.tier === 'pro' || keyInfo?.tier === 'enterprise';
    },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Rate limit exceeded', message: 'Free tier: 100 requests/hour. Upgrade for unlimited access.' },
  });
  app.use('/mcp', freeLimiter);

  // ── Admin API (requires DATABASE_URL + MCP_ADMIN_KEY) ──
  if (isDatabaseConfigured()) {
    app.use('/admin', adminRouter);
    console.log('  Admin API: /admin (database-backed)');
  }

  // ── Mapa de sessões (stateful transport) ──
  const sessions = new Map<string, { transport: StreamableHTTPServerTransport; server: Server }>();

  /**
   * Extrai auth context dos headers HTTP.
   * Priority: 0) Bearer token  1) Headers  2) DB token (via API key user)  3) env fallback
   */
  async function extractAuthContext(req: Request): Promise<AuthContext | null> {
    const keyInfo = getApiKeyInfo(req);

    // 0) Bearer token — OAuth 2.0 (Claude Connectors)
    const authHeader = req.headers['authorization'] as string | undefined;
    if (authHeader?.startsWith('Bearer ')) {
      const bearerToken = authHeader.slice(7);
      if (isDatabaseConfigured()) {
        try {
          const prisma = getPrisma();
          const oauthToken = await prisma.oAuthAccessToken.findUnique({
            where: { token: bearerToken },
            include: { user: true },
          });

          if (oauthToken && oauthToken.expiresAt > new Date()) {
            const oauthUserId = oauthToken.userId;
            const permissions = scopeToPermission(oauthToken.scope);

            // Resolve Meta token for this user
            const metaToken = await prisma.metaToken.findFirst({
              where: { userId: oauthUserId },
              orderBy: { createdAt: 'desc' },
            });

            return {
              accessToken: metaToken ? decryptToken(metaToken.accessToken) : '',
              adAccountId: metaToken?.adAccountId ?? '',
              userId: oauthUserId,
              permissions,
              tier: 'pro', // OAuth users get pro tier
            };
          }
        } catch (err) {
          console.error('[auth] Bearer token lookup failed:', err);
        }
      }
      // Invalid/expired bearer token — return null (will trigger 401)
      return null;
    }

    const permissions = keyInfo?.permissions ?? 'readwrite';
    const tier = keyInfo?.tier ?? 'free';
    const userId = keyInfo?.userId;

    // 1) Explicit headers — power users
    const accessToken = req.headers['x-meta-access-token'] as string | undefined;
    const adAccountId = req.headers['x-meta-ad-account-id'] as string | undefined;

    if (accessToken && adAccountId) {
      return {
        accessToken,
        adAccountId: adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`,
        apiVersion: (req.headers['x-meta-api-version'] as string) || undefined,
        userId,
        permissions,
        tier,
      };
    }

    // 2) DB token — resolve from user's stored Meta tokens
    if (isDatabaseConfigured() && userId) {
      try {
        const prisma = getPrisma();
        const metaToken = await prisma.metaToken.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });

        if (metaToken) {
          return {
            accessToken: decryptToken(metaToken.accessToken),
            adAccountId: metaToken.adAccountId,
            userId,
            permissions,
            tier,
          };
        }
      } catch (err) {
        console.error('[auth] Failed to resolve Meta token from DB:', err);
      }
    }

    // 3) No credentials — MetaClient will fall back to env vars
    // Still set permissions/tier if we have key info
    if (keyInfo) {
      return {
        accessToken: '',
        adAccountId: '',
        userId,
        permissions,
        tier,
      };
    }

    return null;
  }

  /**
   * Wraps handler com auth context se disponível.
   */
  async function withOptionalAuth<T>(req: Request, fn: () => T): Promise<T> {
    const authCtx = await extractAuthContext(req);
    if (authCtx) {
      return withAuthContext(authCtx, fn);
    }
    return fn();
  }

  // ── MCP Handlers (shared between / and /mcp) ──

  async function mcpBearerGuard(req: Request, res: Response, next: () => void) {
    const authHeader = req.headers['authorization'] as string | undefined;
    if (authHeader?.startsWith('Bearer ')) {
      const authCtx = await extractAuthContext(req);
      if (!authCtx) {
        const resourceMetadataUrl = `${BASE_URL}/.well-known/oauth-protected-resource`;
        res.setHeader('WWW-Authenticate', `Bearer resource_metadata="${resourceMetadataUrl}"`);
        res.status(401).json({ error: 'invalid_token', error_description: 'Bearer token is invalid or expired' });
        return;
      }
    }
    next();
  }

  async function mcpPost(req: Request, res: Response) {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    // Sessão existente — reutilizar transport
    if (sessionId && sessions.has(sessionId)) {
      const session = sessions.get(sessionId)!;
      await withOptionalAuth(req, () => session.transport.handleRequest(req, res, req.body));
      return;
    }

    // Nova sessão — deve ser um initialize request
    if (!sessionId && isInitializeRequest(req.body)) {
      const mcpServer = createServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId) => {
          sessions.set(newSessionId, { transport, server: mcpServer });
          console.error(`[MCP] Session initialized: ${newSessionId}`);
        },
      });

      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid && sessions.has(sid)) {
          sessions.delete(sid);
          console.error(`[MCP] Session closed: ${sid}`);
        }
      };

      await mcpServer.connect(transport);
      await withOptionalAuth(req, () => transport.handleRequest(req, res, req.body));
      return;
    }

    // Request inválido — sem sessão e não é initialize
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided',
      },
      id: null,
    });
  }

  async function mcpGet(req: Request, res: Response) {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId) {
      res.status(400).json({ error: 'Mcp-Session-Id header required for GET requests' });
      return;
    }

    const session = sessions.get(sessionId);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    await session.transport.handleRequest(req, res);
  }

  async function mcpDelete(req: Request, res: Response) {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId) {
      res.status(400).json({ error: 'Mcp-Session-Id header required' });
      return;
    }

    const session = sessions.get(sessionId);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    await session.transport.close();
    sessions.delete(sessionId);
    res.status(200).json({ message: 'Session closed' });
  }

  // Mount MCP on /mcp
  app.use('/mcp', mcpBearerGuard);
  app.post('/mcp', mcpPost);
  app.get('/mcp', mcpGet);
  app.delete('/mcp', mcpDelete);

  // Also serve MCP at root / for Claude remote connector compatibility
  // (Claude POSTs to the root URL provided by the user)
  app.post('/', mcpBearerGuard, mcpPost);
  app.get('/', mcpBearerGuard, mcpGet);
  app.delete('/', mcpBearerGuard, mcpDelete);

  // ── Start server ──
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`fb-marketing-mcp HTTP server listening on http://0.0.0.0:${port}`);
    console.log(`  MCP endpoint: POST/GET/DELETE http://0.0.0.0:${port}/mcp (also at /)`);
    console.log(`  Health check: GET http://0.0.0.0:${port}/health`);
    console.log(`  OAuth metadata: GET ${BASE_URL}/.well-known/oauth-authorization-server`);
    console.log(`  API key auth: ${isApiKeyAuthEnabled() ? 'ENABLED' : 'DISABLED'}`);
    console.log(`  Base URL: ${BASE_URL}`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n[ERROR] Port ${port} is already in use.`);
      console.error(`  Try: --port <other-port>  or  kill the process using port ${port}`);
      console.error(`  Find it: lsof -i :${port}\n`);
    } else {
      console.error(`\n[ERROR] Server failed to start:`, err.message);
    }
    process.exit(1);
  });
}
