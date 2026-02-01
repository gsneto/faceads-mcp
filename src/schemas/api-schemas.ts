/**
 * Schemas Zod para Tools de API (Execução)
 */

import { z } from 'zod';

// ==================== SCHEMAS DE CAMPANHAS ====================

export const listCampaignsSchema = z.object({
  fields: z
    .array(z.string())
    .optional()
    .describe('Campos a retornar (default: id, name, status, objective)'),
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
  daily_budget: z.number().positive().optional().describe('Orçamento diário em centavos'),
  special_ad_categories: z
    .array(z.enum(['CREDIT', 'EMPLOYMENT', 'HOUSING', 'ISSUES_ELECTIONS_POLITICS']))
    .optional()
    .describe('Categorias especiais de anúncios'),
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
});

export const createAdsetSchema = z.object({
  name: z.string().min(1).describe('Nome do ad set'),
  campaign_id: z.string().min(1).describe('ID da campanha pai'),
  daily_budget: z.number().positive().optional().describe('Orçamento diário em centavos'),
  billing_event: z
    .enum(['IMPRESSIONS', 'LINK_CLICKS', 'APP_INSTALLS', 'PAGE_LIKES', 'POST_ENGAGEMENT', 'VIDEO_VIEWS'])
    .describe('Evento de cobrança'),
  optimization_goal: z
    .enum([
      'REACH',
      'IMPRESSIONS',
      'LINK_CLICKS',
      'LANDING_PAGE_VIEWS',
      'CONVERSIONS',
      'VALUE',
      'APP_INSTALLS',
      'LEAD_GENERATION',
    ])
    .describe('Objetivo de otimização'),
  targeting: z.record(z.string(), z.unknown()).describe('Especificação de targeting'),
  status: z.enum(['PAUSED', 'ACTIVE']).default('PAUSED').describe('Status inicial'),
});

export const updateAdsetSchema = z.object({
  adset_id: z.string().min(1).describe('ID do ad set'),
  name: z.string().min(1).optional().describe('Novo nome'),
  status: z.enum(['ACTIVE', 'PAUSED']).optional().describe('Novo status'),
  daily_budget: z.number().positive().optional().describe('Novo orçamento diário em centavos'),
  targeting: z.record(z.string(), z.unknown()).optional().describe('Nova especificação de targeting'),
});

// ==================== SCHEMAS DE ADS ====================

export const createAdSchema = z.object({
  name: z.string().min(1).describe('Nome do anúncio'),
  adset_id: z.string().min(1).describe('ID do ad set pai'),
  creative_id: z.string().min(1).describe('ID do criativo a usar'),
  status: z.enum(['PAUSED', 'ACTIVE']).default('PAUSED').describe('Status inicial'),
});

// ==================== SCHEMAS DE CRIATIVOS ====================

export const createCreativeSchema = z.object({
  name: z.string().min(1).describe('Nome do criativo'),
  object_story_spec: z.record(z.string(), z.unknown()).optional().describe('Especificação do criativo (link_data, video_data, etc.)'),
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

export const getAccountInsightsSchema = z.object({
  date_preset: datePresetSchema.optional().describe('Período predefinido'),
  time_range: timeRangeSchema.optional().describe('Intervalo de datas personalizado'),
  fields: z
    .array(z.string())
    .optional()
    .describe('Métricas a retornar (impressions, clicks, spend, reach, cpc, cpm, ctr)'),
});

export const getCampaignInsightsSchema = z.object({
  campaign_id: z.string().min(1).describe('ID da campanha'),
  date_preset: datePresetSchema.optional().describe('Período predefinido'),
  time_range: timeRangeSchema.optional(),
  fields: z.array(z.string()).optional(),
});

export const getAdsetInsightsSchema = z.object({
  adset_id: z.string().min(1).describe('ID do ad set'),
  date_preset: datePresetSchema.optional(),
  time_range: timeRangeSchema.optional(),
  fields: z.array(z.string()).optional(),
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
});

export const getReachEstimateSchema = z.object({
  targeting_spec: z.record(z.string(), z.unknown()).describe('Especificação de targeting'),
});

// ==================== TYPES ====================

export type ListCampaignsArgs = z.infer<typeof listCampaignsSchema>;
export type GetCampaignArgs = z.infer<typeof getCampaignSchema>;
export type CreateCampaignArgs = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignArgs = z.infer<typeof updateCampaignSchema>;
export type PauseCampaignArgs = z.infer<typeof pauseCampaignSchema>;
export type ActivateCampaignArgs = z.infer<typeof activateCampaignSchema>;

export type ListAdsetsArgs = z.infer<typeof listAdsetsSchema>;
export type CreateAdsetArgs = z.infer<typeof createAdsetSchema>;
export type UpdateAdsetArgs = z.infer<typeof updateAdsetSchema>;

export type CreateAdArgs = z.infer<typeof createAdSchema>;
export type CreateCreativeArgs = z.infer<typeof createCreativeSchema>;

export type GetAccountInsightsArgs = z.infer<typeof getAccountInsightsSchema>;
export type GetCampaignInsightsArgs = z.infer<typeof getCampaignInsightsSchema>;
export type GetAdsetInsightsArgs = z.infer<typeof getAdsetInsightsSchema>;

export type ListCustomAudiencesArgs = z.infer<typeof listCustomAudiencesSchema>;
export type CreateCustomAudienceArgs = z.infer<typeof createCustomAudienceSchema>;
export type GetReachEstimateArgs = z.infer<typeof getReachEstimateSchema>;

// ==================== SCHEMA MAP ====================

export const apiSchemas = {
  // Campaigns
  list_campaigns: listCampaignsSchema,
  get_campaign: getCampaignSchema,
  create_campaign: createCampaignSchema,
  update_campaign: updateCampaignSchema,
  pause_campaign: pauseCampaignSchema,
  activate_campaign: activateCampaignSchema,
  // Ad Sets
  list_adsets: listAdsetsSchema,
  create_adset: createAdsetSchema,
  update_adset: updateAdsetSchema,
  // Ads
  create_ad: createAdSchema,
  // Creatives
  create_creative: createCreativeSchema,
  // Insights
  get_account_insights: getAccountInsightsSchema,
  get_campaign_insights: getCampaignInsightsSchema,
  get_adset_insights: getAdsetInsightsSchema,
  // Audiences
  list_custom_audiences: listCustomAudiencesSchema,
  create_custom_audience: createCustomAudienceSchema,
  get_reach_estimate: getReachEstimateSchema,
} as const;
