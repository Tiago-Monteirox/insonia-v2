# Insonia Design System

> Frontend design system for **Insonia** — a Django-based store management + PDV (point-of-sale) system built by Tiago Monteiro. The backend exists (REST + GraphQL); this system defines the look, feel, and component vocabulary for the frontend that will consume those APIs.

**Language:** Portuguese (BR) throughout — matches the backend domain (`Produto`, `Venda`, `Categoria`, etc).

---

## Sources

| What | Where |
|------|-------|
| Backend codebase | `insonia/` (mounted local folder) |
| GitHub repo | `Tiago-Monteirox/insonia` |
| Logo (original upload) | `assets/logo-original.jpg` |
| Existing admin theme (reference only) | `insonia/staticfiles/style.css` — uses Pcoded/Bootstrap with teal `#01a9ac` primary |

The backend is monolithic Django 4.2 with two apps: `lojapp` (catalog: Categoria, Marca, Produto, Variações, ProdutoImagem) and `pdv` (Venda, ItemVenda — decrements stock on save). It has no frontend — this is it.

---

## Product context

Insonia is a **store + POS management system** for small retailers. The primary user is the **store owner/manager**, operating on desktop with touchscreen-friendly ergonomics (the PDV/checkout flow runs on a cash register). It handles:

- Catálogo: Produtos with categorias, marcas, imagens, and variações (Tamanho, Cor, etc)
- PDV: create a Venda → add ItemVendas → stock decrements → totals recalculated
- Estatísticas: revenue + lucro by date range

---

## CONTENT FUNDAMENTALS

**Language:** Portuguese (Brasil). Domain nouns follow the backend exactly: *Produto*, *Venda*, *Item de Venda*, *Categoria*, *Marca*, *Variação*, *Preço de venda*, *Preço promocional*, *Preço de custo*, *Lucro*, *Estoque*, *Quantidade*.

**Tone:** neutral, professional, direct. We are a tool for business operators — not a lifestyle brand. No jokes in-product (the README's "sua ansiedade às 2 da manhã" joke stays in the README; the product itself is calm). No exclamation marks in UI copy. No emoji in-product.

**Voice:**
- Second person: **você** (formal/standard BR). Never *tu*.
- Imperative for actions: "Adicionar produto", "Registrar venda", "Excluir item".
- Present tense for states: "Venda registrada", "Estoque atualizado".

**Casing:**
- Buttons, menu items: **Sentence case** ("Adicionar produto", not "Adicionar Produto")
- Section titles: **Sentence case**
- Table headers: **Sentence case** ("Preço de venda", "Data da venda")
- Status badges: **lowercase** ("pago", "pendente", "estoque baixo") — reads as a label, not a shout

**Numbers & currency:**
- Currency: **R$ 1.234,56** (BRL, pt-BR formatting — thousands dot, decimal comma)
- Monospace tabular numerals for all prices and totals so columns align
- Percentages: "23%" — no space
- Dates: "12/04/2026" or "12 abr 2026" depending on density

**Empty & error copy (examples):**
- Empty catalog: *"Nenhum produto cadastrado ainda. Comece adicionando seu primeiro produto."*
- Empty venda: *"Adicione produtos para iniciar a venda."*
- Stock error: *"Estoque insuficiente. Disponível: 3 unidades."*
- Validation: *"O preço promocional deve ser menor que o preço de venda."* (lifted verbatim from backend `Produto.clean()`)

**Never use:**
- Exclamation marks (except "!" in modal destructive confirmations, at most)
- Emoji in-product
- Marketing fluff ("incrível!", "surpreendente!") — we're a tool
- "AI" language (the product has none)

---

## VISUAL FOUNDATIONS

**Overall feel:** fresh modern SaaS. Clean white/slate surfaces, one teal accent, quiet shadows, confident typography. The design does the work; there are no decorative flourishes fighting for attention.

### Color
- **Neutrals:** Tailwind-style slate scale (`neutral-50` → `neutral-950`). Surfaces are white or `neutral-50`; lines are `neutral-200`; body text is `neutral-900`; muted text is `neutral-600`.
- **Single accent:** muted teal `--ins-accent-500: #0ab3ae` — evolved from the backend admin's `#01a9ac` but a half-step cooler and more saturated. Used only for primary actions, active states, focus rings, and brand surfaces. Never for decoration.
- **Semantic:** green (success/pago), amber (warning/estoque baixo), red (danger/excluir), blue (info). Paired with 50-tint backgrounds for soft badges.
- **No gradients.** No bluish-purple. No duotone imagery.

### Typography
- **Inter** for everything — display through body. One family, multiple weights (400/500/600/700).
- **JetBrains Mono** for prices, SKUs, totals, numeric table columns. Tabular numerals always.
- Tight tracking on large headings (`-0.02em`); normal elsewhere.

### Spacing & layout
- 4px base grid. Components snap to 4/8/12/16/24/32/48.
- Comfortable density by default (44px hit targets). A denser mode exists for admin tables (36px rows) — still above desktop-usable minimums.
- Max content width: 1440px centered. Sidebars fixed at 240px.

### Backgrounds
- **Plain neutral surfaces only.** `bg = neutral-50`, cards on `white`. No textures, no gradients, no illustrations as background. The logo's hand-drawn eye mark appears in the sidebar + auth screens as the *only* brand ornament.

### Shadows & elevation
- Low, realistic shadows. `shadow-sm` for cards, `shadow-md` for popovers/menus, `shadow-lg` for modals. No glows, no neon.
- Focus ring: 3px soft teal halo (`rgba(10, 179, 174, 0.25)`).

### Borders & radii
- 1px borders in `neutral-200`. Cards and inputs use `--ins-radius-md` (8px). Buttons `--ins-radius-md`. Pills/badges `--ins-radius-full`. Modals `--ins-radius-lg`.

### States
- **Hover:** surfaces → `neutral-100`; buttons → accent goes one step darker (500 → 600); links → underline.
- **Active/pressed:** subtle 1px inset / slightly darker.
- **Focus:** 3px teal halo (keyboard-only via `:focus-visible`).
- **Disabled:** 50% opacity, `cursor: not-allowed`.
- **Loading:** skeleton blocks in `neutral-200` with a slow shimmer; no spinners unless genuinely indeterminate.

### Animation
- Only where it aids comprehension. Duration 120–320ms, easing `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- Fades & 4px translates. No bounces, no spring overshoot, no rotating icons.
- Modals: 200ms fade + 8px translate-up. Toasts: 200ms slide-in from top-right. Tabs: 150ms underline slide.

### Transparency & blur
- Transparency used only for overlays (modal scrim = `rgba(15,23,42,0.5)`) and hover highlights (`rgba(10,179,174,0.08)`).
- Backdrop blur on the modal scrim (`backdrop-filter: blur(4px)`) — subtle, not showy.

### Imagery
- Product photos on white backgrounds, natural color balance. Square aspect ratio in grids, rounded to `--ins-radius-md`.
- Fallback: `neutral-100` square with the Insonia eye mark centered at 30% opacity.

### Cards
- White surface, 1px `neutral-200` border, `--ins-radius-md`, `--ins-shadow-xs`. On hover (if interactive): `--ins-shadow-sm` + border darkens to `neutral-300`.
- No colored left-border accents. No rounded-with-left-stripe cards.

---

## ICONOGRAPHY

**Primary icon set:** [**Lucide**](https://lucide.dev), loaded via CDN (`https://unpkg.com/lucide@latest`). Outline style, 1.5px stroke, 20px default size in UI (24px for primary actions, 16px in dense tables).

**Usage:**
- Icons accompany actions and categories. They never replace a label (unless in a toolbar with a tooltip).
- Color: `currentColor` — inherit from the enclosing text color. Muted icons use `neutral-400`.
- Never mix icon sets. Never use emoji as icons. Never use Unicode symbols as icons (except `—` for "none/empty" in tables).

**Common mappings for Insonia:**
| Concept | Lucide icon |
|---------|-------------|
| Produtos | `package` |
| Categorias | `tag` |
| Marcas | `bookmark` |
| Variações | `layers` |
| Vendas / PDV | `shopping-cart` |
| Histórico | `receipt` |
| Estatísticas | `bar-chart-3` |
| Usuário | `user` |
| Configurações | `settings` |
| Buscar | `search` |
| Adicionar | `plus` |
| Remover | `trash-2` |
| Editar | `pencil` |
| Estoque | `boxes` |
| Dinheiro / preço | `banknote` |

**Brand mark:** the hand-drawn eye wordmark `INSONIA` (see `assets/logo-original.jpg`). It is the *only* non-Lucide visual in the system, used in the sidebar header, auth screens, and empty-state fallbacks at low opacity. We do not synthesize new variants — if a different treatment is needed, flag it for the designer.

> **Note on logo:** the uploaded `logo-original.jpg` has a purple backdrop from the source image. A transparent/SVG version would be preferred — **ask Tiago for a clean SVG export** so we can recolor it for dark/light contexts.

---

## File index

| File / folder | Purpose |
|---|---|
| `README.md` | This file — context + fundamentals + visual foundations |
| `SKILL.md` | Agent skill metadata (portable to Claude Code) |
| `colors_and_type.css` | CSS variables for colors, type, spacing, radii, shadows, motion |
| `assets/` | Logo + any brand imagery |
| `preview/` | Small HTML cards powering the Design System tab |
| `ui_kits/insonia_app/` | UI kit: Admin + PDV — desktop, touch-friendly |

---

### TODO

- **Tela de listagem/categoria** com filtros (marca, preço, tamanho)
- **Checkout** (Pix, cartão, boleto)
- **Minha conta / meus pedidos**
