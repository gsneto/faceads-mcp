/**
 * Cliente para a API da Meta (Facebook Marketing API)
 *
 * Abstrai chamadas HTTP para a Graph API da Meta.
 */

import { getMetaConfig, getConfigurationError, MetaConfig } from './utils/config.js';

const META_GRAPH_URL = 'https://graph.facebook.com';

/**
 * Tipos de resposta da API
 */
export interface MetaApiResponse<T = unknown> {
  data?: T;
  error?: MetaApiError;
  paging?: {
    cursors?: {
      before: string;
      after: string;
    };
    next?: string;
    previous?: string;
  };
}

export interface MetaApiError {
  message: string;
  type: string;
  code: number;
  error_subcode?: number;
  error_data?: string;
  error_user_title?: string;
  error_user_msg?: string;
  fbtrace_id?: string;
}

/**
 * Tipos para objetos da API
 */
export interface Campaign {
  id: string;
  name: string;
  status: string;
  objective?: string;
  created_time?: string;
  updated_time?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  [key: string]: unknown;
}

export interface AdSet {
  id: string;
  name: string;
  status: string;
  campaign_id: string;
  daily_budget?: string;
  lifetime_budget?: string;
  targeting?: object;
  [key: string]: unknown;
}

export interface Ad {
  id: string;
  name: string;
  status: string;
  adset_id: string;
  creative?: object;
  [key: string]: unknown;
}

export interface AdCreative {
  id: string;
  name: string;
  object_story_spec?: object;
  [key: string]: unknown;
}

export interface InsightsResult {
  impressions?: string;
  clicks?: string;
  spend?: string;
  reach?: string;
  cpc?: string;
  cpm?: string;
  ctr?: string;
  actions?: Array<{ action_type: string; value: string }>;
  date_start?: string;
  date_stop?: string;
  [key: string]: unknown;
}

export interface CustomAudience {
  id: string;
  name: string;
  subtype: string;
  approximate_count?: number;
  [key: string]: unknown;
}

/**
 * Cliente para a Meta Marketing API
 */
export class MetaClient {
  private config: MetaConfig;

  constructor() {
    const config = getMetaConfig();
    if (!config) {
      throw new Error(getConfigurationError());
    }
    this.config = config;
  }

  /**
   * Verifica se o cliente está configurado
   */
  static isConfigured(): boolean {
    return getMetaConfig() !== null;
  }

  /**
   * Retorna mensagem de erro de configuração
   */
  static getConfigError(): string {
    return getConfigurationError();
  }

  /**
   * URL base da API
   */
  private get baseUrl(): string {
    return `${META_GRAPH_URL}/${this.config.apiVersion}`;
  }

  /**
   * Faz requisição GET para a API
   */
  async get<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}/${endpoint}`);
    url.searchParams.set('access_token', this.config.accessToken);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    let response: Response;
    try {
      response = await fetch(url.toString());
    } catch (networkError) {
      // Erro de rede (DNS, conexão, etc.)
      throw new MetaClientError({
        message: `Erro de rede: ${networkError instanceof Error ? networkError.message : String(networkError)}`,
        type: 'NetworkError',
        code: -1,
      });
    }

    let data: MetaApiResponse<T>;
    try {
      data = (await response.json()) as MetaApiResponse<T>;
    } catch (parseError) {
      // Erro ao fazer parse do JSON
      throw new MetaClientError({
        message: `Erro ao processar resposta (HTTP ${response.status}): ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        type: 'ParseError',
        code: response.status,
      });
    }

    if (data.error) {
      throw new MetaClientError(data.error);
    }

    return data as T;
  }

  /**
   * Faz requisição POST para a API
   */
  async post<T>(endpoint: string, body: Record<string, unknown> = {}): Promise<T> {
    const url = `${this.baseUrl}/${endpoint}`;

    const formData = new URLSearchParams();
    formData.set('access_token', this.config.accessToken);

    for (const [key, value] of Object.entries(body)) {
      if (value !== undefined && value !== null) {
        formData.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });
    } catch (networkError) {
      throw new MetaClientError({
        message: `Erro de rede: ${networkError instanceof Error ? networkError.message : String(networkError)}`,
        type: 'NetworkError',
        code: -1,
      });
    }

    let data: MetaApiResponse<T>;
    try {
      data = (await response.json()) as MetaApiResponse<T>;
    } catch (parseError) {
      throw new MetaClientError({
        message: `Erro ao processar resposta (HTTP ${response.status}): ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        type: 'ParseError',
        code: response.status,
      });
    }

    if (data.error) {
      throw new MetaClientError(data.error);
    }

    return data as T;
  }

  /**
   * Faz requisição DELETE para a API
   */
  async delete(endpoint: string): Promise<{ success: boolean }> {
    const url = new URL(`${this.baseUrl}/${endpoint}`);
    url.searchParams.set('access_token', this.config.accessToken);

    let response: Response;
    try {
      response = await fetch(url.toString(), { method: 'DELETE' });
    } catch (networkError) {
      throw new MetaClientError({
        message: `Erro de rede: ${networkError instanceof Error ? networkError.message : String(networkError)}`,
        type: 'NetworkError',
        code: -1,
      });
    }

    let data: MetaApiResponse<{ success: boolean }>;
    try {
      data = (await response.json()) as MetaApiResponse<{ success: boolean }>;
    } catch (parseError) {
      throw new MetaClientError({
        message: `Erro ao processar resposta (HTTP ${response.status}): ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        type: 'ParseError',
        code: response.status,
      });
    }

    if (data.error) {
      throw new MetaClientError(data.error);
    }

    return data as { success: boolean };
  }

  // ==================== DESCOBERTA DE RECURSOS ====================

  /**
   * Descobre contas de anúncios do usuário
   * Deve ser a primeira chamada para obter o ID real da conta
   */
  async discoverAdAccounts(
    fields: string[] = ['id', 'name', 'account_status', 'currency', 'timezone_name']
  ): Promise<{ data: Array<{ id: string; name: string; account_status: number; [key: string]: unknown }> }> {
    return this.get('me/adaccounts', { fields: fields.join(',') });
  }

  /**
   * Lista páginas do Facebook do usuário
   * Necessário para obter page_id para criar criativos
   */
  async listFacebookPages(
    fields: string[] = ['id', 'name', 'access_token', 'category']
  ): Promise<{ data: Array<{ id: string; name: string; access_token?: string; [key: string]: unknown }> }> {
    return this.get('me/accounts', { fields: fields.join(',') });
  }

  /**
   * Obtém conta do Instagram vinculada a uma página
   * Retorna o ID correto do Instagram (formato novo) para usar em criativos
   */
  async getInstagramAccount(
    pageId: string,
    fields: string[] = ['instagram_business_account', 'connected_instagram_account']
  ): Promise<{
    id: string;
    instagram_business_account?: { id: string };
    connected_instagram_account?: { id: string };
  }> {
    return this.get(pageId, { fields: fields.join(',') });
  }

  // ==================== CAMPANHAS ====================

  /**
   * Lista campanhas da conta
   */
  async listCampaigns(
    fields: string[] = ['id', 'name', 'status', 'objective', 'created_time'],
    effectiveStatus?: string[]
  ): Promise<{ data: Campaign[] }> {
    const params: Record<string, string> = {
      fields: fields.join(','),
    };
    
    // Adiciona filtro por effective_status se especificado
    if (effectiveStatus && effectiveStatus.length > 0) {
      params.filtering = JSON.stringify([{
        field: 'effective_status',
        operator: 'IN',
        value: effectiveStatus,
      }]);
    }
    
    return this.get<{ data: Campaign[] }>(`${this.config.adAccountId}/campaigns`, params);
  }

  /**
   * Obtém uma campanha específica
   * Inclui campos de orçamento por default para verificar se é CBO
   */
  async getCampaign(
    campaignId: string,
    fields: string[] = ['id', 'name', 'status', 'objective', 'daily_budget', 'lifetime_budget', 'budget_remaining', 'created_time', 'updated_time']
  ): Promise<Campaign> {
    return this.get<Campaign>(campaignId, { fields: fields.join(',') });
  }

  /**
   * Cria uma nova campanha
   */
  async createCampaign(params: {
    name: string;
    objective: string;
    status?: string;
    special_ad_categories?: string[];
    daily_budget?: number;
    lifetime_budget?: number;
    is_adset_budget_sharing_enabled?: boolean;
  }): Promise<{ id: string }> {
    return this.post<{ id: string }>(`${this.config.adAccountId}/campaigns`, {
      ...params,
      special_ad_categories: params.special_ad_categories || [],
      // Campo obrigatório a partir da v24.0 para campanhas sem CBO
      is_adset_budget_sharing_enabled: params.is_adset_budget_sharing_enabled ?? false,
    });
  }

  /**
   * Atualiza uma campanha
   */
  async updateCampaign(
    campaignId: string,
    params: {
      name?: string;
      status?: string;
      daily_budget?: number;
      lifetime_budget?: number;
    }
  ): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>(campaignId, params);
  }

  // ==================== AD SETS ====================

  /**
   * Lista ad sets da conta
   */
  async listAdSets(
    fields: string[] = ['id', 'name', 'status', 'campaign_id', 'daily_budget'],
    effectiveStatus?: string[]
  ): Promise<{ data: AdSet[] }> {
    const params: Record<string, string> = {
      fields: fields.join(','),
    };
    
    // Adiciona filtro por effective_status se especificado
    if (effectiveStatus && effectiveStatus.length > 0) {
      params.filtering = JSON.stringify([{
        field: 'effective_status',
        operator: 'IN',
        value: effectiveStatus,
      }]);
    }
    
    return this.get<{ data: AdSet[] }>(`${this.config.adAccountId}/adsets`, params);
  }

  /**
   * Obtém um ad set específico
   */
  async getAdSet(
    adsetId: string,
    fields: string[] = ['id', 'name', 'status', 'campaign_id', 'daily_budget', 'targeting']
  ): Promise<AdSet> {
    return this.get<AdSet>(adsetId, { fields: fields.join(',') });
  }

  /**
   * Cria um novo ad set
   */
  async createAdSet(params: {
    name: string;
    campaign_id: string;
    billing_event: string;
    optimization_goal: string;
    bid_amount?: number;
    bid_strategy?: string;
    daily_budget?: number;
    lifetime_budget?: number;
    targeting: object;
    status?: string;
    start_time?: string;
    end_time?: string;
  }): Promise<{ id: string }> {
    return this.post<{ id: string }>(`${this.config.adAccountId}/adsets`, {
      ...params,
      // Campo obrigatório a partir da v24.0
      bid_strategy: params.bid_strategy ?? 'LOWEST_COST_WITHOUT_CAP',
    });
  }

  /**
   * Atualiza um ad set
   */
  async updateAdSet(
    adsetId: string,
    params: {
      name?: string;
      status?: string;
      daily_budget?: number;
      lifetime_budget?: number;
      targeting?: object;
    }
  ): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>(adsetId, params);
  }

  // ==================== ADS ====================

  /**
   * Lista anúncios da conta
   */
  async listAds(fields: string[] = ['id', 'name', 'status', 'adset_id', 'effective_status']): Promise<{ data: Ad[] }> {
    return this.get<{ data: Ad[] }>(`${this.config.adAccountId}/ads`, {
      fields: fields.join(','),
    });
  }

  /**
   * Lista anúncios de uma campanha específica
   */
  async listCampaignAds(
    campaignId: string,
    fields: string[] = ['id', 'name', 'status', 'effective_status', 'adset_id', 'creative']
  ): Promise<{ data: Ad[] }> {
    return this.get<{ data: Ad[] }>(`${campaignId}/ads`, {
      fields: fields.join(','),
    });
  }

  /**
   * Obtém um anúncio específico
   */
  async getAd(
    adId: string,
    fields: string[] = ['id', 'name', 'status', 'effective_status', 'adset_id', 'creative', 'created_time']
  ): Promise<Ad> {
    return this.get<Ad>(adId, { fields: fields.join(',') });
  }

  /**
   * Cria um novo anúncio
   */
  async createAd(params: {
    name: string;
    adset_id: string;
    creative: { creative_id: string } | object;
    status?: string;
  }): Promise<{ id: string }> {
    return this.post<{ id: string }>(`${this.config.adAccountId}/ads`, params);
  }

  /**
   * Atualiza um anúncio
   */
  async updateAd(
    adId: string,
    params: {
      name?: string;
      status?: string;
    }
  ): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>(adId, params);
  }

  // ==================== CRIATIVOS ====================

  /**
   * Lista criativos da conta
   */
  async listCreatives(fields: string[] = ['id', 'name', 'object_story_spec', 'thumbnail_url']): Promise<{ data: AdCreative[] }> {
    return this.get<{ data: AdCreative[] }>(`${this.config.adAccountId}/adcreatives`, {
      fields: fields.join(','),
    });
  }

  /**
   * Obtém um criativo específico
   */
  async getCreative(
    creativeId: string,
    fields: string[] = ['id', 'name', 'object_story_spec', 'thumbnail_url', 'effective_object_story_id']
  ): Promise<AdCreative> {
    return this.get<AdCreative>(creativeId, { fields: fields.join(',') });
  }

  /**
   * Cria um novo criativo
   */
  async createCreative(params: {
    name: string;
    object_story_spec?: object;
    asset_feed_spec?: object;
    degrees_of_freedom_spec?: object;
  }): Promise<{ id: string }> {
    return this.post<{ id: string }>(`${this.config.adAccountId}/adcreatives`, params);
  }

  // ==================== INSIGHTS ====================

  /**
   * Obtém insights de um objeto (conta, campanha, adset, ad)
   */
  async getInsights(
    objectId: string,
    params: {
      fields?: string[];
      date_preset?: string;
      time_range?: { since: string; until: string };
      level?: string;
      breakdowns?: string[];
      action_attribution_windows?: string[];
      use_unified_attribution_setting?: boolean;
    } = {}
  ): Promise<{ data: InsightsResult[] }> {
    const defaultFields = ['impressions', 'clicks', 'spend', 'reach', 'cpc', 'cpm', 'ctr'];

    const queryParams: Record<string, string> = {
      fields: (params.fields || defaultFields).join(','),
    };

    if (params.date_preset) {
      queryParams.date_preset = params.date_preset;
    }

    if (params.time_range) {
      queryParams.time_range = JSON.stringify(params.time_range);
    }

    if (params.level) {
      queryParams.level = params.level;
    }

    if (params.breakdowns) {
      queryParams.breakdowns = params.breakdowns.join(',');
    }

    // Suporte a janelas de atribuicao para quebrar conversoes
    if (params.action_attribution_windows && params.action_attribution_windows.length > 0) {
      queryParams.action_attribution_windows = JSON.stringify(params.action_attribution_windows);
    }

    // Controla se usa config de atribuicao do ad set ou permite override
    if (params.use_unified_attribution_setting !== undefined) {
      queryParams.use_unified_attribution_setting = String(params.use_unified_attribution_setting);
    }

    return this.get<{ data: InsightsResult[] }>(`${objectId}/insights`, queryParams);
  }

  /**
   * Obtém insights da conta de anúncios
   */
  async getAccountInsights(
    params: {
      fields?: string[];
      date_preset?: string;
      time_range?: { since: string; until: string };
      action_attribution_windows?: string[];
      use_unified_attribution_setting?: boolean;
    } = {}
  ): Promise<{ data: InsightsResult[] }> {
    return this.getInsights(this.config.adAccountId, params);
  }

  // ==================== AUDIÊNCIAS ====================

  /**
   * Lista audiências customizadas
   * NOTA: O campo approximate_count foi removido da API v24.0.
   * Use approximate_count_lower_bound e approximate_count_upper_bound se precisar do tamanho.
   */
  async listCustomAudiences(
    fields: string[] = ['id', 'name', 'subtype']
  ): Promise<{ data: CustomAudience[] }> {
    return this.get<{ data: CustomAudience[] }>(`${this.config.adAccountId}/customaudiences`, {
      fields: fields.join(','),
    });
  }

  /**
   * Cria uma audiência customizada
   */
  async createCustomAudience(params: {
    name: string;
    subtype: string;
    description?: string;
    customer_file_source?: string;
  }): Promise<{ id: string }> {
    return this.post<{ id: string }>(`${this.config.adAccountId}/customaudiences`, params);
  }

  /**
   * Obtém estimativa de alcance
   */
  async getReachEstimate(params: { targeting_spec: object; optimize_for?: string }): Promise<{
    data: {
      users_lower_bound: number;
      users_upper_bound: number;
    };
  }> {
    return this.get(`${this.config.adAccountId}/reachestimate`, {
      targeting_spec: JSON.stringify(params.targeting_spec),
      ...(params.optimize_for && { optimize_for: params.optimize_for }),
    });
  }
}

/**
 * Erro customizado para erros da API da Meta
 */
export class MetaClientError extends Error {
  code: number;
  errorSubcode?: number;
  errorData?: string;
  errorUserTitle?: string;
  errorUserMsg?: string;
  fbtraceId?: string;
  type: string;

  constructor(error: MetaApiError) {
    super(error.message);
    this.name = 'MetaClientError';
    this.code = error.code;
    this.errorSubcode = error.error_subcode;
    this.errorData = error.error_data;
    this.errorUserTitle = error.error_user_title;
    this.errorUserMsg = error.error_user_msg;
    this.fbtraceId = error.fbtrace_id;
    this.type = error.type;
  }

  /**
   * Formata o erro para exibição
   */
  toString(): string {
    let msg = `Erro da API Meta (${this.code}): ${this.message}`;
    if (this.errorSubcode) {
      msg += `\nSubcódigo: ${this.errorSubcode}`;
    }
    if (this.errorUserTitle) {
      msg += `\n\n**${this.errorUserTitle}**`;
    }
    if (this.errorUserMsg) {
      msg += `\n${this.errorUserMsg}`;
    }
    if (this.errorData) {
      msg += `\nDados: ${this.errorData}`;
    }
    if (this.fbtraceId) {
      msg += `\n\nFB Trace ID: ${this.fbtraceId}`;
    }
    return msg;
  }
}
