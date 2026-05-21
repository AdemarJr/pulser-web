-- Sistema de Cadastro e Gestão de Eleitores
-- Database: eleitordb (Supabase PostgreSQL)

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE usuario_status AS ENUM ('ativo', 'inativo', 'bloqueado');
CREATE TYPE eleitor_situacao AS ENUM ('ativo', 'inativo', 'pendente', 'falecido', 'mudou_cidade');
CREATE TYPE eleitor_situacao_eleitoral AS ENUM ('regular', 'suspensa', 'cancelada', 'pendente', 'outra');
CREATE TYPE auditoria_acao AS ENUM ('criar', 'alterar', 'excluir', 'login', 'logout', 'exportar', 'visualizar');

-- Perfis (RBAC)
CREATE TABLE perfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) NOT NULL UNIQUE,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE permissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(80) NOT NULL UNIQUE,
  nome VARCHAR(120) NOT NULL,
  modulo VARCHAR(50) NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE perfil_permissoes (
  perfil_id UUID NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  permissao_id UUID NOT NULL REFERENCES permissoes(id) ON DELETE CASCADE,
  PRIMARY KEY (perfil_id, permissao_id)
);

-- Usuários (vinculado ao auth.users do Supabase)
CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  telefone VARCHAR(20),
  cpf VARCHAR(14),
  perfil_id UUID NOT NULL REFERENCES perfis(id),
  status usuario_status DEFAULT 'ativo',
  tentativas_login INT DEFAULT 0,
  bloqueado_ate TIMESTAMPTZ,
  ultimo_acesso TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Territorial
CREATE TABLE estados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  sigla CHAR(2) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE cidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(150) NOT NULL,
  estado_id UUID NOT NULL REFERENCES estados(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (nome, estado_id)
);

CREATE TABLE bairros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(150) NOT NULL,
  cidade_id UUID NOT NULL REFERENCES cidades(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (nome, cidade_id)
);

CREATE TABLE zonas_eleitorais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INT NOT NULL,
  cidade_id UUID NOT NULL REFERENCES cidades(id) ON DELETE RESTRICT,
  estado_id UUID NOT NULL REFERENCES estados(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (numero, cidade_id)
);

-- Eleitores
CREATE TABLE eleitores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Dados pessoais
  nome_completo VARCHAR(200) NOT NULL,
  nome_social VARCHAR(200),
  data_nascimento DATE NOT NULL,
  sexo VARCHAR(20) NOT NULL,
  cpf VARCHAR(14) NOT NULL UNIQUE,
  rg VARCHAR(20) NOT NULL,
  telefone_principal VARCHAR(20) NOT NULL,
  telefone_secundario VARCHAR(20),
  email VARCHAR(255),
  -- Endereço
  cep VARCHAR(9) NOT NULL,
  logradouro VARCHAR(200) NOT NULL,
  numero VARCHAR(20) NOT NULL,
  complemento VARCHAR(100),
  bairro_id UUID NOT NULL REFERENCES bairros(id),
  cidade_id UUID NOT NULL REFERENCES cidades(id),
  estado_id UUID NOT NULL REFERENCES estados(id),
  -- Dados eleitorais
  titulo_eleitor VARCHAR(20) NOT NULL,
  zona_eleitoral_id UUID NOT NULL REFERENCES zonas_eleitorais(id),
  secao_eleitoral VARCHAR(10) NOT NULL,
  municipio_eleitoral VARCHAR(150) NOT NULL,
  situacao_eleitoral eleitor_situacao_eleitoral DEFAULT 'regular',
  local_votacao VARCHAR(200),
  -- Dados políticos opcionais
  lideranca_responsavel VARCHAR(200),
  grupo_politico VARCHAR(150),
  observacoes TEXT,
  prioridade INT DEFAULT 0,
  categoria VARCHAR(100),
  situacao eleitor_situacao DEFAULT 'pendente',
  -- Metadados
  cadastrado_por UUID REFERENCES usuarios(id),
  atualizado_por UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_eleitores_cpf ON eleitores(cpf) WHERE deleted_at IS NULL;
CREATE INDEX idx_eleitores_nome ON eleitores(nome_completo) WHERE deleted_at IS NULL;
CREATE INDEX idx_eleitores_bairro ON eleitores(bairro_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_eleitores_zona ON eleitores(zona_eleitoral_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_eleitores_situacao ON eleitores(situacao) WHERE deleted_at IS NULL;
CREATE INDEX idx_eleitores_created ON eleitores(created_at) WHERE deleted_at IS NULL;

-- Auditoria
CREATE TABLE auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id),
  acao auditoria_acao NOT NULL,
  entidade VARCHAR(50) NOT NULL,
  entidade_id UUID,
  dados_anteriores JSONB,
  dados_novos JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_auditoria_entidade ON auditoria(entidade, entidade_id);
CREATE INDEX idx_auditoria_usuario ON auditoria(usuario_id);
CREATE INDEX idx_auditoria_created ON auditoria(created_at);

-- Sessões
CREATE TABLE sessoes_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  iniciada_em TIMESTAMPTZ DEFAULT now(),
  encerrada_em TIMESTAMPTZ,
  ativa BOOLEAN DEFAULT true
);

-- Função: atualizar updated_at
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER usuarios_updated_at BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER eleitores_updated_at BEFORE UPDATE ON eleitores
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER perfis_updated_at BEFORE UPDATE ON perfis
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Função: registrar auditoria automaticamente
CREATE OR REPLACE FUNCTION registrar_auditoria()
RETURNS TRIGGER AS $$
DECLARE
  v_acao auditoria_acao;
  v_usuario UUID;
BEGIN
  v_usuario := COALESCE(
    (current_setting('request.jwt.claim.sub', true))::uuid,
    auth.uid()
  );

  IF TG_OP = 'INSERT' THEN
    v_acao := 'criar';
    INSERT INTO auditoria (usuario_id, acao, entidade, entidade_id, dados_novos)
    VALUES (v_usuario, v_acao, TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_acao := 'alterar';
    INSERT INTO auditoria (usuario_id, acao, entidade, entidade_id, dados_anteriores, dados_novos)
    VALUES (v_usuario, v_acao, TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_acao := 'excluir';
    INSERT INTO auditoria (usuario_id, acao, entidade, entidade_id, dados_anteriores)
    VALUES (v_usuario, v_acao, TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auditoria_eleitores
  AFTER INSERT OR UPDATE OR DELETE ON eleitores
  FOR EACH ROW EXECUTE FUNCTION registrar_auditoria();

CREATE TRIGGER auditoria_usuarios
  AFTER INSERT OR UPDATE OR DELETE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION registrar_auditoria();

-- View: dashboard stats
CREATE OR REPLACE VIEW vw_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM eleitores WHERE deleted_at IS NULL) AS total_eleitores,
  (SELECT COUNT(*) FROM eleitores WHERE deleted_at IS NULL AND created_at >= date_trunc('month', now())) AS cadastros_mes,
  (SELECT COUNT(*) FROM usuarios WHERE status = 'ativo') AS usuarios_ativos;

-- RLS
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfil_permissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE estados ENABLE ROW LEVEL SECURITY;
ALTER TABLE cidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE bairros ENABLE ROW LEVEL SECURITY;
ALTER TABLE zonas_eleitorais ENABLE ROW LEVEL SECURITY;
ALTER TABLE eleitores ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes_usuario ENABLE ROW LEVEL SECURITY;

-- Helper: perfil do usuário autenticado
CREATE OR REPLACE FUNCTION auth_user_perfil_slug()
RETURNS TEXT AS $$
  SELECT p.slug FROM usuarios u
  JOIN perfis p ON p.id = u.perfil_id
  WHERE u.id = auth.uid() AND u.status = 'ativo';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth_has_permission(permission_slug TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuarios u
    JOIN perfil_permissoes pp ON pp.perfil_id = u.perfil_id
    JOIN permissoes perm ON perm.id = pp.permissao_id
    WHERE u.id = auth.uid() AND u.status = 'ativo' AND perm.slug = permission_slug
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Políticas RLS básicas (leitura autenticada, escrita por permissão)
CREATE POLICY "perfis_read" ON perfis FOR SELECT TO authenticated USING (true);
CREATE POLICY "permissoes_read" ON permissoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "perfil_permissoes_read" ON perfil_permissoes FOR SELECT TO authenticated USING (true);

CREATE POLICY "usuarios_read" ON usuarios FOR SELECT TO authenticated
  USING (auth_has_permission('usuarios.visualizar') OR id = auth.uid());
CREATE POLICY "usuarios_write" ON usuarios FOR ALL TO authenticated
  USING (auth_has_permission('usuarios.gerenciar'))
  WITH CHECK (auth_has_permission('usuarios.gerenciar'));

CREATE POLICY "territorio_read" ON estados FOR SELECT TO authenticated USING (true);
CREATE POLICY "territorio_read_cidades" ON cidades FOR SELECT TO authenticated USING (true);
CREATE POLICY "territorio_read_bairros" ON bairros FOR SELECT TO authenticated USING (true);
CREATE POLICY "territorio_read_zonas" ON zonas_eleitorais FOR SELECT TO authenticated USING (true);

CREATE POLICY "territorio_write_estados" ON estados FOR ALL TO authenticated
  USING (auth_has_permission('territorio.gerenciar'))
  WITH CHECK (auth_has_permission('territorio.gerenciar'));
CREATE POLICY "territorio_write_cidades" ON cidades FOR ALL TO authenticated
  USING (auth_has_permission('territorio.gerenciar'))
  WITH CHECK (auth_has_permission('territorio.gerenciar'));
CREATE POLICY "territorio_write_bairros" ON bairros FOR ALL TO authenticated
  USING (auth_has_permission('territorio.gerenciar'))
  WITH CHECK (auth_has_permission('territorio.gerenciar'));
CREATE POLICY "territorio_write_zonas" ON zonas_eleitorais FOR ALL TO authenticated
  USING (auth_has_permission('territorio.gerenciar'))
  WITH CHECK (auth_has_permission('territorio.gerenciar'));

CREATE POLICY "eleitores_read" ON eleitores FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL AND (
      auth_has_permission('eleitores.visualizar_todos')
      OR (auth_has_permission('eleitores.visualizar') AND cadastrado_por = auth.uid())
    )
  );

CREATE POLICY "eleitores_insert" ON eleitores FOR INSERT TO authenticated
  WITH CHECK (auth_has_permission('eleitores.criar'));

CREATE POLICY "eleitores_update" ON eleitores FOR UPDATE TO authenticated
  USING (
    auth_has_permission('eleitores.editar_todos')
    OR (auth_has_permission('eleitores.editar_proprios') AND cadastrado_por = auth.uid())
  );

CREATE POLICY "eleitores_delete" ON eleitores FOR DELETE TO authenticated
  USING (auth_has_permission('eleitores.excluir'));

CREATE POLICY "auditoria_read" ON auditoria FOR SELECT TO authenticated
  USING (auth_has_permission('auditoria.visualizar'));

CREATE POLICY "sessoes_own" ON sessoes_usuario FOR ALL TO authenticated
  USING (usuario_id = auth.uid() OR auth_has_permission('usuarios.gerenciar'));
