# Inovadoor Field Ops — Verificação do fluxo básico

**Autor:** Manus AI  
**Projeto:** Inovadoor Field Ops  
**Segmento:** portas industriais, manutenção, instalação e assistência técnica  
**Data da verificação:** 31 de agosto de 2026

## Resumo executivo

O primeiro fluxo operacional do Inovadoor Field Ops foi ampliado para cobrir o ciclo principal solicitado: o cliente abre um chamado no portal, a Gestão Inovadoor recebe a solicitação na fila de triagem e pode convertê-la em ordem de serviço; a equipe administra clientes, unidades, equipamentos, vínculos de ativos, terceiros e formulários padronizados de atendimento e instalação. A solução também mantém a experiência de execução em campo como PWA, com checklist, início e conclusão do atendimento.

A interface atual funciona como uma demonstração operacional persistida no navegador, permitindo validar o fluxo visual sem depender de dados reais. Em paralelo, o backend recebeu as entidades e contratos tRPC protegidos necessários para a futura persistência multiusuário em banco. Essa separação torna possível testar a experiência imediatamente sem introduzir registros demonstrativos no banco compartilhado.

## Fluxos verificados

| Fluxo | Resultado | Comportamento entregue |
|---|---|---|
| Cliente abre chamado | Pronto na interface e no contrato de backend | O portal seleciona o equipamento vinculado, registra assunto, descrição e prioridade e cria uma solicitação encaminhada para triagem. |
| Gestão visualiza e gerencia OS | Pronto | A fila reúne OS próprias e solicitações originadas no portal, com status, prioridade, responsável, terceiro e formulário associado. |
| Cadastro de cliente | Pronto | A Gestão pode cadastrar razão social, cidade, estado, endereço e contato principal. O cadastro é usado nos demais módulos. |
| Cadastro de equipamento | Pronto | O ativo recebe nome, código, modelo, estado e cliente vinculado, com espaço para QR Code e histórico de manutenção. |
| Vínculo equipamento–cliente | Pronto | O vínculo pode ser criado ou atualizado e é usado no portal, nos chamados, nas OS e nos relatórios da unidade. |
| Gestão de terceiros | Pronto | A Gestão cadastra parceiros, região, responsável, SLA e status de homologação. A OS pode ser atribuída a um terceiro. |
| Formulário de atendimento | Pronto | Template com diagnóstico, peças, evidências fotográficas, assinatura e checklist. Pode ser vinculado a OS de manutenção. |
| Formulário de instalação | Pronto | Template com conferência do local, fixação, nivelamento, testes, fotos e termo de aceite. |
| Execução em campo | Pronto na experiência PWA | O técnico inicia o atendimento, percorre o checklist e finaliza o serviço para envio do relatório. |

## Experiência por perfil

A aplicação possui seleção de ambiente por perfil. A **Gestão Inovadoor** acessa indicadores, OS, agenda, cadastros, terceiros, estoque, relatórios e integrações. O **Portal do cliente** apresenta a unidade, os equipamentos vinculados, chamados existentes e o formulário de abertura de nova solicitação. O perfil de **terceiros** concentra a visão da rede autorizada e do SLA. O perfil de **equipe de campo** abre a experiência PWA com agenda e checklist de execução. O perfil de **gestão de pessoas** organiza pessoas, áreas, perfis e acessos.

## Modelo de dados e API

O banco possui as entidades de organizações, usuários, pessoas, clientes, terceiros, equipamentos, ordens de serviço, eventos de OS, integrações, templates de formulários e chamados de clientes. Foi adicionada a migração `drizzle/0002_dark_rhodey.sql`, aplicada ao banco do projeto, contendo as tabelas `customerTickets` e `serviceFormTemplates`.

| Recurso | Procedimentos disponíveis |
|---|---|
| Clientes | `customers.list`, `customers.create` |
| Equipamentos | `equipment.list`, `equipment.create`, `equipment.linkCustomer` |
| Terceiros | `thirdParties.list`, `thirdParties.create` |
| Formulários | `forms.list`, `forms.create` |
| Chamados | `customerTickets.list`, `customerTickets.create`, `customerTickets.convertToWorkOrder` |
| Ordens de serviço | `workOrders.list`, `workOrders.create`, `workOrders.updateStatus` |
| Integração | `integrations.monday.status`, `integrations.monday.connect` |

As mutações administrativas usam uma proteção de gestão: somente usuários administradores ou usuários com perfil `gestao` podem criar clientes, equipamentos, terceiros, formulários e OS. A abertura de chamado exige autenticação, e a conversão de chamado em OS fica restrita à Gestão. As consultas filtram a organização do usuário para evitar exposição de dados entre organizações.

## Validação técnica

A implementação foi validada com TypeScript, testes automatizados e build de produção. O preview foi recarregado depois da atualização do service worker, que passou a priorizar a versão atual do HTML e a remover o cache antigo. Isso corrigiu a situação em que o navegador continuava exibindo o dashboard anterior.

| Verificação | Resultado |
|---|---|
| `pnpm check` | Aprovado, sem erros TypeScript |
| `pnpm test` | Aprovado: 7 testes em 2 arquivos |
| `pnpm build` | Aprovado, frontend e servidor compilados |
| Preview do dashboard | Carregado com menu de Formulários e botão Abrir chamado |
| Console após recarga | Sem saída de erro registrada |
| Migração SQL | Aplicada com sucesso ao banco do projeto |

Os testes cobrem autenticação obrigatória para dados operacionais, resumo tipado do dashboard, isolamento de ordens por organização, listagem de chamados e formulários, proteção de mutações administrativas por perfil e validação de campos de chamados.

## Limitações atuais

A interface entregue utiliza um estado demonstrativo persistido em `localStorage` para que o fluxo possa ser explorado imediatamente no preview, mesmo quando não existe uma sessão autenticada de banco disponível no navegador. O backend já possui o schema, a migração, helpers e contratos tRPC, mas a próxima etapa é substituir as mutações locais da interface por chamadas tRPC autenticadas, incluindo tratamento de loading, erros e atualização otimista.

A integração monday.com está preparada no backend e na interface, porém ainda requer o mapeamento do board, dos campos e dos webhooks reais. GPS, fotos, assinatura digital e sincronização offline real também devem ser conectados aos serviços de produção antes do uso operacional definitivo.

## Conclusão

O básico solicitado está pronto para validação funcional: o cliente consegue iniciar o ciclo por chamado, a Inovadoor consegue organizar o atendimento, os ativos são vinculados às unidades, terceiros podem ser gerenciados e os formulários de atendimento e instalação já fazem parte do processo de OS e campo. O produto está em condição adequada para a próxima fase de integração da interface com o backend autenticado e de homologação com usuários reais da operação.

## Referências

As funcionalidades de gestão de equipes externas, ordens, formulários, equipamentos, estoque, portal do cliente, roteirização e relatórios foram comparadas com a descrição pública do FieldControl [1] [2]. Os recursos de agenda, localização, execução offline e registros de atendimento foram considerados a partir da descrição pública do aplicativo [3]. A atuação da Inovadoor em portas industriais orientou o vocabulário de ativos e serviços [4].

[1]: https://fieldcontrol.com.br/funcionalidades.html "FieldControl — Funcionalidades"
[2]: https://fieldcontrol.com.br/modulos.html "FieldControl — Módulos"
[3]: https://play.google.com/store/apps/details?id=com.fieldcontrol.orc&hl=pt_BR "FieldControl — Aplicativo na Google Play"
[4]: https://inovadoor.com.br/ "Inovadoor — Portas industriais"
