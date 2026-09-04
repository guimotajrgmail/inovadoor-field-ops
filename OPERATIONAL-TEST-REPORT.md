# Relatório de teste operacional — Inovadoor Field Ops

## Resultado executivo

O teste ponta a ponta foi executado com dados genéricos persistidos no banco da organização de teste `1`. Foram exercitados os perfis de gestão, terceiro, cliente, técnico e gestão de pessoas. O fluxo de cadastro de clientes, catálogo de equipamentos, vínculo por número de série, formulários, chamados, OS, evidências de campo e permissões concluiu sem falhas funcionais.

## Plano executado

| Etapa | Cenário                                                                     | Resultado |
| ----- | --------------------------------------------------------------------------- | --------- |
| 1     | Cadastrar cliente de teste com dados de contato e endereço                  | Aprovado  |
| 2     | Cadastrar parceiro terceiro homologado com SLA                              | Aprovado  |
| 3     | Cadastrar catálogos Porta rápida, Porta seccional e Abrigo de doca          | Aprovado  |
| 4     | Instalar uma Porta rápida no cliente com local e serial único               | Aprovado  |
| 5     | Criar checklists preventiva, corretiva e instalação                         | Aprovado  |
| 6     | Criar ficha customizada para equipamento padrão                             | Aprovado  |
| 7     | Criar OS de instalação vinculada a cliente, equipamento, técnico e terceiro | Aprovado  |
| 8     | Cliente abrir e consultar chamado                                           | Aprovado  |
| 9     | Terceiro consultar somente suas OS atribuídas                               | Aprovado  |
| 10    | Técnico iniciar, atualizar e concluir atendimento                           | Aprovado  |
| 11    | Registrar foto, assinatura, GPS e checklist da execução                     | Aprovado  |
| 12    | Gestão de pessoas consultar equipe cadastrada                               | Aprovado  |
| 13    | Confirmar que técnico não consegue cadastrar cliente                        | Aprovado  |

## Dados criados

| Entidade          | Dados de teste                                                          |
| ----------------- | ----------------------------------------------------------------------- |
| Cliente           | Cliente Teste · FrioSul, Araucária/PR                                   |
| Terceiro          | Parceiro Teste · Updoors, região Sul, SLA 96%                           |
| Catálogos         | Porta rápida, Porta seccional e Abrigo de doca                          |
| Unidade instalada | Porta rápida no local “Doca de testes 01”, serial `TEST-SERIE-001`      |
| Técnico           | Técnico Teste · Rafael                                                  |
| Formulários       | Checklist preventiva, corretiva e instalação; ficha técnica customizada |
| OS                | `TEST-OS-OPERACIONAL-001`, instalação de porta rápida                   |
| Chamado           | `TEST-CHAMADO-OPERACIONAL-001`, falha simulada de sensor                |
| Evidências        | Uma foto e uma assinatura genéricas, ambas com GPS `-25.4284,-49.2733`  |
| Perfis            | Gestão, terceiro, cliente, campo e pessoas                              |

## Evidências de isolamento

O perfil de terceiro retornou somente ordens cujo `assignedThirdPartyId` corresponde ao parceiro de teste. O perfil de cliente retornou somente chamados, OS e equipamentos cujo `customerId` corresponde ao cliente de teste. O perfil de campo recebeu a OS atribuída e foi impedido de criar clientes, retornando `FORBIDDEN`. O perfil de pessoas acessou a listagem da equipe.

## Evidências do atendimento técnico

A OS foi atualizada de `agendada` para `em_campo` e depois para `concluida`. Foram armazenados dois registros de evidência no storage, uma foto e uma assinatura, com latitude e longitude. O checklist de instalação foi persistido no campo `checklistJson`, incluindo resultado aprovado e confirmação de segurança.

## IDs principais

- Cliente: `1`
- Terceiro: `1`
- Catálogos: `1`, `2` e `3`
- Equipamento instalado: `1`
- OS: `1`
- Chamado: `1`
- Técnico: `1`

## Validações técnicas

O TypeScript foi verificado com `pnpm check`. A suíte automatizada foi executada com 13 testes aprovados. O roteiro operacional foi executado diretamente pelas funções de domínio e pelos callers tRPC, preservando as mesmas regras de autorização da aplicação. Os dados podem ser consultados posteriormente na interface usando o ambiente de gestão.

Os registros foram criados com nomes e identificadores de teste para facilitar a limpeza posterior. O script de execução está em `scripts/run-operational-test.ts` e usa chaves determinísticas para as entidades principais, exceto fichas customizadas, que recebem identificadores temporais para não colidir com definições anteriores.

## Limitações observadas

O login do preview utiliza o ambiente demonstrativo e não mantém uma sessão OAuth real no navegador. Por isso, o teste de persistência foi executado no servidor com os callers tRPC autenticados e dados reais do banco, enquanto a validação visual de login permanece demonstrativa. A geração de vídeo não foi executada como upload real; a integração monday.com continua sendo o caminho de simulação para contadores de vídeo.

## Conclusão

O fluxo operacional básico está funcional para os cinco perfis testados. O cenário cobre o ciclo principal do segmento de portas industriais: catálogo, unidade instalada, cliente, chamado, triagem, OS, terceiro, técnico, checklist, evidências, GPS, assinatura e conclusão.

## Referências

[1]: https://fieldcontrol.com.br "FieldControl — referência funcional de gestão de campo"
[2]: https://inovadoor.com.br "Inovadoor — referência do segmento de portas industriais"
