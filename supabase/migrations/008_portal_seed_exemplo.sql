-- Campanha e formulários de exemplo (portal público)
INSERT INTO campanhas (slug, titulo, descricao, status, publicado_em)
VALUES (
  'participacao-cidada',
  'Participação Cidadã',
  'Enquetes, pesquisas e consultas abertas à comunidade. Sua opinião ajuda a orientar decisões e prioridades.',
  'publicado',
  now()
);

INSERT INTO formularios (campanha_id, slug, tipo, titulo, descricao, status, ordem, config, publicado_em)
SELECT
  c.id,
  'intencao-voto-2026',
  'intencao_voto',
  'Em quem você pretende votar?',
  'Pesquisa de intenção de voto — respostas anônimas e agregadas.',
  'publicado',
  1,
  '{"mostrar_resultados_publicos": true}'::jsonb,
  now()
FROM campanhas c WHERE c.slug = 'participacao-cidada';

INSERT INTO perguntas (formulario_id, ordem, texto, tipo, opcoes, obrigatoria)
SELECT
  f.id,
  1,
  'Se a eleição fosse hoje, em quem você votaria para prefeito(a)?',
  'intencao_candidato',
  '[
    {"id": "cand_a", "label": "Candidato(a) A"},
    {"id": "cand_b", "label": "Candidato(a) B"},
    {"id": "cand_c", "label": "Candidato(a) C"},
    {"id": "indeciso", "label": "Indeciso(a)"},
    {"id": "branco_nulo", "label": "Branco / Nulo"}
  ]'::jsonb,
  true
FROM formularios f
JOIN campanhas c ON c.id = f.campanha_id
WHERE c.slug = 'participacao-cidada' AND f.slug = 'intencao-voto-2026';

INSERT INTO formularios (campanha_id, slug, tipo, titulo, descricao, status, ordem, config, publicado_em)
SELECT
  c.id,
  'prioridades-bairro',
  'enquete',
  'Quais são as prioridades do seu bairro?',
  'Escolha até 3 temas que mais importam para você.',
  'publicado',
  2,
  '{"mostrar_resultados_publicos": true}'::jsonb,
  now()
FROM campanhas c WHERE c.slug = 'participacao-cidada';

INSERT INTO perguntas (formulario_id, ordem, texto, tipo, opcoes, obrigatoria, config)
SELECT
  f.id,
  1,
  'Selecione os temas prioritários (máximo 3):',
  'multi',
  '[
    {"id": "saude", "label": "Saúde"},
    {"id": "educacao", "label": "Educação"},
    {"id": "seguranca", "label": "Segurança"},
    {"id": "emprego", "label": "Emprego e renda"},
    {"id": "transporte", "label": "Transporte"},
    {"id": "meio_ambiente", "label": "Meio ambiente"}
  ]'::jsonb,
  true,
  '{"max_selecoes": 3}'::jsonb
FROM formularios f
JOIN campanhas c ON c.id = f.campanha_id
WHERE c.slug = 'participacao-cidada' AND f.slug = 'prioridades-bairro';

INSERT INTO formularios (campanha_id, slug, tipo, titulo, descricao, status, ordem, config, publicado_em)
SELECT
  c.id,
  'quiz-cidadania',
  'quiz',
  'Quiz: direitos do eleitor',
  'Teste seus conhecimentos sobre o processo eleitoral.',
  'publicado',
  3,
  '{"mostrar_resultados_publicos": false}'::jsonb,
  now()
FROM campanhas c WHERE c.slug = 'participacao-cidada';

INSERT INTO perguntas (formulario_id, ordem, texto, tipo, opcoes, obrigatoria, config)
SELECT f.id, 1, 'Qual a idade mínima para votar no Brasil?', 'single',
  '[{"id": "14", "label": "14 anos"}, {"id": "16", "label": "16 anos", "correta": true}, {"id": "18", "label": "18 anos"}, {"id": "21", "label": "21 anos"}]'::jsonb,
  true, '{}'::jsonb
FROM formularios f JOIN campanhas c ON c.id = f.campanha_id
WHERE c.slug = 'participacao-cidada' AND f.slug = 'quiz-cidadania';

INSERT INTO perguntas (formulario_id, ordem, texto, tipo, opcoes, obrigatoria, config)
SELECT f.id, 2, 'O voto é obrigatório entre 18 e 70 anos?', 'single',
  '[{"id": "sim", "label": "Sim", "correta": true}, {"id": "nao", "label": "Não"}]'::jsonb,
  true, '{}'::jsonb
FROM formularios f JOIN campanhas c ON c.id = f.campanha_id
WHERE c.slug = 'participacao-cidada' AND f.slug = 'quiz-cidadania';
