import { useState, useEffect } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { api } from '../lib/api.js';
import { fmtBRL } from '../lib/data.js';

export default function Historico() {
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState({ de: '', ate: '' });

  async function load() {
    setLoading(true);
    try {
      const params = [];
      if (filtro.de)  params.push(`dateFrom: "${filtro.de}"`);
      if (filtro.ate) params.push(`dateTo: "${filtro.ate}"`);
      const args = params.length ? `(${params.join(', ')})` : '';
      const data = await api.gql(`{
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

  useEffect(() => { load(); }, []);

  async function cancelarVenda(id) {
    if (!confirm(`Cancelar venda #${id} e restaurar o estoque?`)) return;
    await api.gql(`mutation { deleteSale(id: ${id}) }`);
    setVendas(prev => prev.filter(v => v.id !== id));
  }

  function fmtData(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="content">
      <div className="page-header">
        <div>
          <h1>Histórico de vendas</h1>
          <div className="sub">{vendas.length} vendas</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, alignItems: 'flex-end' }}>
          <div className="field">
            <label>De</label>
            <input className="input" type="date" value={filtro.de} onChange={e => setFiltro(f => ({ ...f, de: e.target.value }))} />
          </div>
          <div className="field">
            <label>Até</label>
            <input className="input" type="date" value={filtro.ate} onChange={e => setFiltro(f => ({ ...f, ate: e.target.value }))} />
          </div>
          <button className="btn primary" onClick={load}>
            <Search size={16} />Filtrar
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--ins-fg-muted)', padding: 24 }}>Carregando…</div>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Venda</th><th>Data</th><th>Itens</th>
                <th className="num">Valor total</th><th className="num">Lucro</th>
                <th className="actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              {vendas.map(v => (
                <tr key={v.id}>
                  <td><span className="price" style={{ fontWeight: 600 }}>#{v.id}</span></td>
                  <td>{fmtData(v.saleDate)}</td>
                  <td>{v.items.length}</td>
                  <td className="num" style={{ fontWeight: 600 }}>{fmtBRL(v.totalAmount)}</td>
                  <td className="num" style={{ color: 'var(--ins-success-700)' }}>{fmtBRL(v.totalProfit)}</td>
                  <td className="actions">
                    <button className="btn ghost sm icon-only" title="Cancelar venda" onClick={() => cancelarVenda(v.id)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {vendas.length === 0 && (
                <tr><td colSpan={6} style={{ color: 'var(--ins-fg-muted)', textAlign: 'center' }}>Nenhuma venda encontrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
