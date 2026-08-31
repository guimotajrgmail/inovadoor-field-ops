# Verificação do preview

- O preview HTTP do projeto Inovadoor Field Ops carregou normalmente pelo domínio público gerenciado.
- O erro ocorria somente no cliente HMR do Vite, que tentava abrir o WebSocket no servidor interno `localhost:5173` atrás do proxy HTTPS.
- O dashboard foi renderizado e o gráfico de fluxo foi confirmado visualmente no preview.
- A correção aplicada é `server.hmr: false` em `vite.config.ts`; isso remove a tentativa de conexão WebSocket do cliente de desenvolvimento. O build de produção continua inalterado.

## Validação dos fluxos na interface

Após limpar o service worker antigo e recarregar o preview com cache-busting, a interface atual passou a exibir o menu **Formulários**, o botão **Abrir chamado**, os indicadores derivados do estado local e o gráfico visível. O bundle servido pelo Vite contém os textos do portal do cliente e dos fluxos de cadastro. A execução direta de `pnpm check`, `pnpm test` e `pnpm build` foi concluída sem falhas; sete testes Vitest passaram.
