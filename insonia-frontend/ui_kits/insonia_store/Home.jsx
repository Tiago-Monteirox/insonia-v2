// Home page — wireframe: header · banner rotativo · lançamentos · promocionais · footer
function Home({ onOpen }) {
  const [slide, setSlide] = React.useState(0);
  React.useEffect(() => { if (window.lucide) lucide.createIcons(); });
  React.useEffect(() => {
    const t = setInterval(() => setSlide(s => (s+1) % 3), 6000);
    return () => clearInterval(t);
  }, []);

  const slides = [
    { cls: 's1', eyebrow: 'Coleção Outono 26', title: 'Conforto que você sente no primeiro passo.', sub: 'Tênis Runner 3.0 — cabedal em mesh respirável e entressola em EVA.', cta: 'Comprar agora', letter: 'R' },
    { cls: 's2', eyebrow: 'Semana do Esporte', title: 'Até 40% OFF em vestuário esportivo.', sub: 'Camisetas, shorts e regatas das principais marcas.', cta: 'Ver promoções', letter: '%' },
    { cls: 's3', eyebrow: 'Lançamento exclusivo', title: 'Mochila Urban 25L. Leve tudo que importa.', sub: 'Dois compartimentos, bolso notebook 15" e tecido impermeável.', cta: 'Comprar', letter: 'M' },
  ];

  const lancamentos = storeProducts.filter(p => p.tag === 'Lançamento');
  const promocionais = storeProducts.filter(p => p.tag === 'Promoção');

  return (
    <>
      <div className="container">
        <div className="banner">
          {slides.map((s, i) => (
            <div key={i} className={`slide ${s.cls} ${i===slide?'active':''}`}>
              <div className="text">
                <div className="eyebrow">{s.eyebrow}</div>
                <h1>{s.title}</h1>
                <p>{s.sub}</p>
                <button className="pbtn" style={{display:'inline-flex', padding:'0 24px', height:48, fontSize:14}}>
                  <i data-lucide="arrow-right"></i>{s.cta}
                </button>
              </div>
              <div className="visual"><span className="big-letter">{s.letter}</span></div>
            </div>
          ))}
          <button className="arr prev" onClick={()=>setSlide(s=>(s-1+3)%3)}><i data-lucide="chevron-left"></i></button>
          <button className="arr next" onClick={()=>setSlide(s=>(s+1)%3)}><i data-lucide="chevron-right"></i></button>
          <div className="dots">
            {slides.map((_, i) => <button key={i} className={i===slide?'active':''} onClick={()=>setSlide(i)}></button>)}
          </div>
        </div>
      </div>

      <div className="container section">
        <div className="section-head">
          <div>
            <h2>Lançamentos</h2>
            <div className="sub">Novidades que acabaram de chegar</div>
          </div>
          <a href="#" className="more">ver todos <i data-lucide="arrow-right"></i></a>
        </div>
        <div className="grid-products">
          {lancamentos.map(p => <ProductCard key={p.id} p={p} onOpen={onOpen}/>)}
        </div>
      </div>

      <div className="container section">
        <div className="section-head">
          <div>
            <h2>Promoções</h2>
            <div className="sub">Ofertas por tempo limitado</div>
          </div>
          <a href="#" className="more">ver todas <i data-lucide="arrow-right"></i></a>
        </div>
        <div className="grid-products">
          {promocionais.map(p => <ProductCard key={p.id} p={p} onOpen={onOpen}/>)}
        </div>
      </div>

      <TrustStrip/>
    </>
  );
}

window.Home = Home;
