// Sidebar component
const { useState } = React;

function Sidebar({ current, onNavigate }) {
  const items = [
    { group: 'Principal', links: [
      { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
      { id: 'pdv', label: 'Registrar venda', icon: 'shopping-cart' },
    ]},
    { group: 'Catálogo', links: [
      { id: 'produtos', label: 'Produtos', icon: 'package' },
      { id: 'categorias', label: 'Categorias', icon: 'tag' },
      { id: 'marcas', label: 'Marcas', icon: 'bookmark' },
      { id: 'variacoes', label: 'Variações', icon: 'layers' },
    ]},
    { group: 'Vendas', links: [
      { id: 'historico', label: 'Histórico', icon: 'receipt' },
      { id: 'estatisticas', label: 'Estatísticas', icon: 'bar-chart-3' },
    ]},
  ];

  React.useEffect(() => { if (window.lucide) lucide.createIcons(); }, [current]);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="mark" style={{background:'#fff', padding:2}}><img src="../../assets/insonia-logo.png" alt="Insonia"/></div>
        <div className="name">Insônia<small>gestão + PDV</small></div>
      </div>
      {items.map(section => (
        <div className="sidebar-group" key={section.group}>
          <div className="group-label">{section.group}</div>
          {section.links.map(link => (
            <button
              key={link.id}
              className={`nav-item ${current === link.id ? 'active' : ''}`}
              onClick={() => onNavigate(link.id)}
            >
              <i data-lucide={link.icon} style={{width:18,height:18}}></i>
              <span>{link.label}</span>
            </button>
          ))}
        </div>
      ))}
      <div className="sidebar-user">
        <div className="avatar">TM</div>
        <div className="info">Tiago Monteiro<small>Administrador</small></div>
        <i data-lucide="settings" style={{width:16,height:16,color:'var(--ins-neutral-400)',cursor:'pointer'}}></i>
      </div>
    </aside>
  );
}

function Topbar({ title, children }) {
  React.useEffect(() => { if (window.lucide) lucide.createIcons(); });
  return (
    <header className="topbar">
      <h1>{title}</h1>
      <div className="spacer"></div>
      <div className="search">
        <i data-lucide="search"></i>
        <input placeholder="Buscar produto, venda, cliente…" />
      </div>
      {children}
    </header>
  );
}

window.Sidebar = Sidebar;
window.Topbar = Topbar;
