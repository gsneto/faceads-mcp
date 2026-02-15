/**
 * Middleware de logging de uso para billing e analytics
 *
 * Loga cada request com: timestamp, API key, path, duração, status.
 * Output vai para stdout em formato JSON (estruturado para ingestão futura).
 */

import type { Request, Response, NextFunction } from 'express';
import { getApiKeyInfo } from './auth.js';

export interface UsageLogEntry {
  timestamp: string;
  apiKey: string;
  tier: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  userAgent?: string;
}

/**
 * Middleware Express para logging de uso.
 */
export function usageLogger() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();

    // Hook no finish do response para logar após conclusão
    res.on('finish', () => {
      const keyInfo = getApiKeyInfo(req);
      const entry: UsageLogEntry = {
        timestamp: new Date().toISOString(),
        apiKey: keyInfo?.key ?? 'unknown',
        tier: keyInfo?.tier ?? 'unknown',
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
        userAgent: req.headers['user-agent'],
      };

      // Log estruturado para stdout (pode ser redirecionado para arquivo/serviço)
      console.log(JSON.stringify(entry));
    });

    next();
  };
}
