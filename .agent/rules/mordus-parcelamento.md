---
trigger: always_on
---

# 🧠 FEATURE: Gestão de Parcelamentos, Atrasos e Competência Financeira (MORDOS)

## 🎯 OBJETIVO

Implementar um sistema robusto de controle de despesas parceladas que suporte:

* Parcelas futuras
* Parcelas vencidas (em atraso)
* Parcelas pagas (no prazo ou com atraso)
* Implantação retroativa (usuário começando no meio do ano)
* Separação entre **competência**, **status** e **impacto no caixa**
* Integração correta com o **fechamento mensal**

---

## 🧩 CONCEITOS FUNDAMENTAIS (OBRIGATÓRIO)

### 1. Separação de responsabilidades

Cada parcela deve possuir:

* `competencia` → mês ao qual a parcela pertence (ex: março/2026)
* `data_vencimento`
* `status`
* `data_pagamento` (nullable)
* `valor`
* `origem` (referência à compra/pai)

---

### 2. Estados da parcela

O sistema deve suportar os seguintes estados:

* `PENDENTE` → ainda não venceu
* `VENCIDA` → venceu e não foi paga
* `PAGA` → paga dentro do prazo
* `PAGA_COM_ATRASO` → paga após vencimento

Regra automática:

* Se `hoje > data_vencimento` e `status != PAGA` → status = VENCIDA

---

### 3. Princípio central

**OBRIGAÇÃO ≠ SAÍDA DE CAIXA**

* A parcela impacta o caixa apenas quando for paga
* Parcelas vencidas NÃO devem ser automaticamente lançadas como saída no mês atual

---

## 💰 COMPORTAMENTO FINANCEIRO

### 1. Regra de caixa

* Só existe saída de dinheiro quando `status = PAGA`
* A saída ocorre na `data_pagamento`

---

### 2. Regra de competência

* A parcela pertence sempre ao mês da `competencia`
* Mesmo que seja paga em outro mês

---

### 3. Regra de atraso

Parcelas vencidas devem:

* Continuar vinculadas ao mês original
* Ser exibidas como **pendências acumuladas**
* NÃO alterar automaticamente o saldo do mês atual

---

## 🔁 FLUXO DE FECHAMENTO MENSAL

### 1. O fechamento deve transportar apenas:

* saldo financeiro final (entradas - saídas reais)

### 2. NÃO transportar como saldo:

* parcelas vencidas não pagas

### 3. Parcelas vencidas devem aparecer no mês seguinte como:

* `pendencias_acumuladas`

---

## 🧾 IMPLANTAÇÃO RETROATIVA (CRÍTICO)

Usuário pode iniciar uso no meio do tempo (ex: abril)

O sistema deve permitir:

### 1. Definir estado inicial:

* saldo em caixa
* parcelas em aberto (vencidas ou futuras)
* parcelas já pagas

### 2. Não exigir reconstrução de meses anteriores

### 3. Parcelas herdadas devem:

* manter suas competências originais
* respeitar status atual

---

## 📦 MODELAGEM DE PARCELAMENTO

### 1. Estrutura

* Entidade pai: `CompraParcelada`
* Entidade filha: `Parcela`

Cada compra gera automaticamente N parcelas

---

### 2. Exemplo

Compra em janeiro (4x):

| Parcela | Competência | Vencimento |
| ------- | ----------- | ---------- |
| 1       | Jan         | 10/01      |
| 2       | Fev         | 10/02      |
| 3       | Mar         | 10/03      |
| 4       | Abr         | 10/04      |

---

## ⚠️ CASOS REAIS QUE DEVEM SER SUPORTADOS

### Caso 1: parcelas atrasadas

* Jan, Fev, Mar não pagas
* Abril atual

Sistema deve:

* mostrar 3 parcelas vencidas
* NÃO lançar saída automática em abril

---

### Caso 2: pagamento de parcelas antigas

* Fev e Mar pagas em abril

Sistema deve:

* registrar saída em abril
* manter competência original das parcelas

---

### Caso 3: pagamento parcial (opcional futura feature)

* parcela pode ter pagamento parcial
* saldo restante continua pendente

---

### Caso 4: edição retroativa

* alteração de parcela deve atualizar status dinamicamente
* NÃO quebrar histórico de pagamentos já realizados

---

## 🧠 REGRAS DE EXIBIÇÃO (UX)

Cada mês deve mostrar separadamente:

### 1. Saldo inicial

### 2. Movimentações do mês

* entradas
* saídas (somente pagas)

### 3. Parcelas do mês

* parcelas da competência atual

### 4. Pendências acumuladas

* parcelas vencidas de meses anteriores

---

## 🚫 ERROS QUE NÃO PODEM ACONTECER

* Somar parcelas atrasadas como saída automática no mês atual
* Misturar competência com pagamento
* Fazer saldo considerar contas não pagas
* Ocultar atrasos dentro de “pendente genérico”

---

## ✅ RESULTADO ESPERADO

O sistema deve permitir que o usuário entenda claramente:

* quanto já foi pago
* quanto ainda deve
* o que está atrasado
* o que pertence ao mês atual
* e qual é o saldo real disponível

---

## 🔧 PRIORIDADE DE IMPLEMENTAÇÃO

1. Modelagem correta de parcela (com status e datas)
2. Regra de cálculo de status automático
3. Separação entre competência e caixa
4. Exibição de pendências acumuladas
5. Integração com fechamento mensal
6. Suporte à implantação retroativa

---

## 📌 OBSERVAÇÃO FINAL

Este módulo é crítico para a confiabilidade do sistema financeiro.

Qualquer inconsistência aqui impactará diretamente:

* confiança do usuário
* precisão dos relatórios
* tomada de decisão da igreja

---
