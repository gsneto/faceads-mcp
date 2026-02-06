/**
 * Tools de Execução - API da Meta
 *
 * Estas tools requerem configuração de API keys (META_ACCESS_TOKEN, META_AD_ACCOUNT_ID).
 * Permitem criar, atualizar e gerenciar campanhas na plataforma Meta Ads.
 */

import { MetaClient, MetaClientError } from './meta-client.js';
import { getConfigurationError, getMetaConfig, isMetaConfigured } from './utils/config.js';
import {
  apiSchemas,
  validateArgs,
  formatValidationError,
  // Descoberta
  type DiscoverAdAccountsArgs,
  type ListFacebookPagesArgs,
  type GetInstagramAccountArgs,
  // Campanhas
  type CreateCampaignArgs,
  type UpdateCampaignArgs,
  type GetCampaignArgs,
  type ListCampaignsArgs,
  type PauseCampaignArgs,
  type ActivateCampaignArgs,
  // Ad Sets
  type ListAdsetsArgs,
  type GetAdsetArgs,
  type CreateAdsetArgs,
  type UpdateAdsetArgs,
  type PauseAdsetArgs,
  type ActivateAdsetArgs,
  // Ads
  type ListAdsArgs,
  type ListCampaignAdsArgs,
  type GetAdArgs,
  type CreateAdArgs,
  type UpdateAdArgs,
  type PauseAdArgs,
  type ActivateAdArgs,
  // Criativos
  type ListCreativesArgs,
  type GetCreativeArgs,
  type CreateCreativeArgs,
  // Insights
  type GetAccountInsightsArgs,
  type GetCampaignInsightsArgs,
  type GetAdsetInsightsArgs,
  type GetAdInsightsArgs,
  type GetAttributionComparisonArgs,
  type GetPerformanceSummaryArgs,
  type ListCampaignAdsWithInsightsArgs,
  // Audiências
  type ListCustomAudiencesArgs,
  type CreateCustomAudienceArgs,
  type GetReachEstimateArgs,
  // Pixels
  type ListPixelsArgs,
  // Geolocalização
  type SearchGeolocationArgs,
  // API Customizada
  type ExecuteApiArgs,
} from './schemas/index.js';

/**
 * Define as tools de execução (API Meta) com JSON Schema manual
 */
export const apiTools = [
  // ==================== DESCOBERTA DE RECURSOS ====================
  {
    name: 'discover_ad_accounts',
    description:
      'Descobre as contas de anúncios do usuário. DEVE ser a primeira chamada de qualquer sessão para obter o ID real da conta (act_XXXXX). Evita erros de ID inventado.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Campos a retornar (default: id, name, account_status, currency, timezone_name)',
        },
      },
    },
  },
  {
    name: 'list_facebook_pages',
    description:
      'Lista as páginas do Facebook do usuário. Necessário para obter o page_id usado na criação de criativos. Retorna também o access_token da página se necessário.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Campos a retornar (default: id, name, access_token, category)',
        },
      },
    },
  },
  {
    name: 'get_instagram_account',
    description:
      'Obtém a conta do Instagram vinculada a uma página do Facebook. Retorna o ID correto do Instagram (formato novo, não o da UI do Meta Ads) para usar no campo instagram_user_id ao criar criativos.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        page_id: { type: 'string', description: 'ID da página do Facebook' },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Campos a retornar (default: instagram_business_account, connected_instagram_account)',
        },
      },
      required: ['page_id'],
    },
  },

  // ==================== CAMPANHAS ====================
  {
    name: 'list_campaigns',
    description: `Lista campanhas da conta de anúncios. Suporta filtro por status.

FILTRAR POR STATUS:
- effective_status: ["ACTIVE"] → só campanhas ativas
- effective_status: ["PAUSED"] → só campanhas pausadas
- effective_status: ["ACTIVE", "PAUSED"] → ativas e pausadas

DICA: Use effective_status para economizar tokens retornando só o que precisa.`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Campos a retornar (default: id, name, status, objective)',
        },
        effective_status: {
          type: 'array',
          items: { 
            type: 'string',
            enum: ['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED', 'PENDING_REVIEW', 'DISAPPROVED', 'PREAPPROVED', 'PENDING_BILLING_INFO', 'CAMPAIGN_PAUSED', 'IN_PROCESS', 'WITH_ISSUES'],
          },
          description: 'Filtrar por status efetivo. Ex: ["ACTIVE"] retorna só campanhas ativas',
        },
      },
    },
  },
  {
    name: 'get_campaign',
    description: 'Obtém detalhes de uma campanha específica, incluindo informações de orçamento para verificar se é CBO (Campaign Budget Optimization). Campos padrão: id, name, status, objective, daily_budget, lifetime_budget, budget_remaining.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        campaign_id: { type: 'string', description: 'ID da campanha' },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Campos a retornar (default inclui campos de orçamento para identificar CBO)',
        },
      },
      required: ['campaign_id'],
    },
  },
  {
    name: 'create_campaign',
    description: `Cria uma nova campanha. Sempre criar com status PAUSED para revisão antes de ativar.

**OBJETIVOS DISPONÍVEIS:**
- OUTCOME_SALES (conversões) - requer promoted_object no ad set
- OUTCOME_LEADS (leads/formulários)
- OUTCOME_TRAFFIC (tráfego para site)
- OUTCOME_ENGAGEMENT (engajamento)
- OUTCOME_AWARENESS (reconhecimento de marca)
- OUTCOME_APP_PROMOTION (instalação de apps)

**FLUXO RECOMENDADO PARA CRIAR CAMPANHA COMPLETA:**
1. \`create_campaign\` - criar a campanha (este passo)
2. \`list_pixels\` - obter pixel_id (se objetivo for OUTCOME_SALES)
3. \`search_geolocation\` - obter keys de localização corretos
4. \`create_adset\` - criar ad set com targeting e promoted_object
5. \`create_creative\` - criar criativo (imagem/vídeo + texto)
6. \`create_ad\` - vincular ad set + criativo

**ORÇAMENTO:**
- Para CBO (Campaign Budget Optimization): defina daily_budget na campanha
- Para ABO (Ad Set Budget): defina daily_budget nos ad sets individuais

O campo is_adset_budget_sharing_enabled é incluído automaticamente como false.`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Nome da campanha' },
        objective: {
          type: 'string',
          enum: ['OUTCOME_AWARENESS', 'OUTCOME_ENGAGEMENT', 'OUTCOME_LEADS', 'OUTCOME_SALES', 'OUTCOME_TRAFFIC', 'OUTCOME_APP_PROMOTION'],
          description: 'Objetivo da campanha',
        },
        status: { type: 'string', enum: ['PAUSED', 'ACTIVE'], description: 'Status inicial (default: PAUSED)' },
        daily_budget: { type: 'number', description: 'Orçamento diário em centavos (para CBO - Campaign Budget Optimization)' },
        special_ad_categories: {
          type: 'array',
          items: { type: 'string', enum: ['CREDIT', 'EMPLOYMENT', 'HOUSING', 'ISSUES_ELECTIONS_POLITICS'] },
          description: 'Categorias especiais de anúncios',
        },
        is_adset_budget_sharing_enabled: {
          type: 'boolean',
          description: 'Permite compartilhamento de até 20% do orçamento entre ad sets (default: false)',
        },
      },
      required: ['name', 'objective'],
    },
  },
  {
    name: 'update_campaign',
    description: 'Atualiza uma campanha existente. Requer API key configurada.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        campaign_id: { type: 'string', description: 'ID da campanha' },
        name: { type: 'string', description: 'Novo nome' },
        status: { type: 'string', enum: ['ACTIVE', 'PAUSED'], description: 'Novo status' },
        daily_budget: { type: 'number', description: 'Novo orçamento diário em centavos' },
      },
      required: ['campaign_id'],
    },
  },
  {
    name: 'pause_campaign',
    description: 'Pausa uma campanha. Requer API key configurada.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        campaign_id: { type: 'string', description: 'ID da campanha' },
      },
      required: ['campaign_id'],
    },
  },
  {
    name: 'activate_campaign',
    description: 'Ativa uma campanha pausada. Requer API key configurada.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        campaign_id: { type: 'string', description: 'ID da campanha' },
      },
      required: ['campaign_id'],
    },
  },

  // ==================== AD SETS ====================
  {
    name: 'list_adsets',
    description: `Lista conjuntos de anúncios da conta. Suporta filtro por status.

FILTRAR POR STATUS:
- effective_status: ["ACTIVE"] → só ad sets ativos
- effective_status: ["PAUSED", "CAMPAIGN_PAUSED"] → pausados (inclui pausados por campanha)

DICA: Use effective_status para economizar tokens.`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        fields: { type: 'array', items: { type: 'string' }, description: 'Campos a retornar' },
        effective_status: {
          type: 'array',
          items: { 
            type: 'string',
            enum: ['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED', 'PENDING_REVIEW', 'DISAPPROVED', 'PREAPPROVED', 'PENDING_BILLING_INFO', 'CAMPAIGN_PAUSED', 'ADSET_PAUSED', 'IN_PROCESS', 'WITH_ISSUES'],
          },
          description: 'Filtrar por status efetivo. Ex: ["ACTIVE"] retorna só ad sets ativos',
        },
      },
    },
  },
  {
    name: 'get_adset',
    description: 'Obtém detalhes de um conjunto de anúncios específico, incluindo targeting e orçamento.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        adset_id: { type: 'string', description: 'ID do ad set' },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Campos a retornar (default: id, name, status, campaign_id, daily_budget, targeting)',
        },
      },
      required: ['adset_id'],
    },
  },
  {
    name: 'create_adset',
    description: `Cria um novo conjunto de anúncios (Ad Set).

**ANTES DE CRIAR:**
1. Use \`list_pixels\` para obter pixel_id (se OFFSITE_CONVERSIONS)
2. Use \`search_geolocation\` para obter keys de localização corretos (CRÍTICO!)

**CAMPOS OBRIGATÓRIOS POR OBJETIVO:**
- OFFSITE_CONVERSIONS: promoted_object com pixel_id + custom_event_type
- APP_INSTALLS: promoted_object com application_id
- PAGE_LIKES: promoted_object com page_id

**ADVANTAGE+ AUDIENCE (v24.0):**
- advantage_audience é injetado automaticamente como 1 (ativado)
- CRÍTICO: Com Advantage+ ativado (1), a API REJEITA age_max < 65 ou age_min > 18 (erro 1870189)
- Use age_min: 18 e age_max: 65 com Advantage+ - a idade vira SUGESTÃO, o Meta pode entregar para qualquer idade
- Para controle RÍGIDO de idade, defina advantage_audience: 0

**LOCALIZAÇÃO - ATENÇÃO:**
NUNCA invente keys! Use search_geolocation para buscar os corretos.
Exemplo errado: key 3847 = California, US (NÃO São Paulo!)
Exemplo correto: key 460 = São Paulo, BR

**EXEMPLO COMPLETO PARA CONVERSÕES:**
\`\`\`json
{
  "name": "Ad Set Conversões",
  "campaign_id": "123456789",
  "optimization_goal": "OFFSITE_CONVERSIONS",
  "billing_event": "IMPRESSIONS",
  "daily_budget": 2000,
  "promoted_object": {
    "pixel_id": "326251992461180",
    "custom_event_type": "PURCHASE"
  },
  "targeting": {
    "geo_locations": {"regions": [{"key": "460"}]},
    "age_min": 18,
    "age_max": 65,
    "targeting_automation": {"advantage_audience": 1}
  }
}
\`\`\`

**Orçamento mínimo Brasil:** R$5,33 (533 centavos). Use 600+ para garantir.`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Nome do ad set' },
        campaign_id: { type: 'string', description: 'ID da campanha pai' },
        daily_budget: { type: 'number', description: 'Orçamento diário em centavos (mínimo 533 no Brasil, recomendado 600+)' },
        billing_event: {
          type: 'string',
          enum: ['IMPRESSIONS', 'LINK_CLICKS', 'APP_INSTALLS', 'PAGE_LIKES', 'POST_ENGAGEMENT', 'VIDEO_VIEWS'],
          description: 'Evento de cobrança',
        },
        optimization_goal: {
          type: 'string',
          enum: [
            // Alcance e impressões
            'REACH', 'IMPRESSIONS', 'AD_RECALL_LIFT',
            // Tráfego
            'LINK_CLICKS', 'LANDING_PAGE_VIEWS',
            // Conversões (OFFSITE_CONVERSIONS é o correto, não CONVERSIONS)
            'OFFSITE_CONVERSIONS', 'VALUE',
            // Engajamento
            'ENGAGED_USERS', 'EVENT_RESPONSES', 'PAGE_LIKES', 'POST_ENGAGEMENT', 'THRUPLAY', 'VIDEO_VIEWS',
            // Leads
            'LEAD_GENERATION', 'QUALITY_LEAD',
            // Apps
            'APP_INSTALLS', 'APP_INSTALLS_AND_OFFSITE_CONVERSIONS',
            // Instagram/Mensagens
            'VISIT_INSTAGRAM_PROFILE', 'PROFILE_VISIT', 'CONVERSATIONS', 'MESSAGING_PURCHASE_CONVERSION', 'MESSAGING_APPOINTMENT_CONVERSION',
            // Outros
            'IN_APP_VALUE', 'SUBSCRIBERS', 'REMINDERS_SET', 'MEANINGFUL_CALL_ATTEMPT', 'QUALITY_CALL', 'DERIVED_EVENTS',
          ],
          description: 'Objetivo de otimização. Para conversões use OFFSITE_CONVERSIONS (não CONVERSIONS).',
        },
        targeting: { type: 'object', description: 'Especificação de targeting' },
        status: { type: 'string', enum: ['PAUSED', 'ACTIVE'], description: 'Status inicial' },
        bid_strategy: {
          type: 'string',
          enum: ['LOWEST_COST_WITHOUT_CAP', 'LOWEST_COST_WITH_BID_CAP', 'COST_CAP', 'BID_CAP'],
          description: 'Estratégia de lance (default: LOWEST_COST_WITHOUT_CAP)',
        },
        bid_amount: { type: 'number', description: 'Valor do lance em centavos (obrigatório para BID_CAP e COST_CAP)' },
        promoted_object: {
          type: 'object',
          description: 'Objeto promovido. OBRIGATÓRIO para: OFFSITE_CONVERSIONS (pixel_id + custom_event_type), APP_INSTALLS (application_id), PAGE_LIKES (page_id). Use list_pixels para obter pixel_id.',
          properties: {
            pixel_id: { type: 'string', description: 'ID do pixel (obrigatório para OFFSITE_CONVERSIONS). Use list_pixels para obter.' },
            custom_event_type: {
              type: 'string',
              enum: ['PURCHASE', 'LEAD', 'COMPLETE_REGISTRATION', 'ADD_TO_CART', 'INITIATE_CHECKOUT', 'ADD_PAYMENT_INFO', 'SEARCH', 'CONTENT_VIEW', 'VIEW_CONTENT', 'ADD_TO_WISHLIST', 'CONTACT', 'CUSTOMIZE_PRODUCT', 'DONATE', 'FIND_LOCATION', 'SCHEDULE', 'SUBMIT_APPLICATION', 'START_TRIAL', 'SUBSCRIBE', 'OTHER'],
              description: 'Tipo de evento de conversão',
            },
            application_id: { type: 'string', description: 'ID do app (obrigatório para APP_INSTALLS)' },
            object_store_url: { type: 'string', description: 'URL da app store' },
            page_id: { type: 'string', description: 'ID da página (obrigatório para PAGE_LIKES)' },
            event_id: { type: 'string', description: 'ID do evento' },
            custom_conversion_id: { type: 'string', description: 'ID de conversão customizada' },
            offline_conversion_data_set_id: { type: 'string', description: 'ID do dataset de conversão offline' },
            product_set_id: { type: 'string', description: 'ID do conjunto de produtos' },
          },
        },
        advantage_audience: {
          type: 'number',
          enum: [0, 1],
          description: 'Público Advantage+ (0=desativado, 1=ativado). OBRIGATÓRIO na v24.0. Default: 1. ATENÇÃO: Com Advantage+ ativado (1), a API REJEITA age_max < 65 ou age_min > 18 (erro 1870189). Use 18-65 com Advantage+.',
        },
        start_time: {
          type: 'string',
          description: 'Data/hora de início do ad set (formato ISO 8601, ex: "2026-02-10T00:00:00-0300")',
        },
        end_time: {
          type: 'string',
          description: 'Data/hora de fim do ad set (formato ISO 8601, ex: "2026-02-28T23:59:59-0300")',
        },
        attribution_spec: {
          type: 'array',
          description: 'Especificação de atribuição. Ex: [{"event_type": "CLICK_THROUGH", "window_days": 7}] para 7d click only.',
          items: {
            type: 'object',
            properties: {
              event_type: { type: 'string', description: 'Tipo de evento (ex: "CLICK_THROUGH", "VIEW_THROUGH")' },
              window_days: { type: 'number', description: 'Dias da janela de atribuição (ex: 1, 7, 28)' },
            },
          },
        },
      },
      required: ['name', 'campaign_id', 'billing_event', 'optimization_goal', 'targeting'],
    },
  },
  {
    name: 'update_adset',
    description: 'Atualiza um conjunto de anúncios. Requer API key configurada.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        adset_id: { type: 'string', description: 'ID do ad set' },
        name: { type: 'string', description: 'Novo nome' },
        status: { type: 'string', enum: ['ACTIVE', 'PAUSED'], description: 'Novo status' },
        daily_budget: { type: 'number', description: 'Novo orçamento diário em centavos' },
        targeting: { type: 'object', description: 'Nova especificação de targeting' },
      },
      required: ['adset_id'],
    },
  },
  {
    name: 'pause_adset',
    description: 'Pausa um conjunto de anúncios. Atalho para update_adset com status PAUSED.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        adset_id: { type: 'string', description: 'ID do ad set' },
      },
      required: ['adset_id'],
    },
  },
  {
    name: 'activate_adset',
    description: 'Ativa um conjunto de anúncios pausado. Atalho para update_adset com status ACTIVE.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        adset_id: { type: 'string', description: 'ID do ad set' },
      },
      required: ['adset_id'],
    },
  },

  // ==================== ADS ====================
  {
    name: 'list_ads',
    description: 'Lista todos os anúncios da conta de anúncios.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Campos a retornar (default: id, name, status, adset_id, effective_status)',
        },
      },
    },
  },
  {
    name: 'list_campaign_ads',
    description: 'Lista todos os anúncios de uma campanha específica. Muito útil para análise de performance por campanha.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        campaign_id: { type: 'string', description: 'ID da campanha' },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Campos a retornar (default: id, name, status, effective_status, adset_id, creative)',
        },
      },
      required: ['campaign_id'],
    },
  },
  {
    name: 'get_ad',
    description: 'Obtém detalhes de um anúncio específico, incluindo effective_status para ver o status real de entrega.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        ad_id: { type: 'string', description: 'ID do anúncio' },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Campos a retornar (default: id, name, status, effective_status, adset_id, creative, created_time)',
        },
      },
      required: ['ad_id'],
    },
  },
  {
    name: 'create_ad',
    description: 'Cria um novo anúncio. Requer API key configurada.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Nome do anúncio' },
        adset_id: { type: 'string', description: 'ID do ad set pai' },
        creative_id: { type: 'string', description: 'ID do criativo a usar' },
        status: { type: 'string', enum: ['PAUSED', 'ACTIVE'], description: 'Status inicial' },
      },
      required: ['name', 'adset_id', 'creative_id'],
    },
  },
  {
    name: 'update_ad',
    description: 'Atualiza um anúncio existente. Use para alterar nome ou status (ACTIVE/PAUSED).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        ad_id: { type: 'string', description: 'ID do anúncio' },
        name: { type: 'string', description: 'Novo nome' },
        status: { type: 'string', enum: ['ACTIVE', 'PAUSED'], description: 'Novo status' },
      },
      required: ['ad_id'],
    },
  },
  {
    name: 'pause_ad',
    description: 'Pausa um anúncio. Atalho para update_ad com status PAUSED.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        ad_id: { type: 'string', description: 'ID do anúncio' },
      },
      required: ['ad_id'],
    },
  },
  {
    name: 'activate_ad',
    description: 'Ativa um anúncio pausado. Atalho para update_ad com status ACTIVE.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        ad_id: { type: 'string', description: 'ID do anúncio' },
      },
      required: ['ad_id'],
    },
  },

  // ==================== CRIATIVOS ====================
  {
    name: 'list_creatives',
    description: 'Lista todos os criativos da conta de anúncios.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Campos a retornar (default: id, name, object_story_spec, thumbnail_url)',
        },
      },
    },
  },
  {
    name: 'get_creative',
    description: 'Obtém detalhes de um criativo específico.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        creative_id: { type: 'string', description: 'ID do criativo' },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Campos a retornar (default: id, name, object_story_spec, thumbnail_url, effective_object_story_id)',
        },
      },
      required: ['creative_id'],
    },
  },
  {
    name: 'create_creative',
    description: `Cria um novo criativo para anúncios.

**Estrutura do object_story_spec para Link Ad:**
\`\`\`json
{
  "page_id": "ID_DA_PAGINA",
  "instagram_user_id": "ID_DO_INSTAGRAM (opcional, use get_instagram_account)",
  "link_data": {
    "link": "https://seu-site.com",
    "message": "Texto do post",
    "name": "Título do anúncio",
    "description": "Descrição",
    "call_to_action": { "type": "LEARN_MORE" }
  }
}
\`\`\`

**CTAs disponíveis:** LEARN_MORE, SHOP_NOW, SIGN_UP, BOOK_TRAVEL, CONTACT_US, DOWNLOAD, GET_QUOTE, APPLY_NOW, SUBSCRIBE, WATCH_MORE

**Dica:** Use list_facebook_pages para obter page_id e get_instagram_account para obter instagram_user_id.`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Nome do criativo' },
        object_story_spec: {
          type: 'object',
          description: 'Especificação do criativo. Deve conter page_id e link_data (ou video_data, photo_data)',
          properties: {
            page_id: { type: 'string', description: 'ID da página do Facebook' },
            instagram_user_id: { type: 'string', description: 'ID do Instagram (obter via get_instagram_account)' },
            link_data: {
              type: 'object',
              description: 'Dados do link para anúncio',
              properties: {
                link: { type: 'string', description: 'URL de destino' },
                message: { type: 'string', description: 'Texto do post' },
                name: { type: 'string', description: 'Título do anúncio' },
                description: { type: 'string', description: 'Descrição' },
                call_to_action: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', description: 'Tipo do CTA (LEARN_MORE, SHOP_NOW, etc.)' },
                  },
                },
              },
            },
          },
        },
      },
      required: ['name'],
    },
  },

  // ==================== INSIGHTS ====================
  {
    name: 'get_account_insights',
    description: `Obtém métricas agregadas da conta de anúncios.

PARÂMETROS DE ATRIBUIÇÃO:
- action_attribution_windows: Quebra conversões por janela (1d_click, 7d_click, 1d_view, incrementality)
- use_unified_attribution_setting: false permite override das janelas

EXEMPLO COM ATRIBUIÇÃO:
fields: ["spend", "actions", "cost_per_action_type"]
action_attribution_windows: ["1d_click", "7d_click", "incrementality"]

INTERPRETAÇÃO:
- value = total com atribuição padrão
- 1d_click = conversões 1 dia após clique
- incrementality = conversões incrementais (impacto real)`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        date_preset: {
          type: 'string',
          enum: ['today', 'yesterday', 'last_7d', 'last_14d', 'last_30d', 'this_month', 'last_month'],
          description: 'Período predefinido',
        },
        time_range: {
          type: 'object',
          properties: {
            since: { type: 'string', description: 'Data inicial (YYYY-MM-DD)' },
            until: { type: 'string', description: 'Data final (YYYY-MM-DD)' },
          },
          description: 'Intervalo de datas personalizado',
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Métricas a retornar (impressions, clicks, spend, reach, cpc, cpm, ctr, actions, cost_per_action_type)',
        },
        action_attribution_windows: {
          type: 'array',
          items: { 
            type: 'string',
            enum: ['1d_click', '7d_click', '28d_click', '1d_view', '7d_view', '28d_view', '1d_ev', 'incrementality', 'dda'],
          },
          description: 'Janelas de atribuição para quebrar métricas de conversão',
        },
        use_unified_attribution_setting: {
          type: 'boolean',
          description: 'Se false, permite especificar janelas manualmente (default: true)',
        },
      },
    },
  },
  {
    name: 'get_campaign_insights',
    description: `Obtém métricas de uma campanha específica.

PARÂMETROS DE ATRIBUIÇÃO AVANÇADA:
- action_attribution_windows: ["1d_click", "7d_click", "incrementality"] - quebra conversões por janela
- use_unified_attribution_setting: false - permite override das config do ad set

DICA: Para análise de eficiência real, use get_attribution_comparison que já formata a comparação entre modelos.`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        campaign_id: { type: 'string', description: 'ID da campanha' },
        date_preset: { 
          type: 'string', 
          enum: ['today', 'yesterday', 'last_7d', 'last_14d', 'last_30d', 'this_month', 'last_month'],
          description: 'Período predefinido' 
        },
        time_range: {
          type: 'object',
          properties: {
            since: { type: 'string', description: 'Data inicial (YYYY-MM-DD)' },
            until: { type: 'string', description: 'Data final (YYYY-MM-DD)' },
          },
        },
        fields: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Métricas (impressions, clicks, spend, reach, cpc, cpm, ctr, actions, cost_per_action_type)',
        },
        action_attribution_windows: {
          type: 'array',
          items: { 
            type: 'string',
            enum: ['1d_click', '7d_click', '28d_click', '1d_view', '7d_view', '28d_view', '1d_ev', 'incrementality', 'dda'],
          },
          description: 'Janelas de atribuição para quebrar métricas de conversão',
        },
        use_unified_attribution_setting: {
          type: 'boolean',
          description: 'Se false, permite especificar janelas manualmente',
        },
      },
      required: ['campaign_id'],
    },
  },
  {
    name: 'get_adset_insights',
    description: `Obtém métricas de um conjunto de anúncios.

PARÂMETROS DE ATRIBUIÇÃO AVANÇADA:
- action_attribution_windows: ["1d_click", "7d_click", "incrementality"] - quebra conversões por janela
- use_unified_attribution_setting: false - permite override das config do ad set

DICA: Para análise de eficiência real, use get_attribution_comparison que já formata a comparação entre modelos.`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        adset_id: { type: 'string', description: 'ID do ad set' },
        date_preset: { 
          type: 'string',
          enum: ['today', 'yesterday', 'last_7d', 'last_14d', 'last_30d', 'this_month', 'last_month'],
        },
        time_range: {
          type: 'object',
          properties: {
            since: { type: 'string', description: 'Data inicial (YYYY-MM-DD)' },
            until: { type: 'string', description: 'Data final (YYYY-MM-DD)' },
          },
        },
        fields: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Métricas (impressions, clicks, spend, reach, cpc, cpm, ctr, actions, cost_per_action_type)',
        },
        action_attribution_windows: {
          type: 'array',
          items: { 
            type: 'string',
            enum: ['1d_click', '7d_click', '28d_click', '1d_view', '7d_view', '28d_view', '1d_ev', 'incrementality', 'dda'],
          },
          description: 'Janelas de atribuição para quebrar métricas de conversão',
        },
        use_unified_attribution_setting: {
          type: 'boolean',
          description: 'Se false, permite especificar janelas manualmente',
        },
      },
      required: ['adset_id'],
    },
  },
  {
    name: 'get_ad_insights',
    description: `Obtém métricas de um anúncio específico. Completa a hierarquia de insights (conta > campanha > adset > ad).

PARÂMETROS DE ATRIBUIÇÃO AVANÇADA:
- action_attribution_windows: ["1d_click", "7d_click", "incrementality"] - quebra conversões por janela
- use_unified_attribution_setting: false - permite override das config do ad set

EXEMPLO DE USO:
fields: ["ad_name", "spend", "actions", "cost_per_action_type"]
action_attribution_windows: ["1d_click", "7d_click", "1d_view", "incrementality"]

DICA: Para comparação formatada entre modelos de atribuição, use get_attribution_comparison.`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        ad_id: { type: 'string', description: 'ID do anúncio' },
        date_preset: {
          type: 'string',
          enum: ['today', 'yesterday', 'last_7d', 'last_14d', 'last_30d', 'this_month', 'last_month'],
          description: 'Período predefinido',
        },
        time_range: {
          type: 'object',
          properties: {
            since: { type: 'string', description: 'Data inicial (YYYY-MM-DD)' },
            until: { type: 'string', description: 'Data final (YYYY-MM-DD)' },
          },
          description: 'Intervalo de datas personalizado',
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Métricas (impressions, clicks, spend, reach, cpc, cpm, ctr, actions, cost_per_action_type)',
        },
        action_attribution_windows: {
          type: 'array',
          items: { 
            type: 'string',
            enum: ['1d_click', '7d_click', '28d_click', '1d_view', '7d_view', '28d_view', '1d_ev', 'incrementality', 'dda'],
          },
          description: 'Janelas de atribuição para quebrar métricas de conversão',
        },
        use_unified_attribution_setting: {
          type: 'boolean',
          description: 'Se false, permite especificar janelas manualmente',
        },
      },
      required: ['ad_id'],
    },
  },
  {
    name: 'get_attribution_comparison',
    description: `Compara métricas de conversão entre diferentes modelos de atribuição (All Conversions vs First Conversion vs Incremental).
    
QUANDO USAR:
- Análise de eficiência real de anúncios/campanhas
- Identificar se está pagando por conversões orgânicas
- Comparar CPA entre modelos de atribuição

INTERPRETAÇÃO:
- Se incrementality < 30% do all_conversions → alto risco de pagar por conversões orgânicas
- first_conversion é mais preciso para métricas de aquisição
- CPA incremental mostra o custo real por conversão adicional`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        object_id: { type: 'string', description: 'ID do objeto (ad, adset ou campaign)' },
        object_type: { 
          type: 'string', 
          enum: ['ad', 'adset', 'campaign'],
          description: 'Tipo do objeto' 
        },
        date_preset: {
          type: 'string',
          enum: ['today', 'yesterday', 'last_7d', 'last_14d', 'last_30d', 'this_month', 'last_month'],
          description: 'Período (default: last_30d)',
        },
        time_range: {
          type: 'object',
          properties: {
            since: { type: 'string', description: 'Data inicial (YYYY-MM-DD)' },
            until: { type: 'string', description: 'Data final (YYYY-MM-DD)' },
          },
          description: 'Intervalo de datas personalizado',
        },
        actions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tipos de conversão para comparar (default: purchase, lead, initiate_checkout)',
        },
      },
      required: ['object_id', 'object_type'],
    },
  },
  {
    name: 'get_performance_summary',
    description: `Resumo de performance da conta com métricas agregadas por atribuição (all vs incremental).

RETORNA:
- spend total do período
- Para cada action_type: all_conversions, incremental, cpa_all, cpa_incremental, incremental_pct
- ROAS (apenas se purchase_conversion_value existir nos dados)

INTERPRETAÇÃO:
- incremental_pct < 30% → alto risco de pagar por conversões orgânicas
- CPA incremental mostra o custo real por conversão adicional
- ROAS incremental é o retorno real sobre investimento

EXEMPLO:
action_types: ["purchase", "lead"]  // opcional, default: ["purchase"]`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        date_preset: {
          type: 'string',
          enum: ['today', 'yesterday', 'last_7d', 'last_14d', 'last_30d', 'this_month', 'last_month'],
          description: 'Período (default: last_30d)',
        },
        time_range: {
          type: 'object',
          properties: {
            since: { type: 'string', description: 'Data inicial (YYYY-MM-DD)' },
            until: { type: 'string', description: 'Data final (YYYY-MM-DD)' },
          },
          description: 'Intervalo de datas personalizado',
        },
        action_types: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tipos de conversão para analisar (default: ["purchase"]). Ex: ["purchase", "lead"]',
        },
      },
    },
  },
  {
    name: 'list_campaign_ads_with_insights',
    description: `Lista todos os anúncios de uma campanha JÁ COM métricas de insights.

RESOLVE O PROBLEMA N+1:
- Antes: list_campaign_ads → loop de get_ad_insights por ad
- Agora: Uma chamada só retorna ads + métricas

SUPORTA ATRIBUIÇÃO:
- action_attribution_windows: ["1d_click", "7d_click", "incrementality"]
- Retorna conversões quebradas por janela

RETORNO:
Para cada ad: id, name, status, effective_status, spend, impressions, clicks, actions (com atribuição se solicitado)`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        campaign_id: { type: 'string', description: 'ID da campanha' },
        date_preset: {
          type: 'string',
          enum: ['today', 'yesterday', 'last_7d', 'last_14d', 'last_30d', 'this_month', 'last_month'],
          description: 'Período (default: last_30d)',
        },
        time_range: {
          type: 'object',
          properties: {
            since: { type: 'string', description: 'Data inicial (YYYY-MM-DD)' },
            until: { type: 'string', description: 'Data final (YYYY-MM-DD)' },
          },
          description: 'Intervalo de datas personalizado',
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Métricas de insights (default: spend, impressions, clicks, actions, cost_per_action_type)',
        },
        action_attribution_windows: {
          type: 'array',
          items: { 
            type: 'string',
            enum: ['1d_click', '7d_click', '28d_click', '1d_view', '7d_view', '28d_view', '1d_ev', 'incrementality', 'dda'],
          },
          description: 'Janelas de atribuição para quebrar métricas de conversão',
        },
      },
      required: ['campaign_id'],
    },
  },

  // ==================== AUDIÊNCIAS ====================
  {
    name: 'list_custom_audiences',
    description: 'Lista audiências customizadas da conta. NOTA: O campo approximate_count foi removido. Use approximate_count_lower_bound e approximate_count_upper_bound, ou omita campos de tamanho.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        fields: { type: 'array', items: { type: 'string' }, description: 'Campos a retornar. Evite approximate_count (depreciado)' },
      },
    },
  },
  {
    name: 'create_custom_audience',
    description: `Cria uma audiência customizada.

**Subtipos e campos obrigatórios:**
- CUSTOM: Requer customer_file_source (ex: "USER_PROVIDED_ONLY")
- WEBSITE: Requer rule com pixel_id e retention
- APP: Requer rule com app_id
- ENGAGEMENT: Requer rule com page_id ou ig_business_id

**Exemplo para WEBSITE (visitantes do site 30 dias):**
\`\`\`json
{
  "name": "Visitantes Site 30D",
  "subtype": "WEBSITE",
  "rule": {
    "inclusions": {
      "operator": "or",
      "rules": [{
        "event_sources": [{"id": "PIXEL_ID", "type": "pixel"}],
        "retention_seconds": 2592000
      }]
    }
  }
}
\`\`\``,
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Nome da audiência' },
        subtype: {
          type: 'string',
          enum: ['CUSTOM', 'WEBSITE', 'APP', 'OFFLINE_CONVERSION', 'LOOKALIKE', 'ENGAGEMENT'],
          description: 'Subtipo da audiência',
        },
        description: { type: 'string', description: 'Descrição da audiência' },
        customer_file_source: {
          type: 'string',
          enum: ['USER_PROVIDED_ONLY', 'PARTNER_PROVIDED_ONLY', 'BOTH_USER_AND_PARTNER_PROVIDED'],
          description: 'Fonte dos dados (obrigatório para CUSTOM)',
        },
        rule: {
          type: 'object',
          description: 'Regra de audiência (obrigatório para WEBSITE, APP, ENGAGEMENT)',
        },
        pixel_id: { type: 'string', description: 'ID do pixel (para WEBSITE)' },
        prefill: { type: 'boolean', description: 'Preencher com dados históricos' },
      },
      required: ['name', 'subtype'],
    },
  },
  {
    name: 'get_reach_estimate',
    description: 'Obtém estimativa de alcance para um targeting. Requer API key configurada.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        targeting_spec: { type: 'object', description: 'Especificação de targeting' },
      },
      required: ['targeting_spec'],
    },
  },

  // ==================== PIXELS ====================
  {
    name: 'list_pixels',
    description: `Lista os pixels da conta de anúncios.

**QUANDO USAR:**
- ANTES de criar ad sets com optimization_goal: OFFSITE_CONVERSIONS
- Para obter o pixel_id correto para o campo promoted_object

**RETORNA:**
- id: ID do pixel (use este valor no promoted_object.pixel_id)
- name: Nome do pixel
- last_fired_time: Última vez que o pixel disparou eventos

**EXEMPLO DE USO:**
1. Chamar list_pixels para obter os IDs disponíveis
2. Usar o pixel_id no create_adset:
\`\`\`json
{
  "promoted_object": {
    "pixel_id": "326251992461180",
    "custom_event_type": "PURCHASE"
  }
}
\`\`\``,
    inputSchema: {
      type: 'object' as const,
      properties: {
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Campos a retornar (default: id, name, last_fired_time, is_created_by_business)',
        },
      },
    },
  },

  // ==================== GEOLOCALIZAÇÃO ====================
  {
    name: 'search_geolocation',
    description: `Busca localizações para targeting de anúncios.

**CRÍTICO:** SEMPRE use esta tool para obter os keys corretos de localização!
Os keys do Meta são ESPECÍFICOS e NÃO correspondem a códigos geográficos padrão.

**EXEMPLO DO PROBLEMA:**
- Key 3847 = California, US (NÃO é São Paulo!)
- Key 460 = São Paulo, BR (estado)
- Key 2430536 = São Paulo, BR (cidade)

**REFERÊNCIA RÁPIDA BRASIL:**
| Localização | Tipo | Key |
|-------------|------|-----|
| Brasil | country | BR |
| São Paulo (estado) | region | 460 |
| Rio de Janeiro (estado) | region | 461 |
| Minas Gerais (estado) | region | 462 |
| Paraná (estado) | region | 478 |
| São Paulo (cidade) | city | 2430536 |

**COMO USAR NO TARGETING:**
\`\`\`json
{
  "geo_locations": {
    "regions": [{"key": "460"}],
    "countries": ["BR"]
  }
}
\`\`\`

**DICA:** Para maior precisão, sempre busque pelo nome E verifique o country_code no resultado.`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        q: { type: 'string', description: 'Termo de busca (ex: "São Paulo", "Brasil", "California")' },
        location_types: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['country', 'region', 'city', 'zip', 'geo_market', 'electoral_district'],
          },
          description: 'Tipos de localização para filtrar (default: todos). Ex: ["region", "city"]',
        },
        country_code: { type: 'string', description: 'Código do país para filtrar resultados (ex: "BR", "US")' },
        limit: { type: 'number', description: 'Número máximo de resultados (default: 25, máx: 100)' },
      },
      required: ['q'],
    },
  },

  // ==================== API CUSTOMIZADA ====================
  {
    name: 'execute_api',
    description: `Executa chamada customizada à API da Meta para endpoints sem tool específica.

CASOS DE USO:
- Duplicar campanha: POST {id}/copies (params: deep_copy, status_option)
- Listar ads de campanha: GET {campaign_id}/ads
- Obter delivery estimate: GET {adset_id}/delivery_estimate
- Descobrir ID da conta: GET me/adaccounts (FAÇA ISSO PRIMEIRO se não souber o ID!)
- Criar campanha com campos novos: POST {ad_account_id}/campaigns (incluir is_adset_budget_sharing_enabled)
- Criar ad set com bid_strategy: POST {ad_account_id}/adsets (incluir bid_strategy: LOWEST_COST_WITHOUT_CAP)

PLACEHOLDER DE CONTA:
- Use {ad_account_id} no endpoint para usar a conta configurada em META_AD_ACCOUNT_ID
- Se passar um act_XXXX diferente do configurado, será substituído automaticamente
- NUNCA invente IDs! Use me/adaccounts para descobrir o ID real

LIMITAÇÕES DO /copies (deep_copy=true):
- Máx 3 objetos em chamada síncrona (erro 1885194 se exceder)
- Máx 51 objetos em chamada assíncrona (async batch)
- Campanhas na UE requerem dsa_payor e dsa_beneficiary configurados

DICA: Use search_documentation seguido de get_document_by_path nos documentos relevantes ou get_endpoint_reference para descobrir parâmetros disponíveis e como realizar a requisição.`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'DELETE'],
          description: 'Método HTTP da requisição',
        },
        endpoint: {
          type: 'string',
          description: 'Endpoint da API (ex: "123456789/copies", "123456789/ads")',
        },
        params: {
          type: 'object',
          description:
            'Parâmetros da requisição. Para /copies: deep_copy (bool), status_option (PAUSED/ACTIVE/INHERITED_FROM_SOURCE)',
        },
      },
      required: ['method', 'endpoint'],
    },
  },
];

/**
 * Verifica se a API está configurada antes de executar
 */
function requireApiConfig(): MetaClient {
  if (!isMetaConfigured()) {
    throw new Error(getConfigurationError());
  }
  return new MetaClient();
}

/**
 * Implementação das tools de API
 */
export async function handleApiTool(
  name: string,
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
  try {
    const client = requireApiConfig();

    switch (name) {
      // ==================== DESCOBERTA DE RECURSOS ====================
      case 'discover_ad_accounts': {
        const validation = validateArgs(apiSchemas.discover_ad_accounts, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleDiscoverAdAccounts(client, validation.data);
      }

      case 'list_facebook_pages': {
        const validation = validateArgs(apiSchemas.list_facebook_pages, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleListFacebookPages(client, validation.data);
      }

      case 'get_instagram_account': {
        const validation = validateArgs(apiSchemas.get_instagram_account, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleGetInstagramAccount(client, validation.data);
      }

      // ==================== CAMPANHAS ====================
      case 'list_campaigns': {
        const validation = validateArgs(apiSchemas.list_campaigns, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleListCampaigns(client, validation.data);
      }

      case 'get_campaign': {
        const validation = validateArgs(apiSchemas.get_campaign, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleGetCampaign(client, validation.data);
      }

      case 'create_campaign': {
        const validation = validateArgs(apiSchemas.create_campaign, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleCreateCampaign(client, validation.data);
      }

      case 'update_campaign': {
        const validation = validateArgs(apiSchemas.update_campaign, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleUpdateCampaign(client, validation.data);
      }

      case 'pause_campaign': {
        const validation = validateArgs(apiSchemas.pause_campaign, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handlePauseCampaign(client, validation.data);
      }

      case 'activate_campaign': {
        const validation = validateArgs(apiSchemas.activate_campaign, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleActivateCampaign(client, validation.data);
      }

      // ==================== AD SETS ====================
      case 'list_adsets': {
        const validation = validateArgs(apiSchemas.list_adsets, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleListAdsets(client, validation.data);
      }

      case 'get_adset': {
        const validation = validateArgs(apiSchemas.get_adset, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleGetAdset(client, validation.data);
      }

      case 'create_adset': {
        const validation = validateArgs(apiSchemas.create_adset, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleCreateAdset(client, validation.data);
      }

      case 'update_adset': {
        const validation = validateArgs(apiSchemas.update_adset, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleUpdateAdset(client, validation.data);
      }

      case 'pause_adset': {
        const validation = validateArgs(apiSchemas.pause_adset, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handlePauseAdset(client, validation.data);
      }

      case 'activate_adset': {
        const validation = validateArgs(apiSchemas.activate_adset, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleActivateAdset(client, validation.data);
      }

      // ==================== ADS ====================
      case 'list_ads': {
        const validation = validateArgs(apiSchemas.list_ads, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleListAds(client, validation.data);
      }

      case 'list_campaign_ads': {
        const validation = validateArgs(apiSchemas.list_campaign_ads, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleListCampaignAds(client, validation.data);
      }

      case 'get_ad': {
        const validation = validateArgs(apiSchemas.get_ad, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleGetAd(client, validation.data);
      }

      case 'create_ad': {
        const validation = validateArgs(apiSchemas.create_ad, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleCreateAd(client, validation.data);
      }

      case 'update_ad': {
        const validation = validateArgs(apiSchemas.update_ad, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleUpdateAd(client, validation.data);
      }

      case 'pause_ad': {
        const validation = validateArgs(apiSchemas.pause_ad, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handlePauseAd(client, validation.data);
      }

      case 'activate_ad': {
        const validation = validateArgs(apiSchemas.activate_ad, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleActivateAd(client, validation.data);
      }

      // ==================== CRIATIVOS ====================
      case 'list_creatives': {
        const validation = validateArgs(apiSchemas.list_creatives, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleListCreatives(client, validation.data);
      }

      case 'get_creative': {
        const validation = validateArgs(apiSchemas.get_creative, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleGetCreative(client, validation.data);
      }

      case 'create_creative': {
        const validation = validateArgs(apiSchemas.create_creative, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleCreateCreative(client, validation.data);
      }

      // ==================== INSIGHTS ====================
      case 'get_account_insights': {
        const validation = validateArgs(apiSchemas.get_account_insights, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleGetAccountInsights(client, validation.data);
      }

      case 'get_campaign_insights': {
        const validation = validateArgs(apiSchemas.get_campaign_insights, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleGetCampaignInsights(client, validation.data);
      }

      case 'get_adset_insights': {
        const validation = validateArgs(apiSchemas.get_adset_insights, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleGetAdsetInsights(client, validation.data);
      }

      case 'get_ad_insights': {
        const validation = validateArgs(apiSchemas.get_ad_insights, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleGetAdInsights(client, validation.data);
      }

      case 'get_attribution_comparison': {
        const validation = validateArgs(apiSchemas.get_attribution_comparison, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleGetAttributionComparison(client, validation.data);
      }

      case 'get_performance_summary': {
        const validation = validateArgs(apiSchemas.get_performance_summary, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleGetPerformanceSummary(client, validation.data);
      }

      case 'list_campaign_ads_with_insights': {
        const validation = validateArgs(apiSchemas.list_campaign_ads_with_insights, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleListCampaignAdsWithInsights(client, validation.data);
      }

      // ==================== AUDIÊNCIAS ====================
      case 'list_custom_audiences': {
        const validation = validateArgs(apiSchemas.list_custom_audiences, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleListCustomAudiences(client, validation.data);
      }

      case 'create_custom_audience': {
        const validation = validateArgs(apiSchemas.create_custom_audience, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleCreateCustomAudience(client, validation.data);
      }

      case 'get_reach_estimate': {
        const validation = validateArgs(apiSchemas.get_reach_estimate, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleGetReachEstimate(client, validation.data);
      }

      // ==================== PIXELS ====================
      case 'list_pixels': {
        const validation = validateArgs(apiSchemas.list_pixels, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleListPixels(client, validation.data);
      }

      // ==================== GEOLOCALIZAÇÃO ====================
      case 'search_geolocation': {
        const validation = validateArgs(apiSchemas.search_geolocation, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleSearchGeolocation(client, validation.data);
      }

      // ==================== API CUSTOMIZADA ====================
      case 'execute_api': {
        const validation = validateArgs(apiSchemas.execute_api, args);
        if (!validation.success) return formatValidationError(validation.error);
        return await handleExecuteApi(client, validation.data);
      }

      default:
        return {
          content: [{ type: 'text', text: `Tool desconhecida: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    // Captura detalhada de qualquer tipo de erro
    let errorDetails: string;

    if (error instanceof MetaClientError) {
      // Erro estruturado da API Meta
      errorDetails = `# Erro da API Meta

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
      // Erro genérico (rede, timeout, etc.)
      errorDetails = `# Erro

**Tipo:** ${error.name}
**Mensagem:** ${error.message}
${error.stack ? `\n**Stack:**\n\`\`\`\n${error.stack}\n\`\`\`` : ''}`;
    } else {
      // Erro desconhecido
      errorDetails = `# Erro Desconhecido

\`\`\`json
${JSON.stringify(error, null, 2)}
\`\`\``;
    }

    return {
      content: [
        {
          type: 'text',
          text: errorDetails,
        },
      ],
      isError: true,
    };
  }
}

// ==================== DISCOVERY HANDLERS ====================

async function handleDiscoverAdAccounts(
  client: MetaClient,
  args: DiscoverAdAccountsArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const result = await client.discoverAdAccounts(args.fields);
  
  const accountsText = result.data.length > 0
    ? result.data.map(acc => {
        const statusMap: Record<number, string> = {
          1: 'ACTIVE',
          2: 'DISABLED',
          3: 'UNSETTLED',
          7: 'PENDING_RISK_REVIEW',
          8: 'PENDING_SETTLEMENT',
          9: 'IN_GRACE_PERIOD',
          100: 'PENDING_CLOSURE',
          101: 'CLOSED',
          201: 'ANY_ACTIVE',
          202: 'ANY_CLOSED',
        };
        const status = statusMap[acc.account_status] || `UNKNOWN (${acc.account_status})`;
        return `### ${acc.name}
- **ID:** ${acc.id}
- **Status:** ${status}
${acc.currency ? `- **Moeda:** ${acc.currency}` : ''}
${acc.timezone_name ? `- **Timezone:** ${acc.timezone_name}` : ''}`;
      }).join('\n\n')
    : 'Nenhuma conta de anúncios encontrada.';

  return {
    content: [
      {
        type: 'text',
        text: `# Contas de Anúncios\n\nEncontradas ${result.data.length} conta(s):\n\n${accountsText}`,
      },
    ],
  };
}

async function handleListFacebookPages(
  client: MetaClient,
  args: ListFacebookPagesArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const result = await client.listFacebookPages(args.fields);
  
  const pagesText = result.data.length > 0
    ? result.data.map(page => `### ${page.name}
- **ID:** ${page.id}
${page.category ? `- **Categoria:** ${page.category}` : ''}
${page.access_token ? `- **Access Token:** (disponível)` : ''}`
      ).join('\n\n')
    : 'Nenhuma página encontrada.';

  return {
    content: [
      {
        type: 'text',
        text: `# Páginas do Facebook\n\nEncontradas ${result.data.length} página(s):\n\n${pagesText}\n\n**Dica:** Use o ID da página para criar criativos ou obter a conta do Instagram vinculada.`,
      },
    ],
  };
}

async function handleGetInstagramAccount(
  client: MetaClient,
  args: GetInstagramAccountArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const result = await client.getInstagramAccount(args.page_id, args.fields);
  
  const igBusinessId = result.instagram_business_account?.id;
  const igConnectedId = result.connected_instagram_account?.id;
  const igId = igBusinessId || igConnectedId;
  
  let text: string;
  if (igId) {
    text = `# Conta do Instagram

**Page ID:** ${result.id}
**Instagram ID:** ${igId}
${igBusinessId ? `- Tipo: Business Account` : ''}
${igConnectedId && !igBusinessId ? `- Tipo: Connected Account` : ''}

**Como usar:**
Ao criar um criativo, use este ID no campo \`instagram_user_id\` dentro de \`object_story_spec\`:

\`\`\`json
{
  "object_story_spec": {
    "page_id": "${result.id}",
    "instagram_user_id": "${igId}",
    "link_data": { ... }
  }
}
\`\`\`

**Importante:** NÃO use o ID que aparece na UI do Meta Ads (formato antigo, depreciado na v22.0+).`;
  } else {
    text = `# Conta do Instagram

**Page ID:** ${result.id}

⚠️ Nenhuma conta do Instagram vinculada a esta página.

Para vincular uma conta do Instagram:
1. Acesse as configurações da página no Facebook
2. Vá em "Contas vinculadas" > "Instagram"
3. Conecte a conta do Instagram Business`;
  }

  return {
    content: [{ type: 'text', text }],
  };
}

// ==================== CAMPAIGN HANDLERS ====================

async function handleListCampaigns(
  client: MetaClient,
  args: ListCampaignsArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const result = await client.listCampaigns(args.fields, args.effective_status);
  
  const filterNote = args.effective_status 
    ? `\n**Filtro:** ${args.effective_status.join(', ')}\n` 
    : '';
  
  return {
    content: [
      {
        type: 'text',
        text: `# Campanhas${filterNote}\nEncontradas ${result.data.length} campanha(s):\n\n${formatCampaigns(result.data)}`,
      },
    ],
  };
}

async function handleGetCampaign(
  client: MetaClient,
  args: GetCampaignArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const campaign = await client.getCampaign(args.campaign_id, args.fields);
  
  // Determinar se é CBO baseado na presença de orçamento na campanha
  const isCBO = !!(campaign.daily_budget || campaign.lifetime_budget);
  const budgetType = isCBO ? 'CBO (Campaign Budget Optimization)' : 'ABO (Ad Set Budget Optimization)';
  
  let budgetInfo = '';
  if (campaign.daily_budget) {
    budgetInfo = `\n**Orçamento Diário:** R$ ${(parseInt(campaign.daily_budget) / 100).toFixed(2)}`;
  }
  if (campaign.lifetime_budget) {
    budgetInfo += `\n**Orçamento Vitalício:** R$ ${(parseInt(campaign.lifetime_budget) / 100).toFixed(2)}`;
  }
  if (campaign.budget_remaining) {
    budgetInfo += `\n**Orçamento Restante:** R$ ${(parseFloat(campaign.budget_remaining as string) / 100).toFixed(2)}`;
  }

  return {
    content: [
      {
        type: 'text',
        text: `# Campanha: ${campaign.name}

**ID:** ${campaign.id}
**Status:** ${campaign.status}
**Objetivo:** ${campaign.objective || 'N/A'}
**Tipo de Orçamento:** ${budgetType}${budgetInfo}
${campaign.created_time ? `**Criada em:** ${campaign.created_time}` : ''}
${campaign.updated_time ? `**Atualizada em:** ${campaign.updated_time}` : ''}

---

**Dados completos:**
${formatObject(campaign)}`,
      },
    ],
  };
}

async function handleCreateCampaign(
  client: MetaClient,
  args: CreateCampaignArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  // Sempre incluir is_adset_budget_sharing_enabled para evitar erro 4834011
  const is_adset_budget_sharing_enabled = args.is_adset_budget_sharing_enabled ?? false;
  
  const result = await client.createCampaign({
    name: args.name,
    objective: args.objective,
    status: args.status,
    daily_budget: args.daily_budget,
    special_ad_categories: args.special_ad_categories,
    is_adset_budget_sharing_enabled,
  });
  return {
    content: [
      {
        type: 'text',
        text: `# Campanha Criada\n\n**ID:** ${result.id}\n**Nome:** ${args.name}\n**Objetivo:** ${args.objective}\n**Status:** ${args.status}\n**Budget Sharing:** ${is_adset_budget_sharing_enabled}`,
      },
    ],
  };
}

async function handleUpdateCampaign(
  client: MetaClient,
  args: UpdateCampaignArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  await client.updateCampaign(args.campaign_id, {
    name: args.name,
    status: args.status,
    daily_budget: args.daily_budget,
  });
  return {
    content: [
      {
        type: 'text',
        text: `# Campanha Atualizada\n\n**ID:** ${args.campaign_id}\n\nAlterações aplicadas com sucesso.`,
      },
    ],
  };
}

async function handlePauseCampaign(
  client: MetaClient,
  args: PauseCampaignArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  await client.updateCampaign(args.campaign_id, { status: 'PAUSED' });
  return {
    content: [
      {
        type: 'text',
        text: `# Campanha Pausada\n\n**ID:** ${args.campaign_id}\n\nA campanha foi pausada com sucesso.`,
      },
    ],
  };
}

async function handleActivateCampaign(
  client: MetaClient,
  args: ActivateCampaignArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  await client.updateCampaign(args.campaign_id, { status: 'ACTIVE' });
  return {
    content: [
      {
        type: 'text',
        text: `# Campanha Ativada\n\n**ID:** ${args.campaign_id}\n\nA campanha foi ativada com sucesso.`,
      },
    ],
  };
}

// ==================== ADSET HANDLERS ====================

async function handleListAdsets(
  client: MetaClient,
  args: ListAdsetsArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const result = await client.listAdSets(args.fields, args.effective_status);
  
  const filterNote = args.effective_status 
    ? `\n**Filtro:** ${args.effective_status.join(', ')}\n` 
    : '';
  
  return {
    content: [
      {
        type: 'text',
        text: `# Conjuntos de Anúncios${filterNote}\nEncontrados ${result.data.length} ad set(s):\n\n${formatAdSets(result.data)}`,
      },
    ],
  };
}

async function handleGetAdset(
  client: MetaClient,
  args: GetAdsetArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const adset = await client.getAdSet(args.adset_id, args.fields);
  return {
    content: [
      {
        type: 'text',
        text: `# Ad Set: ${adset.name}\n\n${formatObject(adset)}`,
      },
    ],
  };
}

async function handleCreateAdset(
  client: MetaClient,
  args: CreateAdsetArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  // Sempre incluir bid_strategy para evitar erro 2490487
  const bid_strategy = args.bid_strategy ?? 'LOWEST_COST_WITHOUT_CAP';
  
  // Validar orçamento mínimo (533 centavos no Brasil)
  if (args.daily_budget && args.daily_budget < 533) {
    return {
      content: [
        {
          type: 'text',
          text: `# Erro de Validação\n\n**Orçamento muito baixo:** R$ ${(args.daily_budget / 100).toFixed(2)}\n\nO orçamento mínimo no Brasil é R$ 5,33 (533 centavos). Use pelo menos 600 centavos para garantir.`,
        },
      ],
    };
  }
  
  // Preparar targeting com targeting_automation (obrigatório na v24.0)
  const advantageAudience = args.advantage_audience ?? 1; // Default: ativado
  const targeting = args.targeting as Record<string, unknown>;
  
  // Injetar targeting_automation.advantage_audience se não existir
  if (!targeting.targeting_automation) {
    targeting.targeting_automation = { advantage_audience: advantageAudience };
  } else if (typeof targeting.targeting_automation === 'object') {
    const targetingAutomation = targeting.targeting_automation as Record<string, unknown>;
    if (targetingAutomation.advantage_audience === undefined) {
      targetingAutomation.advantage_audience = advantageAudience;
    }
  }
  
  // Coletar avisos para incluir na resposta
  const warnings: string[] = [];
  
  // Validação de aviso: age_max < 65 ou age_min > 18 com Advantage+ ativado
  // NOTA: A API Meta REJEITA essas combinações com erro 1870189
  if (advantageAudience === 1) {
    const ageMax = targeting.age_max as number | undefined;
    const ageMin = targeting.age_min as number | undefined;
    
    if (ageMax !== undefined && ageMax < 65) {
      warnings.push(`⚠️ **ERRO PREVISTO:** Com Advantage+ ativado (advantage_audience=1), age_max=${ageMax} será REJEITADO pela API (erro 1870189). Use age_max=65 ou defina advantage_audience=0 para controle rígido de idade.`);
    }
    if (ageMin !== undefined && ageMin > 18) {
      warnings.push(`⚠️ **ERRO PREVISTO:** Com Advantage+ ativado, age_min=${ageMin} será REJEITADO pela API (erro 1870189). Use age_min=18 ou defina advantage_audience=0 para controle rígido de idade.`);
    }
  }
  
  const result = await client.createAdSet({
    name: args.name,
    campaign_id: args.campaign_id,
    billing_event: args.billing_event,
    optimization_goal: args.optimization_goal,
    targeting,
    daily_budget: args.daily_budget,
    status: args.status,
    bid_strategy,
    bid_amount: args.bid_amount,
    promoted_object: args.promoted_object,
    start_time: args.start_time,
    end_time: args.end_time,
    attribution_spec: args.attribution_spec,
  });
  
  let successMessage = `# Ad Set Criado\n\n**ID:** ${result.id}\n**Nome:** ${args.name}\n**Bid Strategy:** ${bid_strategy}\n**Advantage+ Audience:** ${advantageAudience === 1 ? 'Ativado' : 'Desativado'}`;
  
  if (args.promoted_object) {
    successMessage += `\n**Promoted Object:** ${JSON.stringify(args.promoted_object)}`;
  }
  
  if (args.start_time || args.end_time) {
    successMessage += `\n**Agendamento:** ${args.start_time || 'imediato'} até ${args.end_time || 'indefinido'}`;
  }
  
  if (args.attribution_spec) {
    successMessage += `\n**Attribution Spec:** ${JSON.stringify(args.attribution_spec)}`;
  }
  
  if (warnings.length > 0) {
    successMessage += `\n\n---\n\n${warnings.join('\n\n')}`;
  }
  
  return {
    content: [
      {
        type: 'text',
        text: successMessage,
      },
    ],
  };
}

async function handleUpdateAdset(
  client: MetaClient,
  args: UpdateAdsetArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  await client.updateAdSet(args.adset_id, {
    name: args.name,
    status: args.status,
    daily_budget: args.daily_budget,
    targeting: args.targeting,
  });
  return {
    content: [
      {
        type: 'text',
        text: `# Ad Set Atualizado\n\n**ID:** ${args.adset_id}\n\nAlterações aplicadas com sucesso.`,
      },
    ],
  };
}

async function handlePauseAdset(
  client: MetaClient,
  args: PauseAdsetArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  await client.updateAdSet(args.adset_id, { status: 'PAUSED' });
  return {
    content: [
      {
        type: 'text',
        text: `# Ad Set Pausado\n\n**ID:** ${args.adset_id}\n\nO ad set foi pausado com sucesso.`,
      },
    ],
  };
}

async function handleActivateAdset(
  client: MetaClient,
  args: ActivateAdsetArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  await client.updateAdSet(args.adset_id, { status: 'ACTIVE' });
  return {
    content: [
      {
        type: 'text',
        text: `# Ad Set Ativado\n\n**ID:** ${args.adset_id}\n\nO ad set foi ativado com sucesso.`,
      },
    ],
  };
}

// ==================== AD HANDLERS ====================

async function handleListAds(
  client: MetaClient,
  args: ListAdsArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const result = await client.listAds(args.fields);
  return {
    content: [
      {
        type: 'text',
        text: `# Anúncios\n\nEncontrados ${result.data.length} anúncio(s):\n\n${formatAds(result.data)}`,
      },
    ],
  };
}

async function handleListCampaignAds(
  client: MetaClient,
  args: ListCampaignAdsArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const result = await client.listCampaignAds(args.campaign_id, args.fields);
  return {
    content: [
      {
        type: 'text',
        text: `# Anúncios da Campanha ${args.campaign_id}\n\nEncontrados ${result.data.length} anúncio(s):\n\n${formatAds(result.data)}`,
      },
    ],
  };
}

async function handleGetAd(
  client: MetaClient,
  args: GetAdArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const ad = await client.getAd(args.ad_id, args.fields);
  return {
    content: [
      {
        type: 'text',
        text: `# Anúncio: ${ad.name}\n\n${formatObject(ad)}`,
      },
    ],
  };
}

async function handleCreateAd(
  client: MetaClient,
  args: CreateAdArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const result = await client.createAd({
    name: args.name,
    adset_id: args.adset_id,
    creative: { creative_id: args.creative_id },
    status: args.status,
  });
  return {
    content: [
      {
        type: 'text',
        text: `# Anúncio Criado\n\n**ID:** ${result.id}\n**Nome:** ${args.name}`,
      },
    ],
  };
}

async function handleUpdateAd(
  client: MetaClient,
  args: UpdateAdArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  await client.updateAd(args.ad_id, {
    name: args.name,
    status: args.status,
  });
  return {
    content: [
      {
        type: 'text',
        text: `# Anúncio Atualizado\n\n**ID:** ${args.ad_id}\n\nAlterações aplicadas com sucesso.`,
      },
    ],
  };
}

async function handlePauseAd(
  client: MetaClient,
  args: PauseAdArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  await client.updateAd(args.ad_id, { status: 'PAUSED' });
  return {
    content: [
      {
        type: 'text',
        text: `# Anúncio Pausado\n\n**ID:** ${args.ad_id}\n\nO anúncio foi pausado com sucesso.`,
      },
    ],
  };
}

async function handleActivateAd(
  client: MetaClient,
  args: ActivateAdArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  await client.updateAd(args.ad_id, { status: 'ACTIVE' });
  return {
    content: [
      {
        type: 'text',
        text: `# Anúncio Ativado\n\n**ID:** ${args.ad_id}\n\nO anúncio foi ativado com sucesso.`,
      },
    ],
  };
}

// ==================== CREATIVE HANDLERS ====================

async function handleListCreatives(
  client: MetaClient,
  args: ListCreativesArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const result = await client.listCreatives(args.fields);
  return {
    content: [
      {
        type: 'text',
        text: `# Criativos\n\nEncontrados ${result.data.length} criativo(s):\n\n${formatCreatives(result.data)}`,
      },
    ],
  };
}

async function handleGetCreative(
  client: MetaClient,
  args: GetCreativeArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const creative = await client.getCreative(args.creative_id, args.fields);
  return {
    content: [
      {
        type: 'text',
        text: `# Criativo: ${creative.name}\n\n${formatObject(creative)}`,
      },
    ],
  };
}

async function handleCreateCreative(
  client: MetaClient,
  args: CreateCreativeArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  // Validação básica
  if (!args.object_story_spec) {
    return {
      content: [
        {
          type: 'text',
          text: `# Erro de Validação

O campo \`object_story_spec\` é obrigatório para criar um criativo.

**Exemplo de estrutura:**
\`\`\`json
{
  "page_id": "ID_DA_PAGINA",
  "link_data": {
    "link": "https://seu-site.com",
    "message": "Texto do post"
  }
}
\`\`\`

**Dica:** Use \`list_facebook_pages\` para obter o page_id.`,
        },
      ],
    };
  }

  const spec = args.object_story_spec as { page_id?: string; instagram_user_id?: string };
  
  if (!spec.page_id) {
    return {
      content: [
        {
          type: 'text',
          text: `# Erro de Validação

O campo \`page_id\` é obrigatório no \`object_story_spec\`.

**Dica:** Use \`list_facebook_pages\` para obter o ID da sua página.`,
        },
      ],
    };
  }

  const result = await client.createCreative({
    name: args.name,
    object_story_spec: args.object_story_spec,
  });
  
  let successMessage = `# Criativo Criado

**ID:** ${result.id}
**Nome:** ${args.name}
**Page ID:** ${spec.page_id}`;

  if (spec.instagram_user_id) {
    successMessage += `\n**Instagram ID:** ${spec.instagram_user_id}`;
  }

  successMessage += `\n\n**Próximo passo:** Use este creative_id ao criar um anúncio com \`create_ad\`.`;

  return {
    content: [{ type: 'text', text: successMessage }],
  };
}

// ==================== INSIGHTS HANDLERS ====================

async function handleGetAccountInsights(
  client: MetaClient,
  args: GetAccountInsightsArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const result = await client.getAccountInsights({
    date_preset: args.date_preset,
    time_range: args.time_range,
    fields: args.fields,
    action_attribution_windows: args.action_attribution_windows,
    use_unified_attribution_setting: args.use_unified_attribution_setting,
  });
  
  const hasAttribution = args.action_attribution_windows && args.action_attribution_windows.length > 0;
  const attributionNote = hasAttribution 
    ? `\n\n**Janelas de Atribuição:** ${args.action_attribution_windows?.join(', ')}\n` 
    : '';
  
  return {
    content: [
      {
        type: 'text',
        text: `# Insights da Conta${attributionNote}\n\n${formatInsights(result.data, hasAttribution)}`,
      },
    ],
  };
}

async function handleGetCampaignInsights(
  client: MetaClient,
  args: GetCampaignInsightsArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const result = await client.getInsights(args.campaign_id, {
    date_preset: args.date_preset,
    time_range: args.time_range,
    fields: args.fields,
    action_attribution_windows: args.action_attribution_windows,
    use_unified_attribution_setting: args.use_unified_attribution_setting,
  });
  
  const hasAttribution = args.action_attribution_windows && args.action_attribution_windows.length > 0;
  const attributionNote = hasAttribution 
    ? `\n\n**Janelas de Atribuição:** ${args.action_attribution_windows?.join(', ')}\n` 
    : '';
  
  return {
    content: [
      {
        type: 'text',
        text: `# Insights da Campanha ${args.campaign_id}${attributionNote}\n\n${formatInsights(result.data, hasAttribution)}`,
      },
    ],
  };
}

async function handleGetAdsetInsights(
  client: MetaClient,
  args: GetAdsetInsightsArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const result = await client.getInsights(args.adset_id, {
    date_preset: args.date_preset,
    time_range: args.time_range,
    fields: args.fields,
    action_attribution_windows: args.action_attribution_windows,
    use_unified_attribution_setting: args.use_unified_attribution_setting,
  });
  
  const hasAttribution = args.action_attribution_windows && args.action_attribution_windows.length > 0;
  const attributionNote = hasAttribution 
    ? `\n\n**Janelas de Atribuição:** ${args.action_attribution_windows?.join(', ')}\n` 
    : '';
  
  return {
    content: [
      {
        type: 'text',
        text: `# Insights do Ad Set ${args.adset_id}${attributionNote}\n\n${formatInsights(result.data, hasAttribution)}`,
      },
    ],
  };
}

async function handleGetAdInsights(
  client: MetaClient,
  args: GetAdInsightsArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const result = await client.getInsights(args.ad_id, {
    date_preset: args.date_preset,
    time_range: args.time_range,
    fields: args.fields,
    action_attribution_windows: args.action_attribution_windows,
    use_unified_attribution_setting: args.use_unified_attribution_setting,
  });
  
  const hasAttribution = args.action_attribution_windows && args.action_attribution_windows.length > 0;
  const attributionNote = hasAttribution 
    ? `\n\n**Janelas de Atribuição:** ${args.action_attribution_windows?.join(', ')}\n` 
    : '';
  
  return {
    content: [
      {
        type: 'text',
        text: `# Insights do Anúncio ${args.ad_id}${attributionNote}\n\n${formatInsights(result.data, hasAttribution)}`,
      },
    ],
  };
}

async function handleGetAttributionComparison(
  client: MetaClient,
  args: GetAttributionComparisonArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  // Janelas para comparação completa
  const attributionWindows = [
    '1d_click',
    '7d_click', 
    '1d_view',
    '7d_view',
    'incrementality',
  ];
  
  const actionsToTrack = args.actions || ['purchase', 'lead', 'initiate_checkout'];
  
  // Buscar insights com todas as janelas de atribuição
  const result = await client.getInsights(args.object_id, {
    date_preset: args.date_preset || 'last_30d',
    time_range: args.time_range,
    fields: ['spend', 'actions', 'cost_per_action_type'],
    action_attribution_windows: attributionWindows,
    use_unified_attribution_setting: false, // Permite override
  });
  
  if (!result.data || result.data.length === 0) {
    return {
      content: [{
        type: 'text',
        text: `Nenhum dado de insights disponível para ${args.object_type} ${args.object_id}.`,
      }],
    };
  }
  
  const data = result.data[0];
  const spend = parseFloat(data.spend as string || '0');
  const actions = (data.actions as Array<Record<string, unknown>>) || [];
  const costs = (data.cost_per_action_type as Array<Record<string, unknown>>) || [];
  
  const lines: string[] = [
    `# Comparação de Atribuição - ${args.object_type.toUpperCase()} ${args.object_id}`,
    '',
    `**Período:** ${data.date_start || args.date_preset || 'last_30d'} a ${data.date_stop || 'hoje'}`,
    `**Gasto Total:** R$ ${spend.toFixed(2)}`,
    '',
    '## Análise por Tipo de Conversão',
    '',
  ];
  
  for (const actionType of actionsToTrack) {
    const action = actions.find(a => a.action_type === actionType);
    const costData = costs.find(c => c.action_type === actionType);
    
    if (action) {
      const allConversions = parseFloat(action.value as string || '0');
      const click1d = parseFloat(action['1d_click'] as string || '0');
      const click7d = parseFloat(action['7d_click'] as string || '0');
      const view1d = parseFloat(action['1d_view'] as string || '0');
      const incremental = parseFloat(action['incrementality'] as string || '0');
      
      // Calcular CPAs
      const cpaAll = allConversions > 0 ? spend / allConversions : 0;
      const cpaIncremental = incremental > 0 ? spend / incremental : 0;
      
      // Calcular % incremental
      const incrementalPct = allConversions > 0 ? (incremental / allConversions) * 100 : 0;
      
      // Alerta de risco
      let riskAlert = '';
      if (incrementalPct > 0 && incrementalPct < 30) {
        riskAlert = '\n⚠️ **ALERTA:** Menos de 30% das conversões são incrementais - alto risco de pagar por conversões orgânicas!';
      } else if (incrementalPct >= 30 && incrementalPct < 50) {
        riskAlert = '\n⚡ **ATENÇÃO:** Entre 30-50% incrementais - considere testar otimização First Conversion';
      }
      
      lines.push(`### ${actionType.toUpperCase()}`);
      lines.push('');
      lines.push('| Modelo | Conversões | CPA |');
      lines.push('|--------|------------|-----|');
      lines.push(`| All Conversions (padrão) | ${allConversions.toFixed(0)} | R$ ${cpaAll.toFixed(2)} |`);
      lines.push(`| 1d Click | ${click1d.toFixed(0)} | ${click1d > 0 ? `R$ ${(spend / click1d).toFixed(2)}` : '-'} |`);
      lines.push(`| 7d Click | ${click7d.toFixed(0)} | ${click7d > 0 ? `R$ ${(spend / click7d).toFixed(2)}` : '-'} |`);
      lines.push(`| 1d View | ${view1d.toFixed(0)} | ${view1d > 0 ? `R$ ${(spend / view1d).toFixed(2)}` : '-'} |`);
      lines.push(`| **Incremental** | **${incremental.toFixed(0)}** | **R$ ${cpaIncremental.toFixed(2)}** |`);
      lines.push('');
      lines.push(`**% Incremental:** ${incrementalPct.toFixed(1)}% das conversões totais`);
      if (riskAlert) lines.push(riskAlert);
      lines.push('');
    }
  }
  
  // Adicionar seção de interpretação
  lines.push('---');
  lines.push('');
  lines.push('## Como Interpretar');
  lines.push('');
  lines.push('| Modelo | Use quando... | Cuidado com... |');
  lines.push('|--------|---------------|----------------|');
  lines.push('| All Conversions | Quer volume máximo reportado | Inflaciona métricas |');
  lines.push('| First Conversion | Evitar contar mesmo usuário múltiplas vezes | CPA parece maior |');
  lines.push('| Incrementality | Quer saber impacto real dos anúncios | Número muito menor |');
  lines.push('');
  lines.push('**Regra prática:** Se `incrementality < 30%` do total, considere testar otimização First Conversion no ad set.');
  
  return {
    content: [{
      type: 'text',
      text: lines.join('\n'),
    }],
  };
}

async function handleGetPerformanceSummary(
  client: MetaClient,
  args: GetPerformanceSummaryArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const actionTypes = args.action_types || ['purchase'];
  
  // Buscar insights da conta com atribuição expandida
  const result = await client.getAccountInsights({
    date_preset: args.date_preset || 'last_30d',
    time_range: args.time_range,
    fields: ['spend', 'actions', 'cost_per_action_type', 'action_values'],
    action_attribution_windows: ['1d_click', '7d_click', 'incrementality'],
    use_unified_attribution_setting: false,
  });
  
  if (!result.data || result.data.length === 0) {
    return {
      content: [{
        type: 'text',
        text: 'Nenhum dado de insights disponível para o período selecionado.',
      }],
    };
  }
  
  const data = result.data[0];
  const spend = parseFloat(data.spend as string || '0');
  const actions = (data.actions as Array<Record<string, unknown>>) || [];
  const actionValues = (data.action_values as Array<Record<string, unknown>>) || [];
  
  // Construir resumo
  const summary: {
    spend: number;
    period: string;
    conversions: Record<string, {
      all_conversions: number;
      incremental: number;
      cpa_all: number;
      cpa_incremental: number;
      incremental_pct: number;
    }>;
    roas: { all: number; incremental: number } | null;
    roas_note?: string;
  } = {
    spend,
    period: `${data.date_start || ''} a ${data.date_stop || ''}`,
    conversions: {},
    roas: null,
  };
  
  // Processar cada tipo de conversão
  for (const actionType of actionTypes) {
    const action = actions.find(a => a.action_type === actionType);
    
    if (action) {
      const allConversions = parseFloat(action.value as string || '0');
      const incremental = parseFloat(action['incrementality'] as string || '0');
      
      summary.conversions[actionType] = {
        all_conversions: allConversions,
        incremental,
        cpa_all: allConversions > 0 ? spend / allConversions : 0,
        cpa_incremental: incremental > 0 ? spend / incremental : 0,
        incremental_pct: allConversions > 0 ? (incremental / allConversions) * 100 : 0,
      };
    }
  }
  
  // Calcular ROAS se houver valor de conversão
  const purchaseValue = actionValues.find(av => av.action_type === 'purchase' || av.action_type === 'omni_purchase');
  
  if (purchaseValue && purchaseValue.value) {
    const totalValue = parseFloat(purchaseValue.value as string || '0');
    const incrementalValue = parseFloat(purchaseValue['incrementality'] as string || '0');
    
    summary.roas = {
      all: spend > 0 ? totalValue / spend : 0,
      incremental: spend > 0 ? incrementalValue / spend : 0,
    };
  } else {
    summary.roas_note = 'ROAS não disponível - configure purchase_conversion_value na conta para rastrear valor de conversão.';
  }
  
  // Formatar output
  const lines: string[] = [
    '# Resumo de Performance',
    '',
    `**Período:** ${summary.period}`,
    `**Gasto Total:** R$ ${summary.spend.toFixed(2)}`,
    '',
  ];
  
  // Métricas por tipo de conversão
  for (const [actionType, metrics] of Object.entries(summary.conversions)) {
    const riskEmoji = metrics.incremental_pct < 30 ? '⚠️' : (metrics.incremental_pct < 50 ? '⚡' : '✅');
    
    lines.push(`## ${actionType.toUpperCase()}`);
    lines.push('');
    lines.push(`| Métrica | All | Incremental |`);
    lines.push(`|---------|-----|-------------|`);
    lines.push(`| Conversões | ${metrics.all_conversions.toFixed(0)} | ${metrics.incremental.toFixed(0)} |`);
    lines.push(`| CPA | R$ ${metrics.cpa_all.toFixed(2)} | R$ ${metrics.cpa_incremental.toFixed(2)} |`);
    lines.push('');
    lines.push(`${riskEmoji} **% Incremental:** ${metrics.incremental_pct.toFixed(1)}%`);
    lines.push('');
  }
  
  // ROAS
  lines.push('## ROAS');
  lines.push('');
  if (summary.roas) {
    lines.push(`| Métrica | All | Incremental |`);
    lines.push(`|---------|-----|-------------|`);
    lines.push(`| ROAS | ${summary.roas.all.toFixed(2)}x | ${summary.roas.incremental.toFixed(2)}x |`);
  } else {
    lines.push(`*${summary.roas_note}*`);
  }
  lines.push('');
  
  // Interpretação
  lines.push('---');
  lines.push('');
  lines.push('**Interpretação:**');
  lines.push('- % Incremental < 30% ⚠️ = alto risco de pagar por conversões orgânicas');
  lines.push('- % Incremental 30-50% ⚡ = considere testar First Conversion');
  lines.push('- % Incremental > 50% ✅ = boa eficiência incremental');
  
  return {
    content: [{
      type: 'text',
      text: lines.join('\n'),
    }],
  };
}

async function handleListCampaignAdsWithInsights(
  client: MetaClient,
  args: ListCampaignAdsWithInsightsArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  // 1. Listar ads da campanha
  const adsResult = await client.listCampaignAds(args.campaign_id, ['id', 'name', 'status', 'effective_status']);
  
  if (!adsResult.data || adsResult.data.length === 0) {
    return {
      content: [{
        type: 'text',
        text: `Nenhum anúncio encontrado na campanha ${args.campaign_id}.`,
      }],
    };
  }
  
  const ads = adsResult.data;
  const insightsFields = args.fields || ['spend', 'impressions', 'clicks', 'actions', 'cost_per_action_type'];
  
  // 2. Buscar insights de cada ad em paralelo (batch interno)
  const insightsPromises = ads.map(async (ad) => {
    try {
      const insights = await client.getInsights(ad.id as string, {
        date_preset: args.date_preset || 'last_30d',
        time_range: args.time_range,
        fields: insightsFields,
        action_attribution_windows: args.action_attribution_windows,
        use_unified_attribution_setting: args.action_attribution_windows ? false : undefined,
      });
      return { ad, insights: insights.data?.[0] || null };
    } catch {
      // Se falhar para um ad específico, continuar com os outros
      return { ad, insights: null };
    }
  });
  
  const results = await Promise.all(insightsPromises);
  
  // 3. Formatar output
  const lines: string[] = [
    `# Anúncios da Campanha ${args.campaign_id}`,
    '',
    `**Total:** ${ads.length} anúncio(s)`,
    `**Período:** ${args.date_preset || 'last_30d'}`,
  ];
  
  if (args.action_attribution_windows) {
    lines.push(`**Atribuição:** ${args.action_attribution_windows.join(', ')}`);
  }
  lines.push('');
  
  for (const { ad, insights } of results) {
    const statusEmoji = ad.effective_status === 'ACTIVE' ? '✅' : (ad.effective_status === 'PAUSED' ? '⏸️' : '❌');
    
    lines.push(`## ${statusEmoji} ${ad.name}`);
    lines.push(`**ID:** ${ad.id} | **Status:** ${ad.effective_status}`);
    lines.push('');
    
    if (insights) {
      const spend = parseFloat(insights.spend as string || '0');
      const impressions = parseInt(insights.impressions as string || '0', 10);
      const clicks = parseInt(insights.clicks as string || '0', 10);
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      
      lines.push(`| Métrica | Valor |`);
      lines.push(`|---------|-------|`);
      lines.push(`| Spend | R$ ${spend.toFixed(2)} |`);
      lines.push(`| Impressões | ${impressions.toLocaleString()} |`);
      lines.push(`| Cliques | ${clicks.toLocaleString()} |`);
      lines.push(`| CTR | ${ctr.toFixed(2)}% |`);
      
      // Processar actions se existirem
      const actions = (insights.actions as Array<Record<string, unknown>>) || [];
      if (actions.length > 0) {
        lines.push('');
        lines.push('**Conversões:**');
        for (const action of actions) {
          const actionType = action.action_type as string;
          const value = action.value as string;
          
          // Se tiver atribuição, mostrar breakdown
          if (args.action_attribution_windows) {
            const attrValues = args.action_attribution_windows.map((w: string) => {
              const v = action[w] as string | undefined;
              return v ? `${w}: ${v}` : null;
            }).filter(Boolean).join(', ');
            
            lines.push(`- ${actionType}: ${value} (${attrValues || 'sem dados de atribuição'})`);
          } else {
            lines.push(`- ${actionType}: ${value}`);
          }
        }
      }
    } else {
      lines.push('*Sem dados de insights disponíveis*');
    }
    
    lines.push('');
  }
  
  return {
    content: [{
      type: 'text',
      text: lines.join('\n'),
    }],
  };
}

// ==================== AUDIENCE HANDLERS ====================

async function handleListCustomAudiences(
  client: MetaClient,
  args: ListCustomAudiencesArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const result = await client.listCustomAudiences(args.fields);
  return {
    content: [
      {
        type: 'text',
        text: `# Audiências Customizadas\n\nEncontradas ${result.data.length} audiência(s):\n\n${formatAudiences(result.data)}`,
      },
    ],
  };
}

async function handleCreateCustomAudience(
  client: MetaClient,
  args: CreateCustomAudienceArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  // Validação de campos obrigatórios por subtipo
  if (args.subtype === 'CUSTOM' && !args.customer_file_source) {
    return {
      content: [
        {
          type: 'text',
          text: `# Erro de Validação\n\nPara audiências do tipo CUSTOM, o campo \`customer_file_source\` é obrigatório.\n\nValores aceitos: USER_PROVIDED_ONLY, PARTNER_PROVIDED_ONLY, BOTH_USER_AND_PARTNER_PROVIDED`,
        },
      ],
    };
  }
  
  if (['WEBSITE', 'APP', 'ENGAGEMENT'].includes(args.subtype) && !args.rule) {
    return {
      content: [
        {
          type: 'text',
          text: `# Erro de Validação\n\nPara audiências do tipo ${args.subtype}, o campo \`rule\` é obrigatório.\n\nConsulte a documentação para exemplos de regras.`,
        },
      ],
    };
  }

  const result = await client.createCustomAudience({
    name: args.name,
    subtype: args.subtype,
    description: args.description,
    customer_file_source: args.customer_file_source,
    rule: args.rule,
    pixel_id: args.pixel_id,
    prefill: args.prefill,
  });
  return {
    content: [
      {
        type: 'text',
        text: `# Audiência Criada\n\n**ID:** ${result.id}\n**Nome:** ${args.name}\n**Subtipo:** ${args.subtype}`,
      },
    ],
  };
}

async function handleGetReachEstimate(
  client: MetaClient,
  args: GetReachEstimateArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const result = await client.getReachEstimate({
    targeting_spec: args.targeting_spec,
  });
  return {
    content: [
      {
        type: 'text',
        text: `# Estimativa de Alcance\n\n**Alcance estimado:** ${result.data.users_lower_bound.toLocaleString()} - ${result.data.users_upper_bound.toLocaleString()} pessoas`,
      },
    ],
  };
}

// ==================== PIXELS HANDLERS ====================

async function handleListPixels(
  client: MetaClient,
  args: ListPixelsArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const result = await client.listPixels(args.fields);
  
  if (result.data.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: `# Pixels da Conta\n\nNenhum pixel encontrado nesta conta.\n\n**Dica:** Crie um pixel no Facebook Business Manager ou Events Manager antes de criar ad sets com OFFSITE_CONVERSIONS.`,
        },
      ],
    };
  }
  
  const pixelsTable = result.data.map(pixel => {
    const lastFired = pixel.last_fired_time 
      ? new Date(pixel.last_fired_time).toLocaleString('pt-BR')
      : 'Nunca';
    return `| ${pixel.id} | ${pixel.name} | ${lastFired} |`;
  }).join('\n');
  
  return {
    content: [
      {
        type: 'text',
        text: `# Pixels da Conta

Encontrados ${result.data.length} pixel(s):

| ID | Nome | Último Disparo |
|----|------|----------------|
${pixelsTable}

**Como usar no create_adset:**
\`\`\`json
{
  "promoted_object": {
    "pixel_id": "${result.data[0].id}",
    "custom_event_type": "PURCHASE"
  }
}
\`\`\``,
      },
    ],
  };
}

// ==================== GEOLOCALIZAÇÃO HANDLERS ====================

async function handleSearchGeolocation(
  client: MetaClient,
  args: SearchGeolocationArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const result = await client.searchGeolocation({
    q: args.q,
    location_types: args.location_types,
    country_code: args.country_code,
    limit: args.limit,
  });
  
  if (result.data.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: `# Busca de Localização

Nenhuma localização encontrada para "${args.q}".

**Dicas:**
- Tente um termo mais genérico
- Verifique a ortografia
- Use location_types para filtrar (ex: ["region", "city"])
- Use country_code para limitar a um país (ex: "BR")`,
        },
      ],
    };
  }
  
  const locationsTable = result.data.map(loc => {
    const countryInfo = loc.country_code ? `${loc.country_name || loc.country_code}` : '-';
    const regionInfo = loc.region || '-';
    return `| ${loc.key} | ${loc.name} | ${loc.type} | ${countryInfo} | ${regionInfo} |`;
  }).join('\n');
  
  return {
    content: [
      {
        type: 'text',
        text: `# Busca de Localização: "${args.q}"

Encontradas ${result.data.length} localização(ões):

| Key | Nome | Tipo | País | Região |
|-----|------|------|------|--------|
${locationsTable}

**Como usar no targeting do create_adset:**

Para países:
\`\`\`json
{
  "geo_locations": {
    "countries": ["BR"]
  }
}
\`\`\`

Para estados/regiões:
\`\`\`json
{
  "geo_locations": {
    "regions": [{"key": "${result.data[0].key}"}]
  }
}
\`\`\`

Para cidades:
\`\`\`json
{
  "geo_locations": {
    "cities": [{"key": "${result.data[0].key}"}]
  }
}
\`\`\`

**IMPORTANTE:** Use o valor da coluna "Key", NÃO invente IDs!`,
      },
    ],
  };
}

// ==================== API CUSTOMIZADA HANDLER ====================

/**
 * Processa o endpoint substituindo placeholders e validando IDs de conta
 */
function processEndpoint(endpoint: string): { processedEndpoint: string; warnings: string[] } {
  const config = getMetaConfig();
  const warnings: string[] = [];
  let processedEndpoint = endpoint;

  if (!config) {
    return { processedEndpoint, warnings };
  }

  const configuredAccountId = config.adAccountId;

  // 1. Substituir placeholder {ad_account_id} pelo ID configurado
  if (processedEndpoint.includes('{ad_account_id}')) {
    processedEndpoint = processedEndpoint.replace('{ad_account_id}', configuredAccountId);
  }

  // 2. Detectar e corrigir se alguém passou um ID de conta diferente do configurado
  // Padrão: act_NUMEROS no início do endpoint (ex: act_123456789/adimages)
  const accountIdPattern = /^act_\d+/;
  const match = processedEndpoint.match(accountIdPattern);

  if (match) {
    const providedAccountId = match[0];
    if (providedAccountId !== configuredAccountId) {
      warnings.push(
        `⚠️ ID de conta substituído: "${providedAccountId}" → "${configuredAccountId}" (usando META_AD_ACCOUNT_ID configurado)`
      );
      processedEndpoint = processedEndpoint.replace(accountIdPattern, configuredAccountId);
    }
  }

  return { processedEndpoint, warnings };
}

async function handleExecuteApi(
  client: MetaClient,
  args: ExecuteApiArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const { method, endpoint, params } = args;

  // Processar endpoint (substituir placeholders e validar IDs)
  const { processedEndpoint, warnings } = processEndpoint(endpoint);

  let result: unknown;

  switch (method) {
    case 'GET': {
      // Converter params para Record<string, string> para GET
      const queryParams: Record<string, string> = {};
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined && value !== null) {
            queryParams[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
          }
        }
      }
      result = await client.get(processedEndpoint, queryParams);
      break;
    }
    case 'POST': {
      result = await client.post(processedEndpoint, (params as Record<string, unknown>) || {});
      break;
    }
    case 'DELETE': {
      result = await client.delete(processedEndpoint);
      break;
    }
  }

  // Montar resposta com avisos se houver
  const warningsText = warnings.length > 0 ? `\n\n${warnings.join('\n')}\n` : '';

  return {
    content: [
      {
        type: 'text',
        text: `# Resultado da API${warningsText}\n\n**Método:** ${method}\n**Endpoint:** ${processedEndpoint}\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``,
      },
    ],
  };
}

// ==================== FORMATTERS ====================

function formatCampaigns(campaigns: Array<{ id: string; name: string; status: string; objective?: string }>): string {
  if (campaigns.length === 0) return 'Nenhuma campanha encontrada.';

  return campaigns
    .map(
      (c) => `### ${c.name}
- **ID:** ${c.id}
- **Status:** ${c.status}
- **Objetivo:** ${c.objective || 'N/A'}
`
    )
    .join('\n');
}

function formatAdSets(
  adsets: Array<{ id: string; name: string; status: string; campaign_id?: string; daily_budget?: string }>
): string {
  if (adsets.length === 0) return 'Nenhum ad set encontrado.';

  return adsets
    .map(
      (a) => `### ${a.name}
- **ID:** ${a.id}
- **Status:** ${a.status}
- **Campanha:** ${a.campaign_id || 'N/A'}
- **Orçamento diário:** ${a.daily_budget ? `R$ ${(parseInt(a.daily_budget) / 100).toFixed(2)}` : 'N/A'}
`
    )
    .join('\n');
}

function formatAds(
  ads: Array<{ id: string; name: string; status: string; effective_status?: string; adset_id?: string; creative?: object }>
): string {
  if (ads.length === 0) return 'Nenhum anúncio encontrado.';

  return ads
    .map(
      (a) => `### ${a.name}
- **ID:** ${a.id}
- **Status:** ${a.status}
- **Effective Status:** ${a.effective_status || 'N/A'}
- **Ad Set:** ${a.adset_id || 'N/A'}
${a.creative ? `- **Creative ID:** ${(a.creative as { id?: string }).id || 'N/A'}` : ''}
`
    )
    .join('\n');
}

function formatInsights(insights: Array<Record<string, unknown>>, hasAttribution: boolean = false): string {
  if (!insights || insights.length === 0) return 'Nenhum dado de insights disponível.';

  const data = insights[0];
  const lines: string[] = [];

  if (data.date_start && data.date_stop) {
    lines.push(`**Período:** ${data.date_start} a ${data.date_stop}\n`);
  }

  const metrics = [
    { key: 'impressions', label: 'Impressões' },
    { key: 'reach', label: 'Alcance' },
    { key: 'clicks', label: 'Cliques' },
    { key: 'spend', label: 'Gasto' },
    { key: 'cpc', label: 'CPC' },
    { key: 'cpm', label: 'CPM' },
    { key: 'ctr', label: 'CTR' },
  ];

  for (const { key, label } of metrics) {
    if (data[key] !== undefined) {
      let value = data[key];
      if (key === 'spend' || key === 'cpc' || key === 'cpm') {
        value = `R$ ${parseFloat(value as string).toFixed(2)}`;
      } else if (key === 'ctr') {
        value = `${parseFloat(value as string).toFixed(2)}%`;
      } else {
        value = parseInt(value as string).toLocaleString();
      }
      lines.push(`- **${label}:** ${value}`);
    }
  }

  // Formatar actions com breakdown por janela de atribuição
  if (data.actions && Array.isArray(data.actions)) {
    lines.push('\n## Conversões (Actions)\n');
    const actions = data.actions as Array<Record<string, unknown>>;
    
    for (const action of actions) {
      const actionType = action.action_type as string;
      const value = action.value as string;
      
      if (hasAttribution) {
        // Mostrar breakdown por janela
        lines.push(`### ${actionType}`);
        lines.push(`- **Total:** ${value}`);
        
        // Janelas de clique
        if (action['1d_click']) lines.push(`- **1d click:** ${action['1d_click']}`);
        if (action['7d_click']) lines.push(`- **7d click:** ${action['7d_click']}`);
        if (action['28d_click']) lines.push(`- **28d click:** ${action['28d_click']}`);
        
        // Janelas de view
        if (action['1d_view']) lines.push(`- **1d view:** ${action['1d_view']}`);
        if (action['7d_view']) lines.push(`- **7d view:** ${action['7d_view']}`);
        
        // Incremental
        if (action['incrementality']) {
          const incremental = parseFloat(action['incrementality'] as string);
          const total = parseFloat(value);
          const pct = total > 0 ? ((incremental / total) * 100).toFixed(1) : '0';
          lines.push(`- **Incremental:** ${action['incrementality']} (${pct}% do total)`);
        }
        
        lines.push('');
      } else {
        lines.push(`- **${actionType}:** ${value}`);
      }
    }
  }

  // Formatar cost_per_action_type
  if (data.cost_per_action_type && Array.isArray(data.cost_per_action_type)) {
    lines.push('\n## Custo por Conversão (CPA)\n');
    const costs = data.cost_per_action_type as Array<Record<string, unknown>>;
    
    for (const cost of costs) {
      const actionType = cost.action_type as string;
      const value = parseFloat(cost.value as string);
      
      if (hasAttribution) {
        lines.push(`### CPA - ${actionType}`);
        lines.push(`- **CPA Total:** R$ ${value.toFixed(2)}`);
        
        if (cost['1d_click']) lines.push(`- **CPA 1d click:** R$ ${parseFloat(cost['1d_click'] as string).toFixed(2)}`);
        if (cost['7d_click']) lines.push(`- **CPA 7d click:** R$ ${parseFloat(cost['7d_click'] as string).toFixed(2)}`);
        if (cost['incrementality']) lines.push(`- **CPA Incremental:** R$ ${parseFloat(cost['incrementality'] as string).toFixed(2)}`);
        
        lines.push('');
      } else {
        lines.push(`- **CPA ${actionType}:** R$ ${value.toFixed(2)}`);
      }
    }
  }

  return lines.join('\n');
}

function formatCreatives(
  creatives: Array<{ id: string; name: string; object_story_spec?: object; thumbnail_url?: string }>
): string {
  if (creatives.length === 0) return 'Nenhum criativo encontrado.';

  return creatives
    .map(
      (c) => `### ${c.name}
- **ID:** ${c.id}
${c.thumbnail_url ? `- **Thumbnail:** [Ver imagem](${c.thumbnail_url})` : ''}
${c.object_story_spec ? `- **Tipo:** ${getCreativeType(c.object_story_spec)}` : ''}
`
    )
    .join('\n');
}

function getCreativeType(objectStorySpec: object): string {
  const spec = objectStorySpec as Record<string, unknown>;
  if (spec.link_data) return 'Link Ad';
  if (spec.video_data) return 'Video Ad';
  if (spec.photo_data) return 'Image Ad';
  if (spec.text_data) return 'Text Ad';
  return 'Unknown';
}

function formatAudiences(
  audiences: Array<{ id: string; name: string; subtype: string; approximate_count?: number }>
): string {
  if (audiences.length === 0) return 'Nenhuma audiência encontrada.';

  return audiences
    .map(
      (a) => `### ${a.name}
- **ID:** ${a.id}
- **Subtipo:** ${a.subtype}
- **Tamanho aproximado:** ${a.approximate_count?.toLocaleString() || 'N/A'}
`
    )
    .join('\n');
}

function formatObject(obj: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      const formattedValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
      lines.push(`- **${key}:** ${formattedValue}`);
    }
  }
  return lines.join('\n');
}

/**
 * Verifica se o nome é uma tool de API
 */
export function isApiTool(name: string): boolean {
  return apiTools.some((tool) => tool.name === name);
}
