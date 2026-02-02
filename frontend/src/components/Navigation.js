import { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { 
  Home, Map, Target, Users, User, Car, Radio, Building, Factory, Store, 
  Newspaper, HelpCircle, Shield, ScrollText, Menu, X, ChevronRight,
  DollarSign, Wallet, UserCheck, Landmark
} from 'lucide-react';

// Main navigation items for mobile bottom bar
const navItems = [
  { path: '/dashboard', icon: Home, label: 'Início' },
  { path: '/missoes', icon: Target, label: 'Missões' },
  { path: '/mapa', icon: Map, label: 'Mapa' },
  { path: '/gangue', icon: Users, label: 'Gangue' },
];

// All menu items organized by sections
const menuSections = [
  {
    title: 'Principal',
    items: [
      { path: '/dashboard', icon: Home, label: 'Início' },
      { path: '/mapa', icon: Map, label: 'Mapa' },
      { path: '/missoes', icon: Target, label: 'Missões' },
    ]
  },
  {
    title: 'Negócios',
    items: [
      { path: '/banco', icon: Landmark, label: 'Banco' },
      { path: '/propriedades', icon: Building, label: 'Propriedades' },
      { path: '/negocios', icon: Factory, label: 'Negócios' },
      { path: '/mercado', icon: Store, label: 'Mercado' },
      { path: '/veiculos', icon: Car, label: 'Veículos' },
    ]
  },
  {
    title: 'Social',
    items: [
      { path: '/gangue', icon: Users, label: 'Gangue' },
      { path: '/contactos', icon: UserCheck, label: 'Contactos' },
      { path: '/eventos', icon: Radio, label: 'Eventos' },
    ]
  },
  {
    title: 'Informações',
    items: [
      { path: '/novidades', icon: Newspaper, label: 'Novidades' },
      { path: '/faq', icon: HelpCircle, label: 'FAQ' },
      { path: '/perfil', icon: User, label: 'Perfil' },
    ]
  },
  {
    title: 'Legal',
    items: [
      { path: '/privacidade', icon: Shield, label: 'Privacidade' },
      { path: '/termos', icon: ScrollText, label: 'Termos' },
    ]
  },
];

// Sidebar items for desktop
const sidebarItems = [
  { path: '/dashboard', icon: Home, label: 'Início' },
  { path: '/mapa', icon: Map, label: 'Mapa' },
  { path: '/missoes', icon: Target, label: 'Missões' },
  { path: '/banco', icon: Landmark, label: 'Banco' },
  { path: '/veiculos', icon: Car, label: 'Veículos' },
  { path: '/propriedades', icon: Building, label: 'Propriedades' },
  { path: '/negocios', icon: Factory, label: 'Negócios' },
  { path: '/mercado', icon: Store, label: 'Mercado' },
  { path: '/eventos', icon: Radio, label: 'Eventos' },
  { path: '/gangue', icon: Users, label: 'Gangue' },
  { path: '/novidades', icon: Newspaper, label: 'Novidades' },
  { path: '/perfil', icon: User, label: 'Perfil' },
];

const footerLinks = [
  { path: '/faq', label: 'FAQ' },
  { path: '/privacidade', label: 'Privacidade' },
  { path: '/termos', label: 'Termos' },
];

// Mobile Menu Drawer
const MobileMenu = ({ isOpen, onClose }) => {
  const location = useLocation();
  
  if (!isOpen) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 z-[60] md:hidden"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-[280px] bg-surface border-l border-border z-[70] md:hidden overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-heading text-xl text-primary">Menu</h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-highlight text-text-secondary hover:text-primary transition-all"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Menu Sections */}
        <div className="p-4 space-y-6">
          {menuSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-[10px] font-ui uppercase tracking-widest text-text-secondary mb-2 px-2">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map(({ path, icon: Icon, label }) => (
                  <NavLink
                    key={path}
                    to={path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                        isActive
                          ? 'bg-primary/20 text-primary border-l-2 border-primary'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-highlight'
                      }`
                    }
                  >
                    <Icon size={20} />
                    <span className="font-ui text-sm">{label}</span>
                    <ChevronRight size={16} className="ml-auto opacity-50" />
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-border mt-4">
          <p className="text-text-secondary text-[10px] text-center uppercase tracking-widest">
            SUBMUNDO v1.3.0
          </p>
        </div>
      </div>
    </>
  );
};

export const BottomNav = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  
  return (
    <>
      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      
      <nav 
        className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50 md:hidden safe-area-bottom"
        data-testid="bottom-nav"
      >
        <div className="flex justify-around items-center h-16 px-1">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              data-testid={`nav-${label.toLowerCase()}`}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center px-2 py-2 min-w-[60px] transition-all ${
                  isActive
                    ? 'text-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`
              }
            >
              <Icon size={22} />
              <span className="text-[9px] mt-1 font-ui uppercase tracking-wider">{label}</span>
            </NavLink>
          ))}
          
          {/* Menu Button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center justify-center px-2 py-2 min-w-[60px] text-text-secondary hover:text-primary transition-all"
          >
            <Menu size={22} />
            <span className="text-[9px] mt-1 font-ui uppercase tracking-wider">Mais</span>
          </button>
        </div>
      </nav>
    </>
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
      
      <div className="p-4 border-t border-border space-y-2">
        <div className="hidden lg:flex flex-wrap gap-2 text-[10px]">
          {footerLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className="text-text-secondary hover:text-primary transition-all"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <p className="text-text-secondary text-[10px] text-center lg:text-left uppercase tracking-widest">
          v1.3.0
        </p>
      </div>
    </aside>
  );
};
