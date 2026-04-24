# Insonia App — UI Kit

Desktop app for store owners/managers (touch-friendly). Single surface combining admin + PDV. Built against the backend models in `insonia/lojapp/` and `insonia/pdv/`.

## Screens

| Screen | File | Backend source |
|---|---|---|
| Login | `Screens.jsx` → `Login` | DRF `/api/auth/` |
| Dashboard | `Dashboard.jsx` | Aggregated from `Venda`, `ItemVenda` |
| Registrar venda (PDV) | `PDV.jsx` | `POST /api/vendas/` + `POST /api/itens-venda/` |
| Produtos | `Produtos.jsx` | `lojapp.Produto` |
| Categorias | `Screens.jsx` → `Categorias` | `lojapp.Categoria` |
| Marcas | `Screens.jsx` → `Marcas` | `lojapp.Marca` |
| Variações | `Screens.jsx` → `Variacoes` | `lojapp.NomeVariacao` / `ValorVariacao` |
| Histórico | `Historico.jsx` → `Historico` | `pdv.Venda` |
| Estatísticas | `Historico.jsx` → `Estatisticas` | `Venda.calcular_*_por_periodo` |

## Components

- `Sidebar.jsx` — dark sidebar, grouped nav, brand mark, user footer
- `Topbar` (in Sidebar.jsx) — title + global search + actions
- `Dashboard.jsx` — stat tiles, bar chart, top products, latest vendas
- `PDV.jsx` — products grid (categoria filter) + persistent cart on the right, qty steppers, finalize toast
- `Produtos.jsx` — table with thumb, SKU, stock badges
- `Screens.jsx` — Login, Categorias, Marcas, Variações
- `app.css` — all component styles built on `colors_and_type.css` vars

## Opens
- Click through the sidebar to navigate
- Click products in PDV to add to cart, adjust qty, finalize
- Click "Sair" in topbar to see the Login screen
