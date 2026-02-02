# FB Marketing MCP

MCP Server para Facebook Marketing API - Documentação e Execução.

## Visão Geral

Este MCP (Model Context Protocol) permite que IAs:

1. **Consultem documentação** da Facebook Marketing API (713+ arquivos)
2. **Executem operações** na plataforma Meta Ads (campanhas, insights, audiências)

## Instalação

### Via npx (recomendado)

```json
{
  "mcpServers": {
    "fb-marketing-mcp": {
      "command": "npx",
      "args": ["-y", "fb-marketing-mcp"]
    }
  }
}
```

### Com execução habilitada

```json
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
}
```

## Variáveis de Ambiente

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `META_ACCESS_TOKEN` | Para execução | Token de acesso da API |
| `META_AD_ACCOUNT_ID` | Para execução | ID da conta de anúncios (act_XXXXX) |
| `META_API_VERSION` | Não | Versão da API (default: v24.0) |

> **Nota**: As variáveis de ambiente são necessárias apenas para as tools de execução. A consulta de documentação funciona sem configuração.

## Funcionalidades

### Tools de Consulta (sempre disponíveis)

| Tool | Descrição |
|------|-----------|
| `search_documentation` | Busca textual com sinônimos PT/EN |
| `get_document_by_path` | Obtém documento específico |
| `list_sections` | Lista seções da documentação |
| `get_endpoint_reference` | Referência de endpoint |
| `get_error_code_info` | Info sobre código de erro |
| `get_quick_reference` | Referência rápida |

### Tools de Execução (requerem API key)

#### Campanhas
- `list_campaigns`, `get_campaign`, `create_campaign`, `update_campaign`
- `pause_campaign`, `activate_campaign`

#### Ad Sets
- `list_adsets`, `create_adset`, `update_adset`

#### Anúncios e Criativos
- `create_ad`, `create_creative`

#### Insights
- `get_account_insights`, `get_campaign_insights`, `get_adset_insights`

#### Audiências
- `list_custom_audiences`, `create_custom_audience`, `get_reach_estimate`

### Prompts Pré-configurados

| Prompt | Descrição |
|--------|-----------|
| `traffic_manager_mode` | Modo gestor de tráfego completo |
| `campaign_audit` | Auditoria de campanhas |
| `quick_optimization` | Otimização rápida |
| `create_campaign_guide` | Guia de criação de campanhas |
| `conversions_api_setup` | Configuração de CAPI |
| `audience_targeting_guide` | Guia de targeting |
| `pixel_setup` | Configuração de Pixel |
| `insights_reporting` | Relatórios de insights |

### Resources

Documentação disponível via URI scheme:

```
fb-marketing-docs://docs/{path}
```

Exemplo: `fb-marketing-docs://docs/insights/error-codes.md`

## Uso

### Consulta de documentação

```
Usuário: Como criar uma campanha de conversões?
IA: [Usa search_documentation] → Retorna documentação relevante
```

### Análise de performance

```
Usuário: Analise minhas campanhas dos últimos 7 dias
IA: [Usa get_account_insights com date_preset: "last_7d"]
```

### Criação de campanha

```
Usuário: Crie uma campanha de tráfego
IA: [Usa create_campaign com objective: "OUTCOME_TRAFFIC"]
```

## Desenvolvimento

### Build

```bash
npm install
npm run build
```

### Executar localmente

```bash
npm start
```

### Scripts de scraping (manutenção)

```bash
npm run scrape          # Scraping completo
npm run scrape:resume   # Retomar scraping
npm run retry-errors    # Retry de erros
npm run discover        # Descobrir URLs
```

## Estrutura do Projeto

```
├── src/
│   ├── index.ts          # Entry point
│   ├── docs-tools.ts     # Tools de documentação
│   ├── api-tools.ts      # Tools de execução
│   ├── meta-client.ts    # Cliente da API Meta
│   ├── resources.ts      # Resources (URI)
│   ├── prompts.ts        # Prompts pré-configurados
│   └── utils/
│       ├── config.ts     # Configuração
│       ├── fileLoader.ts # Carregamento de arquivos
│       └── search.ts     # Sistema de busca
├── docs/                 # 713+ arquivos de documentação
├── scripts/              # Scripts de scraping
└── SKILL.md              # Skill para ClawdBots
```

## Documentação Incluída

A pasta `docs/` contém 713+ arquivos de documentação:

- **insights/** - API de Insights e métricas
- **audiences/** - Audiências e targeting
- **conversions-api/** - Conversions API (CAPI)
- **catalog/** - Catálogo de produtos
- **get-started/** - Primeiros passos
- **guides/** - Guias de recursos
- **reference/** - Referência técnica completa

## Skill para ClawdBots

O arquivo `SKILL.md` contém instruções para usar este MCP como um "gestor de tráfego" em plataformas como ClawdBots.

## Licença

MIT
