import { Link } from 'react-router-dom';
import { Sidebar, BottomNav } from './Navigation';
import { Header } from './Header';
import { Notification } from './Notification';
import { Skull, ArrowLeft, Newspaper, HelpCircle, Shield, ScrollText } from 'lucide-react';

export const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <BottomNav />
      
      <main className="md:ml-20 lg:ml-56 pb-24 md:pb-0">
        <Header />
        <div className="p-3 sm:p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
      
      <Notification />
    </div>
  );
};

// Layout for public pages (no auth required)
export const PublicLayout = ({ children }) => {
  const footerLinks = [
    { to: '/novidades', icon: Newspaper, label: 'Novidades' },
    { to: '/faq', icon: HelpCircle, label: 'FAQ' },
    { to: '/privacidade', icon: Shield, label: 'Privacidade' },
    { to: '/termos', icon: ScrollText, label: 'Termos' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header */}
      <header className="sticky top-0 bg-surface/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface border border-primary flex items-center justify-center">
              <Skull size={20} className="text-primary" />
            </div>
            <h1 className="text-primary font-heading text-xl font-bold tracking-wider">
              SUBMUNDO
            </h1>
          </Link>
          <Link 
            to="/" 
            className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Voltar ao Jogo</span>
          </Link>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 pb-24">
        {children}
      </main>
      
      {/* Simple Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border py-3 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
          {footerLinks.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-1.5 text-text-secondary hover:text-primary transition-colors text-xs sm:text-sm"
            >
              <Icon size={14} />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </footer>
    </div>
  );
};
