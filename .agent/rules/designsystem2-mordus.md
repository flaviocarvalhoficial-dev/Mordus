---
trigger: always_on
---

# Design System: Slite-like Landing Page

**Extraído de:** Screenshot fornecido  
**Data:** 2026-04-09  
**Versão:** 1.0  

> ⚠️ Este documento é a fonte de verdade visual do produto. Toda nova seção deve respeitar estas regras antes de introduzir qualquer variação.

---

## 1. Tokens de Cor

### 1.1 Paleta Base

| Token | Hex | Uso semântico |
|-------|-----|---------------|
| `color-bg-base` | `#F3EDE4` [estimado] | Fundo global claro |
| `color-bg-dark` | `#2F2F2F` [estimado] | Fundo seção escura |
| `color-primary` | `#3B82F6` [estimado] | Botões CTA principais |
| `color-accent-orange` | `#F97316` [estimado] | Destaques secundários |
| `color-accent-purple` | `#8B5CF6` [estimado] | Labels e indicadores |
| `color-text-primary` | `#1F1F1F` [estimado] | Texto principal |
| `color-text-secondary` | `#6B7280` [estimado] | Texto secundário |
| `color-text-inverse` | `#FFFFFF` | Texto em fundo escuro |
| `color-border` | `#E5E7EB` [estimado] | Bordas suaves |
| `color-card-bg` | `#FFFFFF` | Fundo de cards |
| `color-muted-bg` | `#FAFAFA` [estimado] | Backgrounds leves internos |

### 1.2 Regras de Uso

- `color-bg-base`: exclusivo para áreas principais claras
- `color-bg-dark`: usado apenas em blocos de destaque narrativo
- `color-primary`: apenas CTAs e ações principais
- `color-accent-*`: nunca usar em textos longos, apenas micro-elementos
- `color-text-primary`: sempre em fundo claro
- `color-text-inverse`: exclusivo para fundo escuro
- Evitar contraste baixo entre texto e fundo (< WCAG AA)
- Nunca usar `color-primary` como fundo global

---

## 2. Tipografia

### 2.1 Escala

| Token | Tamanho | Peso | Uso |
|-------|---------|------|-----|
| `text-display` | ~48–56px [estimado] | 700 | Hero headline |
| `text-headline` | ~28–36px [estimado] | 600 | Seções principais |
| `text-subheadline` | ~18–20px [estimado] | 400 | Subtextos |
| `text-body` | ~14–16px | 400 | Texto padrão |
| `text-label` | ~12px | 500 | Labels e UI |
| `text-button` | ~14px | 600 | Botões |

### 2.2 Fonte

Prováveis:
- Inter [estimado]
- SF Pro Display [estimado]
- Helvetica Neue [estimado]

Justificativa:
- Sans-serif moderna
- Alta legibilidade
- Aparência neutra e SaaS

### 2.3 Regras

- Hierarquia forte via tamanho + peso
- Headings sem uppercase
- Labels podem usar uppercase leve
- Espaçamento generoso entre linhas (~1.5 line-height)
- Evitar textos densos

---

## 3. Espaçamento e Grid

### 3.1 Escala

| Token | Valor | Uso típico |
|-------|-------|-----------|
| `space-1` | 4px | micro espaçamento |
| `space-2` | 8px | padding interno |
| `space-3` | 12px | elementos pequenos |
| `space-4` | 16px | padrão |
| `space-5` | 24px | blocos |
| `space-6` | 32px | seções |
| `space-7` | 48px | grandes separações |
| `space-8` | 64px | hero spacing |
| `space-9` | 96px | seções principais |

### 3.2 Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `radius-sm` | 6px | inputs |
| `radius-md` | 10px | cards |
| `radius-lg` | 16px | containers |
| `radius-xl` | 24px [estimado] | blocos grandes |
| `radius-full` | 999px | botões pill |

### 3.3 Estrutura de Layout

```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.section {
  padding: 80px 0;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
}

.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

4. Elevação
Uso mínimo de sombras
Profundidade criada por:
contraste de cor
blocos sobrepostos
Sombras leves:
box-shadow: 0 4px 12px rgba(0,0,0,0.05);
Design favorece flat + editorial
5. Anatomia dos Componentes
C1 — Botão Primário
[ Texto CTA ]

Padding:        10px 20px
Cor:            color-primary
Texto:          branco
Radius:         radius-full
Peso:           600
Hover:          escurece levemente
Regra:          sempre destaque principal
C2 — Botão Secundário
[ Texto ]

Background:     transparente
Border:         1px color-border
Texto:          color-text-primary
Hover:          bg leve
C3 — Card
[ Conteúdo ]

Background:     branco
Padding:        24px
Radius:         radius-md
Border:         1px color-border
Shadow:         leve
C4 — Input
[ email input ]

Padding:        12px
Border:         1px solid
Radius:         radius-full
Placeholder:    color-text-secondary
C5 — Label
[ Badge ]

Background:     color-accent
Padding:        4px 8px
Font:           12px
Radius:         radius-full
6. Padrões de Layout
L1 — Hero
.hero {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
L2 — Split Content
.split {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 48px;
}
L3 — Section Dark
.section-dark {
  background: color-bg-dark;
  color: white;
  border-radius: 200px 200px 0 0;
}
7. Estados de Interação
Estado	Regra
Hover — botão	Escurece + leve scale
Hover — card	Elevação sutil
Focus	Outline suave azul
Active	Pressed effect
Scroll — header	Fica sticky
8. Princípios de Identidade
Clareza antes de estilo
Interface limpa e legível.
Espaço é design
Uso agressivo de whitespace.
Minimalismo editorial
Mistura UI + estética de revista.
Hierarquia evidente
Sem ambiguidade visual.
Humanização leve
Ilustrações desenhadas à mão.
Cor com propósito
Cada cor tem função específica.
Sem ruído visual
Evitar excesso de elementos.
9. O que NUNCA fazer
❌ Usar múltiplas cores primárias
❌ Inserir sombras pesadas
❌ Reduzir espaçamento global
❌ Misturar estilos de ilustração
❌ Usar tipografia serifada
❌ Criar CTAs com baixa visibilidade
❌ Usar gradientes sem propósito
❌ Poluir com muitos ícones
❌ Usar cores vibrantes em excesso
❌ Ignorar contraste de texto
❌ Criar layouts densos
❌ Quebrar consistência de radius