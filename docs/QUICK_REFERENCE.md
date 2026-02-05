# Referência Rápida - Facebook Marketing API

Guia rápido com os endpoints e exemplos mais comuns para a API de Marketing do Facebook.

## Estrutura de Anúncios

```
Campaign (Campanha)
├── Objetivo de marketing
├── Orçamento (opcional CBO)
└── Ad Set (Conjunto de Anúncios)
    ├── Targeting (público-alvo)
    ├── Posicionamento
    ├── Orçamento e lance
    └── Ad (Anúncio)
        ├── Creative (criativo)
        └── CTA (call-to-action)
```

## Autenticação

### Token de Acesso

```bash
# Variáveis de ambiente necessárias
META_ACCESS_TOKEN=EAAxxxxxxx...
META_AD_ACCOUNT_ID=act_123456789
META_API_VERSION=v24.0
```

### Base URL

```
https://graph.facebook.com/{api_version}/
```

### Descobrir ID da Conta

**SEMPRE** descubra o ID real da conta antes de operações com `execute_api`:

```
GET /me/adaccounts?fields=id,name,account_status
```

Resposta:
```json
{
  "data": [
    {"id": "act_618288566086470", "name": "Minha Conta", "account_status": 1}
  ]
}
```

> **NUNCA** invente ou use IDs de exemplo da documentação. O ID correto está configurado em `META_AD_ACCOUNT_ID` ou pode ser descoberto via `me/adaccounts`.

## Endpoints Principais

### Campanhas

| Operação | Método | Endpoint |
|----------|--------|----------|
| Listar | GET | `/{ad_account_id}/campaigns` |
| Criar | POST | `/{ad_account_id}/campaigns` |
| Ler | GET | `/{campaign_id}` |
| Atualizar | POST | `/{campaign_id}` |
| Deletar | DELETE | `/{campaign_id}` |

**Exemplo - Criar campanha:**
```json
POST /{ad_account_id}/campaigns
{
  "name": "Minha Campanha",
  "objective": "OUTCOME_SALES",
  "status": "PAUSED",
  "special_ad_categories": [],
  "is_adset_budget_sharing_enabled": false
}
```

> **IMPORTANTE (v24.0+)**: O campo `is_adset_budget_sharing_enabled` é **obrigatório** para campanhas sem CBO. Veja a seção "CBO vs ABO" abaixo.

## CBO vs ABO vs Budget Sharing

| Tipo | Descrição | Orçamento em | Parâmetro |
|------|-----------|--------------|-----------|
| **CBO** | Campaign Budget Optimization - Meta distribui orçamento da campanha entre ad sets | Campanha | `campaign.daily_budget` |
| **ABO** | Ad Set Budget Optimization - Cada ad set tem orçamento fixo | Ad Set | `adset.daily_budget` |
| **ABO + Sharing** | ABO com compartilhamento de até 20% entre ad sets | Ad Set (flexível) | `is_adset_budget_sharing_enabled: true` |

```
CBO (orçamento na campanha):
Campaign [daily_budget: 10000]
├── Ad Set A (Meta decide quanto)
├── Ad Set B (Meta decide quanto)
└── Ad Set C (Meta decide quanto)

ABO sem sharing (is_adset_budget_sharing_enabled: false):
Campaign [sem orçamento]
├── Ad Set A [daily_budget: 3000] → gasta exatamente R$ 30
├── Ad Set B [daily_budget: 4000] → gasta exatamente R$ 40
└── Ad Set C [daily_budget: 3000] → gasta exatamente R$ 30

ABO com sharing (is_adset_budget_sharing_enabled: true):
Campaign [sem orçamento]
├── Ad Set A [daily_budget: 3000] → pode gastar R$ 24-36 (±20%)
├── Ad Set B [daily_budget: 4000] → pode gastar R$ 32-48 (±20%)
└── Ad Set C [daily_budget: 3000] → pode gastar R$ 24-36 (±20%)
```

**Quando usar cada um:**
- **CBO**: Quando quer que a Meta otimize a distribuição automaticamente
- **ABO sem sharing**: Quando precisa de controle exato do orçamento por ad set (ex: testes A/B)
- **ABO com sharing**: Quando quer controle por ad set mas com flexibilidade para otimização

### Ad Sets (Conjuntos de Anúncios)

| Operação | Método | Endpoint |
|----------|--------|----------|
| Listar | GET | `/{ad_account_id}/adsets` |
| Criar | POST | `/{ad_account_id}/adsets` |
| Ler | GET | `/{adset_id}` |
| Atualizar | POST | `/{adset_id}` |

**Exemplo - Criar ad set:**
```json
POST /{ad_account_id}/adsets
{
  "name": "Meu Ad Set",
  "campaign_id": "123456789",
  "daily_budget": 600,
  "billing_event": "IMPRESSIONS",
  "optimization_goal": "LINK_CLICKS",
  "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
  "targeting": {
    "geo_locations": {
      "countries": ["BR"]
    },
    "age_min": 18,
    "age_max": 65
  },
  "status": "PAUSED"
}
```

> **IMPORTANTE**:
> - O `bid_strategy` é **obrigatório**. Use `LOWEST_COST_WITHOUT_CAP` para lance automático ou `COST_CAP`/`BID_CAP` com `bid_amount`.
> - Orçamento mínimo varia por país. No Brasil, o mínimo é **R$ 5,33/dia (533 centavos)**. Use pelo menos `600` para garantir.

### Anúncios

| Operação | Método | Endpoint |
|----------|--------|----------|
| Listar | GET | `/{ad_account_id}/ads` |
| Criar | POST | `/{ad_account_id}/ads` |
| Ler | GET | `/{ad_id}` |
| Atualizar | POST | `/{ad_id}` |

**Exemplo - Criar anúncio:**
```json
POST /{ad_account_id}/ads
{
  "name": "Meu Anúncio",
  "adset_id": "123456789",
  "creative": {
    "creative_id": "987654321"
  },
  "status": "PAUSED"
}
```

### Criativos

| Operação | Método | Endpoint |
|----------|--------|----------|
| Listar | GET | `/{ad_account_id}/adcreatives` |
| Criar | POST | `/{ad_account_id}/adcreatives` |

### Insights (Métricas)

| Operação | Método | Endpoint |
|----------|--------|----------|
| Conta | GET | `/{ad_account_id}/insights` |
| Campanha | GET | `/{campaign_id}/insights` |
| Ad Set | GET | `/{adset_id}/insights` |
| Anúncio | GET | `/{ad_id}/insights` |

**Exemplo - Obter insights:**
```
GET /{ad_account_id}/insights?fields=impressions,clicks,spend,cpc,ctr&date_preset=last_7d
```

### Audiências

| Operação | Método | Endpoint |
|----------|--------|----------|
| Listar | GET | `/{ad_account_id}/customaudiences` |
| Criar | POST | `/{ad_account_id}/customaudiences` |
| Estimativa | GET | `/{ad_account_id}/reachestimate` |

## Objetivos de Campanha

| Objetivo | Descrição |
|----------|-----------|
| `OUTCOME_AWARENESS` | Reconhecimento de marca |
| `OUTCOME_ENGAGEMENT` | Engajamento (curtidas, comentários) |
| `OUTCOME_LEADS` | Geração de leads |
| `OUTCOME_SALES` | Conversões e vendas |
| `OUTCOME_TRAFFIC` | Tráfego para site/app |
| `OUTCOME_APP_PROMOTION` | Instalações de app |

## Status

| Status | Descrição |
|--------|-----------|
| `ACTIVE` | Ativo e veiculando |
| `PAUSED` | Pausado manualmente |
| `DELETED` | Excluído |
| `ARCHIVED` | Arquivado |
| `PENDING_REVIEW` | Em revisão |
| `DISAPPROVED` | Reprovado |

## Métricas Principais

| Métrica | Descrição |
|---------|-----------|
| `impressions` | Número de vezes que o anúncio foi exibido |
| `reach` | Número de pessoas únicas alcançadas |
| `clicks` | Total de cliques |
| `spend` | Valor gasto |
| `cpc` | Custo por clique |
| `cpm` | Custo por mil impressões |
| `ctr` | Taxa de cliques (%) |
| `frequency` | Média de vezes que cada pessoa viu |
| `actions` | Ações realizadas |
| `conversions` | Conversões rastreadas |

## Períodos Predefinidos (date_preset)

| Preset | Descrição |
|--------|-----------|
| `today` | Hoje |
| `yesterday` | Ontem |
| `last_7d` | Últimos 7 dias |
| `last_14d` | Últimos 14 dias |
| `last_30d` | Últimos 30 dias |
| `this_month` | Este mês |
| `last_month` | Mês passado |

## Targeting Básico

```json
{
  "targeting": {
    "geo_locations": {
      "countries": ["BR"],
      "regions": [{"key": "3658"}],
      "cities": [{"key": "2430536", "radius": 10, "distance_unit": "kilometer"}]
    },
    "age_min": 18,
    "age_max": 65,
    "genders": [1, 2],
    "interests": [{"id": "123456", "name": "Marketing"}],
    "behaviors": [{"id": "654321", "name": "Compradores online"}],
    "custom_audiences": [{"id": "audience_id"}],
    "excluded_custom_audiences": [{"id": "excluded_audience_id"}]
  }
}
```

## Billing Events

| Evento | Descrição |
|--------|-----------|
| `IMPRESSIONS` | Cobrança por impressão |
| `LINK_CLICKS` | Cobrança por clique |
| `APP_INSTALLS` | Cobrança por instalação |
| `PAGE_LIKES` | Cobrança por curtida na página |

## Optimization Goals

| Objetivo | Descrição |
|----------|-----------|
| `REACH` | Maximizar alcance |
| `IMPRESSIONS` | Maximizar impressões |
| `LINK_CLICKS` | Maximizar cliques |
| `LANDING_PAGE_VIEWS` | Maximizar visualizações de página |
| `CONVERSIONS` | Maximizar conversões |
| `VALUE` | Maximizar valor de conversão |

## Campos Depreciados/Alterados (v24.0)

| Campo | Objeto | Status | Alternativa |
|-------|--------|--------|-------------|
| `approximate_count` | CustomAudience | **Removido** | Use `approximate_count_lower_bound` e `approximate_count_upper_bound` |
| `is_adset_budget_sharing_enabled` | Campaign | **Obrigatório** | Sempre incluir ao criar campanhas sem CBO |
| `bid_strategy` | AdSet | **Obrigatório** | Sempre incluir (`LOWEST_COST_WITHOUT_CAP`, `COST_CAP`, `BID_CAP`) |
| `image_crops` (191x100) | Creative | **Depreciado** | Use apenas `100x100` ou omita para crop automático |
| `standard_enhancements` | Creative | **Removido v22.0+** | Omitir ao criar criativos |

## Códigos de Erro Frequentes

| Código | Descrição | Solução |
|--------|-----------|---------|
| `100` | Parâmetro inválido | Verificar parâmetros da requisição |
| `190` | Token inválido/expirado | Renovar token de acesso |
| `200` | Permissão negada | Verificar permissões do app |
| `1` | Erro desconhecido | Tentar novamente |
| `2` | Serviço temporariamente indisponível | Aguardar e tentar novamente |
| `4` | Limite de chamadas excedido | Implementar rate limiting |
| `17` | Limite de conta atingido | Reduzir frequência de chamadas |

### Subcódigos do Erro 100 (mais comuns)

| Subcódigo | Problema | Solução |
|-----------|----------|---------|
| `4834011` | `is_adset_budget_sharing_enabled` ausente | Adicione o campo ao criar campanhas sem CBO |
| `2490487` | Bid strategy/amount ausente | Adicione `bid_strategy` ao criar ad sets |
| `1885272` | Orçamento muito baixo | Use pelo menos R$ 5,33 (533 centavos) no Brasil |
| `33` | Objeto não existe | Verifique se o ID está correto (use `me/adaccounts`) |

## Erros Comuns no Endpoint /copies

### Erro 100 - Invalid Parameter (Subcódigos)

| Subcódigo | Título | Causa | Solução |
|-----------|--------|-------|---------|
| `1885194` | Solicitação de cópia muito grande | Tentando copiar mais de 3 objetos (ads/ad sets) de uma vez | Use `deep_copy: false` ou async batch requests |
| `3858079` | DSA payor ausente | Campanha targeting UE sem informações de pagador | Configure `dsa_payor` na conta |
| `3858081` | DSA beneficiary ausente | Campanha targeting UE sem informações de beneficiário | Configure `dsa_beneficiary` na conta |

### Solução para Cópias Grandes

Para copiar campanhas com mais de 3 ads/ad sets, use async batch requests:

```bash
curl -F 'access_token=...' \
  -F 'asyncbatch=[{"method":"POST","relative_url":"<ad-set-id>/copies","body":"deep_copy=true"}]' \
  https://graph.facebook.com/v24.0
```

Documentação: https://developers.facebook.com/docs/graph-api/asynchronous-batch-requests

## Links Úteis

- [Documentação Oficial](https://developers.facebook.com/docs/marketing-api/)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [Referência de Erros](https://developers.facebook.com/docs/marketing-api/error-reference/)
- [Limites de Volume](https://developers.facebook.com/docs/marketing-api/overview/authorization#limits)
