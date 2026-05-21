# API REST

Base URL: `{APP_URL}/api`

Autenticação: cookie de sessão Supabase (JWT) após `POST /api/auth/login`.

## Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/login` | Login (email, password) |
| POST | `/auth/logout` | Encerrar sessão |

## Usuários

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | `/usuarios` | usuarios.visualizar | Listar |
| POST | `/usuarios` | usuarios.gerenciar | Criar (admin) |

## Eleitores

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | `/eleitores` | eleitores.visualizar* | Listar com filtros |
| POST | `/eleitores` | eleitores.criar | Criar |
| GET | `/eleitores/:id` | eleitores.visualizar* | Detalhe |
| PUT | `/eleitores/:id` | eleitores.editar_* | Atualizar |
| DELETE | `/eleitores/:id` | eleitores.excluir | Soft delete |

### Query params (GET /eleitores)

- `nome`, `cpf`, `cidade_id`, `bairro_id`, `zona_eleitoral_id`, `situacao`
- `page` (default 1), `limit` (max 100)

## Territorial

Leitura: qualquer usuário autenticado. Escrita (POST/PUT/DELETE): permissão `territorio.gerenciar`.

### Estados

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/territorio/estados` | Listar (`nome`, `sigla`, `page`, `limit`) |
| POST | `/territorio/estados` | Criar `{ nome, sigla }` |
| GET | `/territorio/estados/:id` | Detalhe |
| PUT | `/territorio/estados/:id` | Atualizar |
| DELETE | `/territorio/estados/:id` | Excluir |

### Municípios (tabela `cidades`)

Usados nos **cadastros** de eleitores. Alias recomendado: `/territorio/municipios`.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/territorio/municipios` ou `/territorio/cidades` | Listar (`estado_id`, `nome`, `page`, `limit`) |
| POST | `/territorio/cidades` | Criar `{ nome, estado_id }` |
| GET | `/territorio/municipios/:id` | Detalhe |
| PUT | `/territorio/cidades/:id` | Atualizar |
| DELETE | `/territorio/cidades/:id` | Excluir |

### Bairros

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/territorio/bairros` | Listar (`cidade_id`, `nome`, `page`, `limit`) |
| POST | `/territorio/bairros` | Criar `{ nome, cidade_id }` |
| GET | `/territorio/bairros/:id` | Detalhe |
| PUT | `/territorio/bairros/:id` | Atualizar |
| DELETE | `/territorio/bairros/:id` | Excluir |

### Zonas eleitorais

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/territorio/zonas` | Listar (`cidade_id`, `estado_id`, `numero`, `page`, `limit`) |
| POST | `/territorio/zonas` | Criar `{ numero, cidade_id, estado_id }` |
| GET | `/territorio/zonas/:id` | Detalhe |
| PUT | `/territorio/zonas/:id` | Atualizar |
| DELETE | `/territorio/zonas/:id` | Excluir |

### Referência externa — estados e municípios (IBGE / BrasilAPI)

Para alimentar os **cadastros**. Proxy autenticado, cache 24h, gratuito.

| Método | Rota | Fonte |
|--------|------|-------|
| GET | `/territorio/referencia/ibge/estados` | IBGE UFs |
| GET | `/territorio/referencia/ibge/estados/:uf/municipios` | IBGE municípios |
| GET | `/territorio/referencia/brasilapi/estados` | BrasilAPI UFs |
| GET | `/territorio/referencia/brasilapi/estados/:uf/municipios` | BrasilAPI municípios |

### Importar IBGE → banco (cadastros)

| Método | Rota | Permissão | Body |
|--------|------|-----------|------|
| POST | `/territorio/sync/ibge` | territorio.gerenciar | `{ "ufs": ["SP"] }` ou `{}` (todo o Brasil) |

Importa apenas **estados** e **municípios**. Requer migration `002_ibge_ids.sql`.

## Dashboard

| Método | Rota | Permissão |
|--------|------|-----------|
| GET | `/dashboard` | dashboard.visualizar |

## Resposta padrão

```json
{
  "success": true,
  "data": { }
}
```

```json
{
  "success": false,
  "error": "Mensagem"
}
```

## Relatórios

`GET /api/relatorios/:tipo?format=pdf|xlsx|csv`

Requer permissão `relatorios.visualizar` ou `relatorios.exportar`.

| tipo | Descrição |
|------|-----------|
| `zona-eleitoral` | Totais por zona eleitoral |
| `bairro` | Totais por bairro |
| `cidade` | Totais por município |
| `cadastros-usuario` | Totais por usuário cadastrador |
| `cadastros-periodo` | Totais por dia (exige `de` e `ate` em YYYY-MM-DD) |

Exemplo: `GET /api/relatorios/bairro?format=xlsx`

Período: `GET /api/relatorios/cadastros-periodo?format=pdf&de=2026-01-01&ate=2026-05-31`

Resposta: arquivo binário com header `Content-Disposition: attachment`.

## Rotas planejadas (próxima iteração)
- `GET /auditoria` com paginação
- `POST /auth/recuperar-senha`
- `PUT /auth/alterar-senha`
