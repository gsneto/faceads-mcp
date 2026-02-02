/**
 * Configuração e validação de variáveis de ambiente
 * para a camada de execução (API Meta)
 */

export interface MetaConfig {
  accessToken: string;
  adAccountId: string;
  apiVersion: string;
}

/**
 * Obtém a configuração da API Meta das variáveis de ambiente
 *
 * Variáveis obrigatórias:
 * - META_ACCESS_TOKEN: Token de acesso da API
 * - META_AD_ACCOUNT_ID: ID da conta de anúncios (ex: act_123456 ou 123456)
 *
 * Variáveis opcionais:
 * - META_API_VERSION: Versão da API (default: v24.0)
 */
export function getMetaConfig(): MetaConfig | null {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const adAccountId = process.env.META_AD_ACCOUNT_ID;

  if (!accessToken || !adAccountId) {
    return null;
  }

  return {
    accessToken,
    adAccountId: adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`,
    apiVersion: process.env.META_API_VERSION || 'v24.0',
  };
}

/**
 * Verifica se a API Meta está configurada
 */
export function isMetaConfigured(): boolean {
  return getMetaConfig() !== null;
}

/**
 * Retorna mensagem de erro para quando a API não está configurada
 */
export function getConfigurationError(): string {
  return `A API da Meta não está configurada. Configure as seguintes variáveis de ambiente:
  
- META_ACCESS_TOKEN: Token de acesso da API (obrigatório)
- META_AD_ACCOUNT_ID: ID da conta de anúncios, ex: act_123456 (obrigatório)
- META_API_VERSION: Versão da API (opcional, default: v24.0)

Exemplo de configuração no MCP:
{
  "mcpServers": {
    "fb-marketing-mcp": {
      "command": "npx",
      "args": ["-y", "fb-marketing-mcp"],
      "env": {
        "META_ACCESS_TOKEN": "seu_token_aqui",
        "META_AD_ACCOUNT_ID": "act_123456789"
      }
    }
  }
}`;
}
