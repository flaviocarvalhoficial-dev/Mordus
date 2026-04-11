---
trigger: always_on
---

# **Mordus AI — Plano de Integração de Agente de IA**

Este documento detalha a estratégia para transformar o Mordus de uma ferramenta de registro em um parceiro inteligente para a gestão eclesiástica.

## **Avaliação de Valor (Assessment)**

O público do Mordus (Tesoureiros, Pastores e Secretários) valoriza a **transparência e a simplicidade**. Um Agente de IA no Mordus não deve ser apenas um "chat", mas um assistente que reduz o trabalho manual e aumenta a confiabilidade dos dados.

### **Sugestão de Direcionamento**

Focar em **IA Invisível** (que trabalha nos bastidores) e **IA de Consulta** (que simplifica a leitura de dados complexos).

---

## **Proposta de Capacidades (Roadmap)**

### **1. Mordus Copilot (Assistente de Suporte e Onboarding)**

- **O que faz:** Responde dúvidas sobre o uso do sistema e regras básicas de tesouraria.
- **Valor:** Reduz a necessidade de suporte humano e ajuda usuários menos experientes a não cometerem erros técnicos.

### **2. Captura Inteligente (OCR + Categorização)**

- **O que faz:** O usuário sobe uma foto de um cupom fiscal ou recibo; a IA extrai o valor, a data, o favorecido e sugere a categoria (ex: "Manutenção", "Missões").
- **Valor:** Economiza tempo de digitação e padroniza os lançamentos.

### **3. Analista Financeiro Proativo**

- **O que faz:** Monitora o fluxo de caixa e gera alertas ou resumos semanais.
- **Exemplo:** "Pastor, detectei que as despesas com energia elétrica subiram 15% acima da média dos últimos 3 meses."
- **Valor:** Transforma dados brutos em decisões estratégicas.

### **4. Consultas em Linguagem Natural**

- **O que faz:** Permite que o usuário pergunte ao invés de navegar em filtros.
- **Exemplo:** "Quanto arrecadamos de dízimo no Pix na última semana?" ou "Gere o relatório de gastos do Departamento Infantil."

---

## **Sugestão Técnica (Stack)**

Para o Mordus (considerando o uso de Supabase e tecnologias modernas):

- **LLM:** OpenAI (GPT-4o/mini) ou Anthropic (Claude 3.5 Sonnet) para raciocínio lógico.
- **Integração:** Supabase Edge Functions (para manter o backend seguro e evitar expor chaves de API).
- **Vetores:** pgvector no Supabase para a base de conhecimento (suporte e manuais).
- **Interface:** Floating Action Button (FAB) com uma interface de chat minimalista (estilo "Coal Gray" seguindo o design do app).

---

## **Próximos Passos Sugeridos**

1. **Definição do MVP:** Escolher entre o assistente de suporte ou a captura inteligente de recibos.
2. **Design de UI:** Prototipar como o agente "vive" dentro da dashboard.
3. **Draft de Backend:** Configurar a primeira Edge Function para teste de prompt.

**IMPORTANT**

A IA nunca deve realizar lançamentos financeiros ou fechar períodos sem aprovação humana explícita. Ela atua como um **sugestor e assistente**, mantendo o tesoureiro no controle total.