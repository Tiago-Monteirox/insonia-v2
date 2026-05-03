import { useState } from 'react';
import { ShoppingCart, X, CheckCircle2 } from 'lucide-react';
import { produtos, categorias, fmtBRL } from '../lib/data.js';

export default function PDV() {
  const [cart, setCart] = useState([]);
  const [filter, setFilter] = useState(0);
  const [toast, setToast] = useState(null);

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

  const finalizar = () => {
    if (cart.length === 0) return;
    setToast(`Venda #${235 + Math.floor(Math.random() * 5)} registrada`);
    setCart([]);
    setTimeout(() => setToast(null), 2500);
  };

  const subtotal = cart.reduce((s, i) => s + i.preco_venda * i.qty, 0);
  const lucro = cart.reduce((s, i) => s + (i.preco_venda - i.preco_custo) * i.qty, 0);

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
                  <div className="sub">{fmtBRL(i.preco_venda)} · {i.sku}</div>
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
