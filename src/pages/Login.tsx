import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import Logo from '../components/logo';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      // Fetch profile to determine redirect
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();

      if (profile?.role === 'Manager_L1') {
        navigate('/manager?tab=team');
      } else if (profile?.role === 'Admin_HR') {
        navigate('/admin?tab=overview');
      } else {
        navigate('/goals?tab=builder');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-[#020617] selection:bg-blue-500/30 selection:text-blue-200">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .perspective-1000 { perspective: 1000px; }
        .login-card {
          transform-style: preserve-3d;
          transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .login-card:hover {
          transform: rotateX(2deg) rotateY(2deg) translateY(-5px);
          box-shadow: 
            20px 20px 60px rgba(0, 0, 0, 0.4),
            -5px -5px 20px rgba(255, 255, 255, 0.05);
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }
      `}</style>

      {/* Left Side - Dark Premium Graphic */}
      <div className="hidden lg:flex lg:w-3/5 bg-mesh-dark relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-navy-900/60 z-10"></div>
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[150px] animate-float"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-navy-900/40 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative z-20 flex flex-col items-center text-center px-12 animate-fade-in-up">
          <div className="mb-12 flex items-center justify-center transform hover:scale-110 transition-transform duration-500 cursor-none">
            <Logo className="h-24 w-auto drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] text-white" />
          </div>
          <h1 className="text-6xl font-black text-white mb-8 tracking-tighter leading-none">
            Scale Your <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Ambitions.</span>
          </h1>
          <p className="text-xl text-blue-100/60 max-w-lg font-medium leading-relaxed">
            The next generation of organizational goal alignment. Handcrafted for performance-driven teams.
          </p>
          
          <div className="mt-16 flex gap-8 items-center justify-center grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
             <div className="flex flex-col items-center">
               <span className="text-3xl font-black text-white">500+</span>
               <span className="text-[10px] uppercase font-bold tracking-widest text-blue-200">Teams</span>
             </div>
             <div className="w-px h-8 bg-white/20"></div>
             <div className="flex flex-col items-center">
               <span className="text-3xl font-black text-white">99%</span>
               <span className="text-[10px] uppercase font-bold tracking-widest text-blue-200">Adoption</span>
             </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-2/5 flex items-center justify-center bg-[#020617] px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background blobs for mobile */}
        <div className="lg:hidden absolute top-0 left-0 w-full h-full -z-10">
          <div className="absolute top-[-20%] left-[-20%] w-full h-full bg-blue-900/20 rounded-full blur-[100px]"></div>
        </div>

        <div className="w-full max-w-md space-y-8 perspective-1000">
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex lg:hidden justify-center mb-8">
              <Logo className="h-12 w-auto text-white" />
            </div>
            <h2 className="text-4xl font-black text-white tracking-tight">Login.</h2>
            <p className="mt-2 text-sm text-gray-400 font-medium">Elevate your performance ecosystem today.</p>
          </div>

          <div className="login-card glass-panel p-10 rounded-[2.5rem] animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <form className="space-y-6" onSubmit={handleLogin}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl animate-shake">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                    <p className="ml-3 text-xs text-red-400 font-bold leading-tight">{error}</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all sm:text-sm font-medium"
                  placeholder="name@enterprise.com"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Password</label>
                </div>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all sm:text-sm font-medium"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-blue-400 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group w-full relative flex justify-center items-center py-5 px-4 border border-transparent rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.2)] text-sm font-black text-white bg-blue-600 hover:bg-blue-500 hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-300 transform active:scale-95"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Authenticating...
                  </div>
                ) : (
                  <>
                    <span className="uppercase tracking-widest">Enter Portal</span>
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-xs text-gray-500 font-bold">
                New to GoalFlow?{' '}
                <Link to="/signup" className="text-blue-400 hover:text-blue-300 transition-colors underline underline-offset-4 decoration-blue-400/30">
                  Request access
                </Link>
              </p>
            </div>
          </div>
          

        </div>
      </div>
    </div>
  );
}
