import { Plus, Pencil, Trash2 } from 'lucide-react';
import { categorias, produtos } from '../lib/data.js';

export default function Categorias() {
  return (
    <div className="content">
      <div className="page-header">
        <div>
          <h1>Categorias</h1>
          <div className="sub">{categorias.length} categorias</div>
        </div>
        <button className="btn primary"><Plus size={16} />Nova categoria</button>
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
                <td className="num">{produtos.filter(p => p.categoria === c.id).length}</td>
                <td className="actions">
                  <button className="btn ghost sm icon-only"><Pencil size={14} /></button>
                  <button className="btn ghost sm icon-only"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
