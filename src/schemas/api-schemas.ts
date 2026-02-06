/**
 * Schemas Zod para Tools de API (Execução)
 */

import { z } from 'zod';

// ==================== SCHEMAS DE DESCOBERTA ====================

export const discoverAdAccountsSchema = z.object({
  fields: z
    .array(z.string())
    .optional()
    .describe('Campos a retornar (default: id, name, account_status, currency, timezone_name)'),
});

export const listFacebookPagesSchema = z.object({
  fields: z
    .array(z.string())
    .optional()
    .describe('Campos a retornar (default: id, name, access_token, category)'),
});

export const getInstagramAccountSchema = z.object({
  page_id: z.string().min(1).describe('ID da página do Facebook'),
  fields: z
    .array(z.string())
    .optional()
    .describe('Campos a retornar (default: instagram_business_account, connected_instagram_account)'),
});

// ==================== SCHEMAS DE CAMPANHAS ====================

// Schema para filtrar por status efetivo
const effectiveStatusSchema = z.array(
  z.enum(['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED', 'PENDING_REVIEW', 'DISAPPROVED', 'PREAPPROVED', 'PENDING_BILLING_INFO', 'CAMPAIGN_PAUSED', 'ADSET_PAUSED', 'IN_PROCESS', 'WITH_ISSUES'])
).describe('Filtrar por status efetivo. Ex: ["ACTIVE"] retorna só campanhas ativas');

export const listCampaignsSchema = z.object({
  fields: z
    .array(z.string())
    .optional()
    .describe('Campos a retornar (default: id, name, status, objective)'),
  effective_status: effectiveStatusSchema.optional(),
});

export const getCampaignSchema = z.object({
  campaign_id: z.string().min(1).describe('ID da campanha'),
  fields: z.array(z.string()).optional().describe('Campos a retornar'),
});

export const createCampaignSchema = z.object({
  name: z.string().min(1).describe('Nome da campanha'),
  objective: z
    .enum([
      'OUTCOME_AWARENESS',
      'OUTCOME_ENGAGEMENT',
      'OUTCOME_LEADS',
      'OUTCOME_SALES',
      'OUTCOME_TRAFFIC',
      'OUTCOME_APP_PROMOTION',
    ])
    .describe('Objetivo da campanha'),
  status: z.enum(['PAUSED', 'ACTIVE']).default('PAUSED').describe('Status inicial (default: PAUSED)'),
  daily_budget: z.number().positive().optional().describe('Orçamento diário em centavos (para CBO)'),
  special_ad_categories: z
    .array(z.enum(['CREDIT', 'EMPLOYMENT', 'HOUSING', 'ISSUES_ELECTIONS_POLITICS']))
    .optional()
    .describe('Categorias especiais de anúncios'),
  is_adset_budget_sharing_enabled: z
    .boolean()
    .default(false)
    .describe('Permite compartilhamento de até 20% do orçamento entre ad sets (default: false)'),
});

export const updateCampaignSchema = z.object({
  campaign_id: z.string().min(1).describe('ID da campanha'),
  name: z.string().min(1).optional().describe('Novo nome'),
  status: z.enum(['ACTIVE', 'PAUSED']).optional().describe('Novo status'),
  daily_budget: z.number().positive().optional().describe('Novo orçamento diário em centavos'),
});

export const pauseCampaignSchema = z.object({
  campaign_id: z.string().min(1).describe('ID da campanha'),
});

export const activateCampaignSchema = z.object({
  campaign_id: z.string().min(1).describe('ID da campanha'),
});

// ==================== SCHEMAS DE AD SETS ====================

export const listAdsetsSchema = z.object({
  fields: z.array(z.string()).optional().describe('Campos a retornar'),
  effective_status: effectiveStatusSchema.optional(),
});

export const createAdsetSchema = z.object({
  name: z.string().min(1).describe('Nome do ad set'),
  campaign_id: z.string().min(1).describe('ID da campanha pai'),
  daily_budget: z
    .number()
    .min(533, 'Orçamento mínimo no Brasil é R$ 5,33 (533 centavos)')
    .optional()
    .describe('Orçamento diário em centavos (mínimo 533 no Brasil, recomendado 600+)'),
  billing_event: z
    .enum(['IMPRESSIONS', 'LINK_CLICKS', 'APP_INSTALLS', 'PAGE_LIKES', 'POST_ENGAGEMENT', 'VIDEO_VIEWS'])
    .describe('Evento de cobrança'),
  optimization_goal: z
    .enum([
      // Alcance e impressões
      'REACH',
      'IMPRESSIONS',
      'AD_RECALL_LIFT',
      // Tráfego
      'LINK_CLICKS',
      'LANDING_PAGE_VIEWS',
      // Conversões (OFFSITE_CONVERSIONS é o correto, não CONVERSIONS)
      'OFFSITE_CONVERSIONS',
      'VALUE',
      // Engajamento
      'ENGAGED_USERS',
      'EVENT_RESPONSES',
      'PAGE_LIKES',
      'POST_ENGAGEMENT',
      'THRUPLAY',
      'VIDEO_VIEWS',
      // Leads
      'LEAD_GENERATION',
      'QUALITY_LEAD',
      // Apps
      'APP_INSTALLS',
      'APP_INSTALLS_AND_OFFSITE_CONVERSIONS',
      // Instagram/Mensagens
      'VISIT_INSTAGRAM_PROFILE',
      'PROFILE_VISIT',
      'CONVERSATIONS',
      'MESSAGING_PURCHASE_CONVERSION',
      'MESSAGING_APPOINTMENT_CONVERSION',
      // Outros
      'IN_APP_VALUE',
      'SUBSCRIBERS',
      'REMINDERS_SET',
      'MEANINGFUL_CALL_ATTEMPT',
      'QUALITY_CALL',
      'DERIVED_EVENTS',
    ])
    .describe('Objetivo de otimização'),
  targeting: z.record(z.string(), z.unknown()).describe('Especificação de targeting'),
  status: z.enum(['PAUSED', 'ACTIVE']).default('PAUSED').describe('Status inicial'),
  bid_strategy: z
    .enum(['LOWEST_COST_WITHOUT_CAP', 'LOWEST_COST_WITH_BID_CAP', 'COST_CAP', 'BID_CAP'])
    .default('LOWEST_COST_WITHOUT_CAP')
    .describe('Estratégia de lance (default: LOWEST_COST_WITHOUT_CAP)'),
  bid_amount: z
    .number()
    .positive()
    .optional()
    .describe('Valor do lance em centavos (obrigatório para BID_CAP e COST_CAP)'),
  promoted_object: z
    .object({
      pixel_id: z.string().optional().describe('ID do pixel (obrigatório para OFFSITE_CONVERSIONS). Use list_pixels para obter.'),
      custom_event_type: z.enum([
        'PURCHASE', 'LEAD', 'COMPLETE_REGISTRATION', 'ADD_TO_CART',
        'INITIATE_CHECKOUT', 'ADD_PAYMENT_INFO', 'SEARCH', 'CONTENT_VIEW',
        'VIEW_CONTENT', 'ADD_TO_WISHLIST', 'CONTACT', 'CUSTOMIZE_PRODUCT',
        'DONATE', 'FIND_LOCATION', 'SCHEDULE', 'SUBMIT_APPLICATION',
        'START_TRIAL', 'SUBSCRIBE', 'OTHER',
      ]).optional().describe('Tipo de evento de conversão'),
      application_id: z.string().optional().describe('ID do app (obrigatório para APP_INSTALLS)'),
      object_store_url: z.string().optional().describe('URL da app store'),
      page_id: z.string().optional().describe('ID da página (obrigatório para PAGE_LIKES)'),
      event_id: z.string().optional().describe('ID do evento'),
      custom_conversion_id: z.string().optional().describe('ID de conversão customizada'),
      offline_conversion_data_set_id: z.string().optional().describe('ID do dataset de conversão offline'),
      product_set_id: z.string().optional().describe('ID do conjunto de produtos'),
    })
    .optional()
    .describe('Objeto promovido. OBRIGATÓRIO para OFFSITE_CONVERSIONS (pixel_id + custom_event_type), APP_INSTALLS (application_id), PAGE_LIKES (page_id).'),
  advantage_audience: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe('Público Advantage+ (0=desativado, 1=ativado). OBRIGATÓRIO na v24.0. Default: 1. ATENÇÃO: Com Advantage+ ativado (1), a API REJEITA age_max < 65 ou age_min > 18 (erro 1870189). Use 18-65 com Advantage+.'),
  start_time: z
    .string()
    .optional()
    .describe('Data/hora de início do ad set (formato ISO 8601, ex: "2026-02-10T00:00:00-0300")'),
  end_time: z
    .string()
    .optional()
    .describe('Data/hora de fim do ad set (formato ISO 8601, ex: "2026-02-28T23:59:59-0300")'),
  attribution_spec: z
    .array(z.object({
      event_type: z.string().describe('Tipo de evento (ex: "CLICK_THROUGH", "VIEW_THROUGH")'),
      window_days: z.number().describe('Dias da janela de atribuição (ex: 1, 7, 28)'),
    }))
    .optional()
    .describe('Especificação de atribuição. Ex: [{"event_type": "CLICK_THROUGH", "window_days": 7}] para 7d click only.'),
});

export const updateAdsetSchema = z.object({
  adset_id: z.string().min(1).describe('ID do ad set'),
  name: z.string().min(1).optional().describe('Novo nome'),
  status: z.enum(['ACTIVE', 'PAUSED']).optional().describe('Novo status'),
  daily_budget: z.number().positive().optional().describe('Novo orçamento diário em centavos'),
  targeting: z.record(z.string(), z.unknown()).optional().describe('Nova especificação de targeting'),
});

export const getAdsetSchema = z.object({
  adset_id: z.string().min(1).describe('ID do ad set'),
  fields: z
    .array(z.string())
    .optional()
    .describe('Campos a retornar (default: id, name, status, campaign_id, daily_budget, targeting)'),
});

export const pauseAdsetSchema = z.object({
  adset_id: z.string().min(1).describe('ID do ad set'),
});

export const activateAdsetSchema = z.object({
  adset_id: z.string().min(1).describe('ID do ad set'),
});

// ==================== SCHEMAS DE ADS ====================

export const listAdsSchema = z.object({
  fields: z
    .array(z.string())
    .optional()
    .describe('Campos a retornar (default: id, name, status, adset_id, effective_status)'),
});

export const listCampaignAdsSchema = z.object({
  campaign_id: z.string().min(1).describe('ID da campanha'),
  fields: z
    .array(z.string())
    .optional()
    .describe('Campos a retornar (default: id, name, status, effective_status, adset_id, creative)'),
});

export const getAdSchema = z.object({
  ad_id: z.string().min(1).describe('ID do anúncio'),
  fields: z
    .array(z.string())
    .optional()
    .describe('Campos a retornar (default: id, name, status, effective_status, adset_id, creative, created_time)'),
});

export const createAdSchema = z.object({
  name: z.string().min(1).describe('Nome do anúncio'),
  adset_id: z.string().min(1).describe('ID do ad set pai'),
  creative_id: z.string().min(1).describe('ID do criativo a usar'),
  status: z.enum(['PAUSED', 'ACTIVE']).default('PAUSED').describe('Status inicial'),
});

export const updateAdSchema = z.object({
  ad_id: z.string().min(1).describe('ID do anúncio'),
  name: z.string().min(1).optional().describe('Novo nome'),
  status: z.enum(['ACTIVE', 'PAUSED']).optional().describe('Novo status'),
});

export const pauseAdSchema = z.object({
  ad_id: z.string().min(1).describe('ID do anúncio'),
});

export const activateAdSchema = z.object({
  ad_id: z.string().min(1).describe('ID do anúncio'),
});

// ==================== SCHEMAS DE CRIATIVOS ====================

export const listCreativesSchema = z.object({
  fields: z
    .array(z.string())
    .optional()
    .describe('Campos a retornar (default: id, name, object_story_spec, thumbnail_url)'),
});

export const getCreativeSchema = z.object({
  creative_id: z.string().min(1).describe('ID do criativo'),
  fields: z
    .array(z.string())
    .optional()
    .describe('Campos a retornar (default: id, name, object_story_spec, thumbnail_url, effective_object_story_id)'),
});

// Schema detalhado para object_story_spec
const linkDataSchema = z.object({
  link: z.string().url().describe('URL de destino'),
  message: z.string().optional().describe('Texto do post'),
  name: z.string().optional().describe('Título do anúncio'),
  description: z.string().optional().describe('Descrição'),
  image_hash: z.string().optional().describe('Hash da imagem'),
  call_to_action: z.object({
    type: z.string().describe('Tipo do CTA (LEARN_MORE, SHOP_NOW, SIGN_UP, etc.)'),
    value: z.record(z.string(), z.unknown()).optional(),
  }).optional(),
}).passthrough();

const objectStorySpecSchema = z.object({
  page_id: z.string().min(1).describe('ID da página do Facebook'),
  instagram_user_id: z.string().optional().describe('ID do Instagram (obter via get_instagram_account)'),
  link_data: linkDataSchema.optional(),
  video_data: z.record(z.string(), z.unknown()).optional(),
  photo_data: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

export const createCreativeSchema = z.object({
  name: z.string().min(1).describe('Nome do criativo'),
  object_story_spec: objectStorySpecSchema.optional().describe('Especificação do criativo'),
});

// ==================== SCHEMAS DE INSIGHTS ====================

const timeRangeSchema = z.object({
  since: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Data inicial (YYYY-MM-DD)'),
  until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Data final (YYYY-MM-DD)'),
});

const datePresetSchema = z.enum([
  'today',
  'yesterday',
  'last_7d',
  'last_14d',
  'last_30d',
  'this_month',
  'last_month',
  'this_quarter',
  'last_quarter',
  'this_year',
  'last_year',
]);

// Schema para janelas de atribuicao
const attributionWindowsSchema = z.array(
  z.enum([
    '1d_click',     // 1 dia apos clique
    '7d_click',     // 7 dias apos clique
    '28d_click',    // 28 dias apos clique
    '1d_view',      // 1 dia apos visualizacao
    '7d_view',      // 7 dias apos visualizacao
    '28d_view',     // 28 dias apos visualizacao
    '1d_ev',        // 1 dia engaged view
    'incrementality', // Atribuicao incremental (conversoes que nao teriam acontecido sem o anuncio)
    'dda',          // Data-driven attribution
  ])
).describe(`Janelas de atribuicao para quebrar metricas de conversao.
Cada action retorna com breakdown por janela:
- value: total com atribuicao padrao
- 1d_click: conversoes 1 dia apos clique
- 7d_click: conversoes 7 dias apos clique
- incrementality: conversoes incrementais (modelo causal da Meta)`);

export const getAccountInsightsSchema = z.object({
  date_preset: datePresetSchema.optional().describe('Período predefinido'),
  time_range: timeRangeSchema.optional().describe('Intervalo de datas personalizado'),
  fields: z
    .array(z.string())
    .optional()
    .describe('Métricas a retornar (impressions, clicks, spend, reach, cpc, cpm, ctr, actions, cost_per_action_type)'),
  action_attribution_windows: attributionWindowsSchema.optional(),
  use_unified_attribution_setting: z.boolean().optional().describe(
    'Se false, permite especificar janelas de atribuicao manualmente. Default: true (usa config do ad set)'
  ),
});

export const getCampaignInsightsSchema = z.object({
  campaign_id: z.string().min(1).describe('ID da campanha'),
  date_preset: datePresetSchema.optional().describe('Período predefinido'),
  time_range: timeRangeSchema.optional(),
  fields: z.array(z.string()).optional().describe('Métricas a retornar (inclua actions e cost_per_action_type para conversões)'),
  action_attribution_windows: attributionWindowsSchema.optional(),
  use_unified_attribution_setting: z.boolean().optional().describe(
    'Se false, permite especificar janelas de atribuicao manualmente'
  ),
});

export const getAdsetInsightsSchema = z.object({
  adset_id: z.string().min(1).describe('ID do ad set'),
  date_preset: datePresetSchema.optional().describe('Período predefinido'),
  time_range: timeRangeSchema.optional(),
  fields: z.array(z.string()).optional().describe('Métricas a retornar (inclua actions e cost_per_action_type para conversões)'),
  action_attribution_windows: attributionWindowsSchema.optional(),
  use_unified_attribution_setting: z.boolean().optional().describe(
    'Se false, permite especificar janelas de atribuicao manualmente'
  ),
});

export const getAdInsightsSchema = z.object({
  ad_id: z.string().min(1).describe('ID do anúncio'),
  date_preset: datePresetSchema.optional().describe('Período predefinido'),
  time_range: timeRangeSchema.optional().describe('Intervalo de datas personalizado'),
  fields: z
    .array(z.string())
    .optional()
    .describe('Métricas a retornar (impressions, clicks, spend, reach, cpc, cpm, ctr, actions, cost_per_action_type)'),
  action_attribution_windows: attributionWindowsSchema.optional(),
  use_unified_attribution_setting: z.boolean().optional().describe(
    'Se false, permite especificar janelas de atribuicao manualmente'
  ),
});

export const getAttributionComparisonSchema = z.object({
  object_id: z.string().min(1).describe('ID do objeto (ad, adset ou campaign)'),
  object_type: z.enum(['ad', 'adset', 'campaign']).describe('Tipo do objeto'),
  date_preset: datePresetSchema.optional().default('last_30d').describe('Período (default: last_30d)'),
  time_range: timeRangeSchema.optional(),
  actions: z
    .array(z.string())
    .optional()
    .default(['purchase', 'lead', 'initiate_checkout'])
    .describe('Tipos de conversao para comparar (default: purchase, lead, initiate_checkout)'),
});

export const getPerformanceSummarySchema = z.object({
  date_preset: datePresetSchema.optional().default('last_30d').describe('Período (default: last_30d)'),
  time_range: timeRangeSchema.optional(),
  action_types: z
    .array(z.string())
    .optional()
    .default(['purchase'])
    .describe('Tipos de conversao para analisar (default: purchase). Ex: ["purchase", "lead"]'),
});

export const listCampaignAdsWithInsightsSchema = z.object({
  campaign_id: z.string().min(1).describe('ID da campanha'),
  date_preset: datePresetSchema.optional().default('last_30d').describe('Período (default: last_30d)'),
  time_range: timeRangeSchema.optional(),
  fields: z
    .array(z.string())
    .optional()
    .default(['spend', 'impressions', 'clicks', 'actions', 'cost_per_action_type'])
    .describe('Métricas de insights a retornar'),
  action_attribution_windows: attributionWindowsSchema.optional().describe(
    'Janelas de atribuição para quebrar métricas de conversão'
  ),
});

// ==================== SCHEMAS DE AUDIÊNCIAS ====================

export const listCustomAudiencesSchema = z.object({
  fields: z.array(z.string()).optional().describe('Campos a retornar'),
});

export const createCustomAudienceSchema = z.object({
  name: z.string().min(1).describe('Nome da audiência'),
  subtype: z
    .enum(['CUSTOM', 'WEBSITE', 'APP', 'OFFLINE_CONVERSION', 'LOOKALIKE', 'ENGAGEMENT'])
    .describe('Subtipo da audiência'),
  description: z.string().optional().describe('Descrição da audiência'),
  customer_file_source: z
    .enum(['USER_PROVIDED_ONLY', 'PARTNER_PROVIDED_ONLY', 'BOTH_USER_AND_PARTNER_PROVIDED'])
    .optional()
    .describe('Fonte dos dados (obrigatório para subtype CUSTOM). USER_PROVIDED_ONLY = dados próprios'),
  rule: z
    .record(z.string(), z.unknown())
    .optional()
    .describe('Regra de audiência (obrigatório para WEBSITE, APP, ENGAGEMENT). Ex: {"inclusions":{"operator":"or","rules":[{"event_sources":[{"id":"PIXEL_ID"}],"retention_seconds":2592000}]}}'),
  pixel_id: z
    .string()
    .optional()
    .describe('ID do pixel (para audiências WEBSITE)'),
  prefill: z
    .boolean()
    .optional()
    .describe('Preencher com dados históricos (default: true)'),
});

export const getReachEstimateSchema = z.object({
  targeting_spec: z.record(z.string(), z.unknown()).describe('Especificação de targeting'),
});

// ==================== PIXELS ====================

export const listPixelsSchema = z.object({
  fields: z
    .array(z.string())
    .optional()
    .describe('Campos a retornar (default: id, name, last_fired_time, is_created_by_business)'),
});

// ==================== GEOLOCALIZAÇÃO ====================

export const searchGeolocationSchema = z.object({
  q: z.string().min(1).describe('Termo de busca (ex: "São Paulo", "Brasil", "California")'),
  location_types: z
    .array(z.enum(['country', 'region', 'city', 'zip', 'geo_market', 'electoral_district']))
    .optional()
    .describe('Tipos de localização para filtrar (default: todos). Ex: ["region", "city"]'),
  country_code: z
    .string()
    .optional()
    .describe('Código do país para filtrar (ex: "BR", "US")'),
  limit: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .describe('Número máximo de resultados (default: 25)'),
});

// ==================== API CUSTOMIZADA ====================

export const executeApiSchema = z.object({
  method: z.enum(['GET', 'POST', 'DELETE']).describe('Método HTTP'),
  endpoint: z.string().min(1).describe('Endpoint da API (ex: "123456789/copies")'),
  params: z.record(z.string(), z.unknown()).optional().describe('Parâmetros da requisição'),
});

// ==================== TYPES ====================

// Descoberta
export type DiscoverAdAccountsArgs = z.infer<typeof discoverAdAccountsSchema>;
export type ListFacebookPagesArgs = z.infer<typeof listFacebookPagesSchema>;
export type GetInstagramAccountArgs = z.infer<typeof getInstagramAccountSchema>;

// Campanhas
export type ListCampaignsArgs = z.infer<typeof listCampaignsSchema>;
export type GetCampaignArgs = z.infer<typeof getCampaignSchema>;
export type CreateCampaignArgs = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignArgs = z.infer<typeof updateCampaignSchema>;
export type PauseCampaignArgs = z.infer<typeof pauseCampaignSchema>;
export type ActivateCampaignArgs = z.infer<typeof activateCampaignSchema>;

export type ListAdsetsArgs = z.infer<typeof listAdsetsSchema>;
export type GetAdsetArgs = z.infer<typeof getAdsetSchema>;
export type CreateAdsetArgs = z.infer<typeof createAdsetSchema>;
export type UpdateAdsetArgs = z.infer<typeof updateAdsetSchema>;
export type PauseAdsetArgs = z.infer<typeof pauseAdsetSchema>;
export type ActivateAdsetArgs = z.infer<typeof activateAdsetSchema>;

export type ListAdsArgs = z.infer<typeof listAdsSchema>;
export type ListCampaignAdsArgs = z.infer<typeof listCampaignAdsSchema>;
export type GetAdArgs = z.infer<typeof getAdSchema>;
export type CreateAdArgs = z.infer<typeof createAdSchema>;
export type UpdateAdArgs = z.infer<typeof updateAdSchema>;
export type PauseAdArgs = z.infer<typeof pauseAdSchema>;
export type ActivateAdArgs = z.infer<typeof activateAdSchema>;

export type ListCreativesArgs = z.infer<typeof listCreativesSchema>;
export type GetCreativeArgs = z.infer<typeof getCreativeSchema>;
export type CreateCreativeArgs = z.infer<typeof createCreativeSchema>;

export type GetAccountInsightsArgs = z.infer<typeof getAccountInsightsSchema>;
export type GetCampaignInsightsArgs = z.infer<typeof getCampaignInsightsSchema>;
export type GetAdsetInsightsArgs = z.infer<typeof getAdsetInsightsSchema>;
export type GetAdInsightsArgs = z.infer<typeof getAdInsightsSchema>;
export type GetAttributionComparisonArgs = z.infer<typeof getAttributionComparisonSchema>;
export type GetPerformanceSummaryArgs = z.infer<typeof getPerformanceSummarySchema>;
export type ListCampaignAdsWithInsightsArgs = z.infer<typeof listCampaignAdsWithInsightsSchema>;

export type ListCustomAudiencesArgs = z.infer<typeof listCustomAudiencesSchema>;
export type CreateCustomAudienceArgs = z.infer<typeof createCustomAudienceSchema>;
export type GetReachEstimateArgs = z.infer<typeof getReachEstimateSchema>;

// Pixels
export type ListPixelsArgs = z.infer<typeof listPixelsSchema>;

// Geolocalização
export type SearchGeolocationArgs = z.infer<typeof searchGeolocationSchema>;

export type ExecuteApiArgs = z.infer<typeof executeApiSchema>;

// ==================== SCHEMA MAP ====================

export const apiSchemas = {
  // Descoberta
  discover_ad_accounts: discoverAdAccountsSchema,
  list_facebook_pages: listFacebookPagesSchema,
  get_instagram_account: getInstagramAccountSchema,
  // Campaigns
  list_campaigns: listCampaignsSchema,
  get_campaign: getCampaignSchema,
  create_campaign: createCampaignSchema,
  update_campaign: updateCampaignSchema,
  pause_campaign: pauseCampaignSchema,
  activate_campaign: activateCampaignSchema,
  // Ad Sets
  list_adsets: listAdsetsSchema,
  get_adset: getAdsetSchema,
  create_adset: createAdsetSchema,
  update_adset: updateAdsetSchema,
  pause_adset: pauseAdsetSchema,
  activate_adset: activateAdsetSchema,
  // Ads
  list_ads: listAdsSchema,
  list_campaign_ads: listCampaignAdsSchema,
  get_ad: getAdSchema,
  create_ad: createAdSchema,
  update_ad: updateAdSchema,
  pause_ad: pauseAdSchema,
  activate_ad: activateAdSchema,
  // Creatives
  list_creatives: listCreativesSchema,
  get_creative: getCreativeSchema,
  create_creative: createCreativeSchema,
  // Insights
  get_account_insights: getAccountInsightsSchema,
  get_campaign_insights: getCampaignInsightsSchema,
  get_adset_insights: getAdsetInsightsSchema,
  get_ad_insights: getAdInsightsSchema,
  get_attribution_comparison: getAttributionComparisonSchema,
  get_performance_summary: getPerformanceSummarySchema,
  list_campaign_ads_with_insights: listCampaignAdsWithInsightsSchema,
  // Audiences
  list_custom_audiences: listCustomAudiencesSchema,
  create_custom_audience: createCustomAudienceSchema,
  get_reach_estimate: getReachEstimateSchema,
  // Pixels
  list_pixels: listPixelsSchema,
  // Geolocalização
  search_geolocation: searchGeolocationSchema,
  // API Customizada
  execute_api: executeApiSchema,
} as const;
