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
- **NUNCA inventar IDs de conta** - sempre usar `META_AD_ACCOUNT_ID` configurado no ambiente
- **Descobrir o ID da conta real** antes de usar `execute_api` com `GET me/adaccounts`

### Parâmetros Obrigatórios (v24.0+)
- **Campanhas sem CBO**: Incluir `is_adset_budget_sharing_enabled` (ver diferença abaixo)
- **Ad Sets**: Incluir `bid_strategy` (ex: `LOWEST_COST_WITHOUT_CAP`)
- **Orçamento mínimo (Brasil)**: R$ 5,33/dia (533 centavos)

### CBO vs ABO (Importante!)

**NÃO confunda** `is_adset_budget_sharing_enabled` com CBO:

| Tipo | Orçamento | Parâmetro |
|------|-----------|-----------|
| **CBO** | Na campanha, Meta distribui | `campaign.daily_budget` |
| **ABO** | Fixo em cada ad set | `adset.daily_budget` + `is_adset_budget_sharing_enabled: false` |
| **ABO + Sharing** | Em cada ad set, com ±20% flexibilidade | `adset.daily_budget` + `is_adset_budget_sharing_enabled: true` |

- Use **CBO** para otimização automática
- Use **ABO sem sharing** para testes A/B com controle exato
- Use **ABO com sharing** para controle com alguma flexibilidade

### Limites
- Não exceder orçamentos sem confirmação explícita
- Não ativar campanhas automaticamente
- Alertar sobre targeting muito restrito ou muito amplo
- Não usar IDs de conta arbitrários - a conta de anúncios é definida pela variável de ambiente

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

### Placeholder de Conta

Use `{ad_account_id}` no endpoint para referenciar a conta configurada em `META_AD_ACCOUNT_ID`:

```json
{
  "method": "POST",
  "endpoint": "{ad_account_id}/adimages",
  "params": { "filename": "/path/to/image.png" }
}
```

**Proteção automática**: Se você passar um `act_XXXX` diferente do configurado, a tool substituirá automaticamente pelo ID correto e exibirá um aviso.

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

## Erros Comuns e Soluções

### Erro: ID da Conta Não Existe (subcódigo 33)

**Causa**: Uso de ID de conta inventado ou de exemplo da documentação.

**Solução**: Sempre descubra o ID real ANTES de usar `execute_api`:
```json
{
  "method": "GET",
  "endpoint": "me/adaccounts",
  "params": { "fields": "id,name,account_status" }
}
```

### Erro: `is_adset_budget_sharing_enabled` Obrigatório (subcódigo 4834011)

**Causa**: Campo obrigatório a partir da v24.0 para campanhas sem CBO.

**Solução**: Adicione ao criar campanhas:
```json
{
  "is_adset_budget_sharing_enabled": false
}
```

### Erro: Bid Strategy Obrigatório (subcódigo 2490487)

**Causa**: Ad sets precisam de estratégia de lance definida.

**Solução**: Adicione `bid_strategy` ao criar ad sets:
```json
{
  "bid_strategy": "LOWEST_COST_WITHOUT_CAP"
}
```

### Erro: Orçamento Muito Baixo (subcódigo 1885272)

**Causa**: Orçamento mínimo varia por país. No Brasil é R$ 5,33/dia.

**Solução**: Use pelo menos 600 centavos (R$ 6,00) para garantir:
```json
{
  "daily_budget": 600
}
```

### Erro: Campo `approximate_count` Não Existe

**Causa**: Campo foi removido de Custom Audiences.

**Solução**: Use campos alternativos:
- `approximate_count_lower_bound`
- `approximate_count_upper_bound`

Ou omita o campo na lista de fields.

### Erro: Instagram ID Depreciado (erro 12)

**Causa**: O ID do Instagram mostrado na UI do Meta Ads (`5610...`) é o formato **antigo**, depreciado na v22.0+.

**Solução**:
1. Descubra o ID novo via API:
```json
GET /{page_id}?fields=instagram_business_account
// Retorna: {"instagram_business_account": {"id": "17841457593597590"}}
```

2. Use `instagram_user_id` **dentro** do `object_story_spec`:
```json
{
  "object_story_spec": {
    "page_id": "123456789",
    "instagram_user_id": "17841457593597590",  // ID novo!
    "link_data": {...}
  }
}
```

**NÃO use**: `instagram_actor_id` (campo errado/depreciado)

## Troubleshooting: Duplicação de Campanhas

### Erros Comuns na Duplicação

| Subcódigo | Problema | Solução |
|-----------|----------|---------|
| `1885194` | Solicitação de cópia muito grande (>3 objetos) | Use async batch ou copie objetos individualmente |
| `2490085` | Crop key `191x100` obsoleto | Recrie o criativo sem `image_crops` ou use apenas `100x100` |
| `3858504` | Criativo com `standard_enhancements` | Recrie o criativo sem aprimoramentos padrão (depreciado na v22.0+) |
| `1885183` | Post criado por app em modo development | O app precisa estar em modo público/produção |

### image_hash vs image_crops

**Conceito importante**: O `image_hash` é reutilizável, mas o `image_crops` pode estar obsoleto.

```json
// ❌ Original (com crop obsoleto):
{
  "image_hash": "65b50b898da88607da98c7ebc6adf615",
  "image_crops": {"191x100": [[0, 94], [1080, 659]]}
}

// ✅ Solução (sem crop, usa padrão automático):
{
  "image_hash": "65b50b898da88607da98c7ebc6adf615"
}
```

**Trade-off**: Ao omitir `image_crops`, a API usa o crop padrão automático. A imagem pode aparecer cortada de forma diferente em alguns posicionamentos, mas funciona.

### Workaround para Criativos Problemáticos

Quando a duplicação falha por criativos incompatíveis:

1. **Obtenha os dados do criativo original** (image_hash, textos, links)
2. **Crie um novo criativo** passando apenas os campos essenciais:
   - `image_hash` (sem `image_crops`)
   - Textos e links
   - Omita `standard_enhancements` e `degrees_of_freedom_spec`
3. **Crie o ad** associando o novo criativo ao ad set

### Placement Asset Customization

Anúncios com regras complexas de customização por posicionamento (feed, stories, reels com crops diferentes) podem falhar na duplicação. 

**Solução simples**: Recrie com um criativo único e deixe a Meta otimizar automaticamente.

## Suporte

Para problemas com a API:
- Use `get_error_code_info` para entender erros
- Consulte a documentação em `docs/error-reference/`
- Verifique permissões do token de acesso
