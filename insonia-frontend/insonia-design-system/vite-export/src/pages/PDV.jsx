import { useState, useEffect } from 'react';
import { ShoppingCart, X, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api.js';
import { fmtBRL } from '../lib/data.js';

export default function PDV() {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cart, setCart] = useState([]);
  const [filter, setFilter] = useState(0);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.gql(`{ allProducts(limit: 200) {
        id name slug stock currency categoryId
        salePrice { amount } costPrice { amount }
      }}`),
      api.gql(`{ allCategories { id name slug } }`),
    ]).then(([prodData, catData]) => {
      setProdutos(prodData.allProducts.map(p => ({
        id: p.id,
        name: p.name,
        quantidade: p.stock,
        preco_venda: p.salePrice.amount,
        preco_custo: p.costPrice.amount,
        letra: p.name[0].toUpperCase(),
        categoria: p.categoryId,
      })));
      setCategorias(catData.allCategories);
    }).catch(() => {
      setToast('Erro ao carregar produtos');
    }).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 0 ? produtos : produtos.filter(p => p.categoria === filter);

  const addToCart = (p) => {
    if (p.quantidade === 0) return;
    setCart(c => {
      const existing = c.find(i => i.id === p.id);
      if (existing) return c.map(i => i.id === p.id ? { ...i, qty: Math.min(i.qty + 1, p.quantidade) } : i);
      return [...c, { ...p, qty: 1 }];
    });
  };

  const updateQty = (id, delta) =>
    setCart(c => c.map(i => i.id === id
      ? { ...i, qty: Math.max(1, Math.min(i.qty + delta, i.quantidade)) }
      : i,
    ));

  const finalizar = async () => {
    if (cart.length === 0) return;
    try {
      const itemsGql = cart.map(i => `{ productId: ${i.id}, quantity: ${i.qty} }`).join(', ');
      const data = await api.gql(`
        mutation {
          createSale(items: [${itemsGql}]) {
            id totalAmount totalProfit
          }
        }
      `);
      const sale = data.createSale;
      const cartSnapshot = cart;
      setCart([]);
      setProdutos(prev => prev.map(p => {
        const item = cartSnapshot.find(i => i.id === p.id);
        return item ? { ...p, quantidade: p.quantidade - item.qty } : p;
      }));
      setToast(`Venda #${sale.id} registrada — ${fmtBRL(sale.totalAmount)}`);
    } catch (err) {
      setToast('Erro: ' + err.message);
    }
    setTimeout(() => setToast(null), 3000);
  };

  const subtotal = cart.reduce((s, i) => s + i.preco_venda * i.qty, 0);
  const lucro = cart.reduce((s, i) => s + (i.preco_venda - i.preco_custo) * i.qty, 0);

  if (loading) return (
    <div className="content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ color: 'var(--ins-fg-muted)' }}>Carregando produtos…</div>
    </div>
  );

  return (
    <div className="content" style={{
      paddingBottom: 0, height: 'calc(100vh - 64px)', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      <div className="pdv-grid" style={{ flex: 1, minHeight: 0 }}>
        <div className="pdv-products">
          <div className="pdv-filter">
            <button className={`chip ${filter === 0 ? 'active' : ''}`} onClick={() => setFilter(0)}>Todos</button>
            {categorias.map(c => (
              <button
                key={c.id}
                className={`chip ${filter === c.id ? 'active' : ''}`}
                onClick={() => setFilter(c.id)}
              >{c.name}</button>
            ))}
          </div>
          <div className="pdv-grid-products">
            {filtered.map(p => (
              <div
                key={p.id}
                className="pdv-product"
                onClick={() => addToCart(p)}
                style={p.quantidade === 0 ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
              >
                <div className="img">{p.letra}</div>
                <div className="name">{p.name}</div>
                <div className="price">{fmtBRL(p.preco_venda)}</div>
                <div className="stock">
                  {p.quantidade === 0 ? 'sem estoque'
                    : p.quantidade < 10 ? `${p.quantidade} · estoque baixo`
                    : `${p.quantidade} em estoque`}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: '1/-1', color: 'var(--ins-fg-muted)', padding: 24, fontSize: 14 }}>
                Nenhum produto encontrado.
              </div>
            )}
          </div>
        </div>

        <div className="cart">
          <div className="cart-header">
            <h3>Venda atual</h3>
            {cart.length > 0 && (
              <button className="btn ghost sm" onClick={() => setCart([])}>
                <X size={14} />Limpar
              </button>
            )}
          </div>
          <div className="cart-items">
            {cart.length === 0 && (
              <div className="empty-cart">
                <ShoppingCart size={32} />
                <div>Adicione produtos para iniciar a venda.</div>
              </div>
            )}
            {cart.map(i => (
              <div key={i.id} className="cart-item">
                <div>
                  <div className="name">{i.name}</div>
                  <div className="sub">{fmtBRL(i.preco_venda)}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <div className="qty-stepper">
                    <button onClick={() => updateQty(i.id, -1)}>−</button>
                    <div className="v">{i.qty}</div>
                    <button onClick={() => updateQty(i.id, +1)}>+</button>
                  </div>
                  <div className="line-total">{fmtBRL(i.preco_venda * i.qty)}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <div className="row">
              <span>Itens</span>
              <span className="price">{cart.reduce((s, i) => s + i.qty, 0)}</span>
            </div>
            <div className="row">
              <span>Lucro estimado</span>
              <span className="price" style={{ color: 'var(--ins-success-700)' }}>{fmtBRL(lucro)}</span>
            </div>
            <div className="total">
              <span>Total</span>
              <span className="price">{fmtBRL(subtotal)}</span>
            </div>
            <button
              className="btn primary lg"
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              onClick={finalizar}
              disabled={cart.length === 0}
            >
              <CheckCircle2 size={18} />Finalizar venda
            </button>
          </div>
        </div>
      </div>
      {toast && (
        <div className="toast">
          <CheckCircle2 size={16} />{toast}
        </div>
      )}
    </div>
  );
}
