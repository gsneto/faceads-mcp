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

  // ── Middleware global ──
  app.use(express.json());

  // CORS para clientes web
  app.use((_req: Request, res: Response, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-Meta-Access-Token, X-Meta-Ad-Account-Id, Mcp-Session-Id');
    res.header('Access-Control-Expose-Headers', 'Mcp-Session-Id');
    if (_req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  // Usage logging
  app.use(usageLogger());

  // API key auth
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

  // ── Health check ──
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'fb-marketing-mcp',
      timestamp: new Date().toISOString(),
      apiKeyAuthEnabled: isApiKeyAuthEnabled(),
      activeSessions: sessions.size,
    });
  });

  // ── Mapa de sessões (stateful transport) ──
  const sessions = new Map<string, { transport: StreamableHTTPServerTransport; server: Server }>();

  /**
   * Extrai auth context dos headers HTTP.
   */
  function extractAuthContext(req: Request): AuthContext | null {
    const accessToken = req.headers['x-meta-access-token'] as string | undefined;
    const adAccountId = req.headers['x-meta-ad-account-id'] as string | undefined;

    if (!accessToken || !adAccountId) {
      return null;
    }

    return {
      accessToken,
      adAccountId: adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`,
      apiVersion: (req.headers['x-meta-api-version'] as string) || undefined,
    };
  }

  /**
   * Wraps handler com auth context se disponível.
   */
  function withOptionalAuth<T>(req: Request, fn: () => T): T {
    const authCtx = extractAuthContext(req);
    if (authCtx) {
      return withAuthContext(authCtx, fn);
    }
    return fn();
  }

  // ── MCP endpoint (POST) ──
  app.post('/mcp', async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    // Sessão existente — reutilizar transport
    if (sessionId && sessions.has(sessionId)) {
      const session = sessions.get(sessionId)!;
      await withOptionalAuth(req, () => session.transport.handleRequest(req, res, req.body));
      return;
    }

    // Nova sessão — deve ser um initialize request
    if (!sessionId && isInitializeRequest(req.body)) {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId) => {
          // Guardar sessão assim que o session ID é gerado (antes do await resolver)
          sessions.set(newSessionId, { transport, server });
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

      const server = createServer();
      await server.connect(transport);
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
  });

  // ── MCP endpoint (GET para SSE) ──
  app.get('/mcp', async (req: Request, res: Response) => {
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
  });

  // ── MCP endpoint (DELETE para encerrar sessão) ──
  app.delete('/mcp', async (req: Request, res: Response) => {
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
  });

  // ── Start server ──
  app.listen(port, '0.0.0.0', () => {
    console.log(`fb-marketing-mcp HTTP server listening on http://0.0.0.0:${port}`);
    console.log(`  MCP endpoint: POST/GET/DELETE http://0.0.0.0:${port}/mcp`);
    console.log(`  Health check: GET http://0.0.0.0:${port}/health`);
    console.log(`  API key auth: ${isApiKeyAuthEnabled() ? 'ENABLED' : 'DISABLED'}`);
  });
}
