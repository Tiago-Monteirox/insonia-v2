import { Plus } from 'lucide-react';

export default function Variacoes() {
  const dims = [
    { name: 'Tamanho', valores: ['PP', 'P', 'M', 'G', 'GG', 'XG'] },
    { name: 'Cor', valores: ['Preto', 'Branco', 'Azul', 'Vermelho', 'Verde', 'Cinza'] },
    { name: 'Numeração', valores: ['38', '39', '40', '41', '42', '43', '44'] },
  ];
  return (
    <div className="content">
      <div className="page-header">
        <div>
          <h1>Variações</h1>
          <div className="sub">Dimensões de variação de produto</div>
        </div>
        <button className="btn primary"><Plus size={16} />Nova dimensão</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {dims.map(d => (
          <div className="card" key={d.name}>
            <div className="card-header">
              <h2>{d.name}</h2>
              <span className="badge neutral">{d.valores.length} valores</span>
            </div>
            <div className="card-body" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {d.valores.map(v => <span key={v} className="chip">{v}</span>)}
              <button className="chip" style={{ borderStyle: 'dashed', color: 'var(--ins-fg-muted)' }}>
                + adicionar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
