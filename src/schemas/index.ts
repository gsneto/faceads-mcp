/**
 * Schemas Zod - Index
 *
 * Centraliza exports de schemas e utilitários para validação
 */

import { z } from 'zod';

// Re-export schemas
export * from './docs-schemas.js';
export * from './api-schemas.js';

// Re-export Zod
export { z };

/**
 * Resultado de validação
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Valida argumentos com um schema Zod
 */
export function validateArgs<T>(
  schema: z.ZodType<T>,
  args: unknown
): ValidationResult<T> {
  const result = schema.safeParse(args);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Formatar erros do Zod
  const messages = result.error.issues.map((issue) => {
    const path = issue.path.join('.');
    return path ? `${path}: ${issue.message}` : issue.message;
  });

  return { success: false, error: `Parâmetros inválidos:\n- ${messages.join('\n- ')}` };
}

/**
 * Formata erro de validação para resposta MCP
 */
export function formatValidationError(error: string): {
  content: Array<{ type: 'text'; text: string }>;
} {
  return {
    content: [
      {
        type: 'text',
        text: `# Erro de Validação\n\n${error}`,
      },
    ],
  };
}
