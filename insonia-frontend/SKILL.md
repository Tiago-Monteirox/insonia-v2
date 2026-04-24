---
name: insonia-design
description: Use this skill to generate well-branded interfaces and assets for Insonia (store management + PDV system, Brazilian Portuguese), either for production or throwaway prototypes/mocks.
user-invocable: true
---

Read `README.md` within this skill first for context, content fundamentals, visual foundations, and iconography rules. Then explore:

- `colors_and_type.css` — all CSS variables (colors, type, spacing, radii, shadows, motion, hit targets)
- `ui_kits/insonia_app/` — the reference UI kit: Sidebar, Topbar, Dashboard, PDV (touch-friendly checkout), Produtos, Categorias, Marcas, Variações, Histórico, Estatísticas, Login
- `preview/` — small cards demonstrating each design token
- `assets/logo-original.jpg` — brand mark (eye-wordmark; request SVG from owner if possible)

**Key constraints:**
- Portuguese (BR) copy; domain nouns match backend: Produto, Venda, Categoria, Marca, Variação, Preço de venda, Lucro, Estoque
- Single accent: muted teal `#0ab3ae`. No gradients, no decorative flourishes
- Inter for UI, JetBrains Mono for prices/SKUs/tabular numerics
- Lucide icons only, outline 1.5px
- 44px hit targets by default (touch-friendly)
- BRL formatting: `R$ 1.234,56`

If creating visual artifacts (slides, mocks, throwaway prototypes), copy the UI-kit assets + `colors_and_type.css` out, and author static HTML files that import them. For production work, copy assets and follow README rules to act as an expert Insonia designer.

If invoked without guidance, ask the user what to build/design (which screen? which flow?), then act as an expert designer outputting HTML artifacts or production code.
