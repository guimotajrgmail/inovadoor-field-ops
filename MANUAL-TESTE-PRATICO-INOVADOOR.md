# Manual de teste prático — Inovadoor Field Ops

## 1. Objetivo

Este roteiro valida os fluxos principais da plataforma Inovadoor Field Ops: autenticação real via Manus OAuth, perfis de Gestão, Cliente, Terceiro e Equipe de campo, cadastros estruturados, vínculos de equipamentos, formulários, planejamento de instalação, assistência técnica e evidências do atendimento.

A aplicação possui dois modos:

- **Login real:** usa a conta autenticada no Manus. O perfil não é escolhido pelo usuário; ele é resolvido pela permissão atribuída à conta.
- **Modo demonstração:** disponível para testes locais sem OAuth. O seletor de perfil é apenas um simulador e não representa controle de acesso de produção.

## 2. Como acessar

1. Abra a URL do projeto publicado ou o preview fornecido pelo ambiente WebDev.
2. Na tela **Acesse sua operação**, escolha uma das opções de ambiente somente se estiver usando o modo demonstração.
3. Para acesso real, clique em **Entrar com minha conta real** e conclua o login no portal OAuth.
4. Depois do retorno à aplicação, confirme no canto superior direito se aparecem o nome e o e-mail da conta autenticada. O nome não deve ser substituído por um usuário demonstrativo.
5. Caso seja necessário trocar o perfil demonstrativo, use **Trocar perfil** e selecione Cliente, Terceiro, Equipe de campo ou Gestão.

> O login real exige que a conta exista no provedor OAuth e que sua permissão tenha sido atribuída pela Gestão. O e-mail e a senha exibidos no modo demonstração não são credenciais reais.

## 3. Dados de teste sugeridos

Use dados genéricos, sem dados pessoais reais:

- Cliente: `FrioSul Distribuição`
- Segmento: `Logística`
- Estado/cidade: `PR / Curitiba`
- Contato: `Ana Teste`, `(41) 99999-0001`, `ana.teste@example.com`
- Equipamento padrão: `Porta rápida`, código `PR-TESTE-001`
- Categoria: `Portas rápidas`
- Fabricante: `Inovadoor`
- Unidade instalada: local `Doca 01`, série `SER-TESTE-0001`
- Terceiro: `Parceiro Sul Teste`
- Região: `Curitiba e região`
- Equipes: `2`

## 4. Teste da Gestão Inovadoor

### 4.1 Pessoas e permissões

1. Entre como Gestão real ou abra o modo demonstrativo Gestão.
2. Abra **Pessoas**.
3. Confirme que a tela está dentro da Gestão Inovadoor, não como um módulo independente do menu inicial.
4. Em uma sessão autenticada, confirme que usuários OAuth reais aparecem com nome, e-mail, perfil e último acesso.
5. Verifique que usuários de Cliente e Terceiro não conseguem abrir os módulos administrativos.

### 4.2 Segmentos de clientes

1. Abra **Clientes** e selecione **Novo cliente**.
2. Confirme que o campo **Segmento** é um seletor, não um texto livre.
3. Cadastre ou selecione um segmento como `Logística`.
4. Salve e confirme que o segmento aparece na listagem e no detalhe do cliente.

### 4.3 Cadastro de cliente

1. No formulário de cliente, preencha razão social/nome, CNPJ ou identificador, segmento, estado e cidade.
2. Use os seletores brasileiros de estado e cidade.
3. Preencha o primeiro contato em campos separados: nome, telefone e e-mail.
4. Use **Adicionar contato** para incluir um segundo contato.
5. Salve.
6. Confirme que o contrato foi gerado automaticamente no formato `CTR-AAAA-NNNN` e que não é necessário digitar o número.
7. Edite ou abra o detalhe e confirme que os contatos continuam separados.

### 4.4 Catálogo de equipamentos

1. Abra **Equipamentos**.
2. Na área **Equipamentos padrão**, cadastre ou selecione uma categoria e um fabricante.
3. Cadastre o padrão `Porta rápida` com código único e descrição.
4. Confirme que categoria e fabricante aparecem como opções reutilizáveis em novos cadastros.
5. Tente cadastrar novamente o mesmo código e confirme que a duplicidade é rejeitada.

### 4.5 Vínculo do equipamento ao cliente

1. Na área de unidades instaladas, selecione o cliente e o equipamento padrão `Porta rápida`.
2. Informe ambiente/local de instalação, por exemplo `Doca 01`.
3. Informe o número de série `SER-TESTE-0001`.
4. Salve e confirme que a unidade aparece no detalhe do cliente e no equipamento.
5. Tente vincular o mesmo número de série novamente e confirme a rejeição de duplicidade.
6. Abra um chamado ou uma OS para confirmar que cliente, padrão, local e série são mantidos no contexto do atendimento.

### 4.6 Terceiros

1. Abra **Terceiros** e selecione **Novo terceiro**.
2. Preencha nome da empresa, região de atendimento, endereço da base, raio de atendimento e quantidade de equipes.
3. Cadastre dois contatos, cada um com nome, telefone e e-mail separados.
4. Salve e abra o detalhe.
5. Confirme que os contatos aparecem e que não há coluna SLA na tabela principal.
6. Confirme que o status é visualizado, sem apresentar configuração de SLA inexistente.

### 4.7 Formulários

1. Abra **Formulários** e selecione **Novo formulário**.
2. Escolha uma entidade: Cliente, Equipamento padrão, Instalação, Terceiro, Pessoa, OS ou Chamado.
3. Adicione campos pelos tipos predefinidos: texto, número, seleção, data, checkbox, observação, foto, assinatura ou localização.
4. Marque alguns campos como obrigatórios.
5. Para campos de seleção, informe opções em linhas separadas e use a pré-visualização.
6. Salve o formulário.
7. Teste **Editar**, **Duplicar** e **Desativar**.
8. Abra um cadastro associado e confirme que os campos customizados aparecem no formulário.
9. Se houver regra condicional, confirme que o campo dependente só aparece quando a condição é atendida.

### 4.8 Planejamento de instalação

1. Abra **Planejamento de instalação**.
2. Crie ou abra uma instalação pendente.
3. Use **Ver candidatos** para visualizar os instaladores elegíveis.
4. Selecione mais de um instalador para compartilhar a oportunidade.
5. Faça o aceite como um instalador.
6. Confirme que, após o aceite, a instalação fica visível ao administrador e ao instalador que aceitou, e deixa de aparecer para os demais candidatos.
7. Confirme a abertura de uma OS relacionada.

### 4.9 Assistência técnica

1. Abra **Assistência técnica**.
2. Crie uma solicitação vinculada a cliente e equipamento instalado.
3. Abra **Detalhes** e confirme que a tela mostra dados operacionais reais da solicitação, e não apenas uma mensagem de placeholder.
4. Converta a solicitação em OS.
5. Confirme cliente, equipamento, série, local e prioridade na OS criada.

### 4.10 Integração Monday.com

1. Abra **Integrações**.
2. Confirme Board ID, direção da sincronização, webhook HTTPS e mapeamento técnico das colunas.
3. No simulador, crie/importе um item com **Situação = Expedido**.
4. Confirme que uma quantidade de 10 portas gera 10 OS individuais.
5. Conclua uma ou mais OS e confirme a atualização de status, quantidade concluída e evidências no item simulado.
6. Para integração real, reconecte o token OAuth do Monday antes de importar valores.

## 5. Teste do Portal do Cliente

1. Entre com uma conta real mapeada para o perfil Cliente ou use o modo demonstrativo Cliente.
2. Confirme que o cliente vê somente seus próprios chamados, OS e equipamentos.
3. Abra **Abrir chamado** dentro do portal.
4. Selecione equipamento, prioridade e descreva o problema.
5. Envie o chamado.
6. Confirme a mensagem de sucesso e que o chamado aparece no acompanhamento.
7. Tente acessar clientes, equipamentos ou OS de outra organização e confirme bloqueio/ausência dos dados.

## 6. Teste do Terceiro

1. Entre com uma conta real mapeada para Terceiro ou use o perfil demonstrativo.
2. Confirme que aparecem somente obras/OS atribuídas ao terceiro e técnicos vinculados a ele.
3. Abra uma OS atribuída.
4. Confirme que não é possível cadastrar cliente nem acessar a Gestão Inovadoor.
5. Confirme que o menu fica restrito a operações próprias, ordens e agenda.

## 7. Teste da Equipe de campo / PWA

1. Entre como Equipe de campo.
2. Abra uma OS atribuída e inicie o atendimento.
3. Preencha o checklist e os campos obrigatórios do formulário de encerramento.
4. Selecione até 20 fotos de uma vez, ou use a câmera do dispositivo.
5. Confirme miniaturas, status individual de envio e remoção individual.
6. Teste o modo offline: adicione uma evidência sem conexão e confirme o status `Offline`/fila.
7. Capture a assinatura usando dedo ou caneta.
8. Confirme que a assinatura é fluida e que **Refazer** limpa o canvas.
9. Registre localização/GPS, observações e conclusão.
10. Tente concluir sem preencher um campo obrigatório e confirme o bloqueio.
11. Conclua com tudo preenchido.
12. No resumo final, use **Exportar PDF** e confirme que o arquivo baixável inclui OS, cliente, equipamento, checklist, fotos, GPS, assinatura e observações.

## 8. Matriz de isolamento esperada

| Perfil | Pode ver | Não pode fazer |
|---|---|---|
| Gestão Inovadoor | Todos os cadastros, OS, formulários, pessoas, terceiros e integrações | — |
| Cliente | Seus chamados, OS e equipamentos; abertura de chamado | Ver dados de outros clientes ou administrar cadastros |
| Terceiro | Obras/OS e técnicos atribuídos ao terceiro | Ver outros terceiros, clientes globais ou administrar catálogo |
| Equipe de campo | OS atribuídas, agenda, checklist, evidências e assinatura | Cadastrar cliente ou acessar módulos administrativos |
| Gestão de pessoas | Usuários, perfis e relatórios autorizados | Alterar módulos fora de sua permissão |

## 9. Resultado esperado da validação técnica

A entrega atual deve apresentar:

- `pnpm check` sem erros de TypeScript;
- 14 testes Vitest aprovados;
- `pnpm build` concluído;
- root renderizando sem tela branca;
- HMR incompatível com o proxy desativado (`hmr: false`);
- login real redirecionando para Manus OAuth;
- portal do cliente com modal de abertura de chamado;
- contatos, segmentos, categorias, fabricantes, ambientes e números de contrato estruturados;
- isolamento por organização e perfil aplicado no backend;
- PWA de campo com múltiplas fotos, assinatura fluida e exportação PDF.

## 10. Diagnóstico rápido

- **Ainda aparece Beatriz:** confirme se está no modo demonstração. No login real, saia e entre novamente com a conta OAuth; o cabeçalho deve usar o nome/e-mail retornado pela sessão.
- **Usuário real sem acesso:** atribua o perfil e o vínculo de cliente/terceiro na Gestão de Pessoas e faça novo login.
- **Preview vazio ou erro de WebSocket:** limpe o cache/service worker e recarregue. O projeto usa `hmr: false` por compatibilidade com o proxy HTTPS.
- **Valores do Monday não importam:** valide o token/conector atual; a estrutura de colunas pode estar pronta mesmo quando a credencial expira.
- **Chamado não aparece:** confirme que a conta está vinculada à mesma organização e ao cliente correto.
