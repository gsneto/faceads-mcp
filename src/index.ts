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

    // Verificar se é uma tool de documentação
    if (isDocsTool(name)) {
      return handleDocsTool(name, args || {});
    }

    // Verificar se é uma tool de API
    if (isApiTool(name)) {
      return handleApiTool(name, args || {});
    }

    // Tool não encontrada
    return {
      content: [
        {
          type: 'text' as const,
          text: `Tool não encontrada: ${name}`,
        },
      ],
    };
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
