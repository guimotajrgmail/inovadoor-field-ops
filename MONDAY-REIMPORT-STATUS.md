# Correção do board operacional Inovadoor

## Resultado aplicado

A conta monday.com confirmou acesso ao board **Inovadoor**, ID `18430857601`, no workspace **Área de trabalho principal**. O board original foi mantido; nenhum item foi apagado ou criado durante esta tentativa.

A estrutura das duas exportações foi adicionada ao board atual com prefixos para evitar colisões:

| Origem | Colunas criadas | Registros de origem |
|---|---:|---:|
| Assistência Técnica (`AT · ...`) | 59 | 3.116 |
| Planejamento de Instalação (`PI · ...`) | 51 colunas lógicas; 7 duplicatas temporárias foram renomeadas com sufixo `· 2` | 3.615 |

O board passou de quatro colunas nativas para uma estrutura operacional ampla. As colunas textuais e de texto longo foram criadas para preservar o conteúdo original, incluindo chamados, clientes, portas, equipes, localização, ações, pedidos, links e informações financeiras.

## Importação dos valores

A tentativa de usar o job nativo `ingest_items` com **UPSERT por Nome** foi iniciada no grupo de assistência técnica, mas o upload do CSV ao URL temporário do S3 retornou `400 InvalidToken`. Portanto, **os valores das exportações ainda não devem ser considerados importados**. O conteúdo original foi apenas normalizado localmente e permanece disponível nos CSVs entregues.

A falha não alterou os itens existentes. O board está em estado parcialmente preparado: estrutura aplicada, valores ainda pendentes.

## Arquivos preparados

Os CSVs normalizados preservam os cabeçalhos e os registros das exportações. O mapeamento documenta o tipo de coluna sugerido e o ID técnico lógico de cada campo.

- `assistencia-normalized.csv`: 3.116 registros, 61 colunas de origem.
- `planejamento-normalized.csv`: 3.615 registros, 54 colunas de origem.
- `monday-column-mapping.csv`: 115 mapeamentos de colunas.

## Próximo passo recomendado

Reexecutar a ingestão através do importador nativo da interface monday.com ou renovar o job de upload com um URL assinado novo e fazer o envio imediatamente, mantendo `UPSERT` por `Name`. A correspondência deve ser feita por Nome, com revisão posterior dos registros sem correspondência e dos nomes duplicados.
