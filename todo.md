# Checklist do Inovadoor Field Ops

## Formulários customizáveis

- [x] Criar definições persistentes por entidade no banco.
- [x] Permitir tipos de campo: texto, texto longo, número, data, seleção e checkbox.
- [x] Permitir obrigatoriedade e opções para campos de seleção.
- [x] Disponibilizar construtor de formulários no módulo Formulários.
- [x] Renderizar campos extras no formulário de cadastro da entidade correspondente.
- [x] Cobrir Clientes, Equipamentos padrão, Instalação, Terceiros, Pessoas, Ordens de serviço e Chamados.
- [x] Expor listagem e criação via endpoints tRPC protegidos para Gestão.
- [x] Manter fallback demonstrativo no navegador sem sessão.
- [x] Validar no preview o construtor e campos extras de Cliente.
- [x] Validar TypeScript, testes e build.

## Homologação recomendada

Cadastrar os campos oficiais de cada processo Inovadoor, definir responsáveis pela manutenção dos formulários e validar quais campos devem ser obrigatórios antes de permitir o encerramento de uma OS.

## Próxima camada operacional

- [x] Filtrar visualmente a navegação conforme o perfil Gestão, Pessoas ou Terceiros.
- [x] Bloquear navegação fora do escopo do perfil com mensagem clara ao usuário.
- [x] Adicionar central de notificações no dashboard, com contador de não lidas.
- [x] Permitir marcar notificações individualmente ou em lote como lidas.
- [x] Validar TypeScript, testes automatizados e build após as melhorias.
- [ ] Persistir eventos e preferências de notificações no banco para produção.
- [ ] Configurar credenciais e nomes de colunas do board real do monday.com.
