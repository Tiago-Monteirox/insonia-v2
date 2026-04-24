// Ecommerce data
const storeProducts = [
  { id: 1, name: 'Tênis Runner 3.0', brand: 'Nike', slug: 'tenis-runner-3', cat: 'calcados', letra: 'R', price: 449.90, from: 599.90, tag: 'Lançamento', stock: 24, rating: 4.8, reviews: 132 },
  { id: 2, name: 'Tênis Air Classic Preto', brand: 'Nike', slug: 'tenis-air-classic', cat: 'calcados', letra: 'A', price: 529.00, from: null, tag: 'Lançamento', stock: 8, rating: 4.9, reviews: 88 },
  { id: 3, name: 'Camiseta dry-fit unissex', brand: 'Adidas', slug: 'camiseta-dry-fit', cat: 'vestuario', letra: 'C', price: 89.00, from: null, tag: 'Lançamento', stock: 42, rating: 4.6, reviews: 210 },
  { id: 4, name: 'Mochila Urban 25L', brand: 'Adidas', slug: 'mochila-25l', cat: 'equipamentos', letra: 'M', price: 249.00, from: null, tag: 'Lançamento', stock: 11, rating: 4.7, reviews: 54 },
  { id: 5, name: 'Shorts Corrida Pro', brand: 'Mizuno', slug: 'shorts-corrida', cat: 'vestuario', letra: 'S', price: 99.00, from: 139.00, tag: 'Promoção', stock: 15, rating: 4.5, reviews: 73 },
  { id: 6, name: 'Meia esportiva (kit 3)', brand: 'Olympikus', slug: 'meia-esportiva', cat: 'acessorios', letra: 'M', price: 14.90, from: 19.90, tag: 'Promoção', stock: 120, rating: 4.4, reviews: 412 },
  { id: 7, name: 'Boné esportivo', brand: 'Nike', slug: 'bone-esportivo', cat: 'acessorios', letra: 'B', price: 49.90, from: 69.90, tag: 'Promoção', stock: 33, rating: 4.3, reviews: 98 },
  { id: 8, name: 'Garrafa térmica 750ml', brand: 'Asics', slug: 'garrafa-termica', cat: 'equipamentos', letra: 'G', price: 59.00, from: 79.00, tag: 'Promoção', stock: 7, rating: 4.7, reviews: 146 },
];

function fmt(n) { return 'R$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function installments(n, parcelas = 10) { return `${parcelas}x ${fmt(n / parcelas)} sem juros`; }

// Shared cart (localStorage)
function loadCart() {
  try { return JSON.parse(localStorage.getItem('insonia_cart') || '[]'); } catch (e) { return []; }
}
function saveCart(items) {
  try { localStorage.setItem('insonia_cart', JSON.stringify(items)); } catch (e) {}
  window.dispatchEvent(new CustomEvent('cart-updated'));
}
function addToCart(p, opts = {}) {
  const items = loadCart();
  const key = `${p.id}-${opts.tamanho||''}-${opts.cor||''}`;
  const existing = items.find(i => i.key === key);
  if (existing) existing.qty += (opts.qty || 1);
  else items.push({ key, id: p.id, name: p.name, brand: p.brand, letra: p.letra, price: p.price, tamanho: opts.tamanho, cor: opts.cor, qty: opts.qty || 1 });
  saveCart(items);
}

Object.assign(window, { storeProducts, fmt, installments, loadCart, saveCart, addToCart });
