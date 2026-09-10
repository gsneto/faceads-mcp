# Meta Ads Desktop para Windows

## Uso

1. Instale `Meta-Ads-Desktop-Setup-1.1.0.exe`.
2. Abra **Meta Ads Desktop** pelo atalho da área de trabalho.
3. Clique em **Configurar**, informe qualquer conta no formato `act_123456789` e cole um token
   Meta válido com acesso de leitura à Marketing API.
4. Clique em **Testar conexão** e depois em **Salvar**.
5. Escolha o período. O painel carrega todas as campanhas, inclusive pausadas.

O painel mostra investimento, checkouts, compras, CPA e ROAS atribuídos pela
Meta. Vendas e receita do checkout continuam sendo a fonte final de confirmação.

## Segurança

- O token é criptografado pelo Windows, compartilhado com o MCP local do Codex e não volta a ser exibido.
- O MCP escuta somente em `127.0.0.1`, numa porta aleatória.
- O segredo do transporte MCP é aleatório e renovado a cada abertura.
- `MCP_PERMISSIONS=read` bloqueia criação, edição, ativação e pausa de campanhas.
- Erros e logs substituem tokens por `[OCULTO]`.

## Desenvolvimento

```bash
npm run desktop:start
npm run desktop:dist
```

O instalador é gerado na pasta `release`.
