/**
 * HTTP Server Transport para MCP
 *
 * Expõe o MCP server via Streamable HTTP transport (POST /mcp, GET /mcp, DELETE /mcp).
 * Auth: OAuth 2.0 Bearer token only. Headers X-Meta-* como override para debug.
 */

import express from 'express';
import type { Request, Response } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { randomUUID } from 'node:crypto';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { withAuthContext, type AuthContext } from '../utils/auth-context.js';
import { usageLogger } from '../middleware/usage-logger.js';
import { isDatabaseConfigured, getPrisma } from '../db/prisma.js';
import { decryptToken } from '../db/crypto.js';
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
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-Meta-Access-Token, X-Meta-Ad-Account-Id, Mcp-Session-Id, Authorization');
    res.header('Access-Control-Expose-Headers', 'Mcp-Session-Id');
    if (_req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  // Usage logging
  app.use(usageLogger());

  // ── Public routes ──

  // Favicon (shown in Claude Desktop connector list)
  const FAVICON_SVG = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
<path d="M0 0 C1.9375 1.5 1.9375 1.5 3 3 C3.53625 2.505 4.0725 2.01 4.625 1.5 C7.76313998 -0.48198314 9.34873465 -0.67064058 13 0 C16.13082696 2.73738079 18.79116591 6.0349054 19.23828125 10.2421875 C19.43661741 17.27790197 19.43661741 17.27790197 17.375 20.6875 C15 22 15 22 12.0625 22.1875 C7.88702539 20.56843842 6.04381209 17.91579927 4 14 C4 13.34 4 12.68 4 12 C3.34 12 2.68 12 2 12 C1.773125 12.9075 1.54625 13.815 1.3125 14.75 C-0.22463018 18.55622711 -1.4426017 19.97875096 -5 22 C-8.1875 21.9375 -8.1875 21.9375 -11 21 C-13.70201284 16.94698074 -13.53670457 13.75715415 -13 9 C-10.19639146 1.79072089 -7.9833629 -0.85536031 0 0 Z M8 4 C7.34 5.32 6.68 6.64 6 8 C7.98 10.97 9.96 13.94 12 17 C12.99 16.67 13.98 16.34 15 16 C14.88541307 14.56163249 14.75790884 13.12429034 14.625 11.6875 C14.55539063 10.88699219 14.48578125 10.08648437 14.4140625 9.26171875 C14.10435574 6.72775559 14.10435574 6.72775559 12 4 C10.68 4 9.36 4 8 4 Z M-4 4 C-7.04577607 6.45627102 -7.9400232 7.7324112 -8.8125 11.625 C-9.27261801 14.86821309 -9.27261801 14.86821309 -8 17 C-7.01 17 -6.02 17 -5 17 C-3.48883192 15.38011249 -3.48883192 15.38011249 -2.25 13.25 C-1.80140625 12.55390625 -1.3528125 11.8578125 -0.890625 11.140625 C0.1715336 9.04520218 0.1715336 9.04520218 -0.171875 6.796875 C-0.44515625 6.20390625 -0.7184375 5.6109375 -1 5 C-1.99 4.67 -2.98 4.34 -4 4 Z " fill="#0175EF" transform="translate(13,4)"/>
</svg>
`;

  app.get('/favicon.ico', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=604800');
    res.send(FAVICON_SVG);
  });

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'fb-marketing-mcp',
      timestamp: new Date().toISOString(),
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

  // OAuth routes (register, authorize, token, settings)
  if (isDatabaseConfigured()) {
    app.use('/oauth', oauthRouter);
    console.log('  OAuth 2.0: /oauth/* (database-backed)');
  }

  // Rate limiting (por userId do OAuth ou IP)
  const mcpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    limit: 100,
    keyGenerator: (req: Request) => {
      // Try to extract userId from Bearer token for per-user limiting
      // Falls back to IP if no auth header
      const authHeader = req.headers['authorization'] as string | undefined;
      if (authHeader?.startsWith('Bearer ')) {
        // Use the token itself as key (unique per user session)
        return `bearer:${authHeader.slice(7, 27)}`; // First 20 chars as key
      }
      return `ip:${ipKeyGenerator(req.ip ?? '0.0.0.0')}`;
    },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Rate limit exceeded', message: '100 requests/hour. Try again later.' },
  });
  app.use('/mcp', mcpLimiter);

  // ── Mapa de sessões (stateful transport) ──
  const sessions = new Map<string, { transport: StreamableHTTPServerTransport; server: Server }>();

  /**
   * Extrai auth context dos headers HTTP.
   * Priority: 1) Bearer token → resolve Meta token do DB  2) Headers X-Meta-* override  3) null → 401
   */
  async function extractAuthContext(req: Request): Promise<AuthContext | null> {
    const authHeader = req.headers['authorization'] as string | undefined;

    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const bearerToken = authHeader.slice(7);
    if (!isDatabaseConfigured()) {
      return null;
    }

    try {
      const prisma = getPrisma();
      const oauthToken = await prisma.oAuthAccessToken.findUnique({
        where: { token: bearerToken },
        include: { user: true },
      });

      if (!oauthToken || oauthToken.expiresAt <= new Date()) {
        return null;
      }

      const oauthUserId = oauthToken.userId;
      const permissions = scopeToPermission(oauthToken.scope);

      // Check for X-Meta-* header override (debug)
      const headerAccessToken = req.headers['x-meta-access-token'] as string | undefined;

      if (headerAccessToken) {
        return {
          accessToken: headerAccessToken,
          apiVersion: (req.headers['x-meta-api-version'] as string) || undefined,
          userId: oauthUserId,
          permissions,
        };
      }

      // Resolve Meta token from DB for this user
      const metaToken = await prisma.metaToken.findFirst({
        where: { userId: oauthUserId },
        orderBy: { createdAt: 'desc' },
      });

      return {
        accessToken: metaToken ? decryptToken(metaToken.accessToken) : '',
        userId: oauthUserId,
        permissions,
      };
    } catch (err) {
      console.error('[auth] Bearer token lookup failed:', err);
      return null;
    }
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
    } else {
      // No Bearer token at all → 401
      const resourceMetadataUrl = `${BASE_URL}/.well-known/oauth-protected-resource`;
      res.setHeader('WWW-Authenticate', `Bearer resource_metadata="${resourceMetadataUrl}"`);
      res.status(401).json({ error: 'unauthorized', error_description: 'Authorization: Bearer token required' });
      return;
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
    console.log(`  Auth: OAuth 2.0 Bearer token only`);
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
