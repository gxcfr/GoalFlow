import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Target, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Left Side - Dark Premium Graphic */}
      <div className="hidden lg:flex lg:w-1/2 bg-mesh-dark relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-navy-900/40"></div>
        <div className="relative z-10 flex flex-col items-center text-center px-12 animate-fade-in-up">
          <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mb-8 border border-white/20 shadow-2xl">
            <Target className="h-12 w-12 text-blue-400" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-6 tracking-tight">Enterprise Goal Tracking</h1>
          <p className="text-lg text-blue-100/80 max-w-md font-light leading-relaxed">
            Align your organization's objectives, streamline managerial reviews, and accelerate performance with GoalFlow.
          </p>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-navy-500/30 rounded-full blur-[100px]"></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-mesh px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div>
            <div className="flex lg:hidden justify-center text-navy-900 mb-6">
              <Target className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back</h2>
            <p className="mt-2 text-sm text-gray-600">Please enter your credentials to access your portal.</p>
          </div>

          <div className="glass-panel p-8 rounded-2xl">
            <form className="space-y-6" onSubmit={handleLogin}>
              {error && (
                <div className="bg-red-50/80 backdrop-blur-sm border-l-4 border-red-400 p-4 rounded-r-md animate-fade-in">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700 font-medium">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 bg-white/60 border border-white/80 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all sm:text-sm"
                  placeholder="name@company.com"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 bg-white/60 border border-white/80 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all sm:text-sm"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-navy-900 hover:bg-navy-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-900 disabled:opacity-50 transition-all duration-200"
              >
                {loading ? 'Signing in...' : 'Sign in'}
                {!loading && <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/signup" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                  Create one now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
