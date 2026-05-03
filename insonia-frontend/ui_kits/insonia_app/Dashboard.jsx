// Dashboard screen
function Dashboard() {
  const [summary, setSummary] = React.useState(null);
  const [chartData, setChartData] = React.useState([]);
  const [topProds, setTopProds] = React.useState([]);
  const [recentSales, setRecentSales] = React.useState([]);
  React.useEffect(() => { if (window.lucide) lucide.createIcons(); });

  React.useEffect(() => {
    async function load() {
      const data = await insApi.gql(`{
        salesSummary { totalRevenue totalProfit saleCount avgTicket }
        dailyRevenue { date total }
        topProducts(limit: 5) { productId name unitsSold revenue }
        allSales(limit: 5) { id saleDate totalAmount totalProfit items { id } }
      }`);
      setSummary(data.salesSummary);
      setChartData(data.dailyRevenue);
      setTopProds(data.topProducts);
      setRecentSales(data.allSales);
    }
    load();
  }, []);

  function fmtData(iso) {
    return new Date(iso).toLocaleDateString('pt-BR');
  }

  if (!summary) return <div className="content" style={{color:'var(--ins-fg-muted)',padding:24}}>Carregando dashboard…</div>;

  return (
    <div className="content">
      <div className="page-header">
        <div><h1>Dashboard</h1><div className="sub">Últimos 30 dias</div></div>
      </div>
      <div className="grid-4" style={{marginBottom:24}}>
        <div className="stat"><div className="label">Faturamento</div><div className="value">{fmtBRL(summary.totalRevenue)}</div></div>
        <div className="stat"><div className="label">Lucro</div><div className="value">{fmtBRL(summary.totalProfit)}</div></div>
        <div className="stat"><div className="label">Vendas</div><div className="value">{summary.saleCount}</div></div>
        <div className="stat"><div className="label">Ticket médio</div><div className="value">{fmtBRL(summary.avgTicket)}</div></div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:20}}>
        <div className="card">
          <div className="card-header"><h2>Faturamento diário</h2></div>
          <div className="card-body" style={{height:240, padding:24}}>
            <Chart data={chartData} />
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2>Mais vendidos</h2></div>
          <div style={{padding:'4px 0'}}>
            {topProds.map((p, i) => (
              <div key={p.productId} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 20px',borderBottom:i<topProds.length-1?'1px solid var(--ins-border)':0}}>
                <div className="thumb-sm">{p.name[0]}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.name}</div>
                  <div style={{fontSize:12,color:'var(--ins-fg-muted)'}}>{p.unitsSold} unidades</div>
                </div>
                <div className="price" style={{fontSize:13}}>{fmtBRL(p.revenue)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{marginTop:20}}>
        <div className="card-header"><h2>Últimas vendas</h2></div>
        <div className="tbl-wrap" style={{border:0, borderRadius:0}}>
          <table className="tbl">
            <thead><tr><th>#</th><th>Data</th><th>Itens</th><th className="num">Valor</th><th className="num">Lucro</th></tr></thead>
            <tbody>
              {recentSales.map(v => (
                <tr key={v.id}>
                  <td><span className="price" style={{color:'var(--ins-fg-muted)'}}>#{v.id}</span></td>
                  <td>{fmtData(v.saleDate)}</td>
                  <td>{v.items.length}</td>
                  <td className="num">{fmtBRL(v.totalAmount)}</td>
                  <td className="num" style={{color:'var(--ins-success-700)'}}>{fmtBRL(v.totalProfit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Chart({ data }) {
  if (!data.length) return <div style={{color:'var(--ins-fg-muted)',fontSize:13}}>Sem dados no período.</div>;
  const max = Math.max(...data.map(d => d.total));
  return (
    <div style={{display:'flex', alignItems:'flex-end', gap:4, height:'100%'}}>
      {data.map((d, i) => (
        <div key={i} title={`${d.date}: ${fmtBRL(d.total)}`}
          style={{flex:1,height:`${(d.total/max)*100}%`,background:i===data.length-1?'var(--ins-accent-500)':'var(--ins-accent-200)',borderRadius:'3px 3px 0 0',transition:'all 200ms',cursor:'default'}}>
        </div>
      ))}
    </div>
  );
}

window.Dashboard = Dashboard;
