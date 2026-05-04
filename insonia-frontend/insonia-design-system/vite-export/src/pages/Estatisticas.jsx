import { useState, useEffect } from 'react';
import { Calculator, TrendingUp, Receipt } from 'lucide-react';
import { api } from '../lib/api.js';
import { fmtBRL } from '../lib/data.js';

export default function Estatisticas() {
  const hoje = new Date().toISOString().slice(0, 10);
  const umMesAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [de, setDe] = useState(umMesAtras);
  const [ate, setAte] = useState(hoje);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  async function calcular() {
    setLoading(true);
    try {
      const data = await api.gql(`{
        salesSummary(dateFrom: "${de}", dateTo: "${ate}") {
          totalRevenue totalProfit saleCount avgTicket
        }
      }`);
      setSummary(data.salesSummary);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { calcular(); }, []);

  return (
    <div className="content">
      <div className="page-header">
        <div>
          <h1>Estatísticas</h1>
          <div className="sub">Filtro por período</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, alignItems: 'flex-end' }}>
          <div className="field">
            <label>Data início</label>
            <input className="input" type="date" value={de} onChange={e => setDe(e.target.value)} />
          </div>
          <div className="field">
            <label>Data fim</label>
            <input className="input" type="date" value={ate} onChange={e => setAte(e.target.value)} />
          </div>
          <button className="btn primary" onClick={calcular} disabled={loading}>
            <Calculator size={16} />{loading ? 'Calculando…' : 'Calcular'}
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid-2">
          <div className="stat">
            <div className="label">Faturamento no período</div>
            <div className="value">{fmtBRL(summary.totalRevenue)}</div>
            <div className="delta up"><Receipt size={14} />{summary.saleCount} vendas</div>
          </div>
          <div className="stat">
            <div className="label">Lucro no período</div>
            <div className="value" style={{ color: 'var(--ins-success-700)' }}>{fmtBRL(summary.totalProfit)}</div>
            <div className="delta up"><TrendingUp size={14} />Ticket médio {fmtBRL(summary.avgTicket)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
