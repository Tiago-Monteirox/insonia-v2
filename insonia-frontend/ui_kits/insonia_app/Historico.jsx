// Histórico de Vendas & Estatísticas
function Historico() {
  React.useEffect(() => { if (window.lucide) lucide.createIcons(); });
  return (
    <div className="content">
      <div className="page-header">
        <div><h1>Histórico de vendas</h1><div className="sub">Últimos 7 dias</div></div>
        <div className="row">
          <button className="btn secondary"><i data-lucide="calendar"></i>05 – 12 abr</button>
          <button className="btn secondary"><i data-lucide="download"></i>Exportar</button>
        </div>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Venda</th><th>Data</th><th>Usuário</th><th>Itens</th><th className="num">Valor total</th><th className="num">Lucro</th><th>Status</th><th className="actions">Ações</th></tr></thead>
          <tbody>
            {vendas.map(v => (
              <tr key={v.id}>
                <td><span className="price" style={{fontWeight:600}}>#{v.id}</span></td>
                <td>{v.data}</td>
                <td>{v.usuario}</td>
                <td>{v.itens}</td>
                <td className="num" style={{fontWeight:600}}>{fmtBRL(v.valor_total)}</td>
                <td className="num" style={{color:'var(--ins-success-700)'}}>{fmtBRL(v.lucro_total)}</td>
                <td><span className="badge success"><span className="dot"></span>{v.status}</span></td>
                <td className="actions">
                  <button className="btn ghost sm icon-only"><i data-lucide="eye"></i></button>
                  <button className="btn ghost sm icon-only"><i data-lucide="printer"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Estatisticas() {
  React.useEffect(() => { if (window.lucide) lucide.createIcons(); });
  return (
    <div className="content">
      <div className="page-header">
        <div><h1>Estatísticas</h1><div className="sub">Filtro por período</div></div>
      </div>
      <div className="card" style={{marginBottom:20}}>
        <div className="card-body" style={{display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:16, alignItems:'end'}}>
          <div className="field"><label>Data início</label><input className="input" type="date" defaultValue="2026-04-01"/></div>
          <div className="field"><label>Data fim</label><input className="input" type="date" defaultValue="2026-04-12"/></div>
          <button className="btn primary"><i data-lucide="calculator"></i>Calcular</button>
        </div>
      </div>
      <div className="grid-2">
        <div className="stat"><div className="label">Valor total no período</div><div className="value">R$ 12.498,30</div><div className="delta up"><i data-lucide="trending-up"></i>89 vendas</div></div>
        <div className="stat"><div className="label">Lucro total no período</div><div className="value" style={{color:'var(--ins-success-700)'}}>R$ 4.872,10</div><div className="delta up"><i data-lucide="trending-up"></i>39% margem média</div></div>
      </div>
    </div>
  );
}

window.Historico = Historico;
window.Estatisticas = Estatisticas;
