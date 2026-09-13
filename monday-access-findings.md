# Diagnóstico da nova conta monday.com — 13 set 2026

A conexão monday.com está habilitada e autenticada como **Guilherme Ezepha** (`116354358`). A conta é Pro em período de teste, com um membro ativo.

O board acessível é **Inovadoor**, ID `18430857601`, URL `https://guilhermeezephas-team.monday.com/boards/18430857601`, no workspace **Área de trabalho principal**, ID `17503800`. O board é público, clássico e contém 6.258 itens.

Os grupos relevantes são:

| Grupo | ID | Uso identificado |
|---|---|---|
| Planejamento Instalacao.xlsx | `group_mm75286q` | Planejamento de instalações |
| assistencia tecnica.xlsx | `group_mm759nwx` | Assistência técnica |
| Tarefas pendentes | `new_group29179` | Tarefas gerais |
| Concluído | `new_group43041` | Itens concluídos |

A estrutura atual do board contém somente as colunas Nome (`name`), Responsável (`project_owner`), Status (`project_status`) e Prazo (`date`). O Status possui os rótulos **Em andamento**, **Feito**, **Parado** e **Não iniciado**. Portanto, dados como cliente, cidade, equipamento, prioridade, número da OS e aceite do instalador ainda não estão representados em colunas dedicadas.

Foram confirmados itens reais nos dois grupos. Exemplos de instalação: `2711.23 - INSTALAÇÃO - WEST PHARMACEUTICAL, DIADEMA/ SP`, `2622.23 - INSTALAÇÃO - DIA BRASIL, OSASCO/ SP` e `0489.23 LATICIONIO BELO VALE LTDA`. Exemplos de assistência: `2654.24 - RIBEIRO CARAM - AUTOZONE, PAULINIA SP`, `2636.23 - IMPEXTRACO - MOTOR P9 VAZANDO ÓLEO` e `2134.24 -LOG, GOIÂNIA GO (porta travando)`.

Os itens retornaram Status **Não iniciado**, Responsável vazio e Prazo vazio nos dois grupos consultados. A conta tem somente o usuário Guilherme Ezepha disponível para atribuição no contexto consultado; os instaladores reais ainda precisarão ser cadastrados ou adicionados como usuários/membros no sistema Inovadoor.

A integração proposta no sistema local manterá o monday como origem dos itens, fará importação por grupo e adicionará localmente os controles operacionais ausentes: candidatos visíveis, aceite exclusivo, atribuição, cliente, endereço, prioridade, SLA, técnico/terceiro e abertura de OS.

## Referência externa

[1]: https://guilhermeezephas-team.monday.com/boards/18430857601 "Board Inovadoor no monday.com"
