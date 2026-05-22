-- Coordenador: permissão para gerenciar usuários abaixo na hierarquia
INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT p.id, perm.id
FROM perfis p
JOIN permissoes perm ON perm.slug = 'usuarios.gerenciar'
WHERE p.slug = 'coordenador'
  AND NOT EXISTS (
    SELECT 1
    FROM perfil_permissoes pp
    WHERE pp.perfil_id = p.id AND pp.permissao_id = perm.id
  );
