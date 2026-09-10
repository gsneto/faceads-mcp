# Meta Ads Pratinho Pronto para Windows

## Uso

1. Instale `Meta-Ads-Pratinho-Pronto-Setup-1.0.0.exe`.
2. Abra **Meta Ads Pratinho Pronto** pelo atalho da área de trabalho.
3. Clique em **Configurar**, informe a conta `act_281413939226359` e cole um token
   Meta válido com acesso de leitura à Marketing API.
4. Clique em **Testar conexão** e depois em **Salvar**.
5. Escolha o período. O painel carrega todas as campanhas, inclusive pausadas.

O painel mostra investimento, checkouts, compras, CPA e ROAS atribuídos pela
Meta. Vendas e receita do checkout continuam sendo a fonte final de confirmação.

## Segurança

- O token é criptografado pelo Windows e não volta a ser exibido.
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
