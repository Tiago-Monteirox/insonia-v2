# Insonia Store — Ecommerce UI Kit

Storefront React+CSS kit for the upcoming Insonia ecommerce (Django-served). Follows the wireframe: `header → banner rotativo → lançamentos → promocionais → footer`.

## Screens

- **Home** (`Home.jsx`) — header + nav, rotating banner (3 slides, autoplay), Lançamentos grid, Promoções grid, trust strip
- **Product Detail** (`ProductDetail.jsx`) — gallery, variation pickers (tamanho + cor), qty, CEP/frete, tabs (descrição / especificações / avaliações), relacionados
- **Cart** (`Cart.jsx`) — line items with qty steppers, cupom (`INSONIA10` = 10%), frete (grátis ≥ R$199), summary sticky

## Components

- `Chrome.jsx` — `StoreHeader`, `StoreFooter`, `TrustStrip`
- `ProductCard.jsx` — reusable card with tag, fav, price, installments
- `data.js` — `storeProducts`, `fmt`, `installments`, localStorage cart (`addToCart`, `loadCart`, `saveCart`)
- `store.css` — all styles, built on root `colors_and_type.css`

## Django integration notes

- Replace `../../assets/insonia-logo.png` with `{% static 'img/insonia-logo.png' %}`
- Replace product data with context/API from `lojapp.Produto`
- The cart persists in `localStorage` for this prototype; wire to `POST /api/itens-venda/` when bridging to the backend
- `store.css` imports `../../colors_and_type.css` — for Django, collect both into `static/css/`

## Interactions to try

- Banner auto-rotates every 6s; arrows + dots
- Click a product card → PDP
- Change size/color, add to cart → cart
- Adjust qty / remove / apply `INSONIA10`
