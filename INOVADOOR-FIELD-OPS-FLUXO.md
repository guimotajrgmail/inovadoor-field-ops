# Inovadoor Field Ops — Verificação do fluxo básico

**Autor:** Manus AI  
**Projeto:** Inovadoor Field Ops  
**Segmento:** portas industriais, manutenção, instalação e assistência técnica  
**Data da verificação:** 31 de agosto de 2026

## Resumo executivo

O primeiro fluxo operacional do Inovadoor Field Ops foi ampliado para cobrir o ciclo principal solicitado: o cliente abre um chamado no portal, a Gestão Inovadoor recebe a solicitação na fila de triagem e pode convertê-la em ordem de serviço; a equipe administra clientes, unidades, equipamentos, vínculos de ativos, terceiros e formulários padronizados de atendimento e instalação. A solução também mantém a experiência de execução em campo como PWA, com checklist, início e conclusão do atendimento.

A interface atual funciona como uma demonstração operacional persistida no navegador quando não há sessão, permitindo validar o fluxo visual sem depender de dados reais. Quando existe sessão autenticada, formulários, evidências e configurações de integração são enviados pelos contratos tRPC. Essa combinação permite testar a experiência imediatamente sem introduzir registros demonstrativos no banco compartilhado.

## Fluxos verificados

| Fluxo | Resultado | Comportamento entregue |
|---|---|---|
| Cliente abre chamado | Pronto na interface e no contrato de backend | O portal seleciona o equipamento vinculado, registra assunto, descrição e prioridade e cria uma solicitação encaminhada para triagem. |
| Gestão visualiza e gerencia OS | Pronto | A fila reúne OS próprias e solicitações originadas no portal, com status, prioridade, responsável, terceiro e formulário associado. |
| Cadastro de cliente | Pronto | A Gestão pode cadastrar razão social, cidade, estado, endereço e contato principal. O cadastro é usado nos demais módulos. |
| Cadastro de equipamento padrão | Pronto | A Gestão cadastra modelos reutilizáveis, como **Porta rápida**, com código padrão, categoria, fabricante, modelo e descrição, sem cliente ou número de série. |
| Instalação e vínculo equipamento–cliente | Pronto | Uma unidade é criada a partir do padrão e recebe cliente/unidade, local físico e número de série único; o vínculo é usado no portal, chamados, OS e formulários. |
| Gestão de terceiros | Pronto | A Gestão cadastra parceiros, região, responsável, SLA e status de homologação. A OS pode ser atribuída a um terceiro. |
| Formulário de atendimento | Pronto | Template com diagnóstico, peças, evidências fotográficas, assinatura e checklist. Pode ser vinculado a OS de manutenção. |
| Formulário de instalação | Pronto | Template com conferência do local, fixação, nivelamento, testes, fotos e termo de aceite. |
| Execução em campo | Pronto na experiência PWA | O técnico inicia o atendimento, percorre o checklist, registra GPS, captura fotos, coleta assinatura e finaliza o serviço para envio do relatório. |

## Experiência por perfil

A aplicação possui seleção de ambiente por perfil. A **Gestão Inovadoor** acessa indicadores, OS, agenda, cadastros, terceiros, estoque, relatórios e integrações. O **Portal do cliente** apresenta a unidade, os equipamentos vinculados, chamados existentes e o formulário de abertura de nova solicitação. O perfil de **terceiros** concentra a visão da rede autorizada e do SLA. O perfil de **equipe de campo** abre a experiência PWA com agenda e checklist de execução. O perfil de **gestão de pessoas** organiza pessoas, áreas, perfis e acessos.

## Modelo de dados e API

O banco possui as entidades de organizações, usuários, pessoas, clientes, terceiros, catálogo de equipamentos padrão, unidades instaladas, ordens de serviço, eventos de OS, integrações, templates de formulários e chamados de clientes. A migração `drizzle/0004_right_post.sql` adicionou `equipmentCatalogs`, `equipment.catalogId` e `equipment.installationLocation`, e foi aplicada ao banco do projeto.

| Recurso | Procedimentos disponíveis |
|---|---|
| Clientes | `customers.list`, `customers.create` |
| Equipamentos | `equipment.standards.list`, `equipment.standards.create`, `equipment.install`, `equipment.list`, `equipment.linkCustomer` |
| Terceiros | `thirdParties.list`, `thirdParties.create` |
| Formulários | `forms.list`, `forms.create` |
| Chamados | `customerTickets.list`, `customerTickets.create`, `customerTickets.convertToWorkOrder` |
| Ordens de serviço | `workOrders.list`, `workOrders.create`, `workOrders.updateStatus` |
| Integração | `integrations.monday.status`, `integrations.monday.connect` |
| Acessos | `users.assignScope` para associar usuário à organização, cliente ou terceiro |
| Webhook monday.com | `integrations.monday.webhook` valida e reconhece eventos recebidos |

As mutações administrativas usam uma proteção de gestão: somente usuários administradores ou usuários com perfil `gestao` podem criar clientes, equipamentos, terceiros, formulários e OS. A abertura de chamado exige autenticação e, quando o perfil é `cliente`, o usuário só pode criar ou consultar chamados da própria unidade. Perfis de cliente e terceiro agora possuem associação explícita no usuário, e a conversão de chamado em OS fica restrita à Gestão. As consultas filtram a organização do usuário para evitar exposição de dados entre organizações.

## Evidências, offline e integração

O PWA captura fotos pelo dispositivo, registra a localização via Geolocation API e oferece um canvas para assinatura do cliente. As evidências são mantidas em uma fila local quando não há conexão ou sessão; ao reconectar, a fila tenta sincronizar automaticamente pelo procedimento `evidence.add`. No servidor, os bytes são enviados ao storage S3 compatível por `storagePut`, enquanto o banco guarda somente chave, URL, tipo, MIME, coordenadas e observações na tabela `workOrderEvidence`.

A tela de integrações agora permite informar o Board ID, a direção de sincronização e o webhook de entrada do monday.com, validando que o endereço seja HTTPS. O salvamento usa `integrations.monday.connect` quando há sessão e mantém a configuração local no modo de demonstração, sem apresentar uma conexão como confirmada quando a persistência falha. A camada de backend reserva `settingsJson` para o mapeamento de campos, direção e endpoint de eventos, enquanto `integrations.monday.webhook` valida e reconhece o evento recebido.

## Validação técnica

A implementação foi validada com TypeScript, testes automatizados e build de produção. O preview foi recarregado depois da atualização do service worker, que passou a priorizar a versão atual do HTML e a remover o cache antigo. Isso corrigiu a situação em que o navegador continuava exibindo o dashboard anterior.

| Verificação | Resultado |
|---|---|
| `pnpm check` | Aprovado, sem erros TypeScript |
| `pnpm test` | Aprovado: 11 testes em 2 arquivos |
| `pnpm build` | Aprovado, frontend e servidor compilados |
| Preview do dashboard | Carregado com menu de Formulários e botão Abrir chamado |
| Console após recarga | Sem saída de erro registrada |
| Migração SQL | `0004_right_post.sql` aplicada com sucesso ao banco do projeto |
| Perfis no navegador | Gestão, terceiro e cliente validados no seletor e em seus painéis |

Os testes cobrem autenticação obrigatória para dados operacionais, resumo tipado do dashboard, isolamento de ordens por organização, listagem de chamados e formulários, proteção de mutações administrativas por perfil, validação de campos de chamados, escopo de usuários cliente/terceiro, evidências e validação do fluxo em duas etapas de equipamentos.

## Limitações atuais

A interface entregue mantém um modo demonstrativo persistido em `localStorage` para funcionar imediatamente no preview sem sessão autenticada. A listagem e criação de formulários, envio de evidências, associação de escopos de usuários e configurações monday.com usam tRPC quando há sessão e conservam fallback local quando não há. Antes do uso operacional definitivo, ainda é recomendável homologar credenciais, permissões e nomes de campos no board real do monday.com, além de definir a política de retenção das evidências.

## Conclusão

O básico solicitado está pronto para validação funcional: o cliente consegue iniciar o ciclo por chamado, a Inovadoor consegue organizar o atendimento, os ativos são vinculados às unidades, terceiros podem ser gerenciados, os formulários de atendimento e instalação fazem parte do processo de OS e campo e o PWA captura evidências com suporte offline. O produto está em condição adequada para homologação com usuários reais e configuração dos boards e credenciais de produção.

## Referências

As funcionalidades de gestão de equipes externas, ordens, formulários, equipamentos, estoque, portal do cliente, roteirização e relatórios foram comparadas com a descrição pública do FieldControl [1] [2]. Os recursos de agenda, localização, execução offline e registros de atendimento foram considerados a partir da descrição pública do aplicativo [3]. A atuação da Inovadoor em portas industriais orientou o vocabulário de ativos e serviços [4].

[1]: https://fieldcontrol.com.br/funcionalidades.html "FieldControl — Funcionalidades"
[2]: https://fieldcontrol.com.br/modulos.html "FieldControl — Módulos"
[3]: https://play.google.com/store/apps/details?id=com.fieldcontrol.orc&hl=pt_BR "FieldControl — Aplicativo na Google Play"
[4]: https://inovadoor.com.br/ "Inovadoor — Portas industriais"
