# Sistema de Cadastro e Gestão de Eleitores

Plataforma administrativa multiusuário com autenticação, RBAC, gestão territorial, dashboard, auditoria e API REST.

**Stack:** Next.js 16 + Supabase (PostgreSQL) + Tailwind CSS

## Início rápido

```bash
cd sistema-eleitores
cp .env.example .env.local
# Preencha as chaves do Supabase

# Aplique o schema no SQL Editor do Supabase:
# - supabase/migrations/001_initial_schema.sql
# - supabase/seed.sql

npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Documentação

| Arquivo | Conteúdo |
|---------|----------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitetura completa |
| [docs/DER.md](docs/DER.md) | Diagrama entidade-relacionamento |
| [docs/API.md](docs/API.md) | Endpoints REST |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Implantação produção |
| [docs/SCREENS.md](docs/SCREENS.md) | Protótipo de telas |

## Perfis de acesso

- **Administrador Geral** — acesso total
- **Coordenador** — equipes, aprovação, exportação
- **Cadastrador** — inserir e editar próprios registros
- **Visualizador** — somente consulta

## Segurança

- Supabase Auth (JWT + cookies)
- Row Level Security (RLS)
- Validação Zod nas APIs
- Auditoria automática via triggers
- Bloqueio após tentativas de login inválidas

## Estrutura

```
src/app/(dashboard)/   → páginas autenticadas
src/app/api/           → REST API
supabase/migrations/   → schema PostgreSQL
```

## Licença

Uso interno / projeto privado.
# pulser-web
