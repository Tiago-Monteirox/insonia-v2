import { useEffect } from 'react';
import { NavLink, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, Tag, Bookmark, Layers,
  Receipt, BarChart3, Settings, Bell, LogOut, Search,
} from 'lucide-react';
import { api } from '../lib/api.js';
import logoUrl from '../assets/insonia-logo.png';

const NAV = [
  { group: 'Principal', links: [
    { to: '/',          label: 'Dashboard',       icon: LayoutDashboard },
    { to: '/pdv',       label: 'Registrar venda', icon: ShoppingCart },
  ]},
  { group: 'Catálogo', links: [
    { to: '/produtos',   label: 'Produtos',   icon: Package },
    { to: '/categorias', label: 'Categorias', icon: Tag },
    { to: '/marcas',     label: 'Marcas',     icon: Bookmark },
    { to: '/variacoes',  label: 'Variações',  icon: Layers },
  ]},
  { group: 'Vendas', links: [
    { to: '/historico',     label: 'Histórico',     icon: Receipt },
    { to: '/estatisticas',  label: 'Estatísticas',  icon: BarChart3 },
  ]},
];

const TITLES = {
  '/': 'Dashboard',
  '/pdv': 'Registrar venda',
  '/produtos': 'Produtos',
  '/categorias': 'Categorias',
  '/marcas': 'Marcas',
  '/variacoes': 'Variações',
  '/historico': 'Histórico',
  '/estatisticas': 'Estatísticas',
};

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await api.logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Topbar title={TITLES[location.pathname] || 'Insônia'} onLogout={handleLogout} />
        <Outlet />
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="mark" style={{ background: '#fff', padding: 2 }}>
          <img src={logoUrl} alt="Insonia" />
        </div>
        <div className="name">Insônia<small>gestão + PDV</small></div>
      </div>
      {NAV.map(section => (
        <div className="sidebar-group" key={section.group}>
          <div className="group-label">{section.group}</div>
          {section.links.map(link => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </div>
      ))}
      <div className="sidebar-user">
        <div className="avatar">TM</div>
        <div className="info">Tiago Monteiro<small>Administrador</small></div>
        <Settings size={16} style={{ color: 'var(--ins-neutral-400)', cursor: 'pointer' }} />
      </div>
    </aside>
  );
}

function Topbar({ title, onLogout }) {
  return (
    <header className="topbar">
      <h1>{title}</h1>
      <div className="spacer"></div>
      <div className="search">
        <Search size={16} />
        <input placeholder="Buscar produto, venda, cliente…" />
      </div>
      <button className="btn ghost icon-only" aria-label="Notificações"><Bell size={16} /></button>
      <button className="btn ghost sm" onClick={onLogout}><LogOut size={16} />Sair</button>
    </header>
  );
}
