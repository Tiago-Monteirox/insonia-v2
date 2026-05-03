import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { produtos, marcas, vendas, fmtBRL } from '../lib/data.js';

export default function Dashboard() {
  const navigate = useNavigate();
  return (
    <div className="content">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <div className="sub">Visão geral dos últimos 30 dias</div>
        </div>
        <div className="row">
          <button className="btn secondary"><Calendar size={16} />Abril 2026</button>
          <button className="btn primary" onClick={() => navigate('/pdv')}>
            <Plus size={16} />Registrar venda
          </button>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat">
          <div className="label">Faturamento</div>
          <div className="value">R$ 24.982,40</div>
          <div className="delta up"><TrendingUp size={14} />+12,4% vs mês anterior</div>
        </div>
        <div className="stat">
          <div className="label">Lucro</div>
          <div className="value">R$ 9.241,80</div>
          <div className="delta up"><TrendingUp size={14} />+8,1% vs mês anterior</div>
        </div>
        <div className="stat">
          <div className="label">Vendas</div>
          <div className="value">142</div>
          <div className="delta up"><TrendingUp size={14} />+18 vendas</div>
        </div>
        <div className="stat">
          <div className="label">Ticket médio</div>
          <div className="value">R$ 175,90</div>
          <div className="delta down"><TrendingDown size={14} />−2,3% vs mês anterior</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header">
            <h2>Faturamento diário</h2>
            <div className="tabs" style={{ marginLeft: 'auto', margin: 0, border: 0 }}>
              <button className="tab active" style={{ padding: '6px 12px', fontSize: 12 }}>30 dias</button>
              <button className="tab" style={{ padding: '6px 12px', fontSize: 12 }}>7 dias</button>
            </div>
          </div>
          <div className="card-body" style={{ height: 240, padding: 24 }}>
            <Chart />
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2>Produtos mais vendidos</h2></div>
          <div style={{ padding: '4px 0' }}>
            {produtos.slice(0, 5).map((p, i) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
                borderBottom: i < 4 ? '1px solid var(--ins-border)' : 0,
              }}>
                <div className="thumb-sm">{p.letra}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 500,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ins-fg-muted)' }}>
                    {marcas.find(m => m.id === p.marca)?.name}
                  </div>
                </div>
                <div className="price" style={{ fontSize: 13 }}>{fmtBRL(p.preco_venda)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <h2>Últimas vendas</h2>
          <div style={{ marginLeft: 'auto' }}>
            <button className="btn ghost sm" onClick={() => navigate('/historico')}>Ver todas →</button>
          </div>
        </div>
        <div className="tbl-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>#</th><th>Data</th><th>Usuário</th><th>Itens</th>
                <th className="num">Valor</th><th className="num">Lucro</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {vendas.slice(0, 5).map(v => (
                <tr key={v.id}>
                  <td><span className="price" style={{ color: 'var(--ins-fg-muted)' }}>#{v.id}</span></td>
                  <td>{v.data}</td>
                  <td>{v.usuario}</td>
                  <td>{v.itens}</td>
                  <td className="num">{fmtBRL(v.valor_total)}</td>
                  <td className="num" style={{ color: 'var(--ins-success-700)' }}>{fmtBRL(v.lucro_total)}</td>
                  <td><span className="badge success"><span className="dot"></span>{v.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Chart() {
  const data = [42, 58, 49, 71, 63, 82, 91, 78, 104, 88, 96, 118, 102, 85, 94, 112, 128, 119, 142, 131, 148, 155, 172, 168, 185, 198, 176, 204, 211, 225];
  const max = Math.max(...data);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: '100%' }}>
      {data.map((v, i) => (
        <div key={i} style={{
          flex: 1,
          height: `${(v / max) * 100}%`,
          background: i === data.length - 1 ? 'var(--ins-accent-500)' : 'var(--ins-accent-200)',
          borderRadius: '3px 3px 0 0',
          transition: 'all 200ms',
        }} />
      ))}
    </div>
  );
}
