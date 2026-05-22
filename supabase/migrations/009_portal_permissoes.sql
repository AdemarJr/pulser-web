INSERT INTO permissoes (slug, nome, modulo) VALUES
  ('portal.gerenciar', 'Gerenciar campanhas e formulários públicos', 'portal'),
  ('portal.visualizar', 'Visualizar participações e resultados do portal', 'portal')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT p.id, perm.id
FROM perfis p
JOIN permissoes perm ON perm.slug IN ('portal.gerenciar', 'portal.visualizar')
WHERE p.slug = 'admin_geral'
  AND NOT EXISTS (
    SELECT 1 FROM perfil_permissoes pp
    WHERE pp.perfil_id = p.id AND pp.permissao_id = perm.id
  );

INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT p.id, perm.id
FROM perfis p
JOIN permissoes perm ON perm.slug = 'portal.visualizar'
WHERE p.slug = 'coordenador'
  AND NOT EXISTS (
    SELECT 1 FROM perfil_permissoes pp
    WHERE pp.perfil_id = p.id AND pp.permissao_id = perm.id
  );
