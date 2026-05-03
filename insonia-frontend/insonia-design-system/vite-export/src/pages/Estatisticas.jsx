import { Calculator, TrendingUp } from 'lucide-react';

export default function Estatisticas() {
  return (
    <div className="content">
      <div className="page-header">
        <div>
          <h1>Estatísticas</h1>
          <div className="sub">Filtro por período</div>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, alignItems: 'end',
        }}>
          <div className="field">
            <label>Data início</label>
            <input className="input" type="date" defaultValue="2026-04-01" />
          </div>
          <div className="field">
            <label>Data fim</label>
            <input className="input" type="date" defaultValue="2026-04-12" />
          </div>
          <button className="btn primary"><Calculator size={16} />Calcular</button>
        </div>
      </div>
      <div className="grid-2">
        <div className="stat">
          <div className="label">Valor total no período</div>
          <div className="value">R$ 12.498,30</div>
          <div className="delta up"><TrendingUp size={14} />89 vendas</div>
        </div>
        <div className="stat">
          <div className="label">Lucro total no período</div>
          <div className="value" style={{ color: 'var(--ins-success-700)' }}>R$ 4.872,10</div>
          <div className="delta up"><TrendingUp size={14} />39% margem média</div>
        </div>
      </div>
    </div>
  );
}
