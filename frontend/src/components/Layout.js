import { Sidebar, BottomNav } from './Navigation';
import { Header } from './Header';
import { Notification } from './Notification';

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
