/**
 * Admin API Routes
 *
 * CRUD endpoints for managing users, API keys, and Meta tokens.
 * Protected by MCP_ADMIN_KEY header.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { getPrisma } from '../db/prisma.js';
import { encryptToken, decryptToken } from '../db/crypto.js';

const router = Router();

// ── Admin auth middleware ──
router.use((req: Request, res: Response, next) => {
  const adminKey = process.env.MCP_ADMIN_KEY;
  if (!adminKey) {
    res.status(503).json({
      error: 'Admin API not configured',
      message: 'Set MCP_ADMIN_KEY environment variable to enable admin routes',
    });
    return;
  }

  const provided = req.headers['x-admin-key'] as string | undefined;
  if (provided !== adminKey) {
    res.status(403).json({
      error: 'Invalid admin key',
      message: 'Include a valid X-Admin-Key header',
    });
    return;
  }

  next();
});

// ── Users ──

// POST /admin/users — Create user
router.post('/users', async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    if (!email) {
      res.status(400).json({ error: 'email is required' });
      return;
    }

    const prisma = getPrisma();
    const user = await prisma.user.create({
      data: { email, name },
    });

    res.status(201).json(user);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to create user', message });
  }
});

// GET /admin/users — List users
router.get('/users', async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const users = await prisma.user.findMany({
      include: { apiKeys: { where: { isActive: true } }, metaTokens: true },
      orderBy: { createdAt: 'desc' },
    });

    // Strip encrypted tokens from response
    const safe = users.map((u) => ({
      ...u,
      metaTokens: u.metaTokens.map((t) => ({
        ...t,
        accessToken: '***encrypted***',
      })),
    }));

    res.json(safe);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to list users', message });
  }
});

// ── API Keys ──

// POST /admin/api-keys — Create API key
router.post('/api-keys', async (req: Request, res: Response) => {
  try {
    const { userId, tier, permissions, description } = req.body;
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    const prisma = getPrisma();
    const apiKey = await prisma.apiKey.create({
      data: {
        userId,
        tier: tier || 'free',
        permissions: permissions || 'read',
        description,
      },
    });

    res.status(201).json(apiKey);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to create API key', message });
  }
});

// GET /admin/api-keys — List API keys
router.get('/api-keys', async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const keys = await prisma.apiKey.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(keys);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to list API keys', message });
  }
});

// DELETE /admin/api-keys/:key — Deactivate API key (soft delete)
router.delete('/api-keys/:key', async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const apiKey = await prisma.apiKey.update({
      where: { key: req.params.key as string },
      data: { isActive: false },
    });

    res.json({ message: 'API key deactivated', key: apiKey.key });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to deactivate API key', message });
  }
});

// ── Meta Tokens ──

// POST /admin/meta-tokens — Store encrypted Meta token
router.post('/meta-tokens', async (req: Request, res: Response) => {
  try {
    const { userId, accessToken, adAccountId, tokenType, scopes, metaUserId, expiresAt } = req.body;
    if (!userId || !accessToken || !adAccountId) {
      res.status(400).json({ error: 'userId, accessToken, and adAccountId are required' });
      return;
    }

    const prisma = getPrisma();
    const token = await prisma.metaToken.create({
      data: {
        userId,
        accessToken: encryptToken(accessToken),
        adAccountId: adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`,
        tokenType: tokenType || 'user',
        scopes,
        metaUserId,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      },
    });

    res.status(201).json({
      ...token,
      accessToken: '***encrypted***',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to store Meta token', message });
  }
});

// GET /admin/meta-tokens/:userId — List Meta tokens for user
router.get('/meta-tokens/:userId', async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const tokens = await prisma.metaToken.findMany({
      where: { userId: req.params.userId as string },
      orderBy: { createdAt: 'desc' },
    });

    res.json(
      tokens.map((t) => ({
        ...t,
        accessToken: '***encrypted***',
      }))
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to list Meta tokens', message });
  }
});

export { router as adminRouter };
