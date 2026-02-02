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
  "special_ad_categories": []
}
```

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
  "daily_budget": 5000,
  "billing_event": "IMPRESSIONS",
  "optimization_goal": "LINK_CLICKS",
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
