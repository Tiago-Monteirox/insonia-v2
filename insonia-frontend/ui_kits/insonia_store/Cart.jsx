// Cart page
function Cart({ onNav }) {
  const [items, setItems] = React.useState(loadCart());
  const [coupon, setCoupon] = React.useState('');
  React.useEffect(() => { if (window.lucide) lucide.createIcons(); });

  const update = (key, delta) => {
    const next = items.map(i => i.key === key ? { ...i, qty: Math.max(1, i.qty + delta) } : i);
    setItems(next); saveCart(next);
  };
  const remove = (key) => {
    const next = items.filter(i => i.key !== key);
    setItems(next); saveCart(next);
  };

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = coupon.toUpperCase() === 'INSONIA10' ? subtotal * 0.1 : 0;
  const shipping = subtotal >= 199 ? 0 : 24.90;
  const total = subtotal - discount + shipping;

  if (items.length === 0) {
    return (
      <div className="container cart-page">
        <div className="empty-cart-big">
          <i data-lucide="shopping-bag"></i>
          <h2>Seu carrinho está vazio</h2>
          <p>Explore nossos lançamentos e encontre seu próximo favorito.</p>
          <button className="checkout-btn" style={{maxWidth:280, margin:'0 auto'}} onClick={()=>onNav('home')}>
            Continuar comprando
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container cart-page">
      <h1>Meu carrinho <span style={{color:'var(--ins-fg-muted)', fontWeight:400, fontSize:18}}>· {items.reduce((s,i)=>s+i.qty,0)} itens</span></h1>

      <div className="cart-layout">
        <div className="cart-list">
          <div className="head">
            <div>Produto</div>
            <div style={{textAlign:'center'}}>Quantidade</div>
            <div style={{textAlign:'right'}}>Preço</div>
            <div></div>
          </div>
          {items.map(i => (
            <div className="cart-row" key={i.key}>
              <div className="prod">
                <div className="thumb">{i.letra}</div>
                <div className="meta">
                  <div className="brand">{i.brand}</div>
                  <div className="name">{i.name}</div>
                  <div className="var">
                    {i.tamanho && `Tamanho: ${i.tamanho}`}{i.tamanho && i.cor && ' · '}{i.cor && `Cor: ${i.cor}`}
                  </div>
                </div>
              </div>
              <div style={{display:'flex', justifyContent:'center'}}>
                <div className="qty-stepper-sm">
                  <button onClick={()=>update(i.key, -1)}>−</button>
                  <div className="v">{i.qty}</div>
                  <button onClick={()=>update(i.key, +1)}>+</button>
                </div>
              </div>
              <div className="unit-price">{fmt(i.price * i.qty)}</div>
              <button className="remove" onClick={()=>remove(i.key)} title="Remover"><i data-lucide="trash-2"></i></button>
            </div>
          ))}
        </div>

        <div className="cart-summary-card">
          <h2>Resumo do pedido</h2>

          <div className="coupon">
            <input placeholder="cupom de desconto" value={coupon} onChange={e=>setCoupon(e.target.value)}/>
            <button>Aplicar</button>
          </div>

          <div className="sum-row"><span>Subtotal</span><span className="v">{fmt(subtotal)}</span></div>
          {discount > 0 && <div className="sum-row discount"><span>Cupom ({coupon.toUpperCase()})</span><span className="v">−{fmt(discount)}</span></div>}
          <div className="sum-row muted">
            <span>Frete</span>
            <span className="v" style={shipping===0?{color:'var(--ins-success-700)'}:{}}>{shipping === 0 ? 'Grátis' : fmt(shipping)}</span>
          </div>

          <div className="total-row"><span>Total</span><span className="v">{fmt(total)}</span></div>
          <div className="install-line">ou {installments(total)}</div>

          <button className="checkout-btn"><i data-lucide="lock"></i>Finalizar compra</button>
          <button className="keep-shop" onClick={()=>onNav('home')}>← continuar comprando</button>
        </div>
      </div>
    </div>
  );
}

window.Cart = Cart;
