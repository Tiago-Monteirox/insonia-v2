// Product Detail Page
function ProductDetail({ product, onNav }) {
  const p = product || storeProducts[0];
  const [tamanho, setTamanho] = React.useState('M');
  const [cor, setCor] = React.useState('Preto');
  const [qty, setQty] = React.useState(1);
  const [tab, setTab] = React.useState('desc');
  const [thumb, setThumb] = React.useState(0);
  React.useEffect(() => { if (window.lucide) lucide.createIcons(); });

  const tamanhos = p.cat === 'calcados' ? ['37','38','39','40','41','42','43'] : ['PP','P','M','G','GG'];
  const oosSize = p.cat === 'calcados' ? '37' : 'PP';
  const cores = ['Preto','Branco','Azul','Cinza'];
  const promo = p.from && p.from > p.price;
  const relacionados = storeProducts.filter(x => x.id !== p.id && x.cat === p.cat).slice(0, 4);

  const handleAdd = () => {
    addToCart(p, { tamanho, cor, qty });
    onNav('cart');
  };

  return (
    <div className="container">
      <div className="breadcrumb">
        <a href="#" onClick={(e)=>{e.preventDefault(); onNav('home');}}>Início</a>
        <span className="sep">/</span>
        <a href="#">{p.cat === 'calcados' ? 'Calçados' : p.cat === 'vestuario' ? 'Vestuário' : p.cat === 'acessorios' ? 'Acessórios' : 'Equipamentos'}</a>
        <span className="sep">/</span>
        <span>{p.name}</span>
      </div>

      <div className="pdp">
        <div className="pdp-gallery">
          <div className="pdp-thumbs">
            {[0,1,2,3].map(i => (
              <div key={i} className={`pdp-thumb ${i===thumb?'active':''}`} onClick={()=>setThumb(i)}>{p.letra}</div>
            ))}
          </div>
          <div className="pdp-main">{p.letra}</div>
        </div>

        <div className="pdp-info">
          <div className="pbrand">{p.brand}</div>
          <h1>{p.name}</h1>
          <div className="rating">
            <span className="stars">★★★★★</span>
            <span>{p.rating.toFixed(1)} · {p.reviews} avaliações</span>
          </div>

          <div className="pdp-price">
            {promo && <div className="from">De {fmt(p.from)}</div>}
            <div className="now">{fmt(p.price)}</div>
            <div className="install">em até {installments(p.price)}</div>
            <div className="pix"><i data-lucide="zap" style={{width:14,height:14}}></i>{fmt(p.price * 0.95)} no Pix (−5%)</div>
          </div>

          <div className="pdp-variation">
            <div className="label"><span>Tamanho</span><span className="picked">{tamanho}</span></div>
            <div className="opts">
              {tamanhos.map(t => (
                <button key={t} className={`opt ${t===tamanho?'active':''} ${t===oosSize?'oos':''}`} onClick={()=> t!==oosSize && setTamanho(t)}>{t}</button>
              ))}
            </div>
          </div>

          <div className="pdp-variation">
            <div className="label"><span>Cor</span><span className="picked">{cor}</span></div>
            <div className="opts">
              {cores.map(c => (
                <button key={c} className={`opt ${c===cor?'active':''}`} onClick={()=>setCor(c)}>{c}</button>
              ))}
            </div>
          </div>

          <div className="pdp-cta">
            <div className="qty-stepper">
              <button onClick={()=>setQty(q=>Math.max(1,q-1))}>−</button>
              <div className="v">{qty}</div>
              <button onClick={()=>setQty(q=>q+1)}>+</button>
            </div>
            <button className="add-btn" onClick={handleAdd}><i data-lucide="shopping-bag"></i>Adicionar ao carrinho</button>
          </div>

          <div className="pdp-ship">
            <div className="row">
              <input placeholder="00000-000" defaultValue="01310-100"/>
              <button>Calcular</button>
            </div>
            <div className="freight-row free"><span>Sedex (2 dias úteis)</span><span className="val">Grátis</span></div>
            <div className="freight-row"><span>Expresso (1 dia útil)</span><span className="val">R$ 18,90</span></div>
            <div style={{fontSize:12, color:'var(--ins-fg-muted)', marginTop:8}}>Consulte prazos e condições.</div>
          </div>
        </div>
      </div>

      <div className="pdp-tabs">
        <div className="tabs-head">
          <button className={tab==='desc'?'active':''} onClick={()=>setTab('desc')}>Descrição</button>
          <button className={tab==='specs'?'active':''} onClick={()=>setTab('specs')}>Especificações</button>
          <button className={tab==='reviews'?'active':''} onClick={()=>setTab('reviews')}>Avaliações ({p.reviews})</button>
        </div>
        {tab === 'desc' && (
          <div className="tabs-body">
            <p>O {p.name} foi desenvolvido para entregar conforto e desempenho em cada passo. Cabedal em malha respirável, entressola em EVA e solado de borracha antiderrapante garantem estabilidade no dia a dia, no treino e nas caminhadas.</p>
            <p>Design moderno e atemporal, pensado para durar. Produzido com materiais de qualidade e acabamento impecável. Disponível em múltiplas cores e tamanhos.</p>
          </div>
        )}
        {tab === 'specs' && (
          <div className="pdp-specs">
            <dl>
              <dt>Marca</dt><dd>{p.brand}</dd>
              <dt>Categoria</dt><dd>{p.cat === 'calcados' ? 'Calçados' : 'Vestuário'}</dd>
              <dt>Material externo</dt><dd>Mesh respirável · Sintético</dd>
              <dt>Material da sola</dt><dd>Borracha EVA</dd>
              <dt>Referência (SKU)</dt><dd style={{fontFamily:'var(--ins-font-mono)'}}>SKU-{8420+p.id}-BR</dd>
              <dt>Garantia</dt><dd>90 dias contra defeitos de fabricação</dd>
            </dl>
          </div>
        )}
        {tab === 'reviews' && (
          <div className="tabs-body">
            <p style={{color:'var(--ins-fg-muted)'}}>Baseado em {p.reviews} avaliações · nota média {p.rating.toFixed(1)} de 5.</p>
            <p><b>Mariana S.</b> · <span className="stars" style={{color:'var(--ins-warning-500)'}}>★★★★★</span><br/>Produto ótimo, chegou antes do prazo e o tamanho veio certinho. Recomendo.</p>
            <p><b>Ricardo P.</b> · <span className="stars" style={{color:'var(--ins-warning-500)'}}>★★★★☆</span><br/>Acabamento muito bom, só achei que a numeração é levemente menor que o esperado.</p>
          </div>
        )}
      </div>

      <div className="section">
        <div className="section-head"><h2>Você também pode gostar</h2></div>
        <div className="grid-products">
          {relacionados.map(r => <ProductCard key={r.id} p={r} onOpen={(p)=>onNav('pdp', p)}/>)}
        </div>
      </div>
    </div>
  );
}

window.ProductDetail = ProductDetail;
