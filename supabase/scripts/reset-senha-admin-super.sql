-- Senha do usuário admin@admin.com (id fixo)
-- Login no app: Admin-super | Senha: @dm1n@2026
-- Supabase → SQL Editor → Run

CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE auth.users
SET
  encrypted_password = crypt('@dm1n@2026', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  confirmation_token = '',
  email_change = '',
  email_change_token_new = '',
  recovery_token = '',
  updated_at = now()
WHERE id = '8a56ab9b-a38e-494f-86cf-6fd677509a6b';

INSERT INTO public.usuarios (id, nome_completo, email, perfil_id, status)
SELECT
  u.id,
  'Admin-super',
  u.email,
  p.id,
  'ativo'
FROM auth.users u
CROSS JOIN public.perfis p
WHERE u.id = '8a56ab9b-a38e-494f-86cf-6fd677509a6b'
  AND p.slug = 'admin_geral'
ON CONFLICT (id) DO UPDATE SET
  nome_completo = 'Admin-super',
  status = 'ativo',
  bloqueado_ate = NULL,
  tentativas_login = 0,
  perfil_id = EXCLUDED.perfil_id;

SELECT u.id, u.email, us.nome_completo, us.status, p.slug AS perfil
FROM auth.users u
LEFT JOIN public.usuarios us ON us.id = u.id
LEFT JOIN public.perfis p ON p.id = us.perfil_id
WHERE u.id = '8a56ab9b-a38e-494f-86cf-6fd677509a6b';
