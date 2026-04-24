// Store Header + Footer + shared chrome
function StoreHeader({ cartCount, onNav, page, theme, onToggleTheme }) {
  React.useEffect(() => { if (window.lucide) lucide.createIcons(); });
  return (
    <>
      <div className="topbar-slim">
        <div className="container">
          <div className="left">
            <span>Frete grátis em compras acima de R$ 199</span>
            <span style={{opacity:0.4}}>·</span>
            <span>10x sem juros no cartão</span>
          </div>
          <div className="right">
            <a href="#">Minha conta</a>
            <span style={{margin:'0 12px',opacity:0.3}}>·</span>
            <a href="#">Meus pedidos</a>
            <span style={{margin:'0 12px',opacity:0.3}}>·</span>
            <a href="#">Atendimento</a>
            <button className="theme-toggle" onClick={onToggleTheme} title="Alternar tema">
              <i data-lucide={theme === 'dark' ? 'sun' : 'moon'}></i>
              <span>{theme === 'dark' ? 'Claro' : 'Escuro'}</span>
            </button>
          </div>
        </div>
      </div>
      <header className="header">
        <div className="container">
          <a href="#" className="logo" onClick={(e)=>{e.preventDefault(); onNav('home');}}>
            <img src="../../assets/insonia-logo.png" alt="Insonia"/>
          </a>
          <div className="hdr-search">
            <input placeholder="O que você está procurando?" />
            <button><i data-lucide="search"></i></button>
          </div>
          <div className="hdr-actions">
            <button className="icon-btn" title="Favoritos"><i data-lucide="heart"></i></button>
            <button className="icon-btn" title="Conta"><i data-lucide="user"></i></button>
            <button className="icon-btn" title="Carrinho" onClick={()=>onNav('cart')}>
              <i data-lucide="shopping-bag"></i>
              {cartCount > 0 && <span className="count">{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>
      <nav className="nav">
        <div className="container">
          <a href="#" className={page==='home'?'active':''} onClick={(e)=>{e.preventDefault(); onNav('home');}}>Início</a>
          <a href="#">Calçados</a>
          <a href="#">Vestuário</a>
          <a href="#">Acessórios</a>
          <a href="#">Equipamentos</a>
          <a href="#">Marcas</a>
          <a href="#" className="sale">Promoções</a>
          <a href="#">Lançamentos</a>
        </div>
      </nav>
    </>
  );
}

function StoreFooter() {
  React.useEffect(() => { if (window.lucide) lucide.createIcons(); });
  return (
    <footer className="footer">
      <div className="container">
        <div className="brand-col">
          <img src="../../assets/insonia-logo.png" alt="Insonia"/>
          <p>Insônia é a sua loja de esporte e estilo. Curadoria de marcas, envio para todo o Brasil e pagamento fácil pelo Pix ou em até 10x sem juros.</p>
          <div className="socials">
            <a href="#"><i data-lucide="instagram"></i></a>
            <a href="#"><i data-lucide="facebook"></i></a>
            <a href="#"><i data-lucide="youtube"></i></a>
            <a href="#"><i data-lucide="message-circle"></i></a>
          </div>
        </div>
        <div>
          <h4>Institucional</h4>
          <a href="#">Sobre nós</a>
          <a href="#">Nossas lojas</a>
          <a href="#">Trabalhe conosco</a>
          <a href="#">Política de privacidade</a>
        </div>
        <div>
          <h4>Ajuda</h4>
          <a href="#">Central de atendimento</a>
          <a href="#">Trocas e devoluções</a>
          <a href="#">Prazo de entrega</a>
          <a href="#">Formas de pagamento</a>
        </div>
        <div>
          <h4>Pagamento</h4>
          <div className="payment-badges" style={{marginBottom:16}}>
            <span>VISA</span><span>MASTER</span><span>ELO</span><span>AMEX</span><span>PIX</span><span>BOLETO</span>
          </div>
          <h4 style={{marginTop:16}}>Contato</h4>
          <a href="#">(11) 4002-8922</a>
          <a href="#">ola@insonia.com.br</a>
        </div>
      </div>
      <div className="container">
        <div className="footer-bottom">
          <div>© 2026 Insonia Comércio Ltda · CNPJ 00.000.000/0001-00</div>
          <div>Site seguro · SSL 256-bit</div>
        </div>
        <div className="signature">Made with <span className="heart">♥</span> by <b>Tiago Monteiro</b></div>
      </div>
    </footer>
  );
}

function TrustStrip() {
  React.useEffect(() => { if (window.lucide) lucide.createIcons(); });
  const items = [
    { i: 'truck', t: 'Frete grátis', s: 'acima de R$ 199' },
    { i: 'refresh-ccw', t: 'Troca fácil', s: '30 dias para trocar' },
    { i: 'shield-check', t: 'Compra segura', s: 'pagamento criptografado' },
    { i: 'credit-card', t: '10x sem juros', s: 'ou Pix com desconto' },
  ];
  return (
    <div className="trust-strip">
      <div className="container">
        {items.map(x => (
          <div className="trust-item" key={x.i}>
            <i data-lucide={x.i}></i>
            <div><div className="t">{x.t}</div><div className="s">{x.s}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.StoreHeader = StoreHeader;
window.StoreFooter = StoreFooter;
window.TrustStrip = TrustStrip;
