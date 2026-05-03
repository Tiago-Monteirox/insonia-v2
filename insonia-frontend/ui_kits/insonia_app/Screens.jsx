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
  const [categorias, setCategorias] = React.useState([]);
  const [nome, setNome] = React.useState('');
  const [editando, setEditando] = React.useState(null); // { id, name }
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => { if (window.lucide) lucide.createIcons(); });

  async function load() {
    const data = await insApi.gql(`{ allCategories { id name slug } }`);
    setCategorias(data.allCategories);
  }
  React.useEffect(() => { load(); }, []);

  async function salvar(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editando) {
        await insApi.gql(`mutation { updateCategory(id: ${editando.id}, input: { name: "${nome}" }) { id } }`);
        setEditando(null);
      } else {
        await insApi.gql(`mutation { createCategory(input: { name: "${nome}" }) { id } }`);
      }
      setNome('');
      await load();
    } finally {
      setSaving(false);
    }
  }

  function iniciarEdicao(c) {
    setEditando(c);
    setNome(c.name);
  }

  async function excluir(id) {
    if (!confirm('Excluir esta categoria?')) return;
    await insApi.gql(`mutation { deleteCategory(id: ${id}) }`);
    setCategorias(prev => prev.filter(c => c.id !== id));
  }

  return (
    <div className="content">
      <div className="page-header">
        <div><h1>Categorias</h1><div className="sub">{categorias.length} categorias</div></div>
      </div>
      <div className="card" style={{marginBottom:20}}>
        <form className="card-body" style={{display:'flex',gap:12,alignItems:'flex-end'}} onSubmit={salvar}>
          <div className="field" style={{flex:1,margin:0}}>
            <label>{editando ? 'Editar categoria' : 'Nova categoria'}</label>
            <input className="input" value={nome} onChange={e=>setNome(e.target.value)} required placeholder="Ex: Calçados" />
          </div>
          <button className="btn primary" disabled={saving}>{saving ? 'Salvando…' : editando ? 'Atualizar' : 'Adicionar'}</button>
          {editando && <button type="button" className="btn secondary" onClick={() => { setEditando(null); setNome(''); }}>Cancelar</button>}
        </form>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Nome</th><th>Slug</th><th className="num">Produtos</th><th className="actions">Ações</th></tr></thead>
          <tbody>
            {categorias.map(c => (
              <tr key={c.id}>
                <td style={{fontWeight:500}}>{c.name}</td>
                <td><span className="price" style={{color:'var(--ins-fg-muted)',fontSize:12}}>/{c.slug}</span></td>
                <td className="num">—</td>
                <td className="actions">
                  <button className="btn ghost sm icon-only" onClick={() => iniciarEdicao(c)}><i data-lucide="pencil"></i></button>
                  <button className="btn ghost sm icon-only" onClick={() => excluir(c.id)}><i data-lucide="trash-2"></i></button>
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
  const [marcas, setMarcas] = React.useState([]);
  const [nome, setNome] = React.useState('');
  const [editando, setEditando] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => { if (window.lucide) lucide.createIcons(); });

  async function load() {
    const data = await insApi.gql(`{ allBrands { id name slug } }`);
    setMarcas(data.allBrands);
  }
  React.useEffect(() => { load(); }, []);

  async function salvar(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editando) {
        await insApi.gql(`mutation { updateBrand(id: ${editando.id}, input: { name: "${nome}" }) { id } }`);
        setEditando(null);
      } else {
        await insApi.gql(`mutation { createBrand(input: { name: "${nome}" }) { id } }`);
      }
      setNome('');
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function excluir(id) {
    if (!confirm('Excluir esta marca?')) return;
    await insApi.gql(`mutation { deleteBrand(id: ${id}) }`);
    setMarcas(prev => prev.filter(m => m.id !== id));
  }

  return (
    <div className="content">
      <div className="page-header">
        <div><h1>Marcas</h1><div className="sub">{marcas.length} marcas</div></div>
      </div>
      <div className="card" style={{marginBottom:20}}>
        <form className="card-body" style={{display:'flex',gap:12,alignItems:'flex-end'}} onSubmit={salvar}>
          <div className="field" style={{flex:1,margin:0}}>
            <label>{editando ? 'Editar marca' : 'Nova marca'}</label>
            <input className="input" value={nome} onChange={e=>setNome(e.target.value)} required placeholder="Ex: Nike" />
          </div>
          <button className="btn primary" disabled={saving}>{saving ? 'Salvando…' : editando ? 'Atualizar' : 'Adicionar'}</button>
          {editando && <button type="button" className="btn secondary" onClick={() => { setEditando(null); setNome(''); }}>Cancelar</button>}
        </form>
      </div>
      <div className="grid-4">
        {marcas.map(m => (
          <div className="card" key={m.id}>
            <div className="card-body" style={{display:'flex',alignItems:'center',gap:12}}>
              <div className="thumb-sm" style={{width:44,height:44,fontSize:16}}>{m.name[0]}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600}}>{m.name}</div>
              </div>
              <div style={{display:'flex',gap:4}}>
                <button className="btn ghost sm icon-only" onClick={() => { setEditando(m); setNome(m.name); }}><i data-lucide="pencil"></i></button>
                <button className="btn ghost sm icon-only" onClick={() => excluir(m.id)}><i data-lucide="trash-2"></i></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Variacoes() {
  const [dims, setDims] = React.useState([]);
  const [nomeDim, setNomeDim] = React.useState('');
  const [novoValor, setNovoValor] = React.useState({}); // { [nameId]: string }
  React.useEffect(() => { if (window.lucide) lucide.createIcons(); });

  async function load() {
    const data = await insApi.gql(`{
      allVariationNames { id name values { id value } }
    }`);
    setDims(data.allVariationNames);
  }
  React.useEffect(() => { load(); }, []);

  async function criarDim(e) {
    e.preventDefault();
    await insApi.gql(`mutation { createVariationName(input: { name: "${nomeDim}" }) { id } }`);
    setNomeDim('');
    await load();
  }

  async function adicionarValor(nameId) {
    const val = novoValor[nameId]?.trim();
    if (!val) return;
    await insApi.gql(`mutation { addVariationValue(input: { nameId: ${nameId}, value: "${val}" }) { id } }`);
    setNovoValor(v => ({ ...v, [nameId]: '' }));
    await load();
  }

  async function excluirValor(id) {
    await insApi.gql(`mutation { deleteVariationValue(id: ${id}) }`);
    await load();
  }

  async function excluirDim(id) {
    if (!confirm('Excluir esta dimensão e todos os valores?')) return;
    await insApi.gql(`mutation { deleteVariationName(id: ${id}) }`);
    await load();
  }

  return (
    <div className="content">
      <div className="page-header">
        <div><h1>Variações</h1><div className="sub">Dimensões de variação de produto</div></div>
      </div>
      <div className="card" style={{marginBottom:20}}>
        <form className="card-body" style={{display:'flex',gap:12,alignItems:'flex-end'}} onSubmit={criarDim}>
          <div className="field" style={{flex:1,margin:0}}>
            <label>Nova dimensão</label>
            <input className="input" value={nomeDim} onChange={e=>setNomeDim(e.target.value)} required placeholder="Ex: Tamanho" />
          </div>
          <button className="btn primary">Adicionar</button>
        </form>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        {dims.map(d => (
          <div className="card" key={d.id}>
            <div className="card-header">
              <h2>{d.name}</h2>
              <span className="badge neutral">{d.values.length} valores</span>
              <button className="btn ghost sm icon-only" style={{marginLeft:'auto'}} onClick={() => excluirDim(d.id)}><i data-lucide="trash-2"></i></button>
            </div>
            <div className="card-body" style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
              {d.values.map(v => (
                <span key={v.id} className="chip" style={{display:'flex',alignItems:'center',gap:4}}>
                  {v.value}
                  <button style={{background:'none',border:'none',cursor:'pointer',padding:0,lineHeight:1,color:'var(--ins-fg-muted)'}} onClick={() => excluirValor(v.id)}>×</button>
                </span>
              ))}
              <input
                className="input"
                style={{width:100,height:32,fontSize:13}}
                placeholder="+ valor"
                value={novoValor[d.id] || ''}
                onChange={e => setNovoValor(v => ({ ...v, [d.id]: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); adicionarValor(d.id); } }}
              />
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
