# Verificação do preview

- O preview HTTP do projeto Inovadoor Field Ops carregou normalmente pelo domínio público gerenciado.
- O erro ocorria somente no cliente HMR do Vite, que tentava abrir o WebSocket no servidor interno `localhost:5173` atrás do proxy HTTPS.
- O dashboard foi renderizado e o gráfico de fluxo foi confirmado visualmente no preview.
- A correção aplicada é `server.hmr: false` em `vite.config.ts`; isso remove a tentativa de conexão WebSocket do cliente de desenvolvimento. O build de produção continua inalterado.
