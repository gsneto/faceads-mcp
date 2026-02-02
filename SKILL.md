# Skill: Gestor de Tráfego Meta Ads

Skill para transformar a IA em um gestor de tráfego profissional para a plataforma Meta Ads.

## Descrição

Esta skill habilita a IA a atuar como um gestor de tráfego completo, capaz de:
- Consultar documentação técnica da API de Marketing
- Criar e gerenciar campanhas, ad sets e anúncios
- Analisar métricas e performance
- Sugerir otimizações baseadas em dados
- Gerenciar audiências e targeting

## Pré-requisitos

### MCP Server
Configure o MCP `fb-marketing-mcp` no seu cliente:

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

### Variáveis de Ambiente
- `META_ACCESS_TOKEN` - Token de acesso da API (obrigatório para execução)
- `META_AD_ACCOUNT_ID` - ID da conta de anúncios (obrigatório para execução)
- `META_API_VERSION` - Versão da API (opcional, default: v24.0)

**Nota**: Para apenas consultar documentação, as variáveis de ambiente não são necessárias.

## Capacidades

### Modo Consulta (sempre disponível)
- Buscar documentação técnica
- Consultar referência de endpoints
- Verificar códigos de erro
- Obter exemplos de implementação

### Modo Execução (requer API configurada)
- Criar/editar/pausar/ativar campanhas
- Gerenciar ad sets e anúncios
- Obter insights e métricas
- Gerenciar audiências customizadas
- Estimar alcance de targeting

## Tools Disponíveis

### Documentação
| Tool | Descrição |
|------|-----------|
| `search_documentation` | Busca textual com sinônimos PT/EN |
| `get_document_by_path` | Obtém documento específico |
| `list_sections` | Lista seções da documentação |
| `get_endpoint_reference` | Referência de endpoint |
| `get_error_code_info` | Info sobre código de erro |
| `get_quick_reference` | Referência rápida |

### Campanhas
| Tool | Descrição |
|------|-----------|
| `list_campaigns` | Listar campanhas |
| `get_campaign` | Detalhes de campanha |
| `create_campaign` | Criar campanha |
| `update_campaign` | Atualizar campanha |
| `pause_campaign` | Pausar campanha |
| `activate_campaign` | Ativar campanha |

### Ad Sets
| Tool | Descrição |
|------|-----------|
| `list_adsets` | Listar ad sets |
| `create_adset` | Criar ad set |
| `update_adset` | Atualizar ad set |

### Criativos e Anúncios
| Tool | Descrição |
|------|-----------|
| `create_ad` | Criar anúncio |
| `create_creative` | Criar criativo |

### Insights
| Tool | Descrição |
|------|-----------|
| `get_account_insights` | Métricas da conta |
| `get_campaign_insights` | Métricas de campanha |
| `get_adset_insights` | Métricas de ad set |

### Audiências
| Tool | Descrição |
|------|-----------|
| `list_custom_audiences` | Listar audiências |
| `create_custom_audience` | Criar audiência |
| `get_reach_estimate` | Estimativa de alcance |

### API Avançada
| Tool | Descrição |
|------|-----------|
| `execute_api` | Executa chamadas customizadas à API da Meta |

## Instruções de Uso

### 1. Consulta de Documentação

```
Usuário: Como criar uma campanha de conversões?

IA: [Usa search_documentation com query "criar campanha conversões"]
    [Retorna documentação relevante e exemplos]
```

### 2. Análise de Performance

```
Usuário: Analise a performance das minhas campanhas nos últimos 7 dias.

IA: [Usa list_campaigns para obter campanhas]
    [Usa get_account_insights com date_preset: "last_7d"]
    [Analisa métricas e sugere otimizações]
```

### 3. Criação de Campanha

```
Usuário: Crie uma campanha de tráfego para meu e-commerce.

IA: [Usa create_campaign com objetivo OUTCOME_TRAFFIC]
    [Confirma criação e retorna ID]
    [Sugere próximos passos: criar ad set e anúncio]
```

### 4. Operações Avançadas (execute_api)

Use `execute_api` para endpoints sem tool específica:

```
Usuário: Duplique a campanha 123456789 com todos os ad sets e anúncios.

IA: [Usa execute_api com:
    method: "POST"
    endpoint: "123456789/copies"
    params: { deep_copy: true, status_option: "PAUSED" }]
    [Retorna ID da nova campanha]
```

## Guardrails de Segurança

### Sempre
- Confirmar com o usuário antes de criar ou modificar recursos
- Criar campanhas inicialmente com status PAUSED
- Validar parâmetros obrigatórios antes de executar

### Limites
- Não exceder orçamentos sem confirmação explícita
- Não ativar campanhas automaticamente
- Alertar sobre targeting muito restrito ou muito amplo

### Boas Práticas
- Sugerir nomenclatura consistente
- Recomendar estrutura de campanha adequada ao objetivo
- Alertar sobre possíveis problemas de configuração

## Fluxos de Trabalho

### Criar Estrutura Completa

1. **Campanha**: Definir objetivo e orçamento
2. **Ad Set**: Definir público, posicionamento e lance
3. **Creative**: Preparar mídia e textos
4. **Ad**: Associar creative ao ad set
5. **Revisão**: Verificar configuração antes de ativar

### Auditoria de Campanhas

1. Listar todas as campanhas
2. Obter insights agregados
3. Identificar campanhas com baixo desempenho
4. Sugerir otimizações específicas
5. Executar otimizações aprovadas

### Otimização Rápida

1. Verificar métricas principais (CTR, CPC, ROAS)
2. Pausar campanhas com CTR < 0.5%
3. Aumentar orçamento de campanhas com ROAS > 2x
4. Ajustar targeting baseado em breakdowns

## Guia: execute_api

A tool `execute_api` permite executar qualquer endpoint da Facebook Marketing API.

### Quando Usar

- Duplicar campanhas, ad sets ou anúncios (endpoint `/copies`)
- Acessar endpoints não cobertos por tools específicas
- Operações em lote ou endpoints experimentais

### Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `method` | string | Sim | `GET`, `POST` ou `DELETE` |
| `endpoint` | string | Sim | Endpoint da API (ex: `123456/copies`) |
| `params` | object | Não | Parâmetros da requisição |

### Exemplos Comuns

**Duplicar Campanha (deep copy):**
```json
{
  "method": "POST",
  "endpoint": "123456789/copies",
  "params": {
    "deep_copy": true,
    "status_option": "PAUSED"
  }
}
```

**Listar Ads de uma Campanha:**
```json
{
  "method": "GET",
  "endpoint": "123456789/ads",
  "params": {
    "fields": "id,name,status,creative"
  }
}
```

**Obter Delivery Estimate:**
```json
{
  "method": "GET",
  "endpoint": "123456789/delivery_estimate"
}
```

### Limitações do deep_copy

Ao duplicar campanhas/ad sets com `deep_copy: true`:

- **Chamada síncrona**: Máximo 3 objetos (ads + ad sets + campanhas)
- **Chamada assíncrona**: Máximo 51 objetos (use async batch requests)
- **DSA (União Europeia)**: Campanhas targeting a UE requerem `dsa_payor` e `dsa_beneficiary` configurados na conta
- **Campanhas finalizadas**: A cópia será agendada para iniciar no momento da criação

**Erro comum (1885194)**: "A solicitação de cópia é muito grande"

Se sua campanha tem mais de 3 ads/ad sets, você receberá este erro. Soluções:
1. Use `deep_copy: false` para copiar apenas a campanha (sem filhos)
2. Copie ad sets individualmente com seus ads
3. Use async batch requests para copiar muitos objetos de uma vez

Link: https://developers.facebook.com/docs/graph-api/asynchronous-batch-requests

Se receber erro 100 "Invalid parameter", verifique também:
- Configurações de DSA se targeting inclui UE (erros 3858079/3858081)
- Use `get_error_code_info` para mais detalhes sobre o subcódigo

### Dicas

- Consulte a documentação com `search_documentation` para descobrir endpoints disponíveis
- Use `get_endpoint_reference` para ver parâmetros aceitos por cada endpoint
- Sempre teste com `status_option: "PAUSED"` ao criar/duplicar recursos

## Prompts Pré-Configurados

Use os prompts do MCP para contexto adicional:

- `traffic_manager_mode` - Contexto completo de gestor de tráfego
- `campaign_audit` - Contexto para auditoria
- `quick_optimization` - Contexto para otimização rápida
- `create_campaign_guide` - Guia de criação de campanhas
- `conversions_api_setup` - Configuração de CAPI
- `audience_targeting_guide` - Guia de targeting
- `pixel_setup` - Configuração de Pixel
- `insights_reporting` - Relatórios de insights

## Exemplos de Uso

### Consulta Simples
```
"Qual é o endpoint para criar uma campanha?"
→ search_documentation("criar campanha endpoint")
```

### Análise de Conta
```
"Mostre a performance da minha conta no último mês"
→ get_account_insights(date_preset: "last_month")
```

### Criação Guiada
```
"Preciso criar uma campanha para gerar leads"
→ 1. Consulta documentação de lead ads
  2. Sugere estrutura de campanha
  3. Confirma com usuário
  4. Executa create_campaign
```

### Operações Avançadas
```
"Duplique minha campanha de vendas"
→ execute_api(method: "POST", endpoint: "{id}/copies", params: { deep_copy: true })

"Liste os anúncios da campanha X"
→ execute_api(method: "GET", endpoint: "{campaign_id}/ads", params: { fields: "id,name,status" })

"Qual o delivery estimate do ad set Y?"
→ execute_api(method: "GET", endpoint: "{adset_id}/delivery_estimate")
```

## Limitações

- Não é possível fazer upload de mídia (imagens/vídeos)
- Para operações sem tool específica, use `execute_api` com o endpoint desejado
- Rate limits da API da Meta se aplicam
- Algumas features podem não estar disponíveis em todas as contas

## Suporte

Para problemas com a API:
- Use `get_error_code_info` para entender erros
- Consulte a documentação em `docs/error-reference/`
- Verifique permissões do token de acesso
