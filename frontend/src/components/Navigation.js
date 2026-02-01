import { NavLink } from 'react-router-dom';
import { Home, Map, Target, Users, User, Car, Radio, Building, Factory, Store } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Início' },
  { path: '/mapa', icon: Map, label: 'Mapa' },
  { path: '/missoes', icon: Target, label: 'Missões' },
  { path: '/gangue', icon: Users, label: 'Gangue' },
  { path: '/perfil', icon: User, label: 'Perfil' },
];

const sidebarItems = [
  { path: '/', icon: Home, label: 'Início' },
  { path: '/mapa', icon: Map, label: 'Mapa' },
  { path: '/missoes', icon: Target, label: 'Missões' },
  { path: '/veiculos', icon: Car, label: 'Veículos' },
  { path: '/propriedades', icon: Building, label: 'Propriedades' },
  { path: '/negocios', icon: Factory, label: 'Negócios' },
  { path: '/mercado', icon: Store, label: 'Mercado' },
  { path: '/eventos', icon: Radio, label: 'Eventos' },
  { path: '/gangue', icon: Users, label: 'Gangue' },
  { path: '/perfil', icon: User, label: 'Perfil' },
];

export const BottomNav = () => {
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50 md:hidden"
      data-testid="bottom-nav"
    >
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            data-testid={`nav-${label.toLowerCase()}`}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center px-3 py-2 transition-all ${
                isActive
                  ? 'text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`
            }
          >
            <Icon size={22} />
            <span className="text-[10px] mt-1 font-ui uppercase tracking-wider">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export const Sidebar = () => {
  return (
    <aside 
      className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 lg:w-56 bg-surface border-r border-border flex-col z-50"
      data-testid="sidebar"
    >
      <div className="p-4 border-b border-border">
        <h1 className="text-primary font-heading text-xl lg:text-2xl font-bold tracking-wider text-center lg:text-left">
          <span className="hidden lg:inline">SUBMUNDO</span>
          <span className="lg:hidden">SM</span>
        </h1>
      </div>
      
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {sidebarItems.map(({ path, icon: Icon, label }) => (
            <li key={path}>
              <NavLink
                to={path}
                data-testid={`sidebar-${label.toLowerCase()}`}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 lg:px-6 py-3 transition-all ${
                    isActive
                      ? 'text-primary bg-surface-highlight border-l-2 border-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-highlight hover:translate-x-1'
                  }`
                }
              >
                <Icon size={20} />
                <span className="hidden lg:block font-ui text-sm uppercase tracking-wider">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-border">
        <p className="text-text-secondary text-[10px] text-center lg:text-left uppercase tracking-widest">
          v1.1.0
        </p>
      </div>
    </aside>
  );
};
