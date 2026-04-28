# 📋 PRD Master — Mordus

> **Versão:** 2.0 (Estado Atual — Abril 2026)
> **Repositório:** `y:\CRIAÇÃO DE MICRO SAAS\Mordus`
> **Stack:** React + Vite + TypeScript + Supabase + Tailwind CSS + shadcn/ui

---

## 1. Identidade e Propósito

### 1.1 O que é o Mordus

O **Mordus** é uma plataforma SaaS de gestão eclesiástica inteligente. O nome une *Mord* (mordomo) e *Ordus* (ordem), representando o propósito de trazer organização e responsabilidade à gestão da igreja.

Não é apenas um sistema de tesouraria. O Mordus é uma plataforma completa que cobre:

- **Tesouraria** — controle financeiro completo com fechamento mensal, parcelamentos e relatórios
- **Secretaria** — cadastro de membros, liderança, departamentos, eventos, patimônio, documentos, congregações, serviço social e parcerias
- **IA** — Copilot que responde perguntas sobre o sistema e os dados da organização

### 1.2 Público-Alvo

| Perfil | Papel no sistema | Acesso |
|--------|-----------------|--------|
| **Admin/Tesoureiro** | Gestão total | Financeiro + Secretaria + Configurações |
| **Secretário** | Gestão de membros | Secretaria (sem financeiro) |
| **Líder de Departamento** | Acesso restrito ao seu departamento | Secretaria parcial |
| **Somente Leitura** | Visualização | Sem criação/edição |

### 1.3 Tagline

> *"Gestão Eclesiástica Inteligente"*

---

## 2. Arquitetura do Sistema

### 2.1 Stack Tecnológico

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Estilo** | Tailwind CSS + shadcn/ui |
| **Backend** | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| **Estado** | React Query (TanStack Query) + Context API |
| **Roteamento** | React Router DOM v6 |
| **Gráficos** | Recharts |
| **IA** | CopilotContext (integração planejada com OpenAI/Anthropic) |

### 2.2 Modelo Multi-Tenant

Cada organização (igreja) é isolada pela coluna `organization_id` em todas as tabelas. Row Level Security (RLS) do Supabase garante isolamento completo entre organizações.

### 2.3 Estrutura de Pastas

```
src/
├── pages/          # Telas principais (Dashboard, Transactions, Members...)
├── components/     # Componentes compartilhados (Sidebar, Copilot, Dialogs...)
├── contexts/       # ChurchContext, CopilotContext, TransactionModalContext
├── hooks/          # Hooks customizados
├── lib/            # supabase.ts, utils.ts
└── types/          # database.types.ts (gerado do Supabase)
```

### 2.4 Contextos Globais

| Contexto | Finalidade |
|---------|-----------|
| `ChurchContext` | Organização ativa, usuário, perfil, permissões, logout |
| `CopilotContext` | Estado do Chat IA (aberto/fechado, histórico de mensagens) |
| `TransactionModalContext` | Controle global do modal de novo/editar lançamento |

---

## 3. Sistema de Permissões (RBAC)

O sistema usa `profile.role` para controlar acessos:

| Role | Label | Permissões |
|------|-------|-----------|
| `admin` | Administrador | Acesso total ao sistema |
| `treasurer` | Tesoureiro | Financeiro + leitura de Secretaria |
| `secretary` | Secretário | Secretaria completa + sem financeiro |
| `leader` | Líder | Apenas membros do próprio departamento |
| `viewer` | Visualizador | Somente leitura |

Permissões derivadas no `ChurchContext`:
- `canManageFinances` — acesso ao módulo financeiro
- `canManageSecretariat` — acesso administrativo à secretaria
- `canAccessSecretariat` — leitura da secretaria
- `canWrite` — pode criar/editar registros
- `isAdmin` — acesso total incluindo auditoria e reset

---

## 4. Navegação e Layout

### 4.1 Sidebar Principal (AppSidebar)

Sidebar vertical fixada à esquerda com 80px de largura. Exibe apenas ícones com tooltip.

| Ícone | Destino | Visível para |
|-------|---------|-------------|
| Grid (Dashboard) | `/` | Todos |
| Cifrão (Tesouraria) | `/lancamentos` | `canManageFinances` |
| Usuários (Secretaria) | `/membros?tab=membros` | `canAccessSecretariat` |
| Engrenagem | `/configuracoes` | Todos |
| Livro | `/ajuda` | Todos |
| Logout | — | Todos |

**Botão central FAB:** botão circular primário `+` que abre o modal global de **Novo Lançamento** (atalho Alt+N).

### 4.2 Context Sidebar (ContextSidebar)

Sidebar direita de contexto com:
- Alertas de contas vencendo (baseado em `reminder_days`)
- Resumo financeiro rápido
- Atalhos para pendências

### 4.3 Search Global (GlobalSearch)

Busca global acessível pelo teclado. Busca membros e lançamentos simultaneamente.

---

## 5. Tela de Autenticação (`/auth`)

### 5.1 Finalidade

Única tela pública do app. Ponto de entrada para novos usuários e login de usuários existentes.

### 5.2 Abas

**Entrar (signin)**
- Campo: E-mail
- Campo: Senha
- Link: "Esqueceu a senha?"
- Botão: "Entrar no Painel"
- Redirecionamento para `/` após login

**Cadastrar (signup)**
- Campo: Nome Completo
- Campo: E-mail
- Campo: Senha
- Botão: "Criar Minha Conta"
- Após cadastro, redireciona para "Entrar" com mensagem de confirmação de e-mail

### 5.3 Fluxo de Autenticação

```
Acesso ao app
    ↓
ProtectedRoute verifica session Supabase
    ↓ não autenticado       ↓ autenticado
Redirect /auth          Carrega ChurchContext
                             ↓
                     ChurchContext verifica organization_id
                             ↓ sem organização
                     OnboardingModal (criar ou vincular organização)
                             ↓ com organização
                     App carregado
```

---

## 6. Onboarding (`OnboardingModal`)

Modal exibido automaticamente quando o usuário logou mas ainda não tem organização vinculada.

**Opções:**
1. **Criar nova organização** — nome da igreja + cria registro em `organizations`
2. **Entrar com código** — digita o UUID da organização para ser vinculado como membro

Após vinculação, O `ChurchContext` carrega os dados da organização e libera o app.

---

## 7. Dashboard — Painel Geral (`/`)

Tela principal do app. Combina dois sub-painéis baseados no parâmetro de URL `?view=`:

| View | Sub-painel |
|------|-----------|
| `tesouraria` (padrão) | Painel Financeiro |
| `secretaria` | Painel da Secretaria (`SecretariaDashboard`) |

### 7.1 Header do Dashboard

- Nome da organização + período selecionado
- Filtro de **Ano** (2024–2026)
- Filtro de **Mês** (Todo o ano ou mês específico)
- Botão **Lançamento Rápido** (`QuickEntryDialog`)
- Botão **Novo Lançamento** (abre `TransactionsDialog`)

### 7.2 Card de IA — AIInsightCard

Um card contextual de IA exibido no topo do painel. Adapta seu conteúdo ao modo ativo (tesouraria ou secretaria). Parte do sistema **Mordus Copilot**.

### 7.3 Painel Financeiro (view=tesouraria)

**Cards de Resumo (5 cards):**

| Card | Valor calculado |
|------|----------------|
| Total Entradas | Soma de transações `type=income` pagas |
| Total Saídas | Soma de transações `type=expense` pagas + pendentes |
| **Saldo em Caixa** | Entradas − Saídas (destaque visual principal) |
| Saldo Projetado | Entradas − (Saídas + Pendentes) |
| Contas a Pagar | Total de saídas com status `pending` |

Os valores animam com contador progressivo (efeito `easeOutQuad` em 800ms).

**Gráfico 1 — Fluxo de Caixa Mensal:**
- Tipo: BarChart (Recharts)
- Dados: Entradas vs Saídas por mês
- Persiste mesmo ao filtrar por mês específico (mostra o contexto anual)

**Gráfico 2 — Tendência Financeira:**
- Tipo: AreaChart (Recharts)
- Dados: Dízimos (linha sólida) vs Ofertas (linha tracejada)
- Usa gradiente visual

**Card Resumo Mensal:**
- Toggle: "Ver Despesas" (oculta saídas por padrão para privacidade)
- Linhas: Dízimos, Ofertas, Saldo Líquido
- Botão: "Visualizar Relatório" (navega para `/lancamentos?tab=relatorios`)

### 7.4 Painel da Secretaria (view=secretaria)

Exibe o `SecretariaDashboard` — detalhado na Seção 11.

---

## 8. Módulo Tesouraria (`/lancamentos`)

Tela mais robusta do app. Organizada em 4 abas:

```
/lancamentos
├── [tab=lancamentos]   → Fluxo de Caixa (padrão)
├── [tab=categorias]    → Gestão de Categorias
├── [tab=fechamento]    → Fechamento Mensal
└── [tab=relatorios]    → Relatórios
```

### 8.1 Aba: Fluxo de Caixa (TransactionsList)

**Objetivo:** Registro e visualização de todas as movimentações financeiras.

#### 8.1.1 KPI Cards (5 cards)

| Card | Descrição |
|------|-----------|
| Saldo Anterior | Acumulado de meses fechados anteriores ao período filtrado |
| Total Entradas | Soma de receitas do período |
| Total Saídas | Soma de despesas do período |
| **Saldo em Caixa** | Saldo Anterior + (Entradas − Saídas) — card destaque |
| Contas a Pagar | Click abre painel lateral de Obrigações |

#### 8.1.2 Painel de Obrigações (Sheet)

Slide-in da direita com:

**Seção Vencidos (vermelho):**
- Lista parcelas em situação `VENCIDA` (passado da data de vencimento)
- Cada item mostra: descrição, número da parcela, data de vencimento, valor
- Botão **"PAGAR ATRASO"** — registra pagamento e cria transação no caixa

**Seção Mês Atual:**
- Liste parcelas da competência atual com status colorido
- Status: `PENDENTE` (amarelo), `PAGA` (verde), `VENCIDA` (vermelho), `PAGA_COM_ATRASO` (verde)
- Botão **"PAGAR AGORA"** para parcelas ainda não pagas

#### 8.1.3 Filtros da Lista

| Filtro | Opções |
|--------|--------|
| Tipo | Todos / Entrada / Saída |
| Categoria | Todas as categorias da organização |
| Ano | Lista dinâmica (5 anos) |
| Mês | Específico ou "Todos os meses" |
| Busca textual | Por descrição |

#### 8.1.4 Ordenação (TableToolbar)

Campos disponíveis: Data, Descrição, Valor, Data de Criação.
Direção: Crescente / Decrescente.
Persistido em `localStorage`.

#### 8.1.5 Colunas Configuráveis

O usuário pode mostrar/ocultar colunas (min: 3, máx: 8):
- Data, Descrição, Categoria, Status, Valor, Forma de Pagamento, Competência, Criado em

Configuração persistida em `localStorage`.

#### 8.1.6 Tabela de Lançamentos

Cada linha exibe dados de acordo com as colunas visíveis. Ações por linha:

- **Toggle de Status** — alterna entre `completed` e `pending`
- **Ícone Comprovante** — abre visualizador/download do comprovante
- **Editar** (ícone lápis) — abre `TransactionsDialog` para edição
- **Excluir** (ícone lixeira) — modal de confirmação (para parcelados, permite excluir apenas este ou todos os futuros)

#### 8.1.7 Tipos de Registro na Lista Unificada

A lista combina dois tipos de dados:

| Tipo | Origem | Indicador visual |
|------|--------|-----------------|
| **Transação realizada** | Tabela `transactions` | Normal |
| **Parcela pendente** | Tabela `installments` (não paga) | Linha especial com indicador |

### 8.2 Modal de Novo/Editar Lançamento (TransactionsDialog)

Modal completo com as seguintes abas/seções:

**Básico:**
- Tipo: Entrada / Saída
- Descrição
- Valor
- Data
- Categoria (select com categorias da organização)
- Forma de Pagamento (select)
- Status: Concluído / Pendente
- Data de Competência
- Comprovante (upload para Supabase Storage)
- Observações

**Parcelamento:**
- Ativar parcelamento
- Número de parcelas
- Data de início (primeira parcela)
- Dia de vencimento
- Preview das parcelas geradas

**Recorrência:**
- Tipo recorrente (mensal, etc.)

**Ocasião:**
- Vincular a um evento

### 8.3 Lançamento Rápido (QuickEntryDialog)

Modal simplificado para entrada rápida sem abrir o modal completo. Campos: Tipo, Descrição, Valor, Categoria. Ideal para uso mobile ou em situações de pressa.

### 8.4 Aba: Categorias

**Objetivo:** Gerenciar categorias de lançamentos e formas de pagamento.

Sub-abas:
- **Entradas** — categorias de receita (ex: Dízimo, Oferta, Doação)
- **Saídas** — categorias de despesa (ex: Manutenção, Salários, Contas)
- **Formas de Pagamento** — (ex: PIX, Dinheiro, Cartão, TED)
- **Funções Ecl.** — cargos eclesiásticos para uso na Secretaria

Ações: Criar, Editar nome/cor, Excluir (com proteção se em uso).

### 8.5 Aba: Fechamento Mensal

**Objetivo:** Consolidar o caixa mensalmente geração de histórico auditável.

**Conceito central — Fórmula Mordus:**
```
SI (Saldo Inicial) + E (Entradas) - S (Saídas) = SF (Saldo Final)
```
O Saldo Final do mês vira **obrigatoriamente** o Saldo Inicial do mês seguinte.

**Funcionalidades:**
- Lista de meses com status (Aberto / Fechado)
- Botão **Fechar Mês** — bloqueia edições do período e grava o fechamento em `monthly_closures`
- Botão **Reabrir Mês** — exclui o registro do fechamento (desbloqueia para edições)
- Modo Flexível (configurável nas Settings) — permite fechar meses fora de ordem cronológica

**Proteções:**
- Não permite fechar um mês se houver meses anteriores abertos (modo contínuo)
- Fechamento retroativo recalcula saldos sucessores em cascata

### 8.6 Aba: Relatórios

**Objetivo:** Exportar e visualizar relatórios financeiros.

- Filtros: Período, Tipo, Categoria
- Visualização: Tabela e Gráficos
- Exportação: PDF / Excel (em implementação)
- Relatório de Lançamentos Sem Comprovante
- Relatório por Categoria

---

## 9. Sistema de Parcelamentos

Implementado com duas tabelas distintas:

### 9.1 Estrutura de Dados

**`installment_purchases`** (compra parcelada):
- `description` — descrição da compra
- `category_id` — categoria
- `payment_method_id` — forma de pagamento

**`installments`** (parcela individual):
- `purchase_id` — referência à compra
- `installment_number` — número da parcela (1, 2, 3...)
- `total_installments` — total de parcelas
- `amount` — valor da parcela
- `competence_date` — mês ao qual pertence (competência)
- `due_date` — data de vencimento
- `payment_date` — data em que foi paga (nullable)
- `status` — `PENDENTE` | `VENCIDA` | `PAGA` | `PAGA_COM_ATRASO`
- `receipt_url` — comprovante

### 9.2 Estados das Parcelas

| Status | Condição |
|--------|---------|
| `PENDENTE` | Não vencida e não paga |
| `VENCIDA` | `hoje > due_date` e não paga |
| `PAGA` | Paga dentro do prazo |
| `PAGA_COM_ATRASO` | Paga após o vencimento |

### 9.3 Regra de Caixa

> **Parcela ≠ Saída de Caixa** automaticamente.

A saída só é lançada em `transactions` **quando** a parcela é marcada como paga. Parcelas vencidas **não** afetam o saldo do mês automaticamente.

---

## 10. Módulo Secretaria (`/membros`)

Tela organizada em 9 abas, acessíveis via parâmetro `?tab=`:

```
/membros
├── [tab=resumo]         → Dashboard da Secretaria
├── [tab=membros]        → Gestão de Membros (padrão)
├── [tab=lideranca]      → Liderança
├── [tab=departamentos]  → Departamentos
├── [tab=patrimonio]     → Patrimônio
├── [tab=documentos]     → Documentos
├── [tab=congregacoes]   → Congregações
├── [tab=calendario]     → Calendário/Eventos
├── [tab=social]         → Serviço Social
└── [tab=parceiros]      → Parcerias
```

### 10.1 Aba: Gestão de Membros

#### KPIs do Topo

| Card | Dado |
|------|------|
| Total de Membros | Contagem geral |
| Membros Ativos | Ativos (+ % do total) |
| Batizados | Batizados (+ % do total) |
| Novos no Mês | Cadastrados no mês corrente |

#### Filtros e Busca

- **Busca:** por nome ou e-mail
- **Status:** Todos / Ativos / Inativos
- **Congregação:** Todas / filtro por congregação
- **Ordenar e Configurar Colunas** via `TableToolbar`

#### Colunas Configuráveis

| Coluna | Conteúdo |
|--------|---------|
| Nome | Nome + avatar |
| Contato | Telefone + e-mail |
| Congregação | Nome da congregação |
| Idade | Calculada desde `birth_date` |
| Status | Badge Ativo / Inativo |
| Dept/Cargos | Departamento e cargo eclesiástico |

#### Drawer de Detalhes (MemberDrawer)

Ao clicar em um membro, abre um drawer lateral (Sheet) com todos os dados do membro em modo leitura.

#### Formulário Multi-Step de Cadastro/Edição

Dialog com 3 passos (barra de progresso visual):

**Passo 1 — Dados Pessoais:**
- Foto de perfil (upload para Supabase Storage)
- Nome Completo *
- Sexo (Masculino / Feminino)
- Data de Nascimento (com cálculo de idade em tempo real)
- Status (Ativo / Inativo)
- Departamento (com criação inline via Popover)
- Cargo/Função (com criação inline via Popover)

**Passo 2 — Contato e Família:**
- E-mail
- Telefone / WhatsApp
- Endereço Residencial
- Nome do Pai
- Nome da Mãe

**Passo 3 — Dados Eclesiásticos:**
- Congregação (com criação inline via Popover)
- Igreja de Procedência (anterior)
- Checkbox: Batizado nas Águas
- Card de Resumo do Cadastro antes de salvar

### 10.2 Aba: Liderança

Cadastro e gerenciamento de líderes da organização.

**Dados registrados:**
- Nome, Cargo, Departamento vinculado, Contato
- Status: ativo / inativo

### 10.3 Aba: Departamentos

Gestão de ministérios e departamentos (Louvor, Infantil, Missões, etc.).

**Funcionalidades:**
- Criar, listar, editar e excluir departamentos
- Vinculação de líderes e membros a departamentos

### 10.4 Aba: Patrimônio

Gestão de bens materiais da organização.

**Dados de um bem:**
- Nome / Descrição
- Categoria / Tipo
- Estado de conservação (Excelente, Bom, Regular, Manutenção)
- Localização
- Valor estimado
- Data de aquisição
- Fotos (upload)

### 10.5 Aba: Documentos

Armazenamento e organização de documentos institucionais.

**Funcionalidades:**
- Upload de documentos (PDF, imagens)
- Categorização (Atas, Certidões, Contratos, etc.)
- Integração com **Google Drive** (via `GoogleDriveConnector`)
- Visualização e download

### 10.6 Aba: Congregações

Gestão das congregações/filiais vinculadas à organização.

**Dados de uma congregação:**
- Nome
- Endereço
- Responsável local
- Contagem de membros vinculados

### 10.7 Aba: Calendário/Eventos

Registro e acompanhamento de eventos da organização.

**Dados de um evento:**
- Título
- Data / Hora
- Local
- Descrição
- Responsável

**Funcionalidades:**
- Visualização em calendário e lista
- Filtro por mês
- Lançamentos financeiros podem ser vinculados a eventos

### 10.8 Aba: Serviço Social

Registro das ações sociais e famílias atendidas pela organização.

**Dados registrados:**
- Nome da família / beneficiado
- Tipo de assistência
- Data
- Responsável pelo atendimento
- Observações

### 10.9 Aba: Parcerias

Registro de parceiros, convênios e organizações colaboradoras.

**Dados registrados:**
- Nome da organização parceira
- Tipo de parceria
- Contato
- Status
- Observações

---

## 11. Dashboard da Secretaria (SecretariaDashboard)

Acessível pelo `Dashboard` com `?view=secretaria` ou pela aba `resumo` em `/membros`.

### 11.1 Filtros Globais

- **Período:** 3 Meses / 6 Meses / 12 Meses
- **Congregação:** Todas / específica
- **Status:** Todos / Ativos / Inativos / Pendentes

### 11.2 KPIs

| Card | Dado |
|------|------|
| Membros Ativos | Total filtrado |
| Departamentos | Quantidade |
| Patrimônio | Quantidade de bens |
| Congregações | Quantidade |

### 11.3 Painéis Temáticos (Sub-boards)

#### Visão Geral (overview)
- **Gráfico de Crescimento de Membros:** AreaChart + BarChart combinados (novas admissões por mês + linha de crescimento acumulado)
- **Aniversariantes do Mês:** Lista de membros com aniversário no mês corrente
- **Últimas Admissões:** 5 registros mais recentes

#### Demográfico (demography)
Sub-abas:
- **Sexo:** PieChart por gênero
- **Estado Civil:** PieChart por estado civil
- **Idade:** BarChart horizontal por faixa etária

#### Eclesiástico (church)
Sub-abas:
- **Batismo:** PieChart batizados vs não batizados
- **Funções:** Gráfico de barras das principais funções/cargos
- **Congregações:** BarChart de membros por congregação

#### Operacional (operational)
- Cards de ações rápidas: Completar Perfis, Próximos Eventos, Documentos
- Resumo do Patrimônio por estado de conservação

---

## 12. Configurações (`/configuracoes`)

Organizada em 4 abas:

### 12.1 Aba: Meu Perfil

- **Foto de Perfil:** upload de imagem (Supabase Storage)
- **Nome Completo:** editável
- **Telefone:** editável
- **E-mail:** exibido (não editável — vinculado ao Supabase Auth)
- **Role/Cargo:** exibido (somente Admin pode alterar o role dos membros)
- **ID do usuário:** exibido (8 primeiros caracteres)

### 12.2 Aba: Organização

**Bloco: Código de Acesso**
- UUID da organização exibido + botão copiar
- Usado para convidar novos membros à organização

**Bloco: Cadastro Institucional**
- Nome da Organização
- CNPJ
- Endereço Completo
- Pastor / Responsável
- Telefone Comercial

**Bloco: Dados Bancários & PIX**
- Banco, Agência, Conta Corrente
- Tipo de Chave PIX (CNPJ, E-mail, Telefone, Aleatória)
- Chave PIX

**Bloco: Modo de Fechamento**
- Toggle: **Fechamento Flexível** (permite fechar meses fora de ordem — para igrejas em regularização retroativa)

**Bloco: Alertas e Notificações**
- **Antecedência de Contas (dias):** número que define com quantos dias de antecedência uma conta vencendo aparece nos alertas da sidebar

**Bloco: Presença Digital**
- Instagram, WhatsApp, Facebook, YouTube

### 12.3 Aba: Equipe & Acessos

- Lista de todos os perfis vinculados à organização
- Busca por nome/ID
- Editar Role de cada membro (apenas Admin)
- Alterar Departamento vinculado (para líderes)
- Ação: Remover membro da organização

### 12.4 Aba: Auditoria (apenas Admin)

- Log completo de todas as ações no sistema
- Paginação (50 registros/página) com "Carregar mais"
- Cada entrada: data/hora, usuário, ação realizada, entidade afetada
- Click em um log abre modal com detalhes

**Zona de Perigo — Reset do Sistema:**
- Botão "Zerar Todos os Dados"
- Modal de confirmação exige digitar o código `ZERAR TUDO`
- Remove: transactions, installments, closures, events, members, departments, leaders, categories, audit_logs
- Remove: outros profiles da organização (mantém apenas o admin que executou)

---

## 13. Ajuda / Manual (`/ajuda`)

Página estática com conteúdo educativo sobre o sistema.

### Seções

**Hero — "Domine a Arte da Mordomia Moderna"**
- Apresentação do produto
- Explicação do nome "Mordus"

**Fundamentos (3 tiles)**
- Gestão Blindada
- Transparência Total
- Legado Digital

**Enciclopédia Mordus — Conhecendo os Módulos**

- **Gestão de Membros e Secretaria:** funcionamento do módulo
- **Inteligência Financeira:** filosofia por trás do fluxo de caixa

**Processos de Fechamento (Tutorials — Dialog)**

- **Fechamento Retroativo:** como regularizar meses passados
- **Transporte de Saldo:** a fórmula `SI + E - S = SF` explicada

**FAQ (Accordion)**

| Pergunta | Resposta |
|---------|---------|
| O que são "Lançamentos Retroativos"? | Histórico alterado pede novo fechamento |
| Como reabrir um mês fechado? | Excluindo o registro do fechamento |
| O "Saldo Projetado" é confiável? | Sim, é matemático |
| Limite de usuários para suporte? | Não há limite |

**Coluna Lateral**
- Conselho técnico: manter fechamentos em ordem cronológica
- Card dark: "Falar com Suporte"

---

## 14. Mordus Copilot (IA)

### 14.1 Conceito

Assistente de IA contextual integrado ao app. Acessa os dados da organização via contexto e responde perguntas em linguagem natural.

### 14.2 Interface

- Botão de ativação flutuante ou via `CopilotContext`
- Chat em slide-panel ou modal
- Histórico de mensagens na sessão

### 14.3 Capacidades Atuais (Nível 1)

O Copilot **pode:**
- ✅ Consultar dados da organização
- ✅ Resumir informações financeiras
- ✅ Alertar sobre pendências e inconsistências
- ✅ Responder dúvidas sobre o sistema

O Copilot **não pode:**
- ❌ Criar lançamentos
- ❌ Fechar caixa
- ❌ Alterar dados de membros
- ❌ Executar ações destrutivas

### 14.4 Base de Conhecimento

Alimentada por chunks de texto categorizados:
- Conceitos de tesouraria eclesiástica
- Regras de categorias e formas de pagamento
- Fluxo de fechamento mensal
- Conceitos de secretaria (membros, departamentos, etc.)
- Pendências e alertas

### 14.5 Stack Técnico (Planejado)

| Componente | Tecnologia |
|-----------|-----------|
| LLM | OpenAI GPT-4o / Anthropic Claude 3.5 |
| Integração Backend | Supabase Edge Functions |
| Banco Vetorial | pgvector (Supabase) |
| Padrão | RAG (Retrieval Augmented Generation) |

---

## 15. Componentes Principais

### 15.1 TransactionsDialog

Dialog completo para criação e edição de lançamentos. Usado no Dashboard e na Tesouraria. Controlado globalmente pelo `TransactionModalContext`.

### 15.2 QuickEntryDialog

Modal simplificado de entrada rápida. Acessível do Dashboard.

### 15.3 MemberDrawer

Sheet lateral com todos os detalhes de um membro em modo leitura.

### 15.4 OnboardingModal

Modal de setup inicial (primeira vez). Cria ou vincula organização.

### 15.5 TableToolbar

Toolbar reutilizável com controles de: ordenação de campo, direção, e visibilidade de colunas. Usado em Transactions e Members.

### 15.6 PermissionGuard

Wrapper que esconde children para usuários sem permissão (`requireWrite`, etc.).

### 15.7 ErrorBoundary

Captura erros de renderização React e exibe fallback visual amigável.

### 15.8 GlobalSearch

Busca global via teclado, busca simultânea em membros e lançamentos.

### 15.9 GoogleDriveConnector

Componente para conectar a conta Google Drive da organização. Permite vincular pasta do Drive para armazenamento de documentos.

### 15.10 SidebarUpdates / UpdatesSheet

Painel de atualizações do produto (changelog do app) exibido na sidebar contextual.

---

## 16. Modelo de Dados (Tabelas Supabase)

| Tabela | Finalidade |
|--------|-----------|
| `organizations` | Dados da organização/igreja |
| `profiles` | Usuários vinculados à organização (RBAC) |
| `members` | Membros cadastrados |
| `transactions` | Lançamentos financeiros |
| `categories` | Categorias (financeiras + cargos eclesiásticos) |
| `installments` | Parcelas individuais |
| `installment_purchases` | Compra parcelada (pai das parcelas) |
| `monthly_closures` | Registros de fechamento mensal |
| `departments` | Departamentos/ministérios |
| `leaders` | Líderes/conselheiros |
| `congregations` | Filiais/congregações |
| `events` | Eventos e cultos |
| `assets` | Patrimônio |
| `families` | Famílias (Serviço Social) |
| `partners` | Parcerias |
| `documents` | Documentos institucionais |
| `audit_logs` | Log de ações para auditoria |

---

## 17. Fluxos Críticos

### 17.1 Fluxo Financeiro Completo

```
Lançamento criado (income/expense)
    ↓
Define: categoria, valor, data, status, comprovante
    ↓
Aparece na lista de Transações (Fluxo de Caixa)
    ↓
Impacta os KPIs da tela e do Dashboard
    ↓
Fim do mês → Revisão → Fechar Mês
    ↓
monthly_closures registrado (saldo final)
    ↓
Saldo Final vira Saldo Inicial do próximo mês
```

### 17.2 Fluxo de Parcelamento

```
Novo Lançamento → ativar parcelamento → define N parcelas + vencimento
    ↓
Sistema gera: installment_purchases + N installments (PENDENTE)
    ↓
Parcelas aparecem na view "Obrigações" (no mês de competência)
    ↓
Usuário clica "PAGAR AGORA" em uma parcela
    ↓
installment.status = PAGA (ou PAGA_COM_ATRASO)
installment.payment_date = hoje
    ↓
Cria transaction correspondente no caixa
    ↓
Parcela sai da lista de pendências
```

### 17.3 Fluxo de Cadastro de Membro

```
Botão "Novo Membro"
    ↓
Passo 1: Dados pessoais + foto + departamento + cargo
    ↓
Passo 2: Contato + família
    ↓
Passo 3: Dados eclesiásticos + congregação + batismo
    ↓ (preview do resumo)
Salvar → INSERT em members
    ↓
Aparece na lista + KPIs atualizados
```

### 17.4 Fluxo de Onboarding

```
Usuário cadastra conta (Auth)
    ↓
Confirma e-mail (Supabase)
    ↓
Faz login → ChurchContext detecta: sem organization_id
    ↓
OnboardingModal aparece
    ↓
Opção A: Criar organização nova
Opção B: Entrar com código de acesso
    ↓
Profile vinculado à organização
    ↓
App funcional
```

---

## 18. Design System

### 18.1 Tokens Visuais

| Token | Uso |
|-------|-----|
| `--primary` | Cor principal (ações, links, destaques) |
| `--secondary` | Fundos de cards e grupos |
| `--destructive` | Erros, exclusões, atrasos |
| `--muted-foreground` | Texto secundário |
| `--chart-blue` | Entradas / dados primários nos gráficos |
| `--chart-pink` | Saídas / dados secundários |
| `--chart-amber` | Alertas / pendências |
| `--chart-emerald` | Dados positivos / crescimento |

### 18.2 Padrões Visuais

- **Border radius:** arredondamentos generosos (xl, 2xl, 3xl)
- **Cards:** fundo `card`, sem borda explícita, sombra sutil
- **Stat cards:** classe `.stat-card`, hover com ring
- **Tipografia:** hierarquia forte via tamanho + peso
- **Animações:** `animate-fade-in`, `animate-in`, transições 500ms
- **Dark mode:** suportado via `next-themes` e tokens CSS

### 18.3 Componentes UI Base (shadcn/ui)

- Card, Button, Input, Select, Dialog, Sheet, Tabs, Badge, Skeleton
- Table, ScrollArea, Popover, Switch, Checkbox, Separator
- Tooltip, Accordion, DatePicker

---

## 19. Roadmap Implícito (deduzirei do código)

### Implementado ✅
- Autenticação completa (login, cadastro, logout)
- Multi-tenant com isolamento por organização
- RBAC completo (5 roles)
- Tesouraria (lançamentos, categorias, fechamento, relatórios)
- Parcelamentos (novo sistema com competência)
- Secretaria (membros, departamentos, liderança, patrimônio, documentos, congregações, eventos, serviço social, parcerias)
- Dashboard duplo (financeiro + secretaria)
- Copilot de IA (estrutura e contexto)
- Auditoria de ações
- Google Drive connector
- Tema escuro/claro

### Em Desenvolvimento / Planejado 🔄
- Exportação de relatórios (PDF/Excel)
- Integração real do Copilot com LLM (RAG + pgvector)
- Notificações por e-mail (relatórios semanais, alertas)
- Paywall / planos de assinatura
- OCR para captura de comprovantes
- App mobile (React Native / Flutter)

---

## 20. Glossário

| Termo | Definição |
|-------|----------|
| **Competência** | Mês ao qual uma transação/parcela pertence (≠ data de pagamento) |
| **Saldo Anterior** | Resultado financeiro acumulado de todos os meses fechados anteriores |
| **Saldo Projetado** | Saldo atual considerando também as saídas pendentes |
| **Fechamento** | Consolidação mensal que bloqueia edições e transporta saldo |
| **Obrigações** | Parcelas ou contas com vencimento futuro/atual não pagas |
| **Comprovante** | Arquivo (imagem/PDF) que valida uma transação financeira |
| **Rol** | Lista oficial de membros ativos da congregação |
| **Congregação** | Filial ou célula subordinada à organização principal |
| **Departamento** | Ministério ou setor da organização (ex: Louvor, Infantil) |
| **Perfil Incompleto** | Membro sem telefone, e-mail ou foto cadastrados |
