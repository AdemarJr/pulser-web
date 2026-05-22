-- Quem pode gerenciar usuários também pode listá-los (coordenador tinha só usuarios.gerenciar)
DROP POLICY IF EXISTS "usuarios_read" ON usuarios;
CREATE POLICY "usuarios_read" ON usuarios FOR SELECT TO authenticated
  USING (
    auth_has_permission('usuarios.visualizar')
    OR auth_has_permission('usuarios.gerenciar')
    OR id = auth.uid()
  );
