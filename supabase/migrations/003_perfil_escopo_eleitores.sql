-- Apenas administrador pode ver/editar todos os eleitores.
-- Coordenador e visualizador passam a ver somente os próprios cadastros.

DELETE FROM perfil_permissoes pp
USING perfis p, permissoes perm
WHERE pp.perfil_id = p.id
  AND pp.permissao_id = perm.id
  AND p.slug IN ('coordenador', 'visualizador')
  AND perm.slug IN ('eleitores.visualizar_todos', 'eleitores.editar_todos');

INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT p.id, perm.id
FROM perfis p
JOIN permissoes perm ON perm.slug IN (
  'eleitores.visualizar',
  'eleitores.editar_proprios'
)
WHERE p.slug = 'coordenador'
ON CONFLICT DO NOTHING;

INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT p.id, perm.id
FROM perfis p
JOIN permissoes perm ON perm.slug = 'eleitores.visualizar'
WHERE p.slug = 'visualizador'
ON CONFLICT DO NOTHING;
