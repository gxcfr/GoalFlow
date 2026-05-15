import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Target, LogOut, LayoutDashboard, Target as TargetIcon, Users } from 'lucide-react';

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
      {/* Floating Sidebar */}
      <div className="hidden md:flex md:w-72 md:flex-col p-6 pr-0">
        <div className="flex flex-col flex-grow glass-panel rounded-3xl overflow-hidden animate-fade-in">
          <div className="flex items-center flex-shrink-0 px-6 py-8">
            <div className="w-10 h-10 bg-navy-900 rounded-xl flex items-center justify-center shadow-md">
              <Target className="h-6 w-6 text-white" />
            </div>
            <span className="ml-3 text-2xl font-bold text-navy-900 tracking-tight">GoalFlow</span>
          </div>
          
          <div className="mt-4 flex-grow flex flex-col">
            <nav className="flex-1 px-4 space-y-2">
              {navigation.map((item, index) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-navy-900 text-white shadow-md shadow-navy-900/20 translate-x-1'
                        : 'text-gray-600 hover:bg-white/50 hover:text-navy-900 hover:translate-x-1'
                    }`}
                    style={{ animationDelay: `${0.1 * index}s` }}
                  >
                    <item.icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors ${
                        isActive ? 'text-white' : 'text-gray-400 group-hover:text-navy-700'
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="flex-shrink-0 p-4 m-4 glass-panel bg-white/40 rounded-2xl border border-white/40">
            <div className="flex items-center justify-between">
              <div className="truncate pr-2">
                <p className="text-sm font-bold text-gray-900 truncate">{profile?.full_name}</p>
                <p className="text-xs font-medium text-gray-500 mt-0.5">{profile?.role.replace('_', ' ')}</p>
              </div>
              <button
                onClick={signOut}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors bg-white/50"
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden p-6 pl-6">
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none scrollbar-hide">
          <div className="h-full">
            <div className="max-w-7xl mx-auto h-full animate-fade-in-up">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
