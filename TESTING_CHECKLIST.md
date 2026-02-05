# Checklist de Testes - MCP Facebook Marketing API

> **Plano Detalhado:** [.cursor/plans/plano_testes_mcp_facebook_30f36159.plan.md](.cursor/plans/plano_testes_mcp_facebook_30f36159.plan.md)
> 
> O plano contém todos os cenários de teste com parâmetros específicos, exemplos de targeting specs em JSON, tabelas de janelas de atribuição e fluxo E2E completo.

---

## AVISOS DE SEGURANÇA

> **CONTA REAL:** Este checklist será executado em uma conta de anúncios real. Tome cuidado com operações que modificam dados.

### Convenções

- **Prefixo de teste:** Todos os objetos criados devem usar o prefixo `[TESTE]` no nome
  - Exemplo: `[TESTE] Campanha de Tráfego`
- **Status inicial:** Sempre criar campanhas, ad sets e ads com status `PAUSED`
- **Cleanup:** Ao final, pausar/deletar todos os objetos de teste

### Pontos de Validação Manual

Após cada operação de **criação** ou **alteração**, PARAR e validar no Gerenciador de Anúncios:

| Operação | O que validar no Gerenciador |
|----------|------------------------------|
| `create_campaign` | Campanha aparece? Nome correto? Status PAUSED? Objetivo correto? |
| `create_adset` | Ad set vinculado à campanha correta? Targeting configurado? Orçamento correto? |
| `create_creative` | Criativo criado? Imagem/link corretos? |
| `create_ad` | Anúncio vinculado ao ad set? Criativo associado? Status PAUSED? |
| `update_*` | Alteração refletida corretamente? |
| `activate_*` | Status mudou para ACTIVE? (CUIDADO: pode começar a gastar) |
| `pause_*` | Status mudou para PAUSED? |
| `create_custom_audience` | Audiência aparece na lista? |

---

## Progresso Geral

| Fase | Descrição | Status | Risco |
|------|-----------|--------|-------|
| 1 | Documentação | [x] | Safe |
| 2 | Descoberta | [x] | Safe |
| 3 | Leitura de Objetos | [x] | Safe |
| 4 | Insights | [x] | Safe |
| 5 | Criação de Objetos | [x] | CUIDADO |
| 6 | Atualização de Objetos | [ ] | CUIDADO |
| 7 | Ativar/Pausar | [ ] | PODE GASTAR |
| 8 | Audiências | [ ] | CUIDADO |
| 9 | API Customizada | [ ] | CUIDADO |
| 10 | Cenários de Erro | [ ] | Safe |
| 11 | Cleanup | [ ] | CUIDADO |

---

## Fase 1 - Documentação (Safe - Read-Only)

> Sem risco, pode executar livremente. Não requer API key.

### 1.1 search_documentation

- [ ] **Busca em português** - "criar campanha"
  - Parâmetros: `query="criar campanha"`
  - Resultado: 
  - Observações:

- [ ] **Busca em inglês** - "custom audiences"
  - Parâmetros: `query="custom audiences"`
  - Resultado: 
  - Observações:

- [ ] **Busca com filtro de seção**
  - Parâmetros: `query="pixel", section="facebook-pixel"`
  - Resultado: 
  - Observações:

- [ ] **Busca com limite**
  - Parâmetros: `query="insights", limit=5`
  - Resultado: 
  - Observações:

- [ ] **Busca termo inexistente**
  - Parâmetros: `query="xyzabc123inexistente"`
  - Resultado esperado: Lista vazia ou mensagem apropriada
  - Resultado: 
  - Observações:

### 1.2 get_document_by_path

- [ ] **Documento válido**
  - Parâmetros: `path="insights/error-codes.md"`
  - Resultado: 
  - Observações:

- [ ] **Documento em subdiretório**
  - Parâmetros: `path="conversions-api/overview.md"`
  - Resultado: 
  - Observações:

- [ ] **Caminho inválido**
  - Parâmetros: `path="caminho/inexistente.md"`
  - Resultado esperado: Erro tratado
  - Resultado: 
  - Observações:

### 1.3 list_sections

- [ ] **Listar todas as seções**
  - Parâmetros: (nenhum)
  - Resultado esperado: 55 seções
  - Resultado: 
  - Observações:

### 1.4 get_endpoint_reference

- [ ] **Endpoint campaigns**
  - Parâmetros: `endpoint="campaigns"`
  - Resultado: 
  - Observações:

- [ ] **Endpoint adsets**
  - Parâmetros: `endpoint="adsets"`
  - Resultado: 
  - Observações:

- [ ] **Endpoint insights**
  - Parâmetros: `endpoint="insights"`
  - Resultado: 
  - Observações:

- [ ] **Endpoint customaudiences**
  - Parâmetros: `endpoint="customaudiences"`
  - Resultado: 
  - Observações:

- [ ] **Endpoint inexistente**
  - Parâmetros: `endpoint="endpointfake"`
  - Resultado esperado: Erro ou mensagem apropriada
  - Resultado: 
  - Observações:

### 1.5 get_error_code_info

- [ ] **Erro 100** (Invalid parameter)
  - Parâmetros: `error_code="100"`
  - Resultado: 
  - Observações:

- [ ] **Erro 190** (Access token)
  - Parâmetros: `error_code="190"`
  - Resultado: 
  - Observações:

- [ ] **Erro 1504022**
  - Parâmetros: `error_code="1504022"`
  - Resultado: 
  - Observações:

- [ ] **Código inexistente**
  - Parâmetros: `error_code="9999999"`
  - Resultado esperado: Erro ou mensagem apropriada
  - Resultado: 
  - Observações:

### 1.6 get_quick_reference

- [ ] **Referência rápida**
  - Parâmetros: (nenhum)
  - Resultado: 
  - Observações:

---

## Fase 2 - Descoberta (Safe - Read-Only)

> Apenas leitura, sem modificações. Requer API key configurada.

### 2.1 discover_ad_accounts

- [ ] **Descobrir contas** (PRIMEIRA CHAMADA de qualquer sessão)
  - Parâmetros: (default)
  - Resultado: 
  - ID da conta: `act_________________`
  - Observações:

- [ ] **Com campos customizados**
  - Parâmetros: `fields=["id", "name", "account_status", "currency"]`
  - Resultado: 
  - Observações:

### 2.2 list_facebook_pages

- [ ] **Listar páginas**
  - Parâmetros: (default)
  - Resultado: 
  - Page ID: `_________________`
  - Observações:

- [ ] **Com campos customizados**
  - Parâmetros: `fields=["id", "name", "access_token"]`
  - Resultado: 
  - Observações:

### 2.3 get_instagram_account

- [ ] **Com page_id válido**
  - Parâmetros: `page_id="(usar ID da fase 2.2)"`
  - Resultado: 
  - Instagram ID: `_________________`
  - Observações:

- [ ] **Com page_id sem Instagram vinculado** (se aplicável)
  - Parâmetros: `page_id="(página sem IG)"`
  - Resultado esperado: Resposta vazia ou mensagem apropriada
  - Resultado: 
  - Observações:

---

## Fase 3 - Leitura de Objetos (Safe - Read-Only)

> Apenas leitura de objetos existentes na conta.

### 3.1 Campanhas

- [ ] **list_campaigns** - Listar todas
  - Parâmetros: (default)
  - Resultado: 
  - Quantidade: 
  - Observações:

- [ ] **list_campaigns** - Filtrar por status ACTIVE
  - Parâmetros: `effective_status=["ACTIVE"]`
  - Resultado: 
  - Observações:

- [ ] **list_campaigns** - Filtrar múltiplos status
  - Parâmetros: `effective_status=["ACTIVE", "PAUSED"]`
  - Resultado: 
  - Observações:

- [ ] **get_campaign** - Campanha existente
  - Parâmetros: `campaign_id="(ID de campanha existente)"`
  - Resultado: 
  - Observações:

### 3.2 Ad Sets

- [ ] **list_adsets** - Listar todos
  - Parâmetros: (default)
  - Resultado: 
  - Quantidade: 
  - Observações:

- [ ] **list_adsets** - Filtrar por status
  - Parâmetros: `effective_status=["ACTIVE"]`
  - Resultado: 
  - Observações:

- [ ] **get_adset** - Ad set existente
  - Parâmetros: `adset_id="(ID de ad set existente)"`
  - Resultado: 
  - Observações:

### 3.3 Anúncios

- [ ] **list_ads** - Listar todos
  - Parâmetros: (default)
  - Resultado: 
  - Quantidade: 
  - Observações:

- [ ] **list_campaign_ads** - Anúncios de campanha específica
  - Parâmetros: `campaign_id="(ID de campanha)"`
  - Resultado: 
  - Observações:

- [ ] **get_ad** - Anúncio existente
  - Parâmetros: `ad_id="(ID de anúncio existente)"`
  - Resultado: 
  - Observações:

### 3.4 Criativos

- [ ] **list_creatives** - Listar todos
  - Parâmetros: (default)
  - Resultado: 
  - Quantidade: 
  - Observações:

- [ ] **get_creative** - Criativo existente
  - Parâmetros: `creative_id="(ID de criativo existente)"`
  - Resultado: 
  - Observações:

### 3.5 Audiências

- [ ] **list_custom_audiences** - Listar todas
  - Parâmetros: (default) - evitar `approximate_count` (depreciado)
  - Resultado: 
  - Quantidade: 
  - Observações:

---

## Fase 4 - Insights (Safe - Read-Only)

> Apenas leitura de métricas. Não modifica dados.

### 4.1 get_account_insights

- [ ] **Últimos 7 dias**
  - Parâmetros: `date_preset="last_7d"`
  - Resultado: 
  - Observações:

- [ ] **Com time_range customizado**
  - Parâmetros: `time_range={"since": "2026-01-01", "until": "2026-01-31"}`
  - Resultado: 
  - Observações:

- [ ] **Com campos específicos**
  - Parâmetros: `fields=["impressions", "clicks", "spend", "ctr", "cpc"]`
  - Resultado: 
  - Observações:

### 4.2 get_campaign_insights

- [ ] **Campanha específica**
  - Parâmetros: `campaign_id="(ID)", date_preset="last_30d"`
  - Resultado: 
  - Observações:

### 4.3 get_adset_insights

- [ ] **Ad set específico**
  - Parâmetros: `adset_id="(ID)", date_preset="last_30d"`
  - Resultado: 
  - Observações:

### 4.4 get_ad_insights

- [ ] **Anúncio específico**
  - Parâmetros: `ad_id="(ID)", date_preset="last_30d"`
  - Resultado: 
  - Observações:

### 4.5 Atribuição Avançada

- [ ] **get_account_insights com janelas de atribuição**
  - Parâmetros: `action_attribution_windows=["1d_click", "7d_click", "1d_view", "incrementality"]`
  - Resultado: 
  - Observações:

- [ ] **get_attribution_comparison**
  - Parâmetros: `object_id="(campaign_id)", object_type="campaign", date_preset="last_30d"`
  - Resultado: 
  - Observações:

- [ ] **get_performance_summary**
  - Parâmetros: `date_preset="last_30d"`
  - Resultado: 
  - Observações:

### 4.6 list_campaign_ads_with_insights

- [ ] **Anúncios com métricas**
  - Parâmetros: `campaign_id="(ID)", date_preset="last_7d"`
  - Resultado: 
  - Observações:

---

## Fase 5 - Criação de Objetos (CUIDADO - Modifica Conta)

> **ATENÇÃO:** Esta fase cria objetos reais na conta. Sempre usar prefixo `[TESTE]` e status `PAUSED`.

### 5.1 create_campaign

- [ ] **Criar campanha de tráfego**
  - Parâmetros: 
    ```json
    {
      "name": "[TESTE] Campanha Tráfego MCP",
      "objective": "OUTCOME_TRAFFIC",
      "status": "PAUSED"
    }
    ```
  - ID retornado: `_________________`
  - ⏸️ **VALIDAR NO GERENCIADOR:**
    - [ ] Campanha aparece na lista
    - [ ] Nome correto: `[TESTE] Campanha Tráfego MCP`
    - [ ] Status é PAUSED
    - [ ] Objetivo é TRAFFIC
  - Resultado: 
  - Observações:

### 5.2 create_adset

- [ ] **Criar ad set básico**
  - Parâmetros:
    ```json
    {
      "name": "[TESTE] Ad Set MCP",
      "campaign_id": "(ID da campanha criada)",
      "billing_event": "IMPRESSIONS",
      "optimization_goal": "LINK_CLICKS",
      "daily_budget": 600,
      "status": "PAUSED",
      "targeting": {
        "geo_locations": { "countries": ["BR"] },
        "age_min": 18,
        "age_max": 65
      }
    }
    ```
  - ID retornado: `_________________`
  - ⏸️ **VALIDAR NO GERENCIADOR:**
    - [ ] Ad set aparece na campanha de teste
    - [ ] Nome correto: `[TESTE] Ad Set MCP`
    - [ ] Orçamento: R$ 6,00/dia
    - [ ] Targeting: Brasil, 18-65
    - [ ] Status é PAUSED
  - Resultado: 
  - Observações:

### 5.3 create_creative

- [ ] **Criar criativo básico**
  - Parâmetros:
    ```json
    {
      "name": "[TESTE] Criativo MCP",
      "object_story_spec": {
        "page_id": "(page_id da fase 2.2)",
        "link_data": {
          "link": "https://example.com",
          "message": "Teste do MCP",
          "name": "Título do Teste",
          "description": "Descrição do teste",
          "call_to_action": {
            "type": "LEARN_MORE"
          }
        }
      }
    }
    ```
  - ID retornado: `_________________`
  - ⏸️ **VALIDAR NO GERENCIADOR:**
    - [ ] Criativo aparece na lista
    - [ ] Nome correto
    - [ ] Link correto
  - Resultado: 
  - Observações:

### 5.4 create_ad

- [ ] **Criar anúncio**
  - Parâmetros:
    ```json
    {
      "name": "[TESTE] Anúncio MCP",
      "adset_id": "(ID do ad set criado)",
      "creative_id": "(ID do criativo criado)",
      "status": "PAUSED"
    }
    ```
  - ID retornado: `_________________`
  - ⏸️ **VALIDAR NO GERENCIADOR:**
    - [ ] Anúncio aparece no ad set de teste
    - [ ] Nome correto: `[TESTE] Anúncio MCP`
    - [ ] Criativo associado corretamente
    - [ ] Status é PAUSED
  - Resultado: 
  - Observações:

---

## Fase 6 - Atualização de Objetos (CUIDADO)

> Usar apenas nos objetos de teste criados na Fase 5.

### 6.1 update_campaign

- [x] **Alterar nome da campanha**
  - Parâmetros: `campaign_id="120240534776680649", name="[TESTE MCP] Campanha Renomeada"`
  - ⏸️ **VALIDAR NO GERENCIADOR:**
    - [x] Nome alterado corretamente
  - Resultado: ✅ **OK**
  - Observações: Funciona perfeitamente

### 6.2 update_adset

- [x] **Alterar orçamento do ad set**
  - Parâmetros: `adset_id="120240534814420649", daily_budget=1000`
  - ⏸️ **VALIDAR NO GERENCIADOR:**
    - [x] Orçamento alterado para R$ 10,00/dia
  - Resultado: ✅ **OK**
  - Observações: Funciona perfeitamente

### 6.3 update_ad

- [x] **Alterar nome do anúncio**
  - Parâmetros: `ad_id="120240534952610649", name="[TESTE MCP] Anúncio Renomeado"`
  - ⏸️ **VALIDAR NO GERENCIADOR:**
    - [x] Nome alterado corretamente
  - Resultado: ⚠️ **Tool `update_ad` NÃO EXISTE** - Usado `execute_api` como workaround
  - Observações: POST direto para o ID do anúncio com `{"name": "..."}` funciona

---

## Fase 7 - Ativar/Pausar (CUIDADO - PODE GASTAR)

> **ATENÇÃO MÁXIMA:** Ativar objetos pode iniciar gastos imediatamente!

### 7.1 Testar Ativação

- [x] **activate_campaign** 
  - Parâmetros: `campaign_id="120240534776680649"`
  - ⏸️ **VALIDAR IMEDIATAMENTE NO GERENCIADOR:**
    - [x] Status mudou para ACTIVE
    - [x] Pausado imediatamente após verificar
  - Resultado: ✅ **OK** - Tool funciona corretamente
  - Observações: Ativou e verificou status ACTIVE/ACTIVE

- [x] **activate_adset (via update_adset)**
  - Parâmetros: `adset_id="120240534814420649", status="ACTIVE"`
  - ⏸️ **VALIDAR IMEDIATAMENTE NO GERENCIADOR:**
    - [x] Status mudou para ACTIVE
  - Resultado: ✅ **OK** - Usado `update_adset` com `status: "ACTIVE"`
  - Observações: Tool `activate_adset` **NÃO EXISTE**, mas `update_adset` funciona

- [x] **activate_ad (via execute_api)**
  - Parâmetros: `POST 120240534952610649 {"status": "ACTIVE"}`
  - ⏸️ **VALIDAR IMEDIATAMENTE NO GERENCIADOR:**
    - [x] Status mudou para ACTIVE
  - Resultado: ✅ **OK** - Usado `execute_api`
  - Observações: Tools `activate_ad` e `update_ad` **NÃO EXISTEM**

### 7.2 Testar Pausa

- [x] **pause_campaign**
  - Parâmetros: `campaign_id="120240534776680649"`
  - ⏸️ **VALIDAR NO GERENCIADOR:**
    - [x] Status mudou para PAUSED
  - Resultado: ✅ **OK** - Tool funciona corretamente
  - Observações: Verificado status PAUSED/PAUSED após pausar

- [x] **pause_adset (via update_adset)**
  - Parâmetros: `adset_id="120240534814420649", status="PAUSED"`
  - ⏸️ **VALIDAR NO GERENCIADOR:**
    - [x] Status mudou para PAUSED
  - Resultado: ✅ **OK** - Usado `update_adset` com `status: "PAUSED"`
  - Observações: Tool `pause_adset` **NÃO EXISTE**

- [x] **pause_ad (via execute_api)**
  - Parâmetros: `POST 120240534952610649 {"status": "PAUSED"}`
  - ⏸️ **VALIDAR NO GERENCIADOR:**
    - [x] Status mudou para PAUSED
  - Resultado: ✅ **OK** - Usado `execute_api`
  - Observações: Tool `pause_ad` **NÃO EXISTE**

### 7.3 Resumo de Tools Ativar/Pausar

| Nível | Tool Dedicada Ativar | Tool Dedicada Pausar | Alternativa |
|-------|---------------------|---------------------|-------------|
| Campaign | ✅ `activate_campaign` | ✅ `pause_campaign` | - |
| Ad Set | ❌ Não existe | ❌ Não existe | `update_adset` com `status` |
| Ad | ❌ Não existe | ❌ Não existe | `execute_api` |

---

## Fase 8 - Audiências (CUIDADO)

### 8.1 list_custom_audiences

- [x] **Listar audiências existentes**
  - Parâmetros: `fields=["id", "name", "subtype", "time_created"]`
  - Resultado: ✅ **OK** - 25 audiências encontradas
  - Tipos encontrados: WEBSITE, ENGAGEMENT, LOOKALIKE, IG_BUSINESS, CUSTOM
  - Observações: Funciona corretamente

### 8.2 create_custom_audience

- [x] **Criar audiência customizada (subtype CUSTOM)**
  - Parâmetros:
    ```json
    {
      "name": "[TESTE] Audiência MCP",
      "subtype": "CUSTOM",
      "description": "Audiência de teste do MCP"
    }
    ```
  - ID retornado: `N/A - ERRO`
  - Resultado: ❌ **ERRO 100** - Falta parâmetro `customer_file_source`
  - Observações: Schema não inclui campo obrigatório

- [x] **Criar audiência customizada (com customer_file_source via execute_api)**
  - Parâmetros: `customer_file_source: "USER_PROVIDED_ONLY"`
  - Resultado: ❌ **ERRO 200/1870090** - Requer aceitar Termos do Público Personalizado
  - Observações: Problema de permissão da conta, não da API

- [x] **Criar audiência ENGAGEMENT**
  - Parâmetros: `subtype: "ENGAGEMENT"`
  - Resultado: ❌ **ERRO 100/1713072** - Falta parâmetro `rule`
  - Observações: Schema não inclui campo obrigatório para este subtipo

### 8.3 get_reach_estimate (Safe)

- [x] **Estimativa de alcance**
  - Parâmetros:
    ```json
    {
      "targeting_spec": {
        "geo_locations": { "countries": ["BR"] },
        "age_min": 25,
        "age_max": 45
      }
    }
    ```
  - Resultado: ✅ **OK**
  - Alcance estimado: **85.500.000 - 100.600.000 pessoas**
  - Observações: Funciona perfeitamente

---

## Fase 9 - API Customizada (CUIDADO)

### 9.1 execute_api - GET (Safe)

- [x] **GET me/adaccounts**
  - Parâmetros: `method="GET", endpoint="me/adaccounts", fields="id,name,currency,account_status"`
  - Resultado: ✅ **OK**
  - Retornou: `act_618288566086470` (CA01 - ZAP, BRL, account_status=1)
  - Observações: Funciona perfeitamente

- [x] **GET {campaign_id}/ads**
  - Parâmetros: `method="GET", endpoint="120240534776680649/ads", fields="id,name,status"`
  - Resultado: ✅ **OK**
  - Retornou: 2 anúncios (`[TESTE MCP] Anúncio Renomeado`, `[TESTE MCP] Anúncio com Instagram`)
  - Observações: Funciona perfeitamente

### 9.2 execute_api - Placeholder

- [x] **GET com placeholder {ad_account_id}**
  - Parâmetros: `method="GET", endpoint="{ad_account_id}"`
  - Resultado esperado: Placeholder substituído corretamente
  - Resultado: ❌ **ERRO 100/33** - "Object with ID '{ad_account_id}' does not exist"
  - Observações: **PLACEHOLDER NÃO SUBSTITUÍDO** - Precisa usar ID real (confirma problema #2)

---

## Fase 10 - Cenários de Erro

> Testar tratamento de erros. Sem risco real.

### 10.1 IDs Inválidos

- [x] **get_campaign com ID inexistente**
  - Parâmetros: `campaign_id="123456789"`
  - Resultado esperado: Erro tratado
  - Resultado: ✅ **ERRO TRATADO** - Erro 100/33 com mensagem clara
  - Observações: "Object with ID '123456789' does not exist"

- [x] **execute_api com ID inexistente**
  - Parâmetros: `endpoint="987654321"`
  - Resultado esperado: Erro tratado
  - Resultado: ✅ **ERRO TRATADO** - Erro 100/33 com mensagem clara
  - Observações: Mensagem idêntica ao anterior

### 10.2 Parâmetros Inválidos

- [x] **create_adset com orçamento abaixo do mínimo**
  - Parâmetros: `daily_budget=100` (abaixo dos 533 centavos mínimos)
  - Resultado esperado: Erro de validação LOCAL (Zod)
  - Resultado: ⚠️ **VALIDAÇÃO LOCAL NÃO FUNCIONOU** - Erro 100/2490487 da API (bid_strategy)
  - Observações: O orçamento baixo passou pela validação local e falhou na API por outro motivo

- [x] **create_campaign com objetivo inválido**
  - Parâmetros: `objective="OBJETIVO_FAKE"`
  - Resultado esperado: Erro de validação
  - Resultado: ✅ **VALIDAÇÃO LOCAL OK** - Zod retornou erro claro
  - Observações: "Invalid option: expected one of OUTCOME_AWARENESS|OUTCOME_ENGAGEMENT|..."

### 10.3 Campos Depreciados

- [x] **list_custom_audiences com approximate_count**
  - Parâmetros: `fields=["id", "name", "approximate_count"]`
  - Resultado esperado: Erro ou aviso de campo depreciado
  - Resultado: ✅ **ERRO CLARO** - Erro 100 "Tried accessing nonexisting field (approximate_count)"
  - Observações: Campo foi removido da API, erro é claro
  - Resultado: 
  - Observações:

---

## Fase 11 - Cleanup

> Limpar todos os objetos de teste criados.

### 11.1 Pausar Objetos de Teste

- [ ] **Pausar campanha de teste**
  - Parâmetros: `campaign_id="(ID teste)"`
  - ⏸️ **VALIDAR NO GERENCIADOR:**
    - [ ] Campanha pausada
  - Resultado: 
  - Observações:

### 11.2 Verificação Final

- [ ] **Verificar no Gerenciador de Anúncios:**
  - [ ] Todos os objetos `[TESTE]` estão pausados
  - [ ] Nenhum gasto inesperado ocorreu
  - [ ] Conta está em estado normal

### 11.3 Deletar Objetos (Opcional)

> Deletar via Gerenciador de Anúncios os objetos criados, se desejado.

- [ ] Deletar anúncio de teste
- [ ] Deletar ad set de teste
- [ ] Deletar campanha de teste
- [ ] Deletar criativo de teste
- [ ] Deletar audiência de teste

---

## Resumo de Resultados

### Estatísticas

| Categoria | Total | Testadas | OK | Erro/Parcial |
|-----------|-------|----------|-----|--------------|
| Documentação | 6 | 6 | 5 | 1 |
| Descoberta | 3 | 3 | 3 | 0 |
| Leitura | 14 | 8 | 7 | 1 |
| Insights | 8 | 4 | 4 | 0 |
| Criação | 4 | 6 | 3 | 3 |
| Atualização | 3 | 3 | 2 | 1 |
| Ativar/Pausar | 6 | 6 | 2 | 4 |
| Audiências | 2 | 4 | 2 | 2 |
| API Customizada | 3 | 3 | 2 | 1 |
| Erros | 5 | 5 | 4 | 1 |
| **TOTAL** | **54** | **48** | **34** | **14** |

**Legenda:**
- ✅ OK: Funciona como esperado
- ⚠️ Erro/Parcial: Tool não existe, falta parâmetro obrigatório, ou precisa workaround

### Problemas Encontrados

| # | Tool | Descrição do Problema | Severidade |
|---|------|----------------------|------------|
| 1 | `create_campaign` | Campo `is_adset_budget_sharing_enabled` é **obrigatório** na v24.0 para campanhas sem CBO, mas a tool não inclui automaticamente. Erro 100/4834011. | **ALTA** |
| 2 | `execute_api` | Placeholder `{ad_account_id}` **não está sendo substituído**. Erro 100/33 "Object with ID '{ad_account_id}' does not exist". Precisa usar ID real. | **ALTA** |
| 3 | `search_documentation` | Busca por termo inexistente retorna resultados com baixa relevância (15%) em vez de lista vazia ou mensagem clara. | BAIXA |
| 4 | `get_endpoint_reference` | Busca por endpoint inexistente retorna resultados genéricos com baixa relevância em vez de erro ou mensagem "não encontrado". | BAIXA |
| 5 | `get_error_code_info` | Código inexistente (9999999) retorna resposta vazia sem mensagem explicativa. | BAIXA |
| 6 | `list_campaigns` | Quando campo `effective_status` é incluído junto com `objective`, o objetivo vem como "N/A". | MÉDIA |
| 7 | `create_adset` | Campo `bid_strategy` não está sendo incluído corretamente. Erro 100/2490487 "O valor ou as restrições de lance são obrigatórios". | **ALTA** |
| 8 | `create_adset` | Muitos campos da API não estão expostos na tool (ver seção "Campos Faltantes"). | **MÉDIA** |
| 9 | `create_creative` | Campo `instagram_user_id` funciona, mas não é documentado de forma clara. Usuário pode criar criativos sem Instagram acidentalmente. | BAIXA |
| 10 | `create_creative` | Muitos campos da UI não estão expostos/documentados: formatos (carrossel, vídeo), CTAs, destinos, Advantage+. | **MÉDIA** |
| 11 | `update_ad` | **Tool não existe!** Existe `update_campaign` e `update_adset`, mas não `update_ad`. Precisa usar `execute_api`. | **ALTA** |
| 12 | `activate_adset` | **Tool não existe!** Precisa usar `update_adset` com `status: "ACTIVE"`. | MÉDIA |
| 13 | `pause_adset` | **Tool não existe!** Precisa usar `update_adset` com `status: "PAUSED"`. | MÉDIA |
| 14 | `activate_ad` | **Tool não existe!** Precisa usar `execute_api`. | **ALTA** |
| 15 | `pause_ad` | **Tool não existe!** Precisa usar `execute_api`. | **ALTA** |
| 16 | `create_custom_audience` | Falta campo `customer_file_source` no schema (obrigatório para subtype CUSTOM). Erro 100. | **ALTA** |
| 17 | `create_custom_audience` | Falta campo `rule` no schema (obrigatório para subtype ENGAGEMENT). Erro 100/1713072. | **ALTA** |
| 18 | `create_adset` | Validação local de `daily_budget` mínimo (533) não funcionou - orçamento=100 passou para API. | MÉDIA |

### Sugestões de Melhoria

| # | Tool | Sugestão |
|---|------|----------|
| 1 | `create_campaign` | Incluir `is_adset_budget_sharing_enabled: false` automaticamente quando `daily_budget` não for informado (ABO) |
| 2 | `execute_api` | Corrigir substituição do placeholder `{ad_account_id}` pelo ID configurado em `META_AD_ACCOUNT_ID` |
| 3 | `search_documentation` | Retornar mensagem "Nenhum resultado encontrado" quando relevância for muito baixa ou zero matches |
| 4 | `get_error_code_info` | Retornar mensagem "Código de erro não encontrado na documentação" quando não houver resultados |
| 5 | `create_adset` | Verificar se `bid_strategy` está sendo incluído automaticamente (campo obrigatório v24.0) |
| 6 | Tools de documentação | Adicionar tools específicas: `discover_ad_accounts`, `list_facebook_pages`, `get_instagram_account` |
| 7 | Geral | Criar validação de campos obrigatórios antes de enviar para a API (evitar erros 100/subcódigo) |
| 8 | `create_adset` | Adicionar campos faltantes (ver tabela abaixo) |
| 9 | `create_creative` | Documentar `instagram_user_id` de forma proeminente na descrição da tool |
| 10 | `create_creative` | Criar exemplos de uso para diferentes formatos: link_data, carousel_data, video_data |
| 11 | `create_creative` | Documentar todos os CTAs disponíveis e seus valores |
| 12 | `create_creative` | Adicionar campos faltantes: `platform_customizations`, `degrees_of_freedom_spec` |
| 13 | Ads | **Criar tool `update_ad`** para consistência (existe update_campaign e update_adset) |
| 14 | Ad Sets | Criar tools `activate_adset` e `pause_adset` para consistência (existe para campaigns) |
| 15 | Ads | Criar tools `activate_ad` e `pause_ad` para consistência |
| 16 | `create_custom_audience` | Adicionar campo `customer_file_source` (obrigatório para CUSTOM) |
| 17 | `create_custom_audience` | Adicionar campo `rule` (obrigatório para ENGAGEMENT, WEBSITE, etc.) |
| 18 | `create_custom_audience` | Criar exemplos para cada subtype: CUSTOM, WEBSITE, ENGAGEMENT, LOOKALIKE |

---

## Campos Faltantes no `create_adset`

A API suporta muitos campos que não estão expostos na tool atual:

### Alta Prioridade (comuns na UI)

| Campo | Descrição | Uso na UI |
|-------|-----------|-----------|
| `destination_type` | Local da conversão | Site, App, Messenger, Instagram, Ligações |
| `start_time` | Data/hora de início | Programação |
| `end_time` | Data/hora de término | Programação |
| `lifetime_budget` | Orçamento vitalício | Alternativa ao daily_budget |
| `promoted_object` | Pixel, evento, página | Necessário para conversões |
| `is_dynamic_creative` | Criativo dinâmico | Toggle na UI |
| `frequency_control_specs` | Controle de frequência | Limitar impressões por pessoa |
| `adset_schedule` | Programação de horários | Veicular em horários específicos |

### Média Prioridade

| Campo | Descrição |
|-------|-----------|
| `attribution_spec` | Janelas de atribuição customizadas |
| `pacing_type` | Tipo de pacing (standard, day_parting) |
| `tune_for_category` | Categoria especial (housing, credit, etc.) |
| `value_rule_set_id` | Regras de valor |
| `existing_customer_budget_percentage` | % orçamento para clientes existentes |

### DSA/Transparência (UE)

| Campo | Descrição |
|-------|-----------|
| `dsa_beneficiary` | Beneficiário do anúncio |
| `dsa_payor` | Pagador do anúncio |

### Targeting Avançado (dentro de `targeting`)

| Campo | Descrição |
|-------|-----------|
| `publisher_platforms` | Facebook, Instagram, Audience Network |
| `facebook_positions` | Feed, Stories, Reels, etc. |
| `instagram_positions` | Feed, Stories, Reels, Explore |
| `device_platforms` | Mobile, Desktop |
| `flexible_spec` | Interesses com OR |
| `exclusions` | Exclusões de público |

---

## Campos Faltantes no `create_creative`

**Nota:** O schema atual já suporta `instagram_user_id` no `object_story_spec`, mas não foi passado no teste inicial.

A API suporta muitos campos que não estão expostos/documentados de forma clara na tool atual:

### Alta Prioridade (comuns na UI)

| Campo | Descrição | Uso na UI |
|-------|-----------|-----------|
| `instagram_user_id` | ID da conta do Instagram | Seção "Identidade" → "Conta do Instagram" |
| `instagram_actor_id` | Alternativa ao instagram_user_id | Actor ID para Instagram |
| `call_to_action.type` | Tipo de CTA | "Saiba mais", "Comprar", "Ligar", "WhatsApp" |
| `call_to_action.value` | Configuração do CTA | Número de telefone, link de WhatsApp |
| `carousel_data` | Dados para carrossel | Formato carrossel na UI |
| `video_data` | Dados para vídeo | Anúncios em vídeo |
| `asset_feed_spec` | Múltiplos assets | Criativo dinâmico / Testes A/B |

### Média Prioridade

| Campo | Descrição |
|-------|-----------|
| `platform_customizations` | Mídia diferente por placement (Instagram vs Facebook) |
| `degrees_of_freedom_spec` | Aprimoramentos Advantage+ (geração de texto, imagens IA) |
| `contextual_multi_ads` | "Anúncios com vários anunciantes" |
| `authorization_category` | Categoria de autorização (Parceria) |
| `branded_content_sponsor_page_id` | Parceria de conteúdo de marca |

### Destinos (destination types)

| Tipo | Descrição |
|------|-----------|
| `WEBSITE` | Site (link padrão) |
| `INSTANT_EXPERIENCE` | Experiência instantânea (Canvas) |
| `MESSENGER` | Abrir conversa no Messenger |
| `WHATSAPP` | Abrir conversa no WhatsApp |
| `INSTAGRAM_DIRECT` | Direct do Instagram |
| `FACEBOOK_EVENT` | Evento do Facebook |
| `PHONE_CALL` | Ligação telefônica |
| `LEAD_GENERATION` | Formulário instantâneo |

### CTAs Disponíveis (call_to_action.type)

| CTA | Descrição |
|-----|-----------|
| `LEARN_MORE` | Saiba mais |
| `SHOP_NOW` | Comprar agora |
| `SIGN_UP` | Cadastre-se |
| `BOOK_TRAVEL` | Reservar |
| `SUBSCRIBE` | Assinar |
| `DOWNLOAD` | Baixar |
| `GET_QUOTE` | Obter cotação |
| `CONTACT_US` | Fale conosco |
| `CALL_NOW` | Ligar agora |
| `SEND_WHATSAPP_MESSAGE` | WhatsApp |
| `APPLY_NOW` | Candidatar-se |

### Rastreamento e Atribuição

| Campo | Descrição |
|-------|-----------|
| `url_tags` | Parâmetros de URL (UTM) |
| `tracking_specs` | Especificações de rastreamento |
| `conversion_tracking_disabled` | Desabilitar rastreamento |

### Observações do Teste

1. **Schema suporta `instagram_user_id`** - Está no schema (`api-schemas.ts` linha 235), mas não foi documentado de forma proeminente
2. **`call_to_action` está no schema** - Mas tipos e valores não estão documentados na descrição
3. **Formatos múltiplos** - Carrossel, vídeo, e coleção requerem estruturas diferentes
4. **TESTADO:** Criativo com `instagram_user_id` funciona! (ID: `1464498495246842`) - Precisa ser passado explicitamente
5. **Estrutura correta:** `object_story_spec: { page_id, instagram_user_id, link_data: { ... } }`

---

## IDs de Referência (Preencher durante testes)

| Objeto | ID | Notas |
|--------|-----|-------|
| Ad Account | `act_618288566086470` | CA01 - ZAP, BRL |
| Page | `104270431948334` | Automação e Conversão |
| Instagram | `17841457593597590` | Vinculado à página |
| Campanha Teste | `120240534776680649` | [TESTE MCP] Campanha Tráfego |
| Ad Set Teste | `120240534814420649` | [TESTE MCP] Ad Set Tráfego |
| Criativo Teste | `783945517469316` | [TESTE MCP] Criativo Tráfego (sem Instagram) |
| Criativo c/ Instagram | `1464498495246842` | [TESTE MCP] Criativo com Instagram |
| Anúncio Teste | `120240534952610649` | [TESTE MCP] Anúncio Tráfego (sem Instagram) |
| Anúncio c/ Instagram | `120240535072530649` | [TESTE MCP] Anúncio com Instagram |
| Audiência Teste | N/A | Não criada - erro de parâmetro/permissão |

---

**Data de início dos testes:** 2026-02-05

**Data de conclusão:** 2026-02-05

**Testado por:** Oscar Yoshiura + Claude (Cursor AI)
