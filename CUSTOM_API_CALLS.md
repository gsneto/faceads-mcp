# Chamadas Customizadas Recorrentes

Este documento registra chamadas feitas via `execute_api` que podem se tornar tools dedicadas no futuro.

> **Objetivo**: Identificar padrões recorrentes para criar tools específicas, melhorando a experiência do usuário e reduzindo erros.

---

## Índice

1. [Descoberta de Recursos](#descoberta-de-recursos)
2. [Campanhas](#campanhas)
3. [Ad Sets](#ad-sets)
4. [Anúncios](#anúncios)
5. [Criativos](#criativos)
6. [Instagram](#instagram)
7. [Candidatas a Tools](#candidatas-a-tools)

---

## Descoberta de Recursos

### Listar Contas de Anúncios do Usuário

**Uso**: Descobrir o ID real da conta antes de operações (evita erro de ID inventado)

```
Método: GET
Endpoint: me/adaccounts
Params:
  - fields: id, name, account_status
```

**Frequência**: Alta (deveria ser a primeira chamada em qualquer sessão)

---

### Listar Páginas do Facebook

**Uso**: Obter page_id para criar criativos

```
Método: GET
Endpoint: me/accounts
Params:
  - fields: id, name, access_token
```

**Frequência**: Alta (necessário para criar qualquer criativo)

---

### Descobrir Instagram Vinculado à Página

**Uso**: Obter o ID correto do Instagram (formato novo) para criativos

```
Método: GET
Endpoint: {page_id}
Params:
  - fields: instagram_business_account, connected_instagram_account
```

**Frequência**: Alta (necessário sempre que criar criativo com Instagram)

**Nota**: O ID mostrado na UI do Meta Ads é o formato antigo (depreciado v22.0+)

---

## Campanhas

### Criar Campanha com Campo Obrigatório (v24.0+)

**Uso**: Criar campanha ABO incluindo `is_adset_budget_sharing_enabled`

```
Método: POST
Endpoint: act_{ad_account_id}/campaigns
Params:
  - name: string
  - objective: OUTCOME_TRAFFIC | OUTCOME_SALES | OUTCOME_LEADS | etc.
  - status: PAUSED | ACTIVE
  - special_ad_categories: []
  - is_adset_budget_sharing_enabled: boolean (obrigatório para ABO)
```

**Frequência**: Alta

**Nota**: A tool `create_campaign` já foi atualizada para incluir este campo automaticamente.

---

### Criar Campanha CBO (Orçamento na Campanha)

**Uso**: Criar campanha com Campaign Budget Optimization

```
Método: POST
Endpoint: act_{ad_account_id}/campaigns
Params:
  - name: string
  - objective: string
  - status: PAUSED | ACTIVE
  - special_ad_categories: []
  - daily_budget: number (centavos) - DEFINE QUE É CBO
```

**Frequência**: Média

---

### Verificar Detalhes de Campanha (com orçamento)

**Uso**: Confirmar se campanha é CBO e ver orçamento restante

```
Método: GET
Endpoint: {campaign_id}
Params:
  - fields: id, name, status, objective, daily_budget, lifetime_budget, budget_remaining
```

**Frequência**: Média

---

## Ad Sets

### Criar Ad Set com Bid Strategy (v24.0+)

**Uso**: Criar ad set incluindo `bid_strategy` obrigatório

```
Método: POST
Endpoint: act_{ad_account_id}/adsets
Params:
  - name: string
  - campaign_id: string
  - billing_event: IMPRESSIONS | LINK_CLICKS | etc.
  - optimization_goal: LINK_CLICKS | CONVERSIONS | etc.
  - daily_budget: number (mínimo 533 centavos no Brasil)
  - status: PAUSED | ACTIVE
  - targeting: object
  - bid_strategy: LOWEST_COST_WITHOUT_CAP | COST_CAP | BID_CAP
```

**Frequência**: Alta

**Nota**: A tool `create_adset` já foi atualizada para incluir `bid_strategy` automaticamente.

---

## Anúncios

### Listar Ads de uma Campanha

**Uso**: Ver todos os anúncios de uma campanha específica

```
Método: GET
Endpoint: {campaign_id}/ads
Params:
  - fields: id, name, status, effective_status, creative
```

**Frequência**: Alta

**Candidata a tool**: `list_campaign_ads`

---

### Verificar Status de Objeto (Ad/AdSet/Campaign)

**Uso**: Ver status atual incluindo effective_status

```
Método: GET
Endpoint: {object_id}
Params:
  - fields: id, name, status, effective_status
```

**Frequência**: Alta

**Candidata a tool**: `get_object_status`

---

### Ativar/Pausar Anúncio

**Uso**: Alterar status de um anúncio específico

```
Método: POST
Endpoint: {ad_id}
Params:
  - status: ACTIVE | PAUSED
```

**Frequência**: Alta

**Candidata a tool**: `update_ad` (já existe `update_campaign` e `update_adset`)

---

## Criativos

### Criar Criativo Básico (Link Ad)

**Uso**: Criar criativo com link para site

```
Método: POST
Endpoint: act_{ad_account_id}/adcreatives
Params:
  - name: string
  - object_story_spec:
      - page_id: string
      - link_data:
          - link: string (URL)
          - message: string
          - name: string (título)
          - description: string
          - call_to_action:
              - type: LEARN_MORE | SHOP_NOW | SIGN_UP | etc.
```

**Frequência**: Alta

---

### Criar Criativo com Instagram

**Uso**: Criar criativo vinculando conta do Instagram

```
Método: POST
Endpoint: act_{ad_account_id}/adcreatives
Params:
  - name: string
  - object_story_spec:
      - page_id: string
      - instagram_user_id: string (ID NOVO, não o da UI)
      - link_data:
          - link: string
          - message: string
          - name: string
          - description: string
          - call_to_action:
              - type: string
```

**Frequência**: Alta

**Nota**: Usar `instagram_user_id` dentro de `object_story_spec`, NÃO `instagram_actor_id`

---

## Instagram

### Buscar Contas do Instagram da Ad Account

**Uso**: Listar contas de Instagram vinculadas (pode retornar vazio)

```
Método: GET
Endpoint: act_{ad_account_id}/instagram_accounts
Params:
  - fields: id, username
```

**Frequência**: Baixa (geralmente retorna vazio, usar via page_id)

---

## Candidatas a Tools

Com base na frequência e utilidade, estas chamadas são **candidatas prioritárias** para se tornarem tools dedicadas:

### Alta Prioridade

| Chamada | Justificativa | Proposta de Tool |
|---------|---------------|------------------|
| `GET me/adaccounts` | Primeira chamada de qualquer sessão | `discover_ad_accounts` |
| `GET me/accounts` | Necessário para criativos | `list_facebook_pages` |
| `GET {page_id}?fields=instagram_business_account` | Necessário para criativos com IG | `get_instagram_account` |
| `GET {campaign_id}/ads` | Muito comum para análise | `list_campaign_ads` |
| `POST {ad_id}` (status) | Ativar/pausar ads | `update_ad` |

### Média Prioridade

| Chamada | Justificativa | Proposta de Tool |
|---------|---------------|------------------|
| `GET {object_id}` (status) | Verificar effective_status | `get_object_status` |
| `POST adcreatives` (com IG) | Complexo, muitos erros | Melhorar `create_creative` |

---

## Histórico de Atualizações

| Data | Alteração |
|------|-----------|
| 2026-02-05 | Documento criado com base em sessão de testes do MCP |

---

## Como Contribuir

Ao usar `execute_api` para uma chamada recorrente:

1. Verifique se já está documentada aqui
2. Se não estiver, adicione seguindo o formato:
   - Método e Endpoint
   - Params com tipos
   - Frequência estimada
   - Se é candidata a tool

3. Quando uma chamada tiver **alta frequência**, considere criar uma tool dedicada
