import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { api } from '../lib/api.js';

export default function Variacoes() {
  const [dims, setDims] = useState([]);
  const [nomeDim, setNomeDim] = useState('');
  const [novoValor, setNovoValor] = useState({});

  async function load() {
    const data = await api.gql(`{
      allVariationNames { id name values { id value } }
    }`);
    setDims(data.allVariationNames);
  }

  useEffect(() => { load(); }, []);

  async function criarDim(e) {
    e.preventDefault();
    await api.gql(`mutation { createVariationName(input: { name: "${nomeDim}" }) { id } }`);
    setNomeDim('');
    await load();
  }

  async function adicionarValor(nameId) {
    const val = novoValor[nameId]?.trim();
    if (!val) return;
    await api.gql(`mutation { addVariationValue(input: { nameId: ${nameId}, value: "${val}" }) { id } }`);
    setNovoValor(v => ({ ...v, [nameId]: '' }));
    await load();
  }

  async function excluirValor(id) {
    await api.gql(`mutation { deleteVariationValue(id: ${id}) }`);
    await load();
  }

  async function excluirDim(id) {
    if (!confirm('Excluir esta dimensão e todos os valores?')) return;
    await api.gql(`mutation { deleteVariationName(id: ${id}) }`);
    await load();
  }

  return (
    <div className="content">
      <div className="page-header">
        <div>
          <h1>Variações</h1>
          <div className="sub">Dimensões de variação de produto</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <form className="card-body" style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }} onSubmit={criarDim}>
          <div className="field" style={{ flex: 1, margin: 0 }}>
            <label>Nova dimensão</label>
            <input
              className="input"
              value={nomeDim}
              onChange={e => setNomeDim(e.target.value)}
              required
              placeholder="Ex: Tamanho"
            />
          </div>
          <button className="btn primary">Adicionar</button>
        </form>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {dims.map(d => (
          <div className="card" key={d.id}>
            <div className="card-header">
              <h2>{d.name}</h2>
              <span className="badge neutral">{d.values.length} valores</span>
              <button
                className="btn ghost sm icon-only"
                style={{ marginLeft: 'auto' }}
                onClick={() => excluirDim(d.id)}
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="card-body" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {d.values.map(v => (
                <span key={v.id} className="chip" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {v.value}
                  <button
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, color: 'var(--ins-fg-muted)' }}
                    onClick={() => excluirValor(v.id)}
                  >×</button>
                </span>
              ))}
              <input
                className="input"
                style={{ width: 100, height: 32, fontSize: 13 }}
                placeholder="+ valor"
                value={novoValor[d.id] || ''}
                onChange={e => setNovoValor(v => ({ ...v, [d.id]: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); adicionarValor(d.id); } }}
              />
            </div>
          </div>
        ))}
        {dims.length === 0 && (
          <div style={{ color: 'var(--ins-fg-muted)', fontSize: 14 }}>Nenhuma dimensão cadastrada.</div>
        )}
      </div>
    </div>
  );
}
