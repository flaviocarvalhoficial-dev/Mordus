---
slug: audit-trail-implementation
title: Implementação de Trilhas de Auditoria (Audit Trail)
agent: orchestrator
status: planning
---

# 📋 Plano de Implementação: Trilhas de Auditoria

O objetivo é criar um sistema robusto de logs que registre quem criou, editou ou deletou qualquer dado relevante no Mordus, servindo como um diferencial competitivo de segurança e governança.

## 🏗️ Fase 1: Banco de Dados (Supabase/Postgres)

- [x] Criar a tabela `audit_logs` para centralizar todos os registros.
- [x] Implementar a função Postgres `log_audit_action()` que captura as mudanças (antes/depois) em formato JSONB.
- [x] Aplicar triggers nas tabelas críticas:
    - `transactions` (Financeiro)
    - `members` (Membros)
    - `documents` (Secretaria)
    - `organizations` (Configurações)
    - `profiles` (Equipe)
- [x] Configurar RLS na tabela `audit_logs` para permitir leitura APENAS para `role = 'admin'`.

## 💻 Fase 2: Interface (Frontend)

- [x] Criar o componente `AuditLogList` para exibir os logs de forma amigável (quem, o quê, quando).
- [x] Adicionar uma nova aba "Logs de Auditoria" em `/settings`.
- [x] Implementar filtros por:
    - Data (Ordenação automática implementada)
    - Usuário (Quem fez)
    - Módulo (Financeiro, Membros, etc.)
    - Ação (Inserção, Edição, Deleção)

## 🎨 Fase 3: UX & Visualização Detalhada

- [x] Criar um modal de "Detalhes do Log" que mostre o *diff* (ex: "Valor mudou de R$100 para R$150").
- [x] Aplicar estilos premium seguindo o design system do Mordus.

---

## 🛑 Socratic Gate Check (Final)

- [x] Somente admin acessa? **Sim.**
- [ ] Registra Criação, Edição e Deleção? **Sim.**
- [ ] Registra Quem e Quando? **Sim.**
- [ ] Diferencial "Não alternável sem histórico"? **Sim, logs são permanentes.**

---

*Nota: Começarei pelo DDL do banco de dados.*
