-- Remove admin@admin.com (id: 8a56ab9b-a38e-494f-86cf-6fd677509a6b)
-- Supabase → SQL Editor → Run
-- Mantém pulse@gmail.com como admin ativo

-- 1) Desvincula cadastros de eleitores (evita erro de FK)
UPDATE public.eleitores
SET
  cadastrado_por = NULL,
  atualizado_por = NULL
WHERE cadastrado_por = '8a56ab9b-a38e-494f-86cf-6fd677509a6b'
   OR atualizado_por = '8a56ab9b-a38e-494f-86cf-6fd677509a6b';

-- 2) Sessões do usuário
DELETE FROM public.sessoes_usuario
WHERE usuario_id = '8a56ab9b-a38e-494f-86cf-6fd677509a6b';

-- 3) Perfil em public.usuarios
DELETE FROM public.usuarios
WHERE id = '8a56ab9b-a38e-494f-86cf-6fd677509a6b';

-- 4) Auth (identities antes de users)
DELETE FROM auth.identities
WHERE user_id = '8a56ab9b-a38e-494f-86cf-6fd677509a6b';

DELETE FROM auth.users
WHERE id = '8a56ab9b-a38e-494f-86cf-6fd677509a6b';

-- Conferência
SELECT 'auth.users' AS tabela, count(*) AS restantes
FROM auth.users WHERE email = 'admin@admin.com'
UNION ALL
SELECT 'public.usuarios', count(*)
FROM public.usuarios WHERE email = 'admin@admin.com';
