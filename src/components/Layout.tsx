import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, LayoutDashboard, Target as TargetIcon, Users } from 'lucide-react';
import Logo from './logo';
import LogoMark from './tinylogo';

export default function Layout() {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  const getNavigation = () => {
    switch (profile?.role) {
      case 'Employee':
        return [{ name: 'My Goals', href: '/goals', icon: TargetIcon }];
      case 'Manager_L1':
        return [
          { name: 'My Team', href: '/manager', icon: Users },
        ];
      case 'Admin_HR':
        return [
          { name: 'Admin Dashboard', href: '/admin', icon: LayoutDashboard },
        ];
      default:
        return [];
    }
  };

  const navigation = getNavigation();

  return (
    <div className="min-h-screen bg-mesh flex text-gray-900 font-sans">
      <div className="hidden md:flex md:flex-col p-6 pr-0 z-50 group transition-all duration-300 ease-in-out w-[120px] hover:w-72">
        <div className="flex flex-col flex-grow bg-mesh-dark relative rounded-3xl overflow-hidden animate-fade-in transition-all duration-300 shadow-2xl">
          <div className="absolute inset-0 bg-navy-900/40 z-0"></div>
          
          <div className="relative z-10 flex flex-col flex-grow">
            <div className="flex items-center flex-shrink-0 py-8 relative h-24 w-full">
              {/* Tiny Logo - Shows when unhovered, perfectly centered */}
              <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 opacity-100 group-hover:opacity-0 scale-100 group-hover:scale-75">
                <LogoMark className="h-8 w-8 drop-shadow-md" />
              </div>
              {/* Full Logo - Shows when hovered, left aligned matching the nav items */}
              <div className="absolute inset-0 flex items-center px-6 transition-all duration-300 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100">
                <Logo className="h-10 w-auto drop-shadow-md" />
              </div>
            </div>
            
            <div className="mt-4 flex-grow flex flex-col">
              <nav className="flex-1 px-4 space-y-2">
                {navigation.map((item, index) => {
                  const isActive = location.pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-white/20 text-white shadow-md backdrop-blur-md translate-x-1'
                          : 'text-blue-100 hover:bg-white/10 hover:text-white hover:translate-x-1'
                      }`}
                      style={{ animationDelay: `${0.1 * index}s` }}
                    >
                      <item.icon
                        className={`flex-shrink-0 h-5 w-5 transition-colors ${
                          isActive ? 'text-white' : 'text-blue-200 group-hover:text-white'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="ml-3 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden p-6 pl-6">
        {/* Top Header Pill */}
        <div className="w-full flex justify-end mb-6">
          <div className="bg-mesh-dark relative overflow-hidden rounded-full shadow-lg border border-white/10 flex items-center pr-2 pl-6 py-2">
            <div className="absolute inset-0 bg-navy-900/40 z-0"></div>
            <div className="relative z-10 flex items-center space-x-4">
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-white leading-tight">{profile?.full_name}</span>
                <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">{profile?.role.replace('_', ' ')}</span>
              </div>
              <button
                onClick={signOut}
                className="p-2 bg-white/10 hover:bg-red-500/90 hover:text-white text-blue-100 rounded-full transition-colors backdrop-blur-sm"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none scrollbar-hide">
          <div className="h-full">
            <div className="max-w-7xl mx-auto h-full flex flex-col animate-fade-in-up">
              <div className="flex-grow">
                <Outlet />
              </div>
              
              {/* Footer Credits */}
              <div className="mt-12 py-6 border-t border-white/20 text-center flex flex-col items-center justify-center space-y-2">
                <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">
                  Handcrafted with precision & styled for excellence
                </p>
                <div className="flex items-center space-x-2 text-sm text-gray-500 font-semibold">
                  <span>Created by Gajendra C</span>
                  <span className="text-gray-300">•</span>
                  <a href="https://www.linkedin.com/in/gajendrac/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors">LinkedIn</a>
                  <span className="text-gray-300">•</span>
                  <a href="https://github.com/gxcfr" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">GitHub</a>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
