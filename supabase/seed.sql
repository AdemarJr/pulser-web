-- Seed: perfis, permissões e dados territoriais de exemplo

INSERT INTO perfis (slug, nome, descricao, is_system) VALUES
  ('admin_geral', 'Administrador Geral', 'Acesso total ao sistema', true),
  ('coordenador', 'Coordenador', 'Gerencia equipes e aprova registros', true),
  ('cadastrador', 'Cadastrador', 'Insere e edita próprios cadastros', true),
  ('visualizador', 'Visualizador', 'Somente consulta', true);

INSERT INTO permissoes (slug, nome, modulo) VALUES
  ('usuarios.gerenciar', 'Gerenciar usuários', 'usuarios'),
  ('usuarios.visualizar', 'Visualizar usuários', 'usuarios'),
  ('eleitores.criar', 'Criar eleitores', 'eleitores'),
  ('eleitores.editar_proprios', 'Editar próprios cadastros', 'eleitores'),
  ('eleitores.editar_todos', 'Editar todos cadastros', 'eleitores'),
  ('eleitores.visualizar', 'Visualizar cadastros permitidos', 'eleitores'),
  ('eleitores.visualizar_todos', 'Visualizar todos cadastros', 'eleitores'),
  ('eleitores.excluir', 'Excluir eleitores', 'eleitores'),
  ('eleitores.aprovar', 'Aprovar registros pendentes', 'eleitores'),
  ('eleitores.exportar', 'Exportar dados', 'eleitores'),
  ('territorio.gerenciar', 'Gerenciar territorial', 'territorio'),
  ('relatorios.visualizar', 'Visualizar relatórios', 'relatorios'),
  ('relatorios.exportar', 'Exportar relatórios', 'relatorios'),
  ('auditoria.visualizar', 'Visualizar auditoria', 'auditoria'),
  ('dashboard.visualizar', 'Visualizar dashboard', 'dashboard');

-- Admin: todas permissões
INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT p.id, perm.id FROM perfis p, permissoes perm WHERE p.slug = 'admin_geral';

-- Coordenador
INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT p.id, perm.id FROM perfis p
JOIN permissoes perm ON perm.slug IN (
  'usuarios.visualizar', 'eleitores.visualizar', 'eleitores.editar_proprios',
  'eleitores.aprovar', 'eleitores.exportar', 'relatorios.visualizar',
  'relatorios.exportar', 'dashboard.visualizar', 'auditoria.visualizar'
) WHERE p.slug = 'coordenador';

-- Cadastrador
INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT p.id, perm.id FROM perfis p
JOIN permissoes perm ON perm.slug IN (
  'eleitores.criar', 'eleitores.editar_proprios', 'eleitores.visualizar',
  'dashboard.visualizar'
) WHERE p.slug = 'cadastrador';

-- Visualizador
INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT p.id, perm.id FROM perfis p
JOIN permissoes perm ON perm.slug IN (
  'eleitores.visualizar', 'dashboard.visualizar', 'relatorios.visualizar'
) WHERE p.slug = 'visualizador';

-- Estados exemplo
INSERT INTO estados (nome, sigla) VALUES ('São Paulo', 'SP'), ('Rio de Janeiro', 'RJ');

INSERT INTO cidades (nome, estado_id)
SELECT 'São Paulo', id FROM estados WHERE sigla = 'SP';

INSERT INTO bairros (nome, cidade_id)
SELECT 'Centro', id FROM cidades WHERE nome = 'São Paulo' LIMIT 1;

INSERT INTO zonas_eleitorais (numero, cidade_id, estado_id)
SELECT 100, c.id, e.id FROM cidades c
JOIN estados e ON e.id = c.estado_id
WHERE c.nome = 'São Paulo' LIMIT 1;
