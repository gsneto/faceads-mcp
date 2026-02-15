/**
 * Middleware de autenticação por API Key
 *
 * Valida o header X-API-Key contra uma lista de keys autorizadas.
 * Keys são carregadas de variáveis de ambiente.
 */

import type { Request, Response, NextFunction } from 'express';

export interface ApiKeyInfo {
  key: string;
  tier: 'free' | 'pro' | 'enterprise';
}

/**
 * Carrega API keys das variáveis de ambiente.
 *
 * Formato: MCP_API_KEYS=key1:pro,key2:enterprise,key3:free
 * Se MCP_REQUIRE_API_KEY não for "true", auth é desabilitada.
 */
function loadApiKeys(): Map<string, ApiKeyInfo> {
  const keys = new Map<string, ApiKeyInfo>();
  const raw = process.env.MCP_API_KEYS || '';

  for (const entry of raw.split(',')) {
    const trimmed = entry.trim();
    if (!trimmed) continue;

    const [key, tier] = trimmed.split(':');
    if (key) {
      keys.set(key, {
        key,
        tier: (tier as ApiKeyInfo['tier']) || 'free',
      });
    }
  }

  return keys;
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
  const apiKeys = loadApiKeys();

  return (req: Request, res: Response, next: NextFunction): void => {
    // Se auth não está habilitada, passa direto
    if (!isApiKeyAuthEnabled()) {
      (req as Request & { apiKeyInfo?: ApiKeyInfo }).apiKeyInfo = { key: 'anonymous', tier: 'free' };
      next();
      return;
    }

    const apiKey = req.headers['x-api-key'] as string | undefined;

    if (!apiKey) {
      res.status(401).json({
        error: 'API key required',
        message: 'Include X-API-Key header in your request',
      });
      return;
    }

    const keyInfo = apiKeys.get(apiKey);
    if (!keyInfo) {
      res.status(403).json({
        error: 'Invalid API key',
        message: 'The provided API key is not valid',
      });
      return;
    }

    // Attach key info ao request
    (req as Request & { apiKeyInfo?: ApiKeyInfo }).apiKeyInfo = keyInfo;
    next();
  };
}

/**
 * Extrai ApiKeyInfo do request (setado pelo middleware).
 */
export function getApiKeyInfo(req: Request): ApiKeyInfo | undefined {
  return (req as Request & { apiKeyInfo?: ApiKeyInfo }).apiKeyInfo;
}
