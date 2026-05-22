-- Coordenador: ver/editar todos eleitores e excluir (mesmo escopo de gestão que admin na equipe)
INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT p.id, perm.id
FROM perfis p
JOIN permissoes perm ON perm.slug IN (
  'eleitores.visualizar_todos',
  'eleitores.editar_todos',
  'eleitores.excluir'
)
WHERE p.slug = 'coordenador'
  AND NOT EXISTS (
    SELECT 1 FROM perfil_permissoes pp
    WHERE pp.perfil_id = p.id AND pp.permissao_id = perm.id
  );

-- Quem criou cada usuário da equipe
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS criado_por UUID REFERENCES usuarios(id);

CREATE INDEX IF NOT EXISTS idx_usuarios_criado_por ON usuarios(criado_por);
