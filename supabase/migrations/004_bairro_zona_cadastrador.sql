-- Permite quem cadastra eleitores criar bairro/zona do município selecionado
CREATE POLICY "bairros_insert_cadastrador" ON bairros FOR INSERT TO authenticated
  WITH CHECK (auth_has_permission('eleitores.criar'));

CREATE POLICY "zonas_insert_cadastrador" ON zonas_eleitorais FOR INSERT TO authenticated
  WITH CHECK (auth_has_permission('eleitores.criar'));
