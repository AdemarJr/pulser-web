-- Permite soft delete (UPDATE deleted_at) para quem tem eleitores.excluir
DROP POLICY IF EXISTS "eleitores_update" ON eleitores;

CREATE POLICY "eleitores_update" ON eleitores FOR UPDATE TO authenticated
  USING (
    auth_has_permission('eleitores.editar_todos')
    OR (
      auth_has_permission('eleitores.editar_proprios')
      AND cadastrado_por = auth.uid()
    )
    OR (
      auth_has_permission('eleitores.excluir')
      AND (
        auth_has_permission('eleitores.visualizar_todos')
        OR cadastrado_por = auth.uid()
      )
    )
  )
  WITH CHECK (
    auth_has_permission('eleitores.editar_todos')
    OR (
      auth_has_permission('eleitores.editar_proprios')
      AND cadastrado_por = auth.uid()
    )
    OR (
      auth_has_permission('eleitores.excluir')
      AND (
        auth_has_permission('eleitores.visualizar_todos')
        OR cadastrado_por = auth.uid()
      )
    )
  );
