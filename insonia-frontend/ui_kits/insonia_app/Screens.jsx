// Login + simple screens (Categorias, Marcas, Variações)
function Login({ onLogin }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => { if (window.lucide) lucide.createIcons(); });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await insApi.login(email, password);
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-brand">
        <div className="eye" style={{background:'#fff', padding:12}}><img src="../../assets/insonia-logo.png" alt="Insonia" style={{objectFit:'contain'}}/></div>
        <div>
          <div className="big">Insônia<small>Sistema de gestão de loja e ponto de venda.</small></div>
        </div>
        <div style={{fontSize:12, color:'var(--ins-neutral-500)'}}>v1.0 · © 2026</div>
      </div>
      <div className="login-form">
        <form className="inner" onSubmit={handleSubmit}>
          <div>
            <h1>Entrar</h1>
            <p>Acesse sua conta para continuar.</p>
          </div>
          <div className="field">
            <label>E-mail</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="field">
            <label>Senha</label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <div style={{color:'var(--ins-danger-600)', fontSize:13}}>{error}</div>}
          <button className="btn primary lg" style={{justifyContent:'center'}} disabled={loading}>
            <i data-lucide="log-in"></i>{loading ? 'Entrando…' : 'Entrar'}
          </button>
          <div style={{textAlign:'center', fontSize:13, color:'var(--ins-fg-muted)'}}>Esqueceu a senha?</div>
        </form>
      </div>
    </div>
  );
}

function Categorias() {
  React.useEffect(() => { if (window.lucide) lucide.createIcons(); });
  return (
    <div className="content">
      <div className="page-header">
        <div><h1>Categorias</h1><div className="sub">{categorias.length} categorias</div></div>
        <button className="btn primary"><i data-lucide="plus"></i>Nova categoria</button>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Nome</th><th>Slug</th><th className="num">Produtos</th><th className="actions">Ações</th></tr></thead>
          <tbody>
            {categorias.map(c => (
              <tr key={c.id}>
                <td style={{fontWeight:500}}>{c.name}</td>
                <td><span className="price" style={{color:'var(--ins-fg-muted)', fontSize:12}}>/{c.slug}</span></td>
                <td className="num">{produtos.filter(p=>p.categoria===c.id).length}</td>
                <td className="actions">
                  <button className="btn ghost sm icon-only"><i data-lucide="pencil"></i></button>
                  <button className="btn ghost sm icon-only"><i data-lucide="trash-2"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Marcas() {
  React.useEffect(() => { if (window.lucide) lucide.createIcons(); });
  return (
    <div className="content">
      <div className="page-header">
        <div><h1>Marcas</h1><div className="sub">{marcas.length} marcas</div></div>
        <button className="btn primary"><i data-lucide="plus"></i>Nova marca</button>
      </div>
      <div className="grid-4">
        {marcas.map(m => (
          <div className="card" key={m.id}>
            <div className="card-body" style={{display:'flex', alignItems:'center', gap:12}}>
              <div className="thumb-sm" style={{width:44, height:44, fontSize:16}}>{m.name[0]}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600}}>{m.name}</div>
                <div style={{fontSize:12, color:'var(--ins-fg-muted)'}}>{produtos.filter(p=>p.marca===m.id).length} produtos</div>
              </div>
              <button className="btn ghost sm icon-only"><i data-lucide="more-horizontal"></i></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Variacoes() {
  React.useEffect(() => { if (window.lucide) lucide.createIcons(); });
  const dims = [
    { name: 'Tamanho', valores: ['PP','P','M','G','GG','XG'] },
    { name: 'Cor', valores: ['Preto','Branco','Azul','Vermelho','Verde','Cinza'] },
    { name: 'Numeração', valores: ['38','39','40','41','42','43','44'] },
  ];
  return (
    <div className="content">
      <div className="page-header">
        <div><h1>Variações</h1><div className="sub">Dimensões de variação de produto</div></div>
        <button className="btn primary"><i data-lucide="plus"></i>Nova dimensão</button>
      </div>
      <div style={{display:'flex', flexDirection:'column', gap:16}}>
        {dims.map(d => (
          <div className="card" key={d.name}>
            <div className="card-header"><h2>{d.name}</h2><span className="badge neutral">{d.valores.length} valores</span></div>
            <div className="card-body" style={{display:'flex', gap:8, flexWrap:'wrap'}}>
              {d.valores.map(v => <span key={v} className="chip">{v}</span>)}
              <button className="chip" style={{borderStyle:'dashed', color:'var(--ins-fg-muted)'}}>+ adicionar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.Login = Login;
window.Categorias = Categorias;
window.Marcas = Marcas;
window.Variacoes = Variacoes;
