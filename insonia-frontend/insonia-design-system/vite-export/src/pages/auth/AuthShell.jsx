import { Package, ShoppingCart, BarChart3 } from 'lucide-react';
import logoUrl from '../../assets/insonia-logo.png';

export default function AuthShell({ children }) {
  return (
    <div className="login-wrap">
      <aside className="login-brand">
        <div className="topline">
          <div className="mark"><img src={logoUrl} alt="Insonia" /></div>
          <div className="word">Insônia<small>Sistema · v2.0</small></div>
        </div>

        <div className="hero">
          <div className="eyebrow">Gestão · Vendas · PDV</div>
          <h1>
            <span style={{ color: 'rgb(244, 244, 244)' }}>Sua loja,</span>{' '}
            <em>do estoque ao caixa</em>
            <span style={{ color: 'rgb(250, 250, 250)' }}>, em um só lugar.</span>
          </h1>
          <p>
            Cadastre produtos, registre vendas e acompanhe o lucro em tempo real.
            Tudo numa interface pensada para quem opera o balcão.
          </p>
          <div className="features">
            <div className="feat">
              <span className="ic"><Package size={16} /></span>
              <span><b>Catálogo completo</b> — produtos, categorias, marcas, variações.</span>
            </div>
            <div className="feat">
              <span className="ic"><ShoppingCart size={16} /></span>
              <span><b>PDV ágil</b> — venda registrada, estoque atualizado.</span>
            </div>
            <div className="feat">
              <span className="ic"><BarChart3 size={16} /></span>
              <span><b>Estatísticas</b> de receita e lucro por período.</span>
            </div>
          </div>
        </div>

        <div className="footline">
          <span>© 2026 Insônia · feito com ♥ por Tiago Monteiro</span>
          <span className="pill"><span className="dot"></span>Sistema operacional</span>
        </div>
      </aside>
      <div className="login-form">
        <div className="inner">{children}</div>
      </div>
    </div>
  );
}
