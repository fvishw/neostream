import { useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const AUTH_PATHS = ['/login', '/register'];

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const isAuthPage = AUTH_PATHS.includes(pathname);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-cream">
      <Header />
      <div className="flex min-h-0 flex-1">
        {!isAuthPage && <Sidebar />}
        <main
          className={`min-h-0 flex-1 overflow-y-auto ${
            isAuthPage ? 'flex flex-col items-center justify-center p-6' : 'p-6'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
