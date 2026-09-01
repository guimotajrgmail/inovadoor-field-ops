# Verificação do preview

- O preview HTTP do projeto Inovadoor Field Ops carregou normalmente pelo domínio público gerenciado.
- O erro ocorria somente no cliente HMR do Vite, que tentava abrir o WebSocket no servidor interno `localhost:5173` atrás do proxy HTTPS.
- O dashboard foi renderizado e o gráfico de fluxo foi confirmado visualmente no preview.
- A correção aplicada é `server.hmr: false` em `vite.config.ts`; isso remove a tentativa de conexão WebSocket do cliente de desenvolvimento. O build de produção continua inalterado.

## Validação dos fluxos na interface

Após limpar o service worker antigo e recarregar o preview com cache-busting, a interface atual passou a exibir o menu **Formulários**, o botão **Abrir chamado**, os indicadores derivados do estado local e o gráfico visível. O bundle servido pelo Vite contém os textos do portal do cliente e dos fluxos de cadastro. A execução direta de `pnpm check`, `pnpm test` e `pnpm build` foi concluída sem falhas; sete testes Vitest passaram.

## Validação final do PWA

Após limpar caches e recarregar o último bundle, o perfil **Equipe de campo** foi acessado pelo seletor de perfis, o atendimento foi iniciado e o DOM confirmou os controles **Evidências do atendimento**, **Adicionar foto**, **Assinatura do cliente**, **GPS** e contador de itens **na fila**. A tela de Formulários também foi aberta pelo menu lateral. A sincronização remota usa tRPC quando existe sessão e mantém a fila local quando o dispositivo está offline ou sem sessão.

## Auditoria de equipamentos — 01 set 2026

A auditoria confirmou que a versão anterior misturava padrão e ativo instalado no mesmo cadastro. O schema foi ampliado com `equipmentCatalogs`, `catalogId` e `installationLocation`; foram adicionados endpoints para listar/criar padrões, instalar unidade por cliente e enriquecer vínculos existentes. O preview inicialmente serviu a tela antiga por service worker; os caches foram removidos antes da nova validação.

A versão atualizada foi validada no preview: a tela exibe **Equipamentos padrão** com exemplos Porta rápida, Porta seccional e Abrigo de doca, além de **Unidades instaladas** com cliente, local, serial e estado. O modal **Instalar no cliente** exibe os quatro campos esperados: equipamento padrão, cliente/unidade, local da instalação e número de série.

## Validação por perfil

O perfil de Gestão exibiu a navegação operacional com OS, Clientes e Equipamentos. O seletor de perfis apresentou Gestão Inovadoor, Painel de terceiros, Gestão de pessoas, Equipe de campo e Portal do cliente. A tentativa automatizada de trocar para parceiro exigiu passos separados porque a troca de seleção e o login são renderizados em estados consecutivos; a validação será concluída no navegador após esse ajuste de sequência.

A validação por perfil foi concluída: Gestão exibiu OS, Clientes e Equipamentos; Painel de terceiros exibiu Rede de atendimento e SLA da rede; Portal do cliente exibiu Meus chamados, Seus equipamentos e Abrir chamado. As trocas exigem selecionar o perfil e depois confirmar o login em duas etapas.
