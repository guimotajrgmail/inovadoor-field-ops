# Manual completo de testes sequenciais
## Inovadoor Field Ops

**Versão:** 1.0  
**Data:** 18 de outubro de 2026  
**Objetivo:** validar ponta a ponta a plataforma de operações de campo para portas industriais, incluindo autenticação, cadastros, permissões, chamados, anexos, ordens de serviço, PWA de técnicos, formulários, planejamento de instalação, assistência técnica e integração com Monday.com.

---

## 1. Como utilizar este manual

Este documento deve ser executado na ordem apresentada. Cada etapa possui um resultado esperado e um campo para registrar a evidência. Não avance para a etapa seguinte quando o resultado esperado não for atendido. Em caso de falha, anote o identificador do teste, o perfil utilizado, a data/hora, a mensagem exibida e, se possível, uma captura de tela.

O roteiro cobre dois modos de acesso:

- **Login real:** utiliza Manus OAuth. O usuário entra com sua conta real e recebe o perfil, organização, cliente ou terceiro previamente atribuídos pela Gestão.
- **Modo demonstração:** utiliza o seletor de perfil para homologação visual e funcional sem sessão OAuth. Esse modo simula perfis e não substitui o controle de acesso de produção.

> Não use dados pessoais reais. Utilize os dados genéricos deste manual para preservar privacidade e facilitar a limpeza posterior.

### Critério geral de aprovação

O teste é aprovado quando o fluxo executa sem tela branca, sem erro de console, com os dados persistidos no local esperado, com os botões concluindo a ação indicada e com o perfil sem acesso a dados fora do seu escopo.

---

## 2. Pré-condições

Antes de iniciar, confirme:

- Navegador atualizado em computador ou celular.
- Permissão para acessar o preview ou ambiente publicado.
- Conexão de internet para OAuth, storage e sincronizações.
- Câmera e microfone disponíveis para os testes do técnico, quando aplicável.
- Um arquivo de imagem de teste (`porta-teste.jpg`) e um vídeo curto (`porta-teste.mp4`).
- Acesso à conta administrativa demonstrativa ou a uma conta real com perfil Gestão.
- Banco de dados de teste disponível e sem bloqueio de escrita.
- Se o navegador mostrar conteúdo antigo, abrir uma janela anônima ou fazer recarga completa. O preview gerenciado não deve usar HMR/WebSocket.

### Validação técnica inicial

1. Abra a aplicação.
2. Confirme que o dashboard aparece, com menu lateral e cards operacionais.
3. Abra o console do navegador e confirme que não há erro `failed to connect to websocket`, `plugin-react can't detect preamble` ou `Cannot read properties of null (reading 'useState')`.
4. Registre o resultado: **Aprovado / Reprovado**.

---

## 3. Massa de dados de teste

Use os valores abaixo para manter o roteiro reproduzível.

| Entidade | Valor de teste |
|---|---|
| Organização | Inovadoor Testes |
| Cliente | FrioSul Distribuição Teste |
| Documento | 12.345.678/0001-90 |
| Segmento | Logística |
| Estado/cidade | PR / Curitiba |
| Endereço | Rua das Docas, 100, Curitiba – PR |
| Contato principal | Ana Teste · (41) 99999-0001 · ana.teste@example.com |
| Segundo contato | Bruno Teste · (41) 99999-0002 · bruno.teste@example.com |
| Equipamento padrão | Porta rápida |
| Código | PR-TESTE-001 |
| Categoria | Portas rápidas |
| Fabricante | Inovadoor |
| Modelo | PR-2000 |
| Ambiente | Doca de expedição |
| Local instalado | Doca 01 |
| Número de série | SER-TESTE-0001 |
| Terceiro | Parceiro Sul Teste |
| Região | Curitiba e região |
| Base | Rua dos Técnicos, 50, Curitiba – PR |
| Raio de atendimento | 80 km |
| Equipes | 2 |
| Técnico | Rafael Técnico Teste |
| Formulário | Checklist preventiva – Portas rápidas |
| OS | OS-TESTE-0001 |
| Chamado | CH-TESTE-0001 |

---

## 4. Teste 1 — Acesso e autenticação

### 4.1 Acesso demonstrativo

1. Abra a aplicação.
2. Se a tela de acesso aparecer, escolha **Gestão Inovadoor**.
3. Confirme que o dashboard é exibido.
4. Use **Trocar perfil** para alternar entre Gestão, Cliente, Terceiro e Equipe de campo.
5. Confirme que a navegação muda de acordo com o perfil.

**Resultado esperado:** o modo demonstração permite homologar as telas sem afirmar que a conta é real.

### 4.2 Login real via OAuth

1. Abra o menu de perfil.
2. Clique em **Entrar com minha conta real**.
3. Conclua o fluxo Manus OAuth.
4. Retorne à aplicação.
5. Confirme o nome e e-mail no cabeçalho.
6. Confirme que o nome exibido corresponde à conta autenticada, sem substituir automaticamente por Beatriz.
7. Verifique o perfil atribuído pela Gestão.

**Resultado esperado:** o acesso real usa a identidade retornada pelo OAuth e respeita `accessProfile`, `organizationId`, `customerId` e `thirdPartyId`.

### 4.3 Login administrativo de contingência

1. Na tela demonstrativa, utilize a credencial administrativa exibida no próprio formulário.
2. Informe e-mail e senha exatamente como apresentados.
3. Teste uma senha incorreta.
4. Confirme que o acesso é negado com mensagem clara.
5. Informe a credencial correta.
6. Confirme que o perfil Gestão é aberto.

**Resultado esperado:** a credencial administrativa demonstrativa funciona para homologação e uma senha incorreta não libera acesso.

### 4.4 Login local gerenciado pela aplicação

1. Use a conta inicial de contingência exibida no formulário: `admin@inovadoor.com.br` e `Inovadoor@2026`.
2. Abra **Pessoas** e clique em **Convidar pessoa**.
3. Informe nome, e-mail, senha inicial com no mínimo oito caracteres, confirmação da senha, nível de acesso e status **Ativo**.
4. Salve e confirme que a pessoa aparece na listagem.
5. Abra **Trocar perfil**, informe o e-mail e a senha cadastrados e entre novamente.
6. Confirme que o nome da pessoa aparece no cabeçalho e que o módulo inicial respeita o nível atribuído.
7. Retorne como Gestão, altere a pessoa para **Inativo** e tente entrar novamente.

**Resultado esperado:** o login local usa e-mail e senha armazenados com hash, não envia senha por e-mail automaticamente, não expõe hash ao navegador e bloqueia contas inativas.

---

## 5. Teste 2 — Gestão de pessoas e permissões

1. Entre como Gestão.
2. Abra **Pessoas**.
3. Clique em **Convidar pessoa** ou **Cadastrar pessoa**.
4. Preencha:
   - Nome: Rafael Técnico Teste.
   - E-mail: rafael.teste@example.com.
   - Senha inicial: Teste@2026.
   - Confirmação da senha: Teste@2026.
   - Telefone: (41) 99999-0003.
   - Perfil: Equipe de campo.
   - Área: Operações de campo.
   - Status: Ativo.
5. Salve.
6. Confirme que a pessoa aparece na listagem.
7. Cadastre uma segunda pessoa com perfil Terceiro.
8. Cadastre uma terceira pessoa com perfil Pessoas.
9. Altere uma pessoa para **Inativo**.
10. Confirme que o status aparece corretamente.
11. Faça o login real com uma conta mapeada e confirme que o perfil atribuído aparece no cabeçalho.
12. Verifique que uma pessoa inativa não recebe acesso operacional.

**Resultado esperado:** a Gestão consegue criar pessoas, atribuir nível de acesso e controlar ativo/inativo. Pessoas, Cliente, Terceiro e Campo não conseguem administrar usuários sem permissão.

---

## 6. Teste 3 — Catálogos e cadastros estruturados

### 6.1 Segmentos de clientes

1. Abra **Clientes**.
2. Acesse a área de configurações ou cadastro de segmentos.
3. Cadastre `Logística`.
4. Confirme que o segmento aparece no seletor de clientes.
5. Tente criar o mesmo segmento novamente e registre o comportamento.

### 6.2 Categorias e fabricantes

1. Abra **Equipamentos**.
2. Cadastre a categoria `Portas rápidas`.
3. Cadastre o fabricante `Inovadoor`.
4. Confirme que ambos aparecem como dropdowns no cadastro de equipamento padrão.
5. Verifique que o usuário não precisa digitar categorias ou fabricantes repetidamente.

### 6.3 Ambientes de instalação

1. Cadastre o ambiente `Doca de expedição`.
2. Informe uma descrição curta.
3. Salve.
4. Confirme que o ambiente aparece no vínculo de unidade instalada.

**Resultado esperado:** segmentos, categorias, fabricantes e ambientes são cadastros reutilizáveis, separados dos registros operacionais.

---

## 7. Teste 4 — Cadastro completo de cliente

1. Abra **Clientes > Novo cliente**.
2. Informe o nome e documento do cliente de teste.
3. Selecione o segmento `Logística`.
4. Selecione estado `PR` e cidade `Curitiba`.
5. Informe o endereço.
6. Preencha o contato principal nos campos separados de nome, telefone e e-mail.
7. Use **Adicionar contato** e inclua o segundo contato.
8. Salve.
9. Confirme que o sistema gera automaticamente um contrato no formato `CTR-AAAA-NNNN`.
10. Verifique que não existe duplicidade de contrato.
11. Abra o detalhe do cliente.
12. Confirme segmento, cidade, estado e os dois contatos.
13. Edite o telefone do segundo contato e salve.
14. Reabra o detalhe para confirmar a persistência.

**Resultado esperado:** cliente criado com número de contrato automático, localização brasileira selecionável e contatos independentes.

---

## 8. Teste 5 — Cadastro e instalação de equipamento

### 8.1 Equipamento padrão

1. Abra **Equipamentos > Equipamentos padrão**.
2. Selecione categoria `Portas rápidas`.
3. Selecione fabricante `Inovadoor`.
4. Informe nome `Porta rápida`, código `PR-TESTE-001` e modelo `PR-2000`.
5. Salve.
6. Tente criar outro padrão com o mesmo código.
7. Confirme que a duplicidade é rejeitada.

### 8.2 Unidade instalada no cliente

1. Abra **Instalar equipamento no cliente**.
2. Selecione o cliente `FrioSul Distribuição Teste`.
3. Selecione o padrão `Porta rápida`.
4. Selecione o ambiente `Doca de expedição`.
5. Informe local `Doca 01`.
6. Informe série `SER-TESTE-0001`.
7. Salve.
8. Abra o detalhe do cliente e confirme a unidade.
9. Abra o detalhe do equipamento e confirme cliente, local, ambiente e série.
10. Tente instalar novamente com o mesmo número de série.

**Resultado esperado:** a unidade instalada possui identificador único por número de série e fica vinculada ao cliente correto.

---

## 9. Teste 6 — Formulários e campos customizáveis

1. Abra **Formulários**.
2. Clique em **Novo formulário**.
3. Escolha a entidade `Chamados`.
4. Crie o formulário `Checklist de chamado técnico`.
5. Adicione campos predefinidos:
   - Texto: sintoma observado.
   - Lista: tipo de falha.
   - Número: quantidade de ciclos.
   - Data: data da ocorrência.
   - Checkbox: risco operacional.
   - Observação: recomendação.
6. Marque `sintoma observado` e `tipo de falha` como obrigatórios.
7. Configure as opções da lista: `Sensor`, `Motor`, `Fotocélula`, `Outro`.
8. Visualize o preview.
9. Salve.
10. Teste **Editar**, **Duplicar** e **Desativar**.
11. Abra um novo chamado e confirme que os campos são exibidos.
12. Tente salvar sem os campos obrigatórios.
13. Confirme o bloqueio e preencha os campos.

**Resultado esperado:** o construtor usa tipos básicos, campos selecionáveis e regras de obrigatoriedade sem depender de strings complexas.

---

## 10. Teste 7 — Portal do cliente e abertura de chamado

1. Troque para o perfil **Cliente** ou entre com uma conta real mapeada para o cliente de teste.
2. Confirme que aparecem apenas os equipamentos e chamados do próprio cliente.
3. Clique em **Abrir chamado**.
4. Selecione a unidade `Porta rápida — Doca 01`.
5. Selecione prioridade `Alta`.
6. Informe título `Falha no sensor da porta rápida`.
7. Descreva o problema com contexto operacional.
8. Confirme que o formulário customizado aparece, se configurado.

### 10.1 Anexar fotos

1. Na caixa **Fotos do problema**, clique em **Selecionar fotos**.
2. Selecione uma ou mais imagens.
3. Confirme que as miniaturas aparecem.
4. Remova uma imagem e confirme que apenas ela é removida.
5. Selecione novamente a imagem.
6. Tente selecionar arquivo que não seja imagem.
7. Tente selecionar imagem acima de 8 MB.

**Resultado esperado:** apenas imagens são aceitas, com limite de 8 MB por arquivo, miniatura e remoção individual.

### 10.2 Anexar vídeos

1. Na caixa **Vídeos do problema**, clique em **Selecionar vídeos**.
2. Selecione um vídeo curto.
3. Confirme que o nome do vídeo aparece na lista.
4. Selecione mais de um vídeo.
5. Remova um vídeo e confirme a remoção individual.
6. Tente selecionar um arquivo que não seja vídeo.
7. Tente selecionar vídeo acima de 20 MB.

**Resultado esperado:** apenas vídeos são aceitos, com limite de 20 MB por arquivo e controle individual dos anexos.

### 10.3 Enviar e acompanhar

1. Clique em **Salvar formulário**.
2. Confirme a mensagem de chamado recebido.
3. Abra **Meus chamados**.
4. Confirme título, prioridade, status e data.
5. Confirme que os contadores de fotos e vídeos aparecem quando aplicável.
6. Atualize a página.
7. Confirme que o chamado continua na listagem.

**Resultado esperado:** o chamado é salvo, os anexos são persistidos no storage e vinculados ao chamado por organização e ID.

---

## 11. Teste 8 — Gestão, triagem e conversão em OS

1. Troque para Gestão.
2. Abra **Assistência técnica** ou **Ordens de serviço**.
3. Localize o chamado criado pelo cliente.
4. Abra os detalhes.
5. Confirme cliente, equipamento, série, local, descrição, prioridade, fotos e vídeos.
6. Faça a triagem.
7. Atribua o técnico Rafael Técnico Teste.
8. Se necessário, atribua o Parceiro Sul Teste.
9. Converta o chamado em OS.
10. Informe `OS-TESTE-0001` ou utilize o gerador disponível.
11. Confirme que o chamado muda para `Convertido em OS`.
12. Confirme que a OS herda cliente, equipamento, prioridade e descrição.
13. Abra os anexos e confirme que continuam disponíveis para a equipe autorizada.

**Resultado esperado:** a triagem transforma o chamado em atendimento operacional sem perder contexto ou evidências.

---

## 12. Teste 9 — Portal do terceiro

1. Entre com uma conta mapeada para o terceiro ou use o modo demonstração Terceiro.
2. Confirme que o menu contém somente os módulos autorizados.
3. Abra **Ordens** e **Agenda**.
4. Confirme que aparece apenas a OS atribuída ao Parceiro Sul Teste.
5. Abra a OS.
6. Confirme cliente, local, equipamento e técnico relacionado.
7. Tente acessar o cadastro global de clientes.
8. Tente criar um cliente.
9. Tente acessar equipamento de outra organização.

**Resultado esperado:** o terceiro acessa somente suas obras/OS e não administra clientes, catálogos ou dados de terceiros.

---

## 13. Teste 10 — PWA da equipe de campo

1. Entre como Equipe de campo.
2. Abra a OS `OS-TESTE-0001`.
3. Confirme que a OS está atribuída ao técnico correto.
4. Inicie o atendimento.
5. Faça check-in e confirme horário/GPS quando permitido.
6. Preencha o checklist.
7. Tente concluir sem campos obrigatórios.
8. Confirme o bloqueio.
9. Preencha os campos pendentes.

### 13.1 Evidências fotográficas

1. Abra a área de evidências.
2. Selecione até 20 fotos em uma única operação.
3. Confirme miniaturas em grade.
4. Confirme status individual `Enviando` e depois `Enviada`.
5. Remova uma foto específica.
6. Teste uma evidência sem conexão e confirme status `Offline`/fila.

### 13.2 Assinatura

1. Abra a captura de assinatura.
2. Desenhe com o dedo ou caneta.
3. Faça curvas e movimentos contínuos.
4. Confirme que a linha é suave.
5. Clique em **Refazer**.
6. Confirme que o canvas é limpo.
7. Capture uma assinatura válida.

### 13.3 Conclusão e PDF

1. Informe observações técnicas.
2. Confirme latitude/longitude, quando disponíveis.
3. Finalize a OS.
4. Confirme status `Concluída`.
5. Clique em **Exportar PDF**.
6. Abra o PDF baixado.
7. Confirme OS, cliente, equipamento, checklist, evidências, GPS, assinatura e observações.

**Resultado esperado:** o técnico consegue concluir o atendimento mesmo com fila offline, sem perder evidências ou assinatura.

---

## 14. Teste 11 — Planejamento de instalação

1. Entre como Gestão.
2. Abra **Planejamento de instalação**.
3. Crie ou importe uma instalação de teste.
4. Informe cliente, local, data e quantidade.
5. Clique em **Ver candidatos**.
6. Confirme que instaladores elegíveis aparecem.
7. Compartilhe a instalação com pelo menos dois instaladores.
8. Entre como Instalador A.
9. Aceite a obra.
10. Confirme a abertura da OS.
11. Entre como Instalador B.
12. Confirme que a obra aceita não aparece mais para B.
13. Retorne à Gestão.
14. Confirme que a instalação aparece para Gestão e para o instalador que aceitou.

**Resultado esperado:** a visibilidade muda após o aceite e a OS é relacionada à instalação correta.

---

## 15. Teste 12 — Integração e simulador Monday.com

1. Abra **Integrações**.
2. Confirme Board ID e mapeamento técnico das colunas.
3. Confirme coluna de situação/status.
4. Confirme direção inbound e outbound.
5. Confirme webhook HTTPS quando configurado.
6. No simulador, crie um item com situação `Expedido`.
7. Informe quantidade `10`.
8. Execute **Importar Expedido**.
9. Confirme que 10 OS são criadas, uma por porta.
10. Conclua algumas OS.
11. Execute a sincronização de saída.
12. Confirme status, OS concluídas, quantidade, fotos e vídeos nos valores simulados.
13. Se utilizar Monday real, reconecte o token OAuth antes de importar valores.

**Resultado esperado:** o simulador demonstra o fluxo bidirecional sem depender de uma credencial externa expirada.

---

## 16. Teste 13 — Notificações e auditoria visual

1. Gere um chamado como Cliente.
2. Retorne à Gestão.
3. Confirme notificação de novo chamado.
4. Converta o chamado em OS.
5. Confirme notificação da mudança.
6. Sincronize um item Monday.
7. Confirme notificação de sincronização.
8. Marque uma notificação como lida.
9. Use **Marcar todas como lidas**.
10. Atualize a página e confirme o estado persistente quando autenticado.

---

## 17. Matriz de permissões

| Perfil | Deve conseguir | Não deve conseguir |
|---|---|---|
| Gestão | Cadastros completos, usuários, OS, chamados, formulários, terceiros, integrações e relatórios | — |
| Cliente | Ver seus equipamentos, chamados e OS; abrir chamado; anexar fotos/vídeos | Ver dados de outro cliente; cadastrar pessoas; administrar catálogos |
| Terceiro | Ver obras/OS atribuídas e agenda própria | Ver terceiros concorrentes; administrar clientes; alterar catálogo |
| Campo | Ver OS atribuídas; checklist; GPS; fotos; assinatura; concluir OS | Cadastrar clientes; administrar pessoas; ver OS não atribuídas |
| Pessoas | Ver equipe, perfis e relatórios autorizados | Operar módulos não autorizados |

Para cada tentativa proibida, registre se o sistema ocultou o dado ou retornou mensagem de acesso negado. Ambos são aceitáveis quando consistentes com a política de segurança.

---

## 18. Checklist final de aprovação

Marque cada item como **Aprovado**, **Reprovado** ou **Não aplicável**.

- [ ] Dashboard abre sem tela branca.
- [ ] Login real redireciona para OAuth.
- [ ] Nome e e-mail reais aparecem no cabeçalho.
- [ ] Login demonstrativo administrativo funciona.
- [ ] Usuários podem ser cadastrados e desativados.
- [ ] Perfis e vínculos de acesso são respeitados.
- [ ] Segmentos são selecionáveis.
- [ ] Estado e cidade são selecionáveis.
- [ ] Contrato é gerado automaticamente.
- [ ] Contatos múltiplos são preservados.
- [ ] Categoria e fabricante são reutilizáveis.
- [ ] Ambiente de instalação é selecionável.
- [ ] Equipamento padrão é separado da unidade instalada.
- [ ] Número de série duplicado é rejeitado.
- [ ] Formulário customizado pode ser criado, editado, duplicado e desativado.
- [ ] Campos obrigatórios bloqueiam envio incompleto.
- [ ] Cliente abre chamado.
- [ ] Cliente anexa múltiplas fotos.
- [ ] Cliente anexa múltiplos vídeos.
- [ ] Formatos e limites dos anexos são validados.
- [ ] Anexos ficam vinculados ao chamado.
- [ ] Gestão visualiza e faz triagem.
- [ ] Chamado converte em OS.
- [ ] Terceiro vê apenas suas obras.
- [ ] Técnico conclui atendimento.
- [ ] PWA aceita fotos múltiplas.
- [ ] Assinatura é capturada e refeita.
- [ ] GPS e checklist são persistidos.
- [ ] PDF do atendimento é exportado.
- [ ] Planejamento respeita aceite e visibilidade.
- [ ] Assistência técnica abre detalhes reais.
- [ ] Monday simulado importa Expedido.
- [ ] Monday simulado atualiza dados de saída.
- [ ] Notificações são geradas e marcadas como lidas.
- [ ] Não existem erros no console.

---

## 19. Registro de execução

**Executor:** __________________________________________  
**Data/hora de início:** _________________________________  
**Ambiente:** ___________________________________________  
**Versão/checkpoint:** __________________________________  
**Navegador/dispositivo:** ______________________________  

### Falhas encontradas

| ID | Etapa | Perfil | Descrição | Evidência | Severidade | Status |
|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |

### Aprovação final

**Resultado:** (  ) Aprovado  (  ) Aprovado com ressalvas  (  ) Reprovado

**Responsável pela homologação:** __________________________  
**Data:** __________________________  
**Observações:**

______________________________________________________________________________

______________________________________________________________________________

---

## 20. Diagnóstico rápido

- **Tela branca ou root vazio:** faça recarga completa, abra janela anônima e confirme que não há service worker antigo. O preview gerenciado utiliza `hmr: false`.
- **Erro de WebSocket do Vite:** descarte o log antigo do navegador e abra uma URL nova do preview; o cliente HMR não deve ser carregado.
- **Nome incorreto no cabeçalho:** saia do modo demonstração e repita o login OAuth; confirme também o perfil atribuído à conta.
- **Pessoa sem acesso:** confirme status ativo, `accessProfile` e vínculo com cliente/terceiro.
- **Chamado não aparece:** confirme organização, cliente vinculado e filtro de status.
- **Upload rejeitado:** valide formato e tamanho; fotos têm limite de 8 MB e vídeos de 20 MB no chamado.
- **Anexo não aparece na Gestão:** confirme que o chamado foi criado na sessão autenticada e que o storage está configurado.
- **OS não aparece para terceiro ou técnico:** confirme `assignedThirdPartyId` ou `assignedMemberId`.
- **Monday não importa valores:** valide token/conector; use o simulador para validar a lógica sem credencial externa.

---

## 21. Resultado técnico esperado

Ao final do roteiro, a plataforma deve apresentar TypeScript sem erros, build de produção concluído, testes automatizados aprovados, dashboard renderizando, autenticação real disponível, isolamento por organização/perfil, cadastros estruturados, chamados com fotos e vídeos persistidos, OS com PWA de campo, assinatura, GPS, checklist, PDF e integração simulada com Monday.com.
