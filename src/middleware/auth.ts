/**
 * Middleware de autenticação por API Key
 *
 * Valida o header X-API-Key contra:
 * 1. PostgreSQL via Prisma (se DATABASE_URL configurado)
 * 2. Variáveis de ambiente MCP_API_KEYS (fallback)
 */

import type { Request, Response, NextFunction } from 'express';
import { getPrisma, isDatabaseConfigured } from '../db/prisma.js';

export interface ApiKeyInfo {
  key: string;
  tier: 'free' | 'pro' | 'enterprise';
  permissions: 'read' | 'readwrite';
  userId?: string;
}

/**
 * Carrega API keys das variáveis de ambiente.
 *
 * Formato: MCP_API_KEYS=key1:pro:readwrite,key2:enterprise:read,key3:free
 * Tier default: free. Permissions default: readwrite (backwards compat).
 */
function loadApiKeys(): Map<string, ApiKeyInfo> {
  const keys = new Map<string, ApiKeyInfo>();
  const raw = process.env.MCP_API_KEYS || '';

  for (const entry of raw.split(',')) {
    const trimmed = entry.trim();
    if (!trimmed) continue;

    const parts = trimmed.split(':');
    const key = parts[0];
    const tier = (parts[1] as ApiKeyInfo['tier']) || 'free';
    const permissions = (parts[2] as ApiKeyInfo['permissions']) || 'readwrite';

    if (key) {
      keys.set(key, { key, tier, permissions });
    }
  }

  return keys;
}

/**
 * Busca API key no Prisma (PostgreSQL).
 */
async function lookupKeyFromDatabase(apiKey: string): Promise<ApiKeyInfo | null> {
  if (!isDatabaseConfigured()) return null;

  try {
    const prisma = getPrisma();
    const record = await prisma.apiKey.findUnique({
      where: { key: apiKey, isActive: true },
    });

    if (!record) return null;

    return {
      key: record.key,
      tier: record.tier as ApiKeyInfo['tier'],
      permissions: record.permissions as ApiKeyInfo['permissions'],
      userId: record.userId,
    };
  } catch (err) {
    console.error('[auth] Database lookup failed, falling back to env vars:', err);
    return null;
  }
}

/**
 * Retorna true se autenticação por API key está habilitada.
 */
export function isApiKeyAuthEnabled(): boolean {
  return process.env.MCP_REQUIRE_API_KEY === 'true';
}

/**
 * Middleware Express para validação de API key.
 */
export function apiKeyAuth() {
  const envKeys = loadApiKeys();

  return (req: Request, res: Response, next: NextFunction): void => {
    // Se auth não está habilitada, passa direto
    if (!isApiKeyAuthEnabled()) {
      (req as Request & { apiKeyInfo?: ApiKeyInfo }).apiKeyInfo = {
        key: 'anonymous',
        tier: 'free',
        permissions: 'readwrite',
      };
      next();
      return;
    }

    // Bearer token present — skip API key check (validated in extractAuthContext)
    const authHeader = req.headers['authorization'] as string | undefined;
    if (authHeader?.startsWith('Bearer ')) {
      (req as Request & { apiKeyInfo?: ApiKeyInfo }).apiKeyInfo = {
        key: 'oauth-bearer',
        tier: 'pro',
        permissions: 'readwrite',
      };
      next();
      return;
    }

    const apiKey = req.headers['x-api-key'] as string | undefined;

    if (!apiKey) {
      res.status(401).json({
        error: 'API key required',
        message: 'Include X-API-Key or Authorization: Bearer header in your request',
      });
      return;
    }

    // Try env vars first (sync, fast)
    const envKeyInfo = envKeys.get(apiKey);
    if (envKeyInfo) {
      (req as Request & { apiKeyInfo?: ApiKeyInfo }).apiKeyInfo = envKeyInfo;
      next();
      return;
    }

    // Try database (async)
    lookupKeyFromDatabase(apiKey)
      .then((dbKeyInfo) => {
        if (dbKeyInfo) {
          (req as Request & { apiKeyInfo?: ApiKeyInfo }).apiKeyInfo = dbKeyInfo;
          next();
        } else {
          res.status(403).json({
            error: 'Invalid API key',
            message: 'The provided API key is not valid',
          });
        }
      })
      .catch(() => {
        res.status(500).json({
          error: 'Auth error',
          message: 'Failed to validate API key',
        });
      });
  };
}

/**
 * Extrai ApiKeyInfo do request (setado pelo middleware).
 */
export function getApiKeyInfo(req: Request): ApiKeyInfo | undefined {
  return (req as Request & { apiKeyInfo?: ApiKeyInfo }).apiKeyInfo;
}
