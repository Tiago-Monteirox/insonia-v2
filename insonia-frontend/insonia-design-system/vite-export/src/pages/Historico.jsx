import { Calendar, Download, Eye, Printer } from 'lucide-react';
import { vendas, fmtBRL } from '../lib/data.js';

export default function Historico() {
  return (
    <div className="content">
      <div className="page-header">
        <div>
          <h1>Histórico de vendas</h1>
          <div className="sub">Últimos 7 dias</div>
        </div>
        <div className="row">
          <button className="btn secondary"><Calendar size={16} />05 – 12 abr</button>
          <button className="btn secondary"><Download size={16} />Exportar</button>
        </div>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Venda</th><th>Data</th><th>Usuário</th><th>Itens</th>
              <th className="num">Valor total</th><th className="num">Lucro</th>
              <th>Status</th><th className="actions">Ações</th>
            </tr>
          </thead>
          <tbody>
            {vendas.map(v => (
              <tr key={v.id}>
                <td><span className="price" style={{ fontWeight: 600 }}>#{v.id}</span></td>
                <td>{v.data}</td>
                <td>{v.usuario}</td>
                <td>{v.itens}</td>
                <td className="num" style={{ fontWeight: 600 }}>{fmtBRL(v.valor_total)}</td>
                <td className="num" style={{ color: 'var(--ins-success-700)' }}>{fmtBRL(v.lucro_total)}</td>
                <td><span className="badge success"><span className="dot"></span>{v.status}</span></td>
                <td className="actions">
                  <button className="btn ghost sm icon-only"><Eye size={14} /></button>
                  <button className="btn ghost sm icon-only"><Printer size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
