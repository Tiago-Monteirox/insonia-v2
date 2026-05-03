// Produtos list screen
function ProductModal({ produto, onClose, onSave }) {
  const isEdit = !!produto?.id;
  const [form, setForm] = React.useState({
    name: produto?.name || '',
    salePrice: produto?.salePrice?.amount || '',
    costPrice: produto?.costPrice?.amount || '',
    stock: produto?.stock ?? 0,
    description: produto?.description || '',
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => { if (window.lucide) lucide.createIcons(); });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const fields = `
        name: "${form.name}"
        salePrice: ${form.salePrice}
        costPrice: ${form.costPrice}
        stock: ${form.stock}
      `;
      if (isEdit) {
        await insApi.gql(`mutation { updateProduct(id: ${produto.id}, input: { ${fields} }) { id } }`);
      } else {
        await insApi.gql(`mutation { createProduct(input: { ${fields} }) { id } }`);
      }
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
      <div className="card" style={{width:480,maxHeight:'90vh',overflow:'auto'}}>
        <div className="card-header">
          <h2>{isEdit ? 'Editar produto' : 'Novo produto'}</h2>
          <button className="btn ghost sm icon-only" style={{marginLeft:'auto'}} onClick={onClose}><i data-lucide="x"></i></button>
        </div>
        <form className="card-body" style={{display:'flex',flexDirection:'column',gap:16}} onSubmit={submit}>
          <div className="field"><label>Nome</label><input className="input" value={form.name} onChange={e=>set('name',e.target.value)} required /></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div className="field"><label>Preço de venda (R$)</label><input className="input" type="number" step="0.01" value={form.salePrice} onChange={e=>set('salePrice',e.target.value)} required /></div>
            <div className="field"><label>Preço de custo (R$)</label><input className="input" type="number" step="0.01" value={form.costPrice} onChange={e=>set('costPrice',e.target.value)} required /></div>
          </div>
          <div className="field"><label>Estoque</label><input className="input" type="number" value={form.stock} onChange={e=>set('stock',parseInt(e.target.value)||0)} /></div>
          {error && <div style={{color:'var(--ins-danger-600)',fontSize:13}}>{error}</div>}
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button type="button" className="btn secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Produtos() {
  const [produtos, setProdutos] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [modal, setModal] = React.useState(null); // null | 'create' | { ...produto }

  React.useEffect(() => { if (window.lucide) lucide.createIcons(); });

  async function load() {
    try {
      const data = await insApi.gql(`{
        allProducts(limit: 200) {
          id name slug stock categoryId brandId
          salePrice { amount currency }
          costPrice { amount }
          promotionalPrice { amount }
        }
      }`);
      setProdutos(data.allProducts);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  async function handleDelete(id, name) {
    if (!confirm(`Excluir "${name}"? Esta ação não pode ser desfeita.`)) return;
    await insApi.gql(`mutation { deleteProduct(id: ${id}) }`);
    setProdutos(prev => prev.filter(p => p.id !== id));
  }

  if (loading) return (
    <div className="content" style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}>
      <div style={{color:'var(--ins-fg-muted)'}}>Carregando produtos…</div>
    </div>
  );

  return (
    <div className="content">
      <div className="page-header">
        <div><h1>Produtos</h1><div className="sub">{produtos.length} produtos cadastrados</div></div>
        <div className="row">
          <button className="btn primary" onClick={() => setModal('create')}><i data-lucide="plus"></i>Novo produto</button>
        </div>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Produto</th><th>Slug</th>
              <th className="num">Preço de custo</th><th className="num">Preço de venda</th>
              <th className="num">Estoque</th><th className="actions">Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map(p => (
              <tr key={p.id}>
                <td style={{display:'flex', alignItems:'center', gap:12}}>
                  <div className="thumb-sm">{p.name[0].toUpperCase()}</div>
                  <span style={{fontWeight:500}}>{p.name}</span>
                </td>
                <td><span className="price" style={{color:'var(--ins-fg-muted)', fontSize:12}}>{p.slug}</span></td>
                <td className="num" style={{color:'var(--ins-fg-muted)'}}>{fmtBRLCompact(p.costPrice?.amount)}</td>
                <td className="num" style={{fontWeight:600}}>{fmtBRLCompact(p.salePrice?.amount)}</td>
                <td className="num">
                  {p.stock === 0 ? <span className="badge danger"><span className="dot"></span>sem estoque</span>
                    : p.stock < 10 ? <span className="badge warning"><span className="dot"></span>{p.stock}</span>
                    : <span className="price">{p.stock}</span>}
                </td>
                <td className="actions">
                  <button className="btn ghost sm icon-only" onClick={() => setModal(p)}><i data-lucide="pencil"></i></button>
                  <button className="btn ghost sm icon-only" onClick={() => handleDelete(p.id, p.name)}><i data-lucide="trash-2"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <ProductModal
          produto={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}

window.Produtos = Produtos;
