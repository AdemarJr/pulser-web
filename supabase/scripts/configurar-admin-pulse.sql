-- Um único script: cria OU atualiza pulse@gmail.com
-- Supabase → SQL Editor → Run

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_email TEXT := 'pulse@gmail.com';
  v_senha TEXT := 'puls3@2026';
  v_user_id UUID;
  v_instance_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NOT NULL THEN
    UPDATE auth.users
    SET
      encrypted_password = crypt(v_senha, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      confirmation_token = '',
      email_change = '',
      email_change_token_new = '',
      recovery_token = '',
      updated_at = now()
    WHERE id = v_user_id;
    RAISE NOTICE 'Senha atualizada para %', v_email;
  ELSE
    v_user_id := gen_random_uuid();
    SELECT id INTO v_instance_id FROM auth.instances LIMIT 1;
    IF v_instance_id IS NULL THEN
      v_instance_id := '00000000-0000-0000-0000-000000000000';
    END IF;

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      v_instance_id, v_user_id, 'authenticated', 'authenticated', v_email,
      crypt(v_senha, gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"nome_completo":"Administrador PULSE"}'::jsonb,
      now(), now(), '', '', '', ''
    );
    RAISE NOTICE 'Usuário criado: %', v_email;
  END IF;

  INSERT INTO public.usuarios (id, nome_completo, email, perfil_id, status)
  SELECT v_user_id, 'Administrador PULSE', v_email, p.id, 'ativo'
  FROM public.perfis p
  WHERE p.slug = 'admin_geral'
  ON CONFLICT (id) DO UPDATE SET
    status = 'ativo',
    bloqueado_ate = NULL,
    tentativas_login = 0,
    perfil_id = EXCLUDED.perfil_id,
    email = EXCLUDED.email,
    nome_completo = EXCLUDED.nome_completo;
END $$;

SELECT u.email, us.status, p.slug AS perfil
FROM auth.users u
LEFT JOIN public.usuarios us ON us.id = u.id
LEFT JOIN public.perfis p ON p.id = us.perfil_id
WHERE u.email = 'pulse@gmail.com';
