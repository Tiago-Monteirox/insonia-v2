// Histórico de Vendas & Estatísticas
function Historico() {
  const [vendas, setVendas] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filtro, setFiltro] = React.useState({ de: '', ate: '' });
  React.useEffect(() => { if (window.lucide) lucide.createIcons(); });

  async function load() {
    setLoading(true);
    try {
      const params = [];
      if (filtro.de)  params.push(`dateFrom: "${filtro.de}"`);
      if (filtro.ate) params.push(`dateTo: "${filtro.ate}"`);
      const args = params.length ? `(${params.join(', ')})` : '';
      const data = await insApi.gql(`{
        allSales${args} {
          id saleDate totalAmount totalProfit
          items { id productId quantity salePrice { amount } }
        }
      }`);
      setVendas(data.allSales);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  async function cancelarVenda(id) {
    if (!confirm(`Cancelar venda #${id} e restaurar o estoque?`)) return;
    await insApi.gql(`mutation { deleteSale(id: ${id}) }`);
    setVendas(prev => prev.filter(v => v.id !== id));
  }

  function fmtData(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="content">
      <div className="page-header">
        <div><h1>Histórico de vendas</h1><div className="sub">{vendas.length} vendas</div></div>
      </div>
      <div className="card" style={{marginBottom:20}}>
        <div className="card-body" style={{display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:16,alignItems:'flex-end'}}>
          <div className="field"><label>De</label><input className="input" type="date" value={filtro.de} onChange={e=>setFiltro(f=>({...f,de:e.target.value}))}/></div>
          <div className="field"><label>Até</label><input className="input" type="date" value={filtro.ate} onChange={e=>setFiltro(f=>({...f,ate:e.target.value}))}/></div>
          <button className="btn primary" onClick={load}><i data-lucide="search"></i>Filtrar</button>
        </div>
      </div>
      {loading ? (
        <div style={{color:'var(--ins-fg-muted)',padding:24}}>Carregando…</div>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Venda</th><th>Data</th><th>Itens</th><th className="num">Valor total</th><th className="num">Lucro</th><th className="actions">Ações</th></tr></thead>
            <tbody>
              {vendas.map(v => (
                <tr key={v.id}>
                  <td><span className="price" style={{fontWeight:600}}>#{v.id}</span></td>
                  <td>{fmtData(v.saleDate)}</td>
                  <td>{v.items.length}</td>
                  <td className="num" style={{fontWeight:600}}>{fmtBRL(v.totalAmount)}</td>
                  <td className="num" style={{color:'var(--ins-success-700)'}}>{fmtBRL(v.totalProfit)}</td>
                  <td className="actions">
                    <button className="btn ghost sm icon-only" title="Cancelar venda" onClick={() => cancelarVenda(v.id)}><i data-lucide="trash-2"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Estatisticas() {
  const hoje = new Date().toISOString().slice(0, 10);
  const umMesAtras = new Date(Date.now() - 30*24*60*60*1000).toISOString().slice(0, 10);
  const [de, setDe] = React.useState(umMesAtras);
  const [ate, setAte] = React.useState(hoje);
  const [summary, setSummary] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => { if (window.lucide) lucide.createIcons(); });

  async function calcular() {
    setLoading(true);
    try {
      const data = await insApi.gql(`{
        salesSummary(dateFrom: "${de}", dateTo: "${ate}") {
          totalRevenue totalProfit saleCount avgTicket
        }
      }`);
      setSummary(data.salesSummary);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { calcular(); }, []);

  return (
    <div className="content">
      <div className="page-header"><div><h1>Estatísticas</h1><div className="sub">Filtro por período</div></div></div>
      <div className="card" style={{marginBottom:20}}>
        <div className="card-body" style={{display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:16,alignItems:'flex-end'}}>
          <div className="field"><label>Data início</label><input className="input" type="date" value={de} onChange={e=>setDe(e.target.value)}/></div>
          <div className="field"><label>Data fim</label><input className="input" type="date" value={ate} onChange={e=>setAte(e.target.value)}/></div>
          <button className="btn primary" onClick={calcular} disabled={loading}><i data-lucide="calculator"></i>{loading ? 'Calculando…' : 'Calcular'}</button>
        </div>
      </div>
      {summary && (
        <div className="grid-2">
          <div className="stat"><div className="label">Faturamento no período</div><div className="value">{fmtBRL(summary.totalRevenue)}</div><div className="delta up"><i data-lucide="receipt"></i>{summary.saleCount} vendas</div></div>
          <div className="stat"><div className="label">Lucro no período</div><div className="value" style={{color:'var(--ins-success-700)'}}>{fmtBRL(summary.totalProfit)}</div><div className="delta up"><i data-lucide="trending-up"></i>Ticket médio {fmtBRL(summary.avgTicket)}</div></div>
        </div>
      )}
    </div>
  );
}

window.Historico = Historico;
window.Estatisticas = Estatisticas;
