import { Plus, MoreHorizontal } from 'lucide-react';
import { marcas, produtos } from '../lib/data.js';

export default function Marcas() {
  return (
    <div className="content">
      <div className="page-header">
        <div>
          <h1>Marcas</h1>
          <div className="sub">{marcas.length} marcas</div>
        </div>
        <button className="btn primary"><Plus size={16} />Nova marca</button>
      </div>
      <div className="grid-4">
        {marcas.map(m => (
          <div className="card" key={m.id}>
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="thumb-sm" style={{ width: 44, height: 44, fontSize: 16 }}>{m.name[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ins-fg-muted)' }}>
                  {produtos.filter(p => p.marca === m.id).length} produtos
                </div>
              </div>
              <button className="btn ghost sm icon-only"><MoreHorizontal size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
