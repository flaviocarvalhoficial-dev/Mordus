---
trigger: always_on
---

# 🧠 BASE DE CONHECIMENTO — COPILOT MORDUS

## 🎯 OBJETIVO

Criar uma base de conhecimento estruturada para alimentar o Copilot do Mordus, permitindo respostas inteligentes, contextualizadas e confiáveis para igrejas.

---

# 🧩 DOMÍNIOS DE CONHECIMENTO

A base deve ser organizada em 2 pilares principais:

## 1. TESOURARIA

### 📊 Conceitos fundamentais

- Entrada: qualquer valor recebido pela igreja
- Saída: qualquer valor pago pela igreja
- Categoria: classificação da movimentação (ex: dízimo, oferta, manutenção)
- Forma de pagamento: Pix, dinheiro, cartão, TED, DOC, depósito
- Comprovante: documento que valida uma transação
- Fechamento: consolidação financeira de um período

---

### 💰 Tipos de entrada

- Dízimos
- Ofertas
- Doações
- Contribuições especiais
- Eventos

---

### 💸 Tipos de saída

- Manutenção
- Contas (água, luz, internet)
- Salários / ajuda de custo
- Compras gerais
- Eventos

---

### ⚠️ Regras importantes

- Todo lançamento deve ter:
  - valor
  - categoria
  - forma de pagamento

- Comprovante é opcional, mas recomendado

- Fechamento:
  - bloqueia edições
  - deve ser revisado antes de confirmar
  - apenas admin pode reabrir

---

### 📈 Consultas comuns

- Total de entradas por período
- Total de saídas por categoria
- Saldo final
- Lançamentos sem comprovante
- Movimentações por forma de pagamento

---

## 2. SECRETARIA

### 👥 Conceitos fundamentais

- Membro: pessoa cadastrada na igreja
- Status:
  - ativo
  - inativo

- Faixa etária:
  - criança
  - jovem
  - adulto
  - idoso

---

### 📋 Dados de membro

- Nome
- Telefone
- Sexo
- Faixa etária
- Status

---

### ⚠️ Regras importantes

- Cadastro deve ser atualizado
- Dados incompletos devem ser evitados
- Telefone é altamente recomendado

---

### 📊 Consultas comuns

- Total de membros ativos
- Novos membros no período
- Membros sem telefone
- Distribuição por faixa etária

---

## 3. PENDÊNCIAS E ALERTAS

### 🚨 Situações críticas

- Lançamentos sem comprovante
- Períodos não fechados
- Dados de membros incompletos
- Inconsistências financeiras

---

### 📌 Objetivo do Copilot

- Alertar usuários
- Sugerir ações
- Facilitar revisão

---

## 4. FLUXOS DO SISTEMA

### 🔁 Fluxo financeiro

1. Criar lançamento
2. Adicionar categoria
3. Definir forma de pagamento
4. Anexar comprovante (opcional)
5. Revisar
6. Fechar período
7. Gerar relatório

---

### 👥 Fluxo de membros

1. Criar membro
2. Preencher dados
3. Atualizar quando necessário
4. Consultar informações

---

## 5. TOM DE RESPOSTA DO COPILOT

O Copilot deve:

- Responder de forma clara e direta
- Evitar linguagem técnica
- Ser objetivo
- Ajudar na tomada de decisão
- Apontar problemas quando existirem

---

## 6. LIMITAÇÕES DO COPILOT (NÍVEL 1)

O Copilot NÃO pode:

- Criar lançamentos
- Editar dados
- Excluir informações
- Fechar caixa
- Alterar membros

Ele deve apenas:

✔ Consultar  
✔ Explicar  
✔ Resumir  
✔ Alertar  

---

## 7. ESTRUTURA PARA BANCO VETORIAL

Cada bloco deve ser indexado com:

- título
- tipo (tesouraria, secretaria, regra, fluxo)
- conteúdo
- palavras-chave

---

### 📌 Exemplo de chunk

Título: "Lançamentos sem comprovante"  
Tipo: "pendência"  
Conteúdo: "Lançamentos que não possuem comprovante devem ser revisados..."  
Tags: ["financeiro", "pendência", "comprovante"]

---

## 8. PALAVRAS-CHAVE IMPORTANTES

- financeiro
- tesouraria
- entrada
- saída
- relatório
- fechamento
- comprovante
- membros
- cadastro
- igreja
- organização

---

## 🎯 RESULTADO FINAL

Essa base permitirá que o Copilot:

- Entenda o contexto do Mordus
- Responda perguntas com precisão
- Oriente usuários
- Gere valor real dentro do sistema

---

## 🚀 PRÓXIMO PASSO

Usar essa base para:

1. Criar embeddings
2. Alimentar banco vetorial
3. Conectar com API de IA
4. Implementar RAG no Mordus