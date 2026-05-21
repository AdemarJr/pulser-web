# DER — Diagrama Entidade-Relacionamento

## Diagrama (Mermaid ER)

```mermaid
erDiagram
    PERFIS ||--o{ USUARIOS : possui
    PERFIS ||--o{ PERFIL_PERMISSOES : tem
    PERMISSOES ||--o{ PERFIL_PERMISSOES : concede

    ESTADOS ||--o{ CIDADES : contem
    CIDADES ||--o{ BAIRROS : contem
    CIDADES ||--o{ ZONAS_ELEITORAIS : possui
    ESTADOS ||--o{ ZONAS_ELEITORAIS : referencia

    BAIRROS ||--o{ ELEITORES : localiza
    CIDADES ||--o{ ELEITORES : municipio
    ESTADOS ||--o{ ELEITORES : uf
    ZONAS_ELEITORAIS ||--o{ ELEITORES : zona
    USUARIOS ||--o{ ELEITORES : cadastrou

    USUARIOS ||--o{ AUDITORIA : executou
    USUARIOS ||--o{ SESSOES_USUARIO : possui

    PERFIS {
        uuid id PK
        string slug UK
        string nome
        boolean is_system
    }

    PERMISSOES {
        uuid id PK
        string slug UK
        string modulo
    }

    USUARIOS {
        uuid id PK FK_auth_users
        string nome_completo
        string email UK
        uuid perfil_id FK
        enum status
        int tentativas_login
        timestamp ultimo_acesso
    }

    ESTADOS {
        uuid id PK
        string nome
        char sigla UK
    }

    CIDADES {
        uuid id PK
        string nome
        uuid estado_id FK
    }

    BAIRROS {
        uuid id PK
        string nome
        uuid cidade_id FK
    }

    ZONAS_ELEITORAIS {
        uuid id PK
        int numero
        uuid cidade_id FK
        uuid estado_id FK
    }

    ELEITORES {
        uuid id PK
        string nome_completo
        string cpf UK
        date data_nascimento
        uuid bairro_id FK
        uuid zona_eleitoral_id FK
        enum situacao
        uuid cadastrado_por FK
        timestamp deleted_at
    }

    AUDITORIA {
        uuid id PK
        uuid usuario_id FK
        enum acao
        string entidade
        uuid entidade_id
        jsonb dados_anteriores
        jsonb dados_novos
        inet ip_address
    }

    SESSOES_USUARIO {
        uuid id PK
        uuid usuario_id FK
        inet ip_address
        boolean ativa
    }
```

## Relacionamentos territoriais

```
Estado (1) ──→ (N) Cidade (1) ──→ (N) Bairro
                    │
                    └──→ (N) Zona Eleitoral ──→ (N) Eleitor
```

## Tabelas

| Tabela | Descrição |
|--------|-----------|
| perfis | Papéis RBAC (extensível) |
| permissoes | Ações granulares por módulo |
| perfil_permissoes | N:N perfil ↔ permissão |
| usuarios | Perfil estendido do auth.users |
| estados, cidades, bairros, zonas_eleitorais | Hierarquia territorial |
| eleitores | Cadastro principal |
| auditoria | Log imutável de operações |
| sessoes_usuario | Controle de sessão |
