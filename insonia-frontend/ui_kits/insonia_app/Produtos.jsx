// Produtos list screen
function Produtos() {
  React.useEffect(() => { if (window.lucide) lucide.createIcons(); });
  const [tab, setTab] = React.useState('todos');
  return (
    <div className="content">
      <div className="page-header">
        <div><h1>Produtos</h1><div className="sub">{produtos.length} produtos cadastrados</div></div>
        <div className="row">
          <button className="btn secondary"><i data-lucide="upload"></i>Importar Excel</button>
          <button className="btn primary"><i data-lucide="plus"></i>Adicionar produto</button>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab==='todos'?'active':''}`} onClick={()=>setTab('todos')}>Todos · {produtos.length}</button>
        <button className={`tab ${tab==='baixo'?'active':''}`} onClick={()=>setTab('baixo')}>Estoque baixo · 3</button>
        <button className={`tab ${tab==='zero'?'active':''}`} onClick={()=>setTab('zero')}>Sem estoque · 1</button>
        <button className={`tab ${tab==='promo'?'active':''}`} onClick={()=>setTab('promo')}>Em promoção · 0</button>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Produto</th><th>SKU</th><th>Categoria</th><th>Marca</th>
              <th className="num">Preço de custo</th><th className="num">Preço de venda</th>
              <th className="num">Estoque</th><th className="actions">Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map(p => {
              const cat = categorias.find(c=>c.id===p.categoria);
              const marca = marcas.find(m=>m.id===p.marca);
              return (
                <tr key={p.id}>
                  <td style={{display:'flex', alignItems:'center', gap:12}}>
                    <div className="thumb-sm">{p.letra}</div>
                    <span style={{fontWeight:500}}>{p.name}</span>
                  </td>
                  <td><span className="price" style={{color:'var(--ins-fg-muted)', fontSize:12}}>{p.sku}</span></td>
                  <td>{cat?.name}</td>
                  <td>{marca?.name}</td>
                  <td className="num" style={{color:'var(--ins-fg-muted)'}}>{fmtBRLCompact(p.preco_custo)}</td>
                  <td className="num" style={{fontWeight:600}}>{fmtBRLCompact(p.preco_venda)}</td>
                  <td className="num">
                    {p.quantidade === 0 ? <span className="badge danger"><span className="dot"></span>sem estoque</span>
                      : p.quantidade < 10 ? <span className="badge warning"><span className="dot"></span>{p.quantidade}</span>
                      : <span className="price">{p.quantidade}</span>}
                  </td>
                  <td className="actions">
                    <button className="btn ghost sm icon-only"><i data-lucide="pencil"></i></button>
                    <button className="btn ghost sm icon-only"><i data-lucide="trash-2"></i></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

window.Produtos = Produtos;
