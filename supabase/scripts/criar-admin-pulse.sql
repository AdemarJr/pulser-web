-- Use se pulse@gmail.com NÃO existir (UPDATE retornou 0 linhas)
-- Supabase → SQL Editor → Run
-- Login: pulse@gmail.com | Senha: puls3@2026

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_email TEXT := 'pulse@gmail.com';
  v_senha TEXT := 'puls3@2026';
  v_user_id UUID := gen_random_uuid();
  v_instance_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
    RAISE EXCEPTION 'Usuário % já existe. Rode reset-admin-password.sql.', v_email;
  END IF;

  SELECT id INTO v_instance_id FROM auth.instances LIMIT 1;
  IF v_instance_id IS NULL THEN
    v_instance_id := '00000000-0000-0000-0000-000000000000';
  END IF;

  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    v_instance_id,
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    crypt(v_senha, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"nome_completo":"Administrador PULSE"}'::jsonb,
    now(),
    now(),
    '', '', '', ''
  );

  INSERT INTO public.usuarios (id, nome_completo, email, perfil_id, status)
  SELECT v_user_id, 'Administrador PULSE', v_email, p.id, 'ativo'
  FROM public.perfis p
  WHERE p.slug = 'admin_geral';

  RAISE NOTICE 'Criado: % / senha configurada', v_email;
END $$;

SELECT u.email, p.slug AS perfil, us.status
FROM auth.users u
JOIN public.usuarios us ON us.id = u.id
JOIN public.perfis p ON p.id = us.perfil_id
WHERE u.email = 'pulse@gmail.com';
