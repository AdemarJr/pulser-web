-- Cidade em que o cadastro foi realizado (contexto do coordenador/cadastrador)
ALTER TABLE eleitores
  ADD COLUMN IF NOT EXISTS cidade_cadastro_id UUID REFERENCES cidades(id);

UPDATE eleitores
SET cidade_cadastro_id = cidade_id
WHERE cidade_cadastro_id IS NULL;

ALTER TABLE eleitores
  ALTER COLUMN cidade_cadastro_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_eleitores_cidade_cadastro
  ON eleitores(cidade_cadastro_id)
  WHERE deleted_at IS NULL;

-- Município padrão do usuário (cadastrador/coordenador)
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS cidade_cadastro_padrao_id UUID REFERENCES cidades(id);
