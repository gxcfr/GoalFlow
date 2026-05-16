import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, LayoutDashboard, Target as TargetIcon, Users, Menu, X } from 'lucide-react';
import React, { useState } from 'react';
import Logo from './logo';
import LogoMark from './tinylogo';

export default function Layout() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    <div className="min-h-screen bg-mesh flex flex-col md:flex-row text-gray-900 font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-6 py-4 bg-mesh-dark text-white shadow-lg sticky top-0 z-50">
        <Logo className="h-8 w-auto text-white" />
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-xl bg-white/10 text-white"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] flex">
          <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-mesh-dark shadow-2xl animate-fade-in">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-6">
                <Logo className="h-10 w-auto text-white" />
              </div>
              <nav className="mt-8 px-4 space-y-2">
                {navigation.map((item) => {
                  const isActive = location.pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                        isActive
                          ? 'bg-white/20 text-white shadow-md'
                          : 'text-blue-100 hover:bg-white/10'
                      }`}
                    >
                      <item.icon className="mr-4 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
                <button
                  onClick={() => {
                    signOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-3 text-sm font-semibold rounded-xl text-red-300 hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="mr-4 h-5 w-5" />
                  Sign out
                </button>
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-white/10 p-6">
              <div className="flex-shrink-0 group block">
                <div className="flex items-center">
                  <div>
                    <div className="inline-block h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                      <span className="text-white font-bold">{profile?.full_name?.charAt(0)}</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-white">{profile?.full_name}</p>
                    <p className="text-xs font-medium text-blue-200 uppercase tracking-widest">{profile?.role.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-col p-6 pr-0 z-50 group transition-all duration-300 ease-in-out w-[120px] hover:w-72">
        <div className="flex flex-col flex-grow bg-mesh-dark relative rounded-3xl overflow-hidden animate-fade-in transition-all duration-300 shadow-2xl">
          <div className="absolute inset-0 bg-navy-900/40 z-0"></div>
          
          <div className="relative z-10 flex flex-col flex-grow">
            <div className="flex items-center flex-shrink-0 py-8 relative h-24 w-full">
              <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 opacity-100 group-hover:opacity-0 scale-100 group-hover:scale-75">
                <LogoMark className="h-8 w-8 drop-shadow-md text-white" />
              </div>
              <div className="absolute inset-0 flex items-center px-6 transition-all duration-300 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100">
                <Logo className="h-10 w-auto drop-shadow-md text-white" />
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
      <div className="flex flex-col w-0 flex-1 overflow-hidden p-0 md:p-6 md:pl-6">
        {/* Desktop Top Header Pill */}
        <div className="hidden md:flex w-full justify-end mb-6">
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

        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none scrollbar-hide p-6 md:p-0">
          <div className="h-full">
            <div className="max-w-7xl mx-auto h-full flex flex-col animate-fade-in-up">
              <div className="flex-grow">
                <Outlet />
              </div>
              
              {/* Footer Credits */}
              <div className="mt-12 py-6 border-t border-gray-200/50 text-center flex flex-col items-center justify-center space-y-2">
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
