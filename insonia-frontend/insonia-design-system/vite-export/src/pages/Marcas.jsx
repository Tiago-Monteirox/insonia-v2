import { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { api } from '../lib/api.js';

export default function Marcas() {
  const [marcas, setMarcas] = useState([]);
  const [nome, setNome] = useState('');
  const [editando, setEditando] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const data = await api.gql(`{ allBrands { id name slug } }`);
    setMarcas(data.allBrands);
  }

  useEffect(() => { load(); }, []);

  async function salvar(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editando) {
        await api.gql(`mutation { updateBrand(id: ${editando.id}, input: { name: "${nome}" }) { id } }`);
        setEditando(null);
      } else {
        await api.gql(`mutation { createBrand(input: { name: "${nome}" }) { id } }`);
      }
      setNome('');
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function excluir(id) {
    if (!confirm('Excluir esta marca?')) return;
    await api.gql(`mutation { deleteBrand(id: ${id}) }`);
    setMarcas(prev => prev.filter(m => m.id !== id));
  }

  return (
    <div className="content">
      <div className="page-header">
        <div>
          <h1>Marcas</h1>
          <div className="sub">{marcas.length} marcas</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <form className="card-body" style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }} onSubmit={salvar}>
          <div className="field" style={{ flex: 1, margin: 0 }}>
            <label>{editando ? 'Editar marca' : 'Nova marca'}</label>
            <input
              className="input"
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
              placeholder="Ex: Nike"
            />
          </div>
          <button className="btn primary" disabled={saving}>
            {saving ? 'Salvando…' : editando ? 'Atualizar' : 'Adicionar'}
          </button>
          {editando && (
            <button type="button" className="btn secondary" onClick={() => { setEditando(null); setNome(''); }}>
              Cancelar
            </button>
          )}
        </form>
      </div>

      <div className="grid-4">
        {marcas.map(m => (
          <div className="card" key={m.id}>
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="thumb-sm" style={{ width: 44, height: 44, fontSize: 16 }}>{m.name[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{m.name}</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn ghost sm icon-only" onClick={() => { setEditando(m); setNome(m.name); }}>
                  <Pencil size={14} />
                </button>
                <button className="btn ghost sm icon-only" onClick={() => excluir(m.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {marcas.length === 0 && (
          <div style={{ color: 'var(--ins-fg-muted)', fontSize: 14 }}>Nenhuma marca cadastrada.</div>
        )}
      </div>
    </div>
  );
}
