# Protótipo de telas

## 1. Login (`/login`)
- Card central com logo
- Campos: e-mail, senha
- Link recuperar senha
- Feedback de erro e bloqueio

## 2. Dashboard (`/dashboard`)
- 4 cards KPI: total eleitores, cadastros mês, usuários ativos, top cadastrador
- Gráfico barras: eleitores por bairro
- Ranking cadastradores

## 3. Lista de eleitores (`/eleitores`)
- Busca por nome
- Tabela: nome, CPF, bairro, zona, situação
- Botão novo cadastro

## 4. Novo eleitor (`/eleitores/novo`)
- Seções: dados pessoais, endereço/territorial, dados eleitorais
- Cascata estado → cidade → bairro → zona

## 5. Usuários (`/usuarios`)
- Tabela com perfil e status
- (Futuro) modal criar/editar

## 6. Territorial (`/territorio`)
- Cards por módulo: estados, cidades, bairros, zonas

## 7. Relatórios (`/relatorios`)
- Formatos: PDF, Excel, CSV, impressão
- Cards por tipo de relatório

## 8. Auditoria (`/auditoria`)
- Timeline de ações com IP e diff JSON

## Layout comum
- Sidebar escura fixa (desktop)
- Header com título e toggle tema claro/escuro
- Responsivo: sidebar colapsável em mobile (próxima iteração)
