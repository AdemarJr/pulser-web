-- Supabase → SQL Editor → Run
-- Login: pulse@gmail.com | Senha: puls3@2026

CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE auth.users
SET
  encrypted_password = crypt('puls3@2026', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  confirmation_token = '',
  email_change = '',
  email_change_token_new = '',
  recovery_token = '',
  updated_at = now()
WHERE email = 'pulse@gmail.com';

INSERT INTO public.usuarios (id, nome_completo, email, perfil_id, status)
SELECT
  u.id,
  'Administrador PULSE',
  u.email,
  p.id,
  'ativo'
FROM auth.users u
CROSS JOIN public.perfis p
WHERE u.email = 'pulse@gmail.com'
  AND p.slug = 'admin_geral'
ON CONFLICT (id) DO UPDATE SET
  status = 'ativo',
  bloqueado_ate = NULL,
  tentativas_login = 0,
  perfil_id = EXCLUDED.perfil_id,
  email = EXCLUDED.email;

SELECT
  u.email,
  u.email_confirmed_at IS NOT NULL AS pode_logar,
  us.status,
  p.slug AS perfil
FROM auth.users u
LEFT JOIN public.usuarios us ON us.id = u.id
LEFT JOIN public.perfis p ON p.id = us.perfil_id
WHERE u.email = 'pulse@gmail.com';
