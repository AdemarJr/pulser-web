-- Portal público: campanhas, formulários (enquetes, quiz, pesquisas, intenção de voto)

CREATE TYPE portal_formulario_tipo AS ENUM (
  'enquete',
  'quiz',
  'pesquisa',
  'intencao_voto'
);

CREATE TYPE portal_formulario_status AS ENUM (
  'rascunho',
  'publicado',
  'encerrado'
);

CREATE TYPE portal_pergunta_tipo AS ENUM (
  'single',
  'multi',
  'texto',
  'escala',
  'intencao_candidato'
);

CREATE TYPE portal_participacao_status AS ENUM (
  'iniciada',
  'concluida'
);

CREATE TABLE campanhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(120) NOT NULL UNIQUE,
  titulo VARCHAR(300) NOT NULL,
  descricao TEXT,
  status portal_formulario_status NOT NULL DEFAULT 'rascunho',
  imagem_url TEXT,
  publicado_em TIMESTAMPTZ,
  encerrada_em TIMESTAMPTZ,
  criado_por UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id UUID NOT NULL REFERENCES campanhas(id) ON DELETE CASCADE,
  slug VARCHAR(120) NOT NULL,
  tipo portal_formulario_tipo NOT NULL,
  titulo VARCHAR(300) NOT NULL,
  descricao TEXT,
  status portal_formulario_status NOT NULL DEFAULT 'rascunho',
  ordem INT NOT NULL DEFAULT 0,
  config JSONB NOT NULL DEFAULT '{}',
  publicado_em TIMESTAMPTZ,
  encerrada_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campanha_id, slug)
);

CREATE TABLE perguntas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID NOT NULL REFERENCES formularios(id) ON DELETE CASCADE,
  ordem INT NOT NULL DEFAULT 0,
  texto TEXT NOT NULL,
  tipo portal_pergunta_tipo NOT NULL DEFAULT 'single',
  opcoes JSONB NOT NULL DEFAULT '[]',
  obrigatoria BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE participacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formulario_id UUID NOT NULL REFERENCES formularios(id) ON DELETE CASCADE,
  token VARCHAR(64) NOT NULL UNIQUE,
  status portal_participacao_status NOT NULL DEFAULT 'iniciada',
  metadata JSONB NOT NULL DEFAULT '{}',
  consentimento_versao VARCHAR(50),
  ip_hash VARCHAR(64),
  pontuacao INT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participacao_id UUID NOT NULL REFERENCES participacoes(id) ON DELETE CASCADE,
  pergunta_id UUID NOT NULL REFERENCES perguntas(id) ON DELETE CASCADE,
  valor JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (participacao_id, pergunta_id)
);

CREATE INDEX idx_campanhas_status ON campanhas(status);
CREATE INDEX idx_formularios_campanha ON formularios(campanha_id);
CREATE INDEX idx_formularios_status ON formularios(status);
CREATE INDEX idx_participacoes_formulario ON participacoes(formulario_id);
CREATE INDEX idx_respostas_pergunta ON respostas(pergunta_id);

-- Agregação pública de resultados (enquetes / intenção de voto)
CREATE OR REPLACE VIEW vw_portal_resultados_opcao AS
SELECT
  f.id AS formulario_id,
  f.campanha_id,
  p.id AS pergunta_id,
  p.texto AS pergunta_texto,
  p.tipo AS pergunta_tipo,
  opt->>'id' AS opcao_id,
  opt->>'label' AS opcao_label,
  COUNT(*) FILTER (
    WHERE r.valor IS NOT NULL
      AND (
        r.valor #>> '{}' = opt->>'id'
        OR r.valor @> to_jsonb(opt->>'id')
        OR (jsonb_typeof(r.valor) = 'array' AND r.valor ? (opt->>'id'))
      )
  ) AS total_votos
FROM formularios f
JOIN perguntas p ON p.formulario_id = f.id
CROSS JOIN LATERAL jsonb_array_elements(p.opcoes) AS opt
LEFT JOIN respostas r ON r.pergunta_id = p.id
LEFT JOIN participacoes part ON part.id = r.participacao_id AND part.status = 'concluida'
GROUP BY f.id, f.campanha_id, p.id, p.texto, p.tipo, opt->>'id', opt->>'label';

ALTER TABLE campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE formularios ENABLE ROW LEVEL SECURITY;
ALTER TABLE perguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE participacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas ENABLE ROW LEVEL SECURITY;

-- Staff: gerenciar portal
CREATE POLICY "campanhas_staff_all" ON campanhas FOR ALL TO authenticated
  USING (auth_has_permission('portal.gerenciar'))
  WITH CHECK (auth_has_permission('portal.gerenciar'));

CREATE POLICY "campanhas_staff_read" ON campanhas FOR SELECT TO authenticated
  USING (auth_has_permission('portal.visualizar'));

CREATE POLICY "formularios_staff_all" ON formularios FOR ALL TO authenticated
  USING (auth_has_permission('portal.gerenciar'))
  WITH CHECK (auth_has_permission('portal.gerenciar'));

CREATE POLICY "formularios_staff_read" ON formularios FOR SELECT TO authenticated
  USING (auth_has_permission('portal.visualizar'));

CREATE POLICY "perguntas_staff_all" ON perguntas FOR ALL TO authenticated
  USING (auth_has_permission('portal.gerenciar'))
  WITH CHECK (auth_has_permission('portal.gerenciar'));

CREATE POLICY "perguntas_staff_read" ON perguntas FOR SELECT TO authenticated
  USING (auth_has_permission('portal.visualizar'));

CREATE POLICY "participacoes_staff_read" ON participacoes FOR SELECT TO authenticated
  USING (auth_has_permission('portal.visualizar'));

CREATE POLICY "respostas_staff_read" ON respostas FOR SELECT TO authenticated
  USING (auth_has_permission('portal.visualizar'));

-- Público: leitura de campanhas/formulários publicados (via anon key + API)
CREATE POLICY "campanhas_public_read" ON campanhas FOR SELECT TO anon
  USING (status = 'publicado');

CREATE POLICY "formularios_public_read" ON formularios FOR SELECT TO anon
  USING (status = 'publicado');

CREATE POLICY "perguntas_public_read" ON perguntas FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM formularios f
      WHERE f.id = perguntas.formulario_id AND f.status = 'publicado'
    )
  );

CREATE POLICY "participacoes_public_insert" ON participacoes FOR INSERT TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM formularios f
      WHERE f.id = participacoes.formulario_id AND f.status = 'publicado'
    )
  );

CREATE POLICY "participacoes_public_update_own" ON participacoes FOR UPDATE TO anon
  USING (status = 'iniciada')
  WITH CHECK (status IN ('iniciada', 'concluida'));

CREATE POLICY "respostas_public_insert" ON respostas FOR INSERT TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM participacoes part
      JOIN formularios f ON f.id = part.formulario_id
      WHERE part.id = respostas.participacao_id
        AND part.status = 'iniciada'
        AND f.status = 'publicado'
    )
  );

CREATE TRIGGER campanhas_updated_at
  BEFORE UPDATE ON campanhas
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER formularios_updated_at
  BEFORE UPDATE ON formularios
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
