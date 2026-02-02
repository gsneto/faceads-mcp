#!/usr/bin/env node

/**
 * MCP Server para Facebook Marketing API
 *
 * Duas camadas de funcionalidade:
 * 1. Camada de Consulta (read-only): Busca e navegação na documentação
 * 2. Camada de Execução (operacional): Tools que executam ações na API da Meta
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { docsTools, handleDocsTool, isDocsTool } from './docs-tools.js';
import { apiTools, handleApiTool, isApiTool } from './api-tools.js';
import { MetaClientError } from './meta-client.js';
import { registerResourceHandlers } from './resources.js';
import { registerPromptHandlers } from './prompts.js';

// Informações do pacote
const packageInfo = {
  name: 'fb-marketing-mcp',
  version: '1.0.0',
};

async function main() {
  // Criar servidor MCP
  const server = new Server(
    {
      name: packageInfo.name,
      version: packageInfo.version,
    },
    {
      capabilities: {
        resources: {},
        tools: {},
        prompts: {},
      },
    }
  );

  // Registrar handlers de resources e prompts
  registerResourceHandlers(server);
  registerPromptHandlers(server);

  // Registrar handler para listar todas as tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [...docsTools, ...apiTools],
    };
  });

  // Registrar handler para executar tools
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    // Log para debug (vai para stderr, não interfere no protocolo)
    console.error(`[MCP] Executando tool: ${name}`);
    console.error(`[MCP] Args: ${JSON.stringify(args)}`);

    try {
      let result;

      // Verificar se é uma tool de documentação
      if (isDocsTool(name)) {
        result = await handleDocsTool(name, args || {});
      }
      // Verificar se é uma tool de API
      else if (isApiTool(name)) {
        result = await handleApiTool(name, args || {});
      }
      // Tool não encontrada
      else {
        result = {
          content: [
            {
              type: 'text' as const,
              text: `Tool não encontrada: ${name}`,
            },
          ],
          isError: true,
        };
      }

      // Log do resultado
      console.error(`[MCP] Resultado (isError: ${result.isError || false}): ${result.content[0]?.text?.substring(0, 200)}...`);
      
      return result;
    } catch (error) {
      // Log do erro para debug
      console.error(`[MCP] ERRO CAPTURADO:`, error);

      let errorText: string;

      // Verifica se é um erro específico da API Meta
      if (error instanceof MetaClientError) {
        errorText = `# Erro da API Meta

**Código:** ${error.code}
**Tipo:** ${error.type}
**Mensagem:** ${error.message}
${error.errorSubcode ? `**Subcódigo:** ${error.errorSubcode}` : ''}
${error.errorUserTitle ? `\n**${error.errorUserTitle}**` : ''}
${error.errorUserMsg ? `${error.errorUserMsg}` : ''}
${error.errorData ? `**Dados:** ${error.errorData}` : ''}
${error.fbtraceId ? `\n**FB Trace ID:** ${error.fbtraceId}` : ''}

Consulte a documentação de erros com \`get_error_code_info\` para mais detalhes.`;
      } else if (error instanceof Error) {
        errorText = `# Erro não tratado na execução da tool "${name}"\n\n**Tipo:** ${error.name}\n**Mensagem:** ${error.message}\n\n\`\`\`\n${error.stack || 'N/A'}\n\`\`\``;
      } else {
        errorText = `# Erro desconhecido\n\n\`\`\`json\n${JSON.stringify(error, null, 2)}\n\`\`\``;
      }
      
      return {
        content: [
          {
            type: 'text' as const,
            text: errorText,
          },
        ],
        isError: true,
      };
    }
  });

  // Conectar via stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log para debug (vai para stderr, não interfere no protocolo)
  console.error(`${packageInfo.name} v${packageInfo.version} iniciado`);
}

main().catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
