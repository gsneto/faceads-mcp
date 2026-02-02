/**
 * Tools de Execução - API da Meta
 *
 * Estas tools requerem configuração de API keys (META_ACCESS_TOKEN, META_AD_ACCOUNT_ID).
 * Permitem criar, atualizar e gerenciar campanhas na plataforma Meta Ads.
 */

import { MetaClient, MetaClientError } from './meta-client.js';
import { getConfigurationError, isMetaConfigured } from './utils/config.js';
import {
  apiSchemas,
  validateArgs,
  formatValidationError,
  type CreateCampaignArgs,
  type UpdateCampaignArgs,
  type GetCampaignArgs,
  type ListCampaignsArgs,
  type PauseCampaignArgs,
  type ActivateCampaignArgs,
  type ListAdsetsArgs,
  type CreateAdsetArgs,
  type UpdateAdsetArgs,
  type CreateAdArgs,
  type CreateCreativeArgs,
  type GetAccountInsightsArgs,
  type GetCampaignInsightsArgs,
  type GetAdsetInsightsArgs,
  type ListCustomAudiencesArgs,
  type CreateCustomAudienceArgs,
  type GetReachEstimateArgs,
  type ExecuteApiArgs,
} from './schemas/index.js';

/**
 * Define as tools de execução (API Meta) com JSON Schema manual
 */
export const apiTools = [
  // ==================== CAMPANHAS ====================
  {
    name: 'list_campaigns',
    description: 'Lista todas as campanhas da conta de anúncios. Requer API key configurada.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Campos a retornar (default: id, name, status, objective)',
        },
      },
    },
  },
  {
    name: 'get_campaign',
    description: 'Obtém detalhes de uma campanha específica. Requer API key configurada.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        campaign_id: { type: 'string', description: 'ID da campanha' },
        fields: { type: 'array', items: { type: 'string' }, description: 'Campos a retornar' },
      },
      required: ['campaign_id'],
    },
  },
  {
    name: 'create_campaign',
    description:
      'Cria uma nova campanha. Sempre criar com status PAUSED para revisão antes de ativar. Objetivos: OUTCOME_AWARENESS (reconhecimento), OUTCOME_ENGAGEMENT (engajamento), OUTCOME_LEADS (leads), OUTCOME_SALES (conversões), OUTCOME_TRAFFIC (tráfego), OUTCOME_APP_PROMOTION (apps).',
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
        daily_budget: { type: 'number', description: 'Orçamento diário em centavos' },
        special_ad_categories: {
          type: 'array',
          items: { type: 'string', enum: ['CREDIT', 'EMPLOYMENT', 'HOUSING', 'ISSUES_ELECTIONS_POLITICS'] },
          description: 'Categorias especiais de anúncios',
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
    description: 'Lista todos os conjuntos de anúncios da conta. Requer API key configurada.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        fields: { type: 'array', items: { type: 'string' }, description: 'Campos a retornar' },
      },
    },
  },
  {
    name: 'create_adset',
    description: 'Cria um novo conjunto de anúncios. Requer API key configurada.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Nome do ad set' },
        campaign_id: { type: 'string', description: 'ID da campanha pai' },
        daily_budget: { type: 'number', description: 'Orçamento diário em centavos' },
        billing_event: {
          type: 'string',
          enum: ['IMPRESSIONS', 'LINK_CLICKS', 'APP_INSTALLS', 'PAGE_LIKES', 'POST_ENGAGEMENT', 'VIDEO_VIEWS'],
          description: 'Evento de cobrança',
        },
        optimization_goal: {
          type: 'string',
          enum: ['REACH', 'IMPRESSIONS', 'LINK_CLICKS', 'LANDING_PAGE_VIEWS', 'CONVERSIONS', 'VALUE', 'APP_INSTALLS', 'LEAD_GENERATION'],
          description: 'Objetivo de otimização',
        },
        targeting: { type: 'object', description: 'Especificação de targeting' },
        status: { type: 'string', enum: ['PAUSED', 'ACTIVE'], description: 'Status inicial' },
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

  // ==================== ADS ====================
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

  // ==================== CRIATIVOS ====================
  {
    name: 'create_creative',
    description: 'Cria um novo criativo. Requer API key configurada.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Nome do criativo' },
        object_story_spec: { type: 'object', description: 'Especificação do criativo (link_data, video_data, etc.)' },
      },
      required: ['name'],
    },
  },

  // ==================== INSIGHTS ====================
  {
    name: 'get_account_insights',
    description:
      'Obtém métricas agregadas da conta de anúncios. Use date_preset (today, yesterday, last_7d, last_30d, this_month) ou time_range para período customizado. Métricas: impressions, clicks, spend, reach, cpc, cpm, ctr.',
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
          description: 'Métricas a retornar (impressions, clicks, spend, reach, cpc, cpm, ctr)',
        },
      },
    },
  },
  {
    name: 'get_campaign_insights',
    description: 'Obtém métricas de uma campanha específica. Requer API key configurada.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        campaign_id: { type: 'string', description: 'ID da campanha' },
        date_preset: { type: 'string', description: 'Período predefinido' },
        time_range: {
          type: 'object',
          properties: {
            since: { type: 'string' },
            until: { type: 'string' },
          },
        },
        fields: { type: 'array', items: { type: 'string' } },
      },
      required: ['campaign_id'],
    },
  },
  {
    name: 'get_adset_insights',
    description: 'Obtém métricas de um conjunto de anúncios. Requer API key configurada.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        adset_id: { type: 'string', description: 'ID do ad set' },
        date_preset: { type: 'string' },
        time_range: {
          type: 'object',
          properties: {
            since: { type: 'string' },
            until: { type: 'string' },
          },
        },
        fields: { type: 'array', items: { type: 'string' } },
      },
      required: ['adset_id'],
    },
  },

  // ==================== AUDIÊNCIAS ====================
  {
    name: 'list_custom_audiences',
    description: 'Lista audiências customizadas da conta. Requer API key configurada.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        fields: { type: 'array', items: { type: 'string' }, description: 'Campos a retornar' },
      },
    },
  },
  {
    name: 'create_custom_audience',
    description: 'Cria uma audiência customizada. Requer API key configurada.',
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

  // ==================== API CUSTOMIZADA ====================
  {
    name: 'execute_api',
    description: `Executa chamada customizada à API da Meta para endpoints sem tool específica.

CASOS DE USO:
- Duplicar campanha: POST {id}/copies (params: deep_copy, status_option)
- Listar ads de campanha: GET {campaign_id}/ads
- Obter delivery estimate: GET {adset_id}/delivery_estimate

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
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const client = requireApiConfig();

    switch (name) {
      // ==================== CAMPANHAS ====================
      case 'list_campaigns': {
        const validation = validateArgs(apiSchemas.list_campaigns, args);
        if (!validation.success) return formatValidationError(validation.error);
        return handleListCampaigns(client, validation.data);
      }

      case 'get_campaign': {
        const validation = validateArgs(apiSchemas.get_campaign, args);
        if (!validation.success) return formatValidationError(validation.error);
        return handleGetCampaign(client, validation.data);
      }

      case 'create_campaign': {
        const validation = validateArgs(apiSchemas.create_campaign, args);
        if (!validation.success) return formatValidationError(validation.error);
        return handleCreateCampaign(client, validation.data);
      }

      case 'update_campaign': {
        const validation = validateArgs(apiSchemas.update_campaign, args);
        if (!validation.success) return formatValidationError(validation.error);
        return handleUpdateCampaign(client, validation.data);
      }

      case 'pause_campaign': {
        const validation = validateArgs(apiSchemas.pause_campaign, args);
        if (!validation.success) return formatValidationError(validation.error);
        return handlePauseCampaign(client, validation.data);
      }

      case 'activate_campaign': {
        const validation = validateArgs(apiSchemas.activate_campaign, args);
        if (!validation.success) return formatValidationError(validation.error);
        return handleActivateCampaign(client, validation.data);
      }

      // ==================== AD SETS ====================
      case 'list_adsets': {
        const validation = validateArgs(apiSchemas.list_adsets, args);
        if (!validation.success) return formatValidationError(validation.error);
        return handleListAdsets(client, validation.data);
      }

      case 'create_adset': {
        const validation = validateArgs(apiSchemas.create_adset, args);
        if (!validation.success) return formatValidationError(validation.error);
        return handleCreateAdset(client, validation.data);
      }

      case 'update_adset': {
        const validation = validateArgs(apiSchemas.update_adset, args);
        if (!validation.success) return formatValidationError(validation.error);
        return handleUpdateAdset(client, validation.data);
      }

      // ==================== ADS ====================
      case 'create_ad': {
        const validation = validateArgs(apiSchemas.create_ad, args);
        if (!validation.success) return formatValidationError(validation.error);
        return handleCreateAd(client, validation.data);
      }

      // ==================== CRIATIVOS ====================
      case 'create_creative': {
        const validation = validateArgs(apiSchemas.create_creative, args);
        if (!validation.success) return formatValidationError(validation.error);
        return handleCreateCreative(client, validation.data);
      }

      // ==================== INSIGHTS ====================
      case 'get_account_insights': {
        const validation = validateArgs(apiSchemas.get_account_insights, args);
        if (!validation.success) return formatValidationError(validation.error);
        return handleGetAccountInsights(client, validation.data);
      }

      case 'get_campaign_insights': {
        const validation = validateArgs(apiSchemas.get_campaign_insights, args);
        if (!validation.success) return formatValidationError(validation.error);
        return handleGetCampaignInsights(client, validation.data);
      }

      case 'get_adset_insights': {
        const validation = validateArgs(apiSchemas.get_adset_insights, args);
        if (!validation.success) return formatValidationError(validation.error);
        return handleGetAdsetInsights(client, validation.data);
      }

      // ==================== AUDIÊNCIAS ====================
      case 'list_custom_audiences': {
        const validation = validateArgs(apiSchemas.list_custom_audiences, args);
        if (!validation.success) return formatValidationError(validation.error);
        return handleListCustomAudiences(client, validation.data);
      }

      case 'create_custom_audience': {
        const validation = validateArgs(apiSchemas.create_custom_audience, args);
        if (!validation.success) return formatValidationError(validation.error);
        return handleCreateCustomAudience(client, validation.data);
      }

      case 'get_reach_estimate': {
        const validation = validateArgs(apiSchemas.get_reach_estimate, args);
        if (!validation.success) return formatValidationError(validation.error);
        return handleGetReachEstimate(client, validation.data);
      }

      // ==================== API CUSTOMIZADA ====================
      case 'execute_api': {
        const validation = validateArgs(apiSchemas.execute_api, args);
        if (!validation.success) return formatValidationError(validation.error);
        return handleExecuteApi(client, validation.data);
      }

      default:
        return {
          content: [{ type: 'text', text: `Tool desconhecida: ${name}` }],
        };
    }
  } catch (error) {
    if (error instanceof MetaClientError) {
      return {
        content: [
          {
            type: 'text',
            text: `# Erro da API Meta\n\n${error.toString()}\n\nConsulte a documentação de erros com \`get_error_code_info\` para mais detalhes.`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `# Erro\n\n${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}

// ==================== CAMPAIGN HANDLERS ====================

async function handleListCampaigns(
  client: MetaClient,
  args: ListCampaignsArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const result = await client.listCampaigns(args.fields);
  return {
    content: [
      {
        type: 'text',
        text: `# Campanhas\n\nEncontradas ${result.data.length} campanha(s):\n\n${formatCampaigns(result.data)}`,
      },
    ],
  };
}

async function handleGetCampaign(
  client: MetaClient,
  args: GetCampaignArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const campaign = await client.getCampaign(args.campaign_id, args.fields);
  return {
    content: [
      {
        type: 'text',
        text: `# Campanha: ${campaign.name}\n\n${formatObject(campaign)}`,
      },
    ],
  };
}

async function handleCreateCampaign(
  client: MetaClient,
  args: CreateCampaignArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const result = await client.createCampaign({
    name: args.name,
    objective: args.objective,
    status: args.status,
    daily_budget: args.daily_budget,
    special_ad_categories: args.special_ad_categories,
  });
  return {
    content: [
      {
        type: 'text',
        text: `# Campanha Criada\n\n**ID:** ${result.id}\n**Nome:** ${args.name}\n**Objetivo:** ${args.objective}\n**Status:** ${args.status}`,
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
  const result = await client.listAdSets(args.fields);
  return {
    content: [
      {
        type: 'text',
        text: `# Conjuntos de Anúncios\n\nEncontrados ${result.data.length} ad set(s):\n\n${formatAdSets(result.data)}`,
      },
    ],
  };
}

async function handleCreateAdset(
  client: MetaClient,
  args: CreateAdsetArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const result = await client.createAdSet({
    name: args.name,
    campaign_id: args.campaign_id,
    billing_event: args.billing_event,
    optimization_goal: args.optimization_goal,
    targeting: args.targeting,
    daily_budget: args.daily_budget,
    status: args.status,
  });
  return {
    content: [
      {
        type: 'text',
        text: `# Ad Set Criado\n\n**ID:** ${result.id}\n**Nome:** ${args.name}`,
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

// ==================== AD HANDLERS ====================

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

// ==================== CREATIVE HANDLERS ====================

async function handleCreateCreative(
  client: MetaClient,
  args: CreateCreativeArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const result = await client.createCreative({
    name: args.name,
    object_story_spec: args.object_story_spec,
  });
  return {
    content: [
      {
        type: 'text',
        text: `# Criativo Criado\n\n**ID:** ${result.id}\n**Nome:** ${args.name}`,
      },
    ],
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
  });
  return {
    content: [
      {
        type: 'text',
        text: `# Insights da Conta\n\n${formatInsights(result.data)}`,
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
  });
  return {
    content: [
      {
        type: 'text',
        text: `# Insights da Campanha ${args.campaign_id}\n\n${formatInsights(result.data)}`,
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
  });
  return {
    content: [
      {
        type: 'text',
        text: `# Insights do Ad Set ${args.adset_id}\n\n${formatInsights(result.data)}`,
      },
    ],
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
  const result = await client.createCustomAudience({
    name: args.name,
    subtype: args.subtype,
    description: args.description,
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

// ==================== API CUSTOMIZADA HANDLER ====================

async function handleExecuteApi(
  client: MetaClient,
  args: ExecuteApiArgs
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const { method, endpoint, params } = args;

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
      result = await client.get(endpoint, queryParams);
      break;
    }
    case 'POST': {
      result = await client.post(endpoint, (params as Record<string, unknown>) || {});
      break;
    }
    case 'DELETE': {
      result = await client.delete(endpoint);
      break;
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: `# Resultado da API\n\n**Método:** ${method}\n**Endpoint:** ${endpoint}\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``,
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

function formatInsights(insights: Array<Record<string, unknown>>): string {
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

  return lines.join('\n');
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
