import { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { api } from '../lib/api.js';

export default function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [nome, setNome] = useState('');
  const [editando, setEditando] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const data = await api.gql(`{ allCategories { id name slug } }`);
    setCategorias(data.allCategories);
  }

  useEffect(() => { load(); }, []);

  async function salvar(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editando) {
        await api.gql(`mutation { updateCategory(id: ${editando.id}, input: { name: "${nome}" }) { id } }`);
        setEditando(null);
      } else {
        await api.gql(`mutation { createCategory(input: { name: "${nome}" }) { id } }`);
      }
      setNome('');
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function excluir(id) {
    if (!confirm('Excluir esta categoria?')) return;
    await api.gql(`mutation { deleteCategory(id: ${id}) }`);
    setCategorias(prev => prev.filter(c => c.id !== id));
  }

  return (
    <div className="content">
      <div className="page-header">
        <div>
          <h1>Categorias</h1>
          <div className="sub">{categorias.length} categorias</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <form className="card-body" style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }} onSubmit={salvar}>
          <div className="field" style={{ flex: 1, margin: 0 }}>
            <label>{editando ? 'Editar categoria' : 'Nova categoria'}</label>
            <input
              className="input"
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
              placeholder="Ex: Calçados"
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

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Nome</th><th>Slug</th>
              <th className="num">Produtos</th>
              <th className="actions">Ações</th>
            </tr>
          </thead>
          <tbody>
            {categorias.map(c => (
              <tr key={c.id}>
                <td style={{ fontWeight: 500 }}>{c.name}</td>
                <td>
                  <span className="price" style={{ color: 'var(--ins-fg-muted)', fontSize: 12 }}>/{c.slug}</span>
                </td>
                <td className="num">—</td>
                <td className="actions">
                  <button className="btn ghost sm icon-only" onClick={() => { setEditando(c); setNome(c.name); }}>
                    <Pencil size={14} />
                  </button>
                  <button className="btn ghost sm icon-only" onClick={() => excluir(c.id)}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
