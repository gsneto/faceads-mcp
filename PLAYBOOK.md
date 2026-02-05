# Playbook: Regras de Negócio para Meta Ads

> **Este arquivo é customizável por empresa.** Contém thresholds, regras de otimização e valores específicos que devem ser ajustados conforme o contexto de cada negócio.

## Sobre Este Arquivo

O `SKILL.md` contém a documentação técnica genérica da API (tools, endpoints, erros). Este `PLAYBOOK.md` complementa com:

- Thresholds de performance
- Regras de otimização
- Valores específicos de localização
- Fluxos de diagnóstico com critérios de decisão

**Ao usar este MCP em outra empresa:** Copie e ajuste este arquivo conforme suas métricas e objetivos.

---

## Configurações de Localização

### Brasil (BRL)

| Parâmetro | Valor | Notas |
|-----------|-------|-------|
| Moeda | BRL (R$) | Centavos na API |
| Orçamento mínimo diário | R$ 5,33 (533 centavos) | Varia por país |
| Orçamento recomendado | R$ 6,00+ (600 centavos) | Margem de segurança |
| Fuso horário padrão | America/Sao_Paulo | |

### Outras Localizações (Exemplos)

| País | Moeda | Orçamento Mínimo |
|------|-------|------------------|
| EUA | USD | $1.00 (100 cents) |
| Europa | EUR | €1.00 (100 cents) |
| México | MXN | Verificar na API |

---

## Thresholds de Performance

> **Importante:** Estes valores são sugestões baseadas em benchmarks gerais. Ajuste conforme seu setor, margem e histórico.

### Métricas de Engajamento

| Métrica | Alerta | Bom | Excelente | Ação se abaixo |
|---------|--------|-----|-----------|----------------|
| CTR | < 0.5% | 0.5-1.5% | > 1.5% | Revisar criativo/targeting |
| CPC | > R$ 5.00 | R$ 1-5 | < R$ 1.00 | Otimizar lance |
| CPM | > R$ 50 | R$ 15-50 | < R$ 15 | Revisar targeting |

### Métricas de Conversão

| Métrica | Alerta | Bom | Excelente | Ação se abaixo |
|---------|--------|-----|-----------|----------------|
| CVR (Conv. Rate) | < 1% | 1-3% | > 3% | Revisar landing page |
| CPA | > margem | ~ margem | << margem | Escalar ou pausar |
| ROAS | < 1x | 1-2x | > 2x | Escalar se > 2x |

### Métricas de Atribuição

| % Incremental | Interpretação | Ação Recomendada |
|---------------|---------------|------------------|
| > 50% | Saudável | Manter estratégia atual |
| 30-50% | Atenção | Considerar testar First Conversion |
| < 30% | Risco alto | Testar First Conversion ou revisar targeting |
| < 20% | Crítico | Revisar urgentemente - possível canibalização |

---

## Regras de Otimização Automática

### Pausar Campanha/Ad Set

Pausar automaticamente se:

```
CTR < 0.5% E impressões > 1000
OU
CPA > 2x do target E spend > R$ 100
OU
ROAS < 0.5x E spend > R$ 200
```

### Aumentar Orçamento

Aumentar orçamento em 20-30% se:

```
ROAS > 2x E dados > 7 dias
OU
CPA < 50% do target E conversões > 10
```

### Diminuir Orçamento

Reduzir orçamento em 20% se:

```
ROAS entre 1x e 1.5x E tendência de queda
OU
CPA entre target e 1.5x target
```

---

## Fluxos de Diagnóstico

### Fluxo 1: Auditoria Rápida de Performance

```
1. Obter insights dos últimos 7 dias
   └── get_account_insights(date_preset: "last_7d")

2. Verificar CTR geral
   ├── Se CTR < 0.5% → Problema de criativo/targeting
   └── Se CTR > 1% → OK, verificar conversões

3. Verificar CPA/ROAS
   ├── Se ROAS < 1x → Pausar ou otimizar
   ├── Se ROAS 1-2x → Monitorar
   └── Se ROAS > 2x → Considerar escalar

4. Listar campanhas com pior performance
   └── Ordenar por CTR ou ROAS

5. Recomendar ações específicas
```

### Fluxo 2: Análise de Eficiência Real (Atribuição)

```
1. Obter comparação de atribuição
   └── get_attribution_comparison(object_id, object_type)

2. Calcular % incremental
   └── incremental / all_conversions × 100

3. Avaliar risco
   ├── Se > 50% → Saudável, manter
   ├── Se 30-50% → Atenção, considerar testes
   └── Se < 30% → Risco, ação imediata

4. Se < 30%:
   ├── Testar First Conversion no ad set
   ├── Revisar targeting (público muito quente?)
   └── Avaliar se está "roubando" conversões orgânicas

5. Ordenar criativos por CPA incremental
   └── Priorizar os com melhor CPA incremental, não CPA padrão
```

### Fluxo 3: Otimização de Criativos

```
1. Listar todos os ads ativos
   └── list_campaign_ads(campaign_id)

2. Obter insights por ad
   └── get_ad_insights para cada ad

3. Classificar por performance
   ├── Top performers: CTR > média + 20%
   ├── Médios: CTR na média ±20%
   └── Baixos: CTR < média - 20%

4. Ações:
   ├── Top: Aumentar orçamento do ad set
   ├── Médios: Manter, iterar variações
   └── Baixos: Pausar se spend > R$ 50
```

---

## Nomenclatura Recomendada

### Campanhas

```
[Objetivo] - [Produto/Serviço] - [Público] - [Data]
Exemplo: TRÁFEGO - Curso Python - Programadores - 2026-02
```

### Ad Sets

```
[Público] - [Posicionamento] - [Lance]
Exemplo: Lookalike 1% - Feed+Stories - Automático
```

### Anúncios

```
[Formato] - [Variação] - [Versão]
Exemplo: Imagem - Benefício1 - V1
```

---

## Estrutura de Testes A/B

### Teste de Público

1. Criar campanha com 2+ ad sets
2. Mesmo criativo em todos
3. Orçamento igual por ad set (ABO sem sharing)
4. Rodar por 7 dias ou até 100 conversões
5. Vencedor: Melhor CPA com significância estatística

### Teste de Criativo

1. Mesmo ad set
2. 2-4 variações de criativo
3. Deixar Meta otimizar distribuição
4. Analisar após 50+ conversões por variação
5. Pausar perdedores, iterar vencedores

---

## Alertas e Notificações

### Alertas Críticos (ação imediata)

- Campanha gastou > 50% do orçamento diário em < 6h
- CPA > 3x do target
- Aprovação de anúncio negada
- Conta com problemas de pagamento

### Alertas de Atenção (revisar em 24h)

- CTR caiu > 30% vs semana anterior
- Frequência > 3 (mesma pessoa vendo muitas vezes)
- ROAS caiu abaixo de 1.5x

---

## Histórico de Ajustes

| Data | Alteração | Motivo |
|------|-----------|--------|
| 2026-02-05 | Arquivo criado | Separação de elementos específicos do SKILL.md |

---

## Como Usar em Outra Empresa

1. **Copie este arquivo** para o novo projeto
2. **Ajuste a seção de Localização** com sua moeda e orçamentos
3. **Revise os Thresholds** conforme seu setor:
   - E-commerce: ROAS é métrica principal
   - Lead gen: CPA é métrica principal
   - Awareness: CPM e alcance são métricas principais
4. **Adapte os Fluxos** conforme seu processo de otimização
5. **Atualize a Nomenclatura** conforme padrão da empresa

> **Dica:** Mantenha o SKILL.md original (genérico) e customize apenas este PLAYBOOK.md
