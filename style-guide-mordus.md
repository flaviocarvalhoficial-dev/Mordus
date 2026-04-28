# 🎨 Style Guide — Mordus

> **Versão:** 1.0 (Abril 2026)  
> **Produto:** Mordus — Gestão Eclesiástica Inteligente  
> **Stack:** React 18 + TypeScript + Tailwind CSS + shadcn/ui (estilo `default`, baseColor `slate`, CSS Variables ativas)  
> **Referência:** `tailwind.config.ts`, `src/index.css`, `components.json`, `src/components/ui/`

---

## Sumário

1. [Fundamentos de Design](#1-fundamentos-de-design)
2. [Identidade Visual](#2-identidade-visual)
3. [Paleta de Cores](#3-paleta-de-cores)
4. [Tipografia](#4-tipografia)
5. [Espaçamento e Grid](#5-espaçamento-e-grid)
6. [Border Radius](#6-border-radius)
7. [Sombras e Elevação](#7-sombras-e-elevação)
8. [Animações e Transições](#8-animações-e-transições)
9. [Componentes UI](#9-componentes-ui)
10. [Padrões de Layout](#10-padrões-de-layout)
11. [Ícones](#11-ícones)
12. [Gráficos (Recharts)](#12-gráficos-recharts)
13. [Estados de Interface](#13-estados-de-interface)
14. [Modo Escuro](#14-modo-escuro)
15. [Acessibilidade](#15-acessibilidade)
16. [Impressão e PDF](#16-impressão-e-pdf)
17. [Anti-padrões](#17-anti-padrões)

---

## 1. Fundamentos de Design

### 1.1 Princípios

O Mordus adota uma linguagem visual **profissional, limpa e confiável**, adequada ao universo eclesiástico. A interface não deve intimidar; ela deve dar **segurança e clareza** ao tesoureiro ou secretário que lida com dados sensíveis.

| Princípio | Descrição |
|-----------|-----------|
| **Clareza antes de estética** | Informação legível é mais importante que ornamentação |
| **Hierarquia evidente** | O olho do usuário deve saber onde olhar imediatamente |
| **Espaço é design** | Whitespace generoso reduz carga cognitiva |
| **Confiança por consistência** | Componentes iguais se comportam igual em todo o app |
| **Cor com propósito** | Cada cor semântica tem função específica; não usar para decorar |
| **Responsividade implícita** | Layout adaptável sem quebras visuais |

### 1.2 Persona Visual

O Mordus é uma plataforma **SaaS B2B de nicho** com público predominantemente não-técnico. O visual deve transmitir:

- **Seriedade** sem ser corporativo frio
- **Acolhimento** sem ser infantil
- **Modernidade** sem ser exibicionista
- **Organização** sem ser rígido

---

## 2. Identidade Visual

### 2.1 Nome e Significado

> **Mordus** = *Mord* (mordomo) + *Ordus* (ordem)

O nome comunica mordomia e organização. A identidade visual deve reforçar esses valores.

### 2.2 Logo

- Texto principal da logo: usa a cor `--logo-text`
  - Modo claro: `#1A1A1A`
  - Modo escuro: `#FFFFFF`
- Nunca renderizar a logo sobre fundos com pouco contraste
- Manter proporção original; não distorcer

### 2.3 Tom Visual

- **Cor primária:** laranja quente (`hsl(16, 91%, 62%)` → aproximado `#F47B3D`)
- **Sensação:** energia, ação, responsabilidade
- **Suporte:** tons neutros (slate/zinc) para equilíbrio

---

## 3. Paleta de Cores

O Mordus usa **CSS Custom Properties com valores HSL**, permitindo suporte nativo a modo claro/escuro sem duplicar classes Tailwind.

### 3.1 Tokens Semânticos — Modo Claro (`:root`)

| Token CSS | Valor HSL | Hex aproximado | Uso |
|-----------|-----------|----------------|-----|
| `--background` | `0 0% 99%` | `#FCFCFC` | Fundo global da aplicação |
| `--foreground` | `0 0% 12%` | `#1F1F1F` | Texto principal |
| `--card` | `0 0% 100%` | `#FFFFFF` | Fundo de cards e painéis |
| `--card-foreground` | `0 0% 12%` | `#1F1F1F` | Texto dentro de cards |
| `--popover` | `0 0% 100%` | `#FFFFFF` | Fundo de popovers e dropdowns |
| `--popover-foreground` | `0 0% 12%` | `#1F1F1F` | Texto em popovers |
| `--primary` | `16 91% 62%` | `~#F47B3D` | Ação principal, CTA, destaque |
| `--primary-foreground` | `0 0% 100%` | `#FFFFFF` | Texto sobre primary |
| `--secondary` | `220 13% 91%` | `~#E4E7EE` | Botão secundário, pílulas inativas |
| `--secondary-foreground` | `220 9% 46%` | `~#6B748A` | Texto sobre secondary |
| `--muted` | `220 13% 95%` | `~#F0F2F7` | Fundo de áreas subdued/muted |
| `--muted-foreground` | `220 9% 46%` | `~#6B748A` | Texto secundário, labels, placeholders |
| `--accent` | `25 95% 53%` | `~#F97316` | Acentos visuais, destaques secundários |
| `--accent-foreground` | `0 0% 100%` | `#FFFFFF` | Texto sobre accent |
| `--accent-purple` | `262 83% 66%` | `~#8B5CF6` | Destaques de IA, labels especiais |
| `--accent-orange` | `25 95% 53%` | `~#F97316` | Alias do accent — alertas suaves |
| `--destructive` | `0 84% 60%` | `~#EF4444` | Ações destrutivas, erros |
| `--destructive-foreground` | `0 0% 100%` | `#FFFFFF` | Texto sobre destructive |
| `--success` | `160 60% 38%` | `~#22856A` | Confirmações, status positivo |
| `--success-foreground` | `0 0% 100%` | `#FFFFFF` | Texto sobre success |
| `--border` | `220 13% 91%` | `~#E4E7EE` | Bordas de elementos |
| `--input` | `220 13% 91%` | `~#E4E7EE` | Borda de inputs |
| `--ring` | `16 91% 62%` | `~#F47B3D` | Anel de foco (focus ring) |

### 3.2 Tokens de Gráficos

| Token | Valor HSL | Uso |
|-------|-----------|-----|
| `--chart-pink` | `25 91% 75%` | Linha/barra secundária dos gráficos |
| `--chart-blue` | `16 91% 62%` | Linha/barra primária dos gráficos |

### 3.3 Tokens de Sidebar

| Token | Modo Claro | Uso |
|-------|------------|-----|
| `--sidebar-background` | `36 31% 94%` | Fundo da sidebar principal |
| `--sidebar-foreground` | `220 9% 40%` | Ícones e texto da sidebar |
| `--sidebar-primary` | `16 91% 62%` | Item ativo da sidebar |
| `--sidebar-accent` | `36 31% 97%` | Hover na sidebar |
| `--sidebar-border` | `220 13% 93%` | Separador interno da sidebar |
| `--sidebar-muted` | `220 9% 65%` | Labels da sidebar com menor peso |
| `--sidebar-context-background` | `220 13% 98%` | Fundo da sidebar contextual direita |

### 3.4 Regras de Uso de Cor

```
✅ USE:
- primary → CTA principal (botões de ação, destaques numerais)
- success → confirmação, status "pago", fechamento OK
- destructive → exclusão, alertas de erro, vencido
- muted → fundo de secções internas, estado desabilitado
- accent-purple → elementos de IA (Copilot, insights)
- accent-orange → alertas moderados, highlights de orientação

❌ NÃO USE:
- primary como fundo de tela inteira
- accent em textos longos
- múltiplas cores primárias simultâneas em uma tela
- purple/violet em qualquer contexto não-IA (Purple Ban)
- cores vibrantes sem propósito semântico
```

---

## 4. Tipografia

### 4.1 Fontes em Uso

| Família | Variável CSS | Fonte | Uso |
|---------|-------------|-------|-----|
| `--font-heading` | `font-heading` | **Inter** | H1, H2, H3 |
| `--font-body` | `font-body` | **Inter** | Corpo de texto, UI, labels |
| `--font-mono` | `font-mono` | **JetBrains Mono** | Valores monetários, IDs, código |

> **Import:** Google Fonts com pesos `300, 400, 500, 600, 700` (Inter) e `400, 500, 600, 700` (JetBrains Mono)

### 4.2 Escala Tipográfica (Tailwind)

| Classe | Tamanho | Uso típico |
|--------|---------|-----------|
| `text-xs` | 12px | Labels minúsculos, seção `section-header` |
| `text-sm` | 14px | Body default, textos de tabela, tooltips |
| `text-base` | 16px | Parágrafos, valores de formulários |
| `text-lg` | 18px | Subtítulos de seção |
| `text-xl` | 20px | Títulos de card/modal |
| `text-2xl` | 24px | Títulos de página, valores de KPI médios |
| `text-3xl` | 30px | Valores de KPI principais |
| `text-4xl+` | 36px+ | Raros; apenas hero da página `/ajuda` |

### 4.3 Pesos Tipográficos

| Peso | Classe | Quando Usar |
|------|--------|-------------|
| 400 | `font-normal` | Corpo de texto, descrições |
| 500 | `font-medium` | Labels, badges, tabela |
| 600 | `font-semibold` | Subtítulos, nomes de card |
| 700 | `font-bold` | Títulos, CTAs, valores de KPI |

### 4.4 Classes de Texto Semânticas

```css
/* section-header — título de seção em uppercase */
.section-header {
  font-size: 11px;
  font-weight: 700;
  color: muted-foreground;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin-bottom: 1rem;
  padding: 0 0.25rem;
}
```

### 4.5 Regras Tipográficas

- **Nunca usar fonte serifada** no app (somente nos documentos impressos se absolutamente necessário)
- **Inter** é a fonte única do sistema — consistência total
- **JetBrains Mono** obrigatório para: valores monetários em destaque, IDs de usuário/organização, código
- Leading recomendado: `leading-tight` para títulos, `leading-relaxed` para corpo
- Tracking: padrão Tailwind; `tracking-[0.2em]` apenas em `section-header`

---

## 5. Espaçamento e Grid

### 5.1 Sistema de Espaçamento

O Mordus usa a escala padrão do Tailwind CSS (base 4px):

| Classe | Valor | Uso típico |
|--------|-------|-----------|
| `p-1` / `gap-1` | 4px | Micro-espaçamentos internos |
| `p-2` / `gap-2` | 8px | Padding de badges, ícones pequenos |
| `p-3` / `gap-3` | 12px | Padding interno de campos |
| `p-4` / `gap-4` | 16px | Padrão de separação entre elements |
| `p-6` / `gap-6` | 24px | Padding interno de cards (`CardContent`) |
| `p-8` / `gap-8` | 32px | Separação entre seções maiores |
| `p-10` / `gap-10` | 40px | Espaçamento de seções de página |
| `p-12` / `gap-12` | 48px | Separação de painéis no dashboard |

### 5.2 Grid Layout Padrão

```css
/* Dashboard principal — 2 colunas (sidebar + conteúdo) */
.app-layout {
  display: grid;
  grid-template-columns: 80px 1fr; /* sidebar fixa 80px */
  min-height: 100vh;
}

/* KPI Cards — 5 colunas */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem; /* 16px */
}

/* Painel de relatório — 2 colunas */
.report-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem; /* 24px */
}
```

### 5.3 Container

- `max-width: 1400px` para tela `2xl`
- `padding: 2rem` horizontal
- `margin: 0 auto`

---

## 6. Border Radius

O raio base é `--radius: 0.75rem` (12px). Todos derivam desse valor:

| Token | Valor calculado | Equivalente | Uso |
|-------|----------------|-------------|-----|
| `rounded-sm` | `calc(0.75rem - 10px)` | ~2px | Raros, elementos internos pequenos |
| `rounded-md` | `calc(0.75rem - 6px)` | ~6px | Tabs ativas, elementos intermediários |
| `rounded-lg` | `0.75rem` | 12px | Cards padrão do sistema |
| `rounded-xl` | `calc(0.75rem + 8px)` | ~20px | Stat cards (`.stat-card`), modais |
| `rounded-full` | `999px` | Pílula | Botões, inputs, badges, avatares |

> **Regra de ouro:** Tudo que o usuário interage diretamente (botões, inputs) usa `rounded-full`. Contêineres/cards usam `rounded-lg` ou `rounded-xl`.

---

## 7. Sombras e Elevação

O Mordus adota **profundidade mínima**. Elevação é comunicada principalmente por contraste de cor e borderização.

| Classe | Uso |
|--------|-----|
| `shadow-sm` | Cards padrão, botões, elementos base |
| `shadow-md` | Cards em hover, popovers |
| `shadow-lg` | Modais, Sheets, Drawers |
| Sem sombra | A maioria dos elementos internos |

```css
/* stat-card — card de KPI do sistema */
.stat-card {
  shadow: shadow-sm;
  hover: shadow-md + border-primary/20;
  transition: all 300ms;
}
```

> **Nunca** usar `shadow-xl` ou `drop-shadow` em elementos da interface principal.

---

## 8. Animações e Transições

### 8.1 Keyframes Definidos

```css
/* fade-in — entrada suave de elementos */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* accordion-down / accordion-up — expansão de accordion */
/* (padrão Radix UI / shadcn) */

/* soft-pulse-orange — highlight de orientação */
@keyframes soft-pulse-orange {
  0%   { background-color: transparent; }
  30%  { background-color: rgba(249, 115, 22, 0.1); }
  100% { background-color: transparent; }
}
```

### 8.2 Classes de Animação

| Classe | Duração | Uso |
|--------|---------|-----|
| `animate-fade-in` | 400ms ease-out | Entrada de cards, telas, listas |
| `animate-accordion-down` | 200ms ease-out | Expansão de Accordion |
| `animate-accordion-up` | 200ms ease-out | Colapso de Accordion |
| `animate-highlight-orange` | 3s ease-in-out infinite | Destaque de orientação (Copilot/tutorial) |

### 8.3 Transições Padrão

- **Hover em botões:** `transition-all` + `hover:brightness-110` (primário) ou `hover:bg-*/80` (outros)
- **Scale de clique:** `active:scale-95` em todos os botões (`.premium-button`, `buttonVariants`)
- **Duração padrão:** `duration-300` para elementos visuais
- **KPI Counter:** `easeOutQuad` em 800ms (JavaScript — `requestAnimationFrame`)

### 8.4 Regras de Animação

```
✅ USE:
- fade-in para entrada de novas seções/cards
- scale-95 em clique para feedback tátil
- transition-colors/all em 200-300ms para hovers

❌ NÃO USE:
- animações > 500ms em elementos interativos
- bounce/spin em elementos de UI principais
- animações que bloqueiam a leitura de conteúdo
```

---

## 9. Componentes UI

Todos os componentes usam a biblioteca **shadcn/ui** com customizações via `className`. A base é Radix UI Primitives + class-variance-authority (CVA).

### 9.1 Button

```tsx
import { Button } from "@/components/ui/button";

// Variantes disponíveis:
<Button variant="default">   Ação Principal (laranja) </Button>
<Button variant="outline">   Ação Secundária (borda primary) </Button>
<Button variant="secondary"> Ação Neutra (cinza) </Button>
<Button variant="ghost">     Ação Sutil (sem borda) </Button>
<Button variant="destructive"> Excluir / Perigo </Button>
<Button variant="link">      Link textual </Button>

// Tamanhos disponíveis:
<Button size="sm">   Pequeno (h-9, px-4) </Button>
<Button size="default"> Padrão (h-10, px-6) </Button>
<Button size="lg">   Grande (h-11, px-8) </Button>
<Button size="icon"> Ícone quadrado (h-10, w-10) </Button>
```

**Especificações:**
- `border-radius: rounded-full` (pílula) — **obrigatório em todos os botões**
- `font-weight: bold` (700)
- `active:scale-95` — feedback de clique
- Estado `disabled`: `opacity-50` + `pointer-events-none`

### 9.2 Card

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

<Card className="stat-card"> {/* Usa classe .stat-card para KPI cards */}
  <CardHeader>
    <CardTitle>Saldo em Caixa</CardTitle>
    <CardDescription>Período atual</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-3xl font-bold font-mono text-primary">R$ 12.450,00</p>
  </CardContent>
</Card>
```

**Especificações:**
- `border-radius: rounded-lg` (12px) por padrão
- `.stat-card` extension: `rounded-[1.25rem]` (20px), hover com `shadow-md + border-primary/20`
- Padding interno: `p-6` (24px) em header e content

### 9.3 Input

```tsx
import { Input } from "@/components/ui/input";

<Input placeholder="Digite aqui..." />
<Input type="email" placeholder="E-mail" />
<Input disabled />
```

**Especificações:**
- `border-radius: rounded-full` (pílula) — diferencial visual do Mordus
- Height: `h-10` (40px)
- Border: `border-input` (cor do token)
- Focus: `ring-2 ring-ring` (laranja primary)
- Disabled: `opacity-50 + cursor-not-allowed`

### 9.4 Badge

```tsx
import { Badge } from "@/components/ui/badge";

<Badge>              Padrão (laranja) </Badge>
<Badge variant="secondary">  Neutro (cinza) </Badge>
<Badge variant="destructive"> Erro/Vencido (vermelho) </Badge>
<Badge variant="outline">   Borda simples </Badge>
```

**Especificações:**
- `border-radius: rounded-full` (pílula)
- `font-size: text-xs` (12px), `font-weight: semibold`
- `padding: px-2.5 py-0.5`

**Badges semânticos de status do Mordus:**

| Status | Variante recomendada | Cor |
|--------|---------------------|-----|
| `PAGA` / `Ativo` | `secondary` com override verde | `success` |
| `PENDENTE` | `secondary` | Amarelo/amber |
| `VENCIDA` | `destructive` | Vermelho |
| `PAGA_COM_ATRASO` | `outline` | Verde com borda |
| `Fechado` | `default` | Laranja primary |
| `Aberto` | `outline` | Borda neutra |

### 9.5 Tabs

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

<Tabs defaultValue="lancamentos">
  <TabsList>
    <TabsTrigger value="lancamentos">Fluxo de Caixa</TabsTrigger>
    <TabsTrigger value="categorias">Categorias</TabsTrigger>
    <TabsTrigger value="fechamento">Fechamento</TabsTrigger>
    <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
  </TabsList>
  <TabsContent value="lancamentos">...</TabsContent>
</Tabs>
```

**Especificações:**
- `TabsList`: `bg-muted`, `rounded-md`, `h-10`
- `TabsTrigger` ativo: `bg-background` + `shadow-sm`
- Transição suave de estado ativo

### 9.6 Dialog (Modal)

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Novo Lançamento</DialogTitle>
      <DialogDescription>Preencha os dados abaixo.</DialogDescription>
    </DialogHeader>
    {/* conteúdo */}
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
      <Button>Salvar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Especificações:**
- Overlay: backdrop blur + `bg-black/50`
- Fechar com `Esc` — obrigatório
- `DialogTitle`: obrigatório para acessibilidade
- Footer: `Cancelar` (outline) sempre à esquerda, `Salvar` (primary) sempre à direita

### 9.7 Sheet (Slide Panel)

Usado para painéis laterais: Painel de Obrigações, Drawer de Membros, Copilot.

```tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

<Sheet>
  <SheetContent side="right"> {/* "left" | "right" | "top" | "bottom" */}
    <SheetHeader>
      <SheetTitle>Obrigações</SheetTitle>
    </SheetHeader>
    {/* conteúdo */}
  </SheetContent>
</Sheet>
```

### 9.8 Select

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Selecione..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="pix">PIX</SelectItem>
    <SelectItem value="dinheiro">Dinheiro</SelectItem>
  </SelectContent>
</Select>
```

### 9.9 Avatar

```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

<Avatar>
  <AvatarImage src={member.photo_url} alt={member.name} />
  <AvatarFallback>{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
</Avatar>
```

**Especificações:**
- Sempre fornecer `AvatarFallback` com iniciais do nome
- `rounded-full` implícito no componente
- Tamanho padrão: `h-10 w-10`; sidebar: `h-8 w-8`

### 9.10 Tooltip

```tsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button size="icon" variant="ghost"><IconDollar /></Button>
    </TooltipTrigger>
    <TooltipContent>Tesouraria</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

> **Obrigatório** em todos os ícones da Sidebar (pois a sidebar exibe apenas ícones sem texto).

### 9.11 Skeleton (Loading State)

```tsx
import { Skeleton } from "@/components/ui/skeleton";

<Skeleton className="h-10 w-full rounded-lg" />
<Skeleton className="h-4 w-32" />
```

**Uso:** Em todos os componentes que buscam dados assincronamente. Nunca exibir estado vazio sem resolver o loading primeiro.

### 9.12 Sonner (Toast Notifications)

```tsx
import { toast } from "sonner";

toast.success("Lançamento salvo com sucesso!");
toast.error("Erro ao salvar. Tente novamente.");
toast.warning("Mês anterior ainda não foi fechado.");
toast.info("Processando...");
```

**Posição:** `bottom-right` por padrão. Duração: 4s. Nunca usar para erros de campos (use mensagens inline).

### 9.13 Accordion

```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

<Accordion type="single" collapsible>
  <AccordionItem value="faq-1">
    <AccordionTrigger>O que é o Saldo Projetado?</AccordionTrigger>
    <AccordionContent>É a diferença entre entradas e todas as saídas, incluindo pendentes.</AccordionContent>
  </AccordionItem>
</Accordion>
```

### 9.14 Tabela

```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Data</TableHead>
      <TableHead>Descrição</TableHead>
      <TableHead className="text-right">Valor</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>01/04/2026</TableCell>
      <TableCell>Dízimo</TableCell>
      <TableCell className="text-right font-mono text-success">R$ 500,00</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

**Especificações:**
- Valores monetários: `font-mono`, `text-success` (entrada) ou `text-destructive` (saída)
- Header: `text-muted-foreground`, `font-medium`
- Linhas com hover: `hover:bg-muted/50`

---

## 10. Padrões de Layout

### 10.1 Layout Global do App

```
┌─────────────────────────────────────────────────────┐
│ AppSidebar (80px, fixed left)                       │
│  ┌───────────────────────────────────────────────┐  │
│  │  Conteúdo Principal (flex-1)                  │  │
│  │                                               │  │
│  │  [Page Header]                               │  │
│  │  [KPI Cards — grid]                          │  │
│  │  [Charts / Tables / Lists]                   │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
│  ┌────────────────────┐                             │
│  │ ContextSidebar     │  (right, contextual)        │
│  │ (alertas/resumo)   │                             │
│  └────────────────────┘                             │
└─────────────────────────────────────────────────────┘
```

### 10.2 Sidebar Principal (AppSidebar)

- **Largura:** 80px (fixa, somente ícones)
- **Cor de fundo:** `sidebar-background`
- **Ícones:** `sidebar-foreground`; ativo: `sidebar-primary`
- **Tooltips:** obrigatórios em todos os ícones
- **FAB central:** botão `+` redondo (`primary`), abre `TransactionsDialog` (atalho `Alt+N`)
- **Posição FAB:** centralizado verticalmente na sidebar

### 10.3 Header de Página

```tsx
<div className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-2xl font-bold">Tesouraria</h1>
    <p className="text-muted-foreground text-sm">Gestão financeira completa</p>
  </div>
  <div className="flex gap-2">
    {/* filtros e botões de ação */}
  </div>
</div>
```

### 10.4 Card de KPI (Stat Card)

```tsx
<Card className="stat-card">
  <CardContent className="pt-6">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm text-muted-foreground">Total Entradas</span>
      <IconTrendingUp className="text-success h-4 w-4" />
    </div>
    <p className="text-3xl font-bold font-mono">R$ 8.200,00</p>
    <p className="text-xs text-muted-foreground mt-1">+12% vs mês anterior</p>
  </CardContent>
</Card>
```

### 10.5 Formulário Multi-Step

Usado no cadastro de membros:
```
Passo 1 ─── Passo 2 ─── Passo 3
[●]────────[○]────────[○]         ← Barra de progresso
```
- Indicador visual de progresso obrigatório
- Botões: `Anterior` (outline) | `Próximo` / `Salvar` (primary)
- Nunca mais de 5 campos por passo

---

## 11. Ícones

O projeto usa **Lucide React** como biblioteca de ícones.

```tsx
import { DollarSign, Users, Settings, LogOut } from "lucide-react";

<DollarSign className="h-5 w-5" />
```

**Especificações:**
- Tamanho padrão: `h-4 w-4` (16px) em botões, `h-5 w-5` (20px) em cards, `h-6 w-6` (24px) na sidebar
- Cor: herda do contexto (`currentColor`) — nunca hardcodear cor diretamente no ícone
- Sempre acompanhar de `aria-label` ou tooltip quando usado sem texto

**Mapeamento de ícones por módulo:**

| Módulo | Ícone Lucide |
|--------|-------------|
| Tesouraria / Financeiro | `DollarSign`, `TrendingUp`, `TrendingDown` |
| Membros / Secretaria | `Users`, `User`, `UserPlus` |
| Configurações | `Settings`, `Cog` |
| Ajuda / Manual | `BookOpen` |
| Logout | `LogOut` |
| Fechar Mês | `Lock`, `CheckCircle` |
| Comprovante | `FileText`, `Paperclip` |
| Editar | `Pencil` |
| Excluir | `Trash2` |
| Copilot / IA | `Sparkles`, `Bot` |
| Calendário | `Calendar` |
| Patrimônio | `Package` |
| Documentos | `FolderOpen` |

---

## 12. Gráficos (Recharts)

### 12.1 Biblioteca

**Recharts** com o wrapper `ChartContainer` do shadcn/ui (`chart.tsx`).

### 12.2 Chart Config e Tokens

```tsx
const chartConfig = {
  income: { label: "Entradas", color: "hsl(var(--success))" },
  expense: { label: "Saídas", color: "hsl(var(--destructive))" },
  tithe: { label: "Dízimos", color: "hsl(var(--chart-blue))" },
  offering: { label: "Ofertas", color: "hsl(var(--chart-pink))" },
};
```

### 12.3 Tipos de Gráfico por Contexto

| Dado | Tipo | Componente |
|------|------|-----------|
| Entradas vs Saídas por mês | Barras agrupadas | `BarChart` |
| Dízimos vs Ofertas ao longo do tempo | Área | `AreaChart` |
| Crescimento de membros | Área + Barras combinados | `ComposedChart` |
| Distribuição por gênero/estado civil | Pizza | `PieChart` |
| Distribuição por faixa etária | Barras horizontais | `BarChart` (layout="vertical") |
| Funções/cargos | Barras verticais | `BarChart` |

### 12.4 Especificações Visuais

- **Cor de Entrada/Positivo:** `hsl(var(--success))` ← verde
- **Cor de Saída/Negativo:** `hsl(var(--destructive))` ← vermelho
- **Gradiente:** usar `defs > linearGradient` em AreaCharts
- **Tooltip:** usar `ChartTooltip` + `ChartTooltipContent` do shadcn
- **Grid:** `CartesianGrid` com `strokeDasharray="3 3"` e `stroke` em `muted`
- **Eixos:** fonte `text-xs`, cor `muted-foreground`
- **ResponsiveContainer:** sempre envolver em `ChartContainer` do shadcn

---

## 13. Estados de Interface

Toda tela/componente que busca dados assincronamente DEVE implementar os 4 estados:

### 13.1 Loading

```tsx
<div className="space-y-3">
  <Skeleton className="h-24 w-full rounded-xl" />
  <Skeleton className="h-24 w-full rounded-xl" />
  <Skeleton className="h-24 w-full rounded-xl" />
</div>
```

- Usar `Skeleton` do shadcn sempre
- Nunca mostrar spinner global — preferir skeleton do formato do conteúdo
- Manter o mesmo layout do estado carregado (evita layout shift)

### 13.2 Empty State (Estado Vazio)

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <IconInbox className="h-12 w-12 text-muted-foreground mb-4" />
  <h3 className="text-lg font-semibold mb-2">Nenhum lançamento encontrado</h3>
  <p className="text-muted-foreground text-sm max-w-sm">
    Comece adicionando seu primeiro lançamento financeiro.
  </p>
  <Button className="mt-4">
    <IconPlus className="mr-2 h-4 w-4" />
    Novo Lançamento
  </Button>
</div>
```

- Sempre incluir: ícone contextual + título + descrição + CTA (quando aplicável)
- Ícone: `text-muted-foreground`, tamanho `h-12 w-12`
- Nunca deixar tela em branco sem mensagem explicativa

### 13.3 Error State

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <IconAlertCircle className="h-12 w-12 text-destructive mb-4" />
  <h3 className="text-lg font-semibold mb-2">Erro ao carregar dados</h3>
  <p className="text-muted-foreground text-sm mb-4">
    Tente novamente ou entre em contato com o suporte.
  </p>
  <Button variant="outline" onClick={refetch}>Tentar novamente</Button>
</div>
```

- Nunca silenciar erros — sempre exibir para o usuário
- Fornecer ação de recuperação (retry) quando possível
- Ícone: `text-destructive`

### 13.4 Success State

- Usar `toast.success()` para confirmações rápidas de ações
- Para fluxos multi-passo, exibir card/tela de confirmação com ícone `CheckCircle` em `text-success`

---

## 14. Modo Escuro

O Mordus suporta modo escuro via classe `.dark` na raiz (configurado no Tailwind com `darkMode: ["class"]`).

### 14.1 Tokens no Modo Escuro

| Token | Modo Claro | Modo Escuro |
|-------|------------|-------------|
| `--background` | `0 0% 99%` (quase branco) | `0 0% 10%` (quase preto) |
| `--card` | `0 0% 100%` | `0 0% 12%` |
| `--primary` | `16 91% 62%` | `16 91% 65%` (ligeiramente mais claro) |
| `--muted` | `220 13% 95%` | `0 0% 15%` |
| `--border` | `220 13% 91%` | `0 0% 16%` |
| `--sidebar-background` | `36 31% 94%` | `0 0% 6%` |
| `--logo-text` | `#1A1A1A` | `#FFFFFF` |

### 14.2 Regras de Modo Escuro

```
✅ SEMPRE:
- Usar tokens semânticos (bg-background, text-foreground, etc.)
- Testar componentes nos dois modos antes de finalizar
- Manter a .dark em escopo da tag <html> ou <body>

❌ NUNCA:
- Hardcodar hex/rgb values em componentes
- Usar classes como `bg-white`, `text-black` diretamente nos componentes
- Ignorar contraste no modo escuro (min. WCAG AA = 4.5:1)
```

---

## 15. Acessibilidade

### 15.1 Requisitos Mínimos

| Critério | Standard |
|----------|----------|
| Contraste de texto | ≥ 4.5:1 (WCAG AA) |
| Contraste de elementos UI ativos | ≥ 3:1 |
| Tamanho mínimo de toque | 44×44px |
| Focus visível | ring-2 ring-ring com ring-offset-2 |
| Ícones standalone | Obrigatório `aria-label` ou Tooltip |
| Modais | `DialogTitle` obrigatório, fechar com Esc |
| Form labels | Sempre associar `<label>` ao `<input>` |
| Imagens informativas | `alt` descritivo |

### 15.2 Focus Ring

Todos os componentes interativos implementam via Tailwind:
```css
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-ring          /* laranja primary */
focus-visible:ring-offset-2
```

---

## 16. Impressão e PDF

O sistema tem suporte a impressão de relatórios com as seguintes regras:

### 16.1 Classe `.report-paper`

```css
.report-paper {
  background: white;
  width: 100%;
  max-width: 210mm; /* A4 */
  min-height: auto;
  padding: 20mm;
  margin: 0 auto;
  color: black;
}
```

### 16.2 Elementos Ocultos na Impressão

Via `@media print`, são automaticamente ocultados:
- `<aside>` (sidebar)
- `<nav>`, `<header>`, `<footer>`
- `[data-sidebar]`
- `.no-print`
- `[role="dialog"]`, `[data-radix-portal]`

### 16.3 Regras para Componentes Imprimíveis

- Adicionar classe `.no-print` em botões e controles de UI
- Usar `-webkit-print-color-adjust: exact` para preservar cores
- Forçar `background: white !important; color: black !important` dentro do `.report-paper` no modo escuro

---

## 17. Anti-padrões

O que **nunca** fazer no Mordus:

### 17.1 Cores

```
❌ Usar violet/purple fora do contexto de IA (Copilot)
❌ Usar múltiplas cores de destaque na mesma tela
❌ Hardcodar valores hex/rgb em componentes
❌ Usar gradientes sem propósito semântico
❌ Misturar status colors (ex: verde para alerta)
```

### 17.2 Tipografia

```
❌ Usar fonte serifada em qualquer tela do app
❌ Criar textos densos sem respiração (padding/margin)
❌ Uppercase sem ser em section-header
❌ Texto abaixo de 12px em qualquer elemento legível
```

### 17.3 Componentes

```
❌ Criar botões sem rounded-full
❌ Usar shadow-xl ou drop-shadow pesado em UI
❌ Abrir múltiplos Dialogs empilhados (antipadrão UX)
❌ Deixar Avatar sem AvatarFallback
❌ Usar Table sem scroll horizontal no mobile
```

### 17.4 Estados

```
❌ Renderizar lista sem estado de loading
❌ Tela em branco quando não há dados (sem empty state)
❌ Silenciar erro sem feedback para o usuário
❌ Formulário que permite double-submit
❌ Componente que depende de dados mockados em produção
```

### 17.5 Layout

```
❌ Sidebar com mais de 80px de largura (quebra o grid)
❌ KPI cards sem contador animado (perde o apelo visual)
❌ Modal sem DialogTitle (viola acessibilidade Radix)
❌ Input sem placeholder ou label
❌ Botões de ação sem feedback de loading (disabled state)
```

---

## Referências Técnicas

| Documento | Localização |
|-----------|-------------|
| Tokens de Design (CSS vars) | `src/index.css` |
| Configuração Tailwind | `tailwind.config.ts` |
| Configuração shadcn | `components.json` |
| Componentes UI | `src/components/ui/` |
| PRD Master | `mordus-prd-master.md` |
| shadcn/ui Docs | [https://ui.shadcn.com](https://ui.shadcn.com) |
| Tailwind CSS Docs | [https://tailwindcss.com](https://tailwindcss.com) |
| Lucide Icons | [https://lucide.dev](https://lucide.dev) |
| Recharts Docs | [https://recharts.org](https://recharts.org) |
| Radix UI Primitives | [https://radix-ui.com](https://radix-ui.com) |

---

*Style Guide gerado em Abril 2026 — Mordus v2.0*  
*Manter este documento atualizado a cada mudança significativa no design system.*
