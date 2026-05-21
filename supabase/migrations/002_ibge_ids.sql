-- Identificadores IBGE para sincronização com APIs oficiais
ALTER TABLE estados ADD COLUMN IF NOT EXISTS ibge_id INTEGER;
ALTER TABLE cidades ADD COLUMN IF NOT EXISTS ibge_id INTEGER;
ALTER TABLE bairros ADD COLUMN IF NOT EXISTS ibge_id BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS estados_ibge_id_key ON estados(ibge_id) WHERE ibge_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS cidades_ibge_id_key ON cidades(ibge_id) WHERE ibge_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS bairros_ibge_id_key ON bairros(ibge_id) WHERE ibge_id IS NOT NULL;
