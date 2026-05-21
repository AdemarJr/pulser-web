# Plano de implantação em produção

## Pré-requisitos

1. Projeto Supabase criado (database: `eleitordb`)
2. Node.js 20+ no servidor ou Vercel
3. Domínio com HTTPS

## Passo 1 — Banco de dados (Supabase)

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. SQL Editor → execute `supabase/migrations/001_initial_schema.sql`
3. Execute `supabase/seed.sql` para perfis e dados de exemplo
4. Settings → API → copie URL e chaves

## Passo 2 — Variáveis de ambiente

Crie `.env.local` (nunca commite):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
MAX_LOGIN_ATTEMPTS=5
LOGIN_LOCKOUT_MINUTES=15
```

## Passo 3 — Primeiro administrador

No Supabase Auth, crie um usuário. Depois no SQL Editor:

```sql
INSERT INTO usuarios (id, nome_completo, email, perfil_id, status)
SELECT
  'UUID-DO-AUTH-USER',
  'Administrador',
  'admin@seudominio.com',
  id,
  'ativo'
FROM perfis WHERE slug = 'admin_geral';
```

## Passo 4 — Deploy Docker (VPS)

```bash
docker compose up -d --build
```

## Passo 5 — Deploy Vercel (alternativa)

```bash
npx vercel --prod
```

Configure as mesmas variáveis no painel Vercel.

## Segurança em produção

- [ ] HTTPS obrigatório
- [ ] RLS ativo em todas as tabelas
- [ ] Service Role Key apenas no servidor
- [ ] Rate limiting no reverse proxy (nginx)
- [ ] Backup automático Supabase (Pro plan)
- [ ] Política de privacidade LGPD publicada
- [ ] Rotação de chaves semestral

## Monitoramento

- Supabase → Logs / Database health
- Vercel Analytics ou Plausible
- Alertas de erro (Sentry opcional)

## Backup

- Supabase: backups diários automáticos (plano pago)
- Export manual: `pg_dump` via connection string

## Escalabilidade

| Volume | Ação |
|--------|------|
| &lt; 50k eleitores | Configuração atual |
| 50k–500k | Índices compostos, connection pooling (PgBouncer) |
| 500k+ | Read replicas, cache Redis para dashboard |
