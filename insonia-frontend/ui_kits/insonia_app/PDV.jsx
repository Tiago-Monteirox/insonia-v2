// PDV — Registrar venda
function PDV() {
  const [produtos, setProdutos] = React.useState([]);
  const [categorias, setCategorias] = React.useState([]);
  const [cart, setCart] = React.useState([]);
  const [filter, setFilter] = React.useState(0);
  const [toast, setToast] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => { if (window.lucide) lucide.createIcons(); });

  React.useEffect(() => {
    async function load() {
      try {
        const [prodData, catData] = await Promise.all([
          insApi.gql(`{ allProducts(limit: 200) {
            id name slug stock currency categoryId
            salePrice { amount } costPrice { amount }
          }}`),
          insApi.gql(`{ allCategories { id name slug } }`),
        ]);
        setProdutos(prodData.allProducts.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          quantidade: p.stock,
          preco_venda: p.salePrice.amount,
          preco_custo: p.costPrice.amount,
          currency: p.currency,
          letra: p.name[0].toUpperCase(),
          categoria: p.categoryId,
        })));
        setCategorias(catData.allCategories);
      } catch (err) {
        setToast('Erro ao carregar produtos: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return (
    <div className="content" style={{display:'flex', alignItems:'center', justifyContent:'center', height:'60vh'}}>
      <div style={{color:'var(--ins-fg-muted)'}}>Carregando produtos…</div>
    </div>
  );

  const filtered = filter === 0 ? produtos : produtos.filter(p => p.categoria === filter);

  const addToCart = (p) => {
    if (p.quantidade === 0) return;
    setCart(c => {
      const existing = c.find(i => i.id === p.id);
      if (existing) return c.map(i => i.id === p.id ? {...i, qty: Math.min(i.qty+1, p.quantidade)} : i);
      return [...c, {...p, qty: 1}];
    });
  };
  const updateQty = (id, delta) => setCart(c => c.map(i => i.id === id ? {...i, qty: Math.max(1, Math.min(i.qty+delta, i.quantidade))} : i));
  const removeItem = (id) => setCart(c => c.filter(i => i.id !== id));

  const finalizar = async () => {
    if (cart.length === 0) return;
    try {
      const itemsGql = cart.map(i => `{ productId: ${i.id}, quantity: ${i.qty} }`).join(', ');
      const data = await insApi.gql(`
        mutation {
          createSale(items: [${itemsGql}]) {
            id totalAmount totalProfit
          }
        }
      `);
      const sale = data.createSale;
      setToast(`Venda #${sale.id} registrada — ${fmtBRL(sale.totalAmount)}`);
      const cartSnapshot = cart;
      setCart([]);
      setProdutos(prev => prev.map(p => {
        const item = cartSnapshot.find(i => i.id === p.id);
        return item ? { ...p, quantidade: p.quantidade - item.qty } : p;
      }));
    } catch (err) {
      setToast('Erro: ' + err.message);
    }
    setTimeout(() => setToast(null), 3000);
  };

  const subtotal = cart.reduce((s, i) => s + i.preco_venda * i.qty, 0);
  const lucro = cart.reduce((s, i) => s + (i.preco_venda - i.preco_custo) * i.qty, 0);

  return (
    <div className="content" style={{paddingBottom:0, height:'calc(100vh - 64px)', overflow:'hidden', display:'flex', flexDirection:'column'}}>
      <div className="pdv-grid" style={{flex:1, minHeight:0}}>
        <div className="pdv-products">
          <div className="pdv-filter">
            <button className={`chip ${filter===0?'active':''}`} onClick={()=>setFilter(0)}>Todos</button>
            {categorias.map(c => (
              <button key={c.id} className={`chip ${filter===c.id?'active':''}`} onClick={()=>setFilter(c.id)}>{c.name}</button>
            ))}
          </div>
          <div className="pdv-grid-products">
            {filtered.map(p => (
              <div key={p.id} className="pdv-product" onClick={() => addToCart(p)} style={p.quantidade===0?{opacity:0.4, cursor:'not-allowed'}:{}}>
                <div className="img">{p.letra}</div>
                <div className="name">{p.name}</div>
                <div className="price">{fmtBRL(p.preco_venda)}</div>
                <div className="stock">{p.quantidade === 0 ? 'sem estoque' : p.quantidade < 10 ? `${p.quantidade} · estoque baixo` : `${p.quantidade} em estoque`}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="cart">
          <div className="cart-header">
            <h3>Venda atual</h3>
            {cart.length > 0 && <button className="btn ghost sm" onClick={()=>setCart([])}><i data-lucide="x"></i>Limpar</button>}
          </div>
          <div className="cart-items">
            {cart.length === 0 && (
              <div className="empty-cart">
                <i data-lucide="shopping-cart"></i>
                <div>Adicione produtos para iniciar a venda.</div>
              </div>
            )}
            {cart.map(i => (
              <div key={i.id} className="cart-item">
                <div>
                  <div className="name">{i.name}</div>
                  <div className="sub">{fmtBRL(i.preco_venda)}</div>
                </div>
                <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6}}>
                  <div className="qty-stepper">
                    <button onClick={()=>updateQty(i.id,-1)}>−</button>
                    <div className="v">{i.qty}</div>
                    <button onClick={()=>updateQty(i.id,+1)}>+</button>
                  </div>
                  <div className="line-total">{fmtBRL(i.preco_venda * i.qty)}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <div className="row"><span>Itens</span><span className="price">{cart.reduce((s,i)=>s+i.qty,0)}</span></div>
            <div className="row"><span>Lucro estimado</span><span className="price" style={{color:'var(--ins-success-700)'}}>{fmtBRL(lucro)}</span></div>
            <div className="total"><span>Total</span><span className="price">{fmtBRL(subtotal)}</span></div>
            <button className="btn primary lg" style={{width:'100%', justifyContent:'center', marginTop:8}} onClick={finalizar} disabled={cart.length===0}>
              <i data-lucide="check-circle-2"></i>Finalizar venda
            </button>
          </div>
        </div>
      </div>
      {toast && <div className="toast"><i data-lucide="check-circle-2"></i>{toast}</div>}
    </div>
  );
}

window.PDV = PDV;
