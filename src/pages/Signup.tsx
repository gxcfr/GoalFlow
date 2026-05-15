import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Target, AlertCircle, Info, ArrowRight } from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'Employee',
    department: 'Engineering'
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: formData.role,
            department: formData.department
          }
        }
      });
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
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-mesh px-4 py-12 sm:px-6 lg:px-8 overflow-y-auto">
        <div className="w-full max-w-md space-y-8 animate-fade-in-up">
          <div>
            <div className="flex lg:hidden justify-center text-navy-900 mb-6">
              <Target className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Create your account</h2>
            <p className="mt-2 text-sm text-gray-600">Join GoalFlow to align with your organization.</p>
          </div>

          <div className="glass-panel p-8 rounded-2xl">
            <div className="mb-6 bg-blue-50/80 backdrop-blur-sm border-l-4 border-blue-400 p-4 rounded-r-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-blue-500" />
                </div>
                <div className="ml-3">
                  <p className="text-xs text-blue-800 leading-relaxed">
                    <strong>Demo Note:</strong> Role selection is open for demonstration. In production, Manager & Admin roles are invite-only.
                  </p>
                </div>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSignup}>
              {error && (
                <div className="bg-red-50/80 border-l-4 border-red-400 p-3 rounded-r-md animate-fade-in">
                  <div className="flex items-center text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {error}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input name="fullName" type="text" required value={formData.fullName} onChange={handleChange} className="w-full px-4 py-2.5 bg-white/60 border border-white/80 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all sm:text-sm" />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                  <input name="email" type="email" required value={formData.email} onChange={handleChange} className="w-full px-4 py-2.5 bg-white/60 border border-white/80 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all sm:text-sm" />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input name="password" type="password" required value={formData.password} onChange={handleChange} className="w-full px-4 py-2.5 bg-white/60 border border-white/80 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all sm:text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select name="role" value={formData.role} onChange={handleChange} className="w-full px-4 py-2.5 bg-white/60 border border-white/80 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all sm:text-sm">
                    <option value="Employee">Employee</option>
                    <option value="Manager_L1">Manager (L1)</option>
                    <option value="Admin_HR">Admin (HR)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input name="department" type="text" required value={formData.department} onChange={handleChange} className="w-full px-4 py-2.5 bg-white/60 border border-white/80 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all sm:text-sm" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="mt-6 group w-full flex justify-center items-center py-3 px-4 rounded-xl shadow-md text-sm font-semibold text-white bg-navy-900 hover:bg-navy-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-900 disabled:opacity-50 transition-all duration-200">
                {loading ? 'Creating...' : 'Sign up'}
                {!loading && <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Graphic */}
      <div className="hidden lg:flex lg:w-1/2 bg-mesh-dark relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-navy-900/60 backdrop-blur-[2px]"></div>
        <div className="relative z-10 flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="w-full max-w-sm glass-panel-dark p-6 rounded-2xl space-y-4">
            <div className="h-4 w-1/3 bg-white/20 rounded-full"></div>
            <div className="h-4 w-full bg-white/10 rounded-full"></div>
            <div className="h-4 w-5/6 bg-white/10 rounded-full"></div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="h-24 bg-blue-500/20 border border-blue-500/30 rounded-xl"></div>
              <div className="h-24 bg-white/5 border border-white/10 rounded-xl"></div>
            </div>
          </div>
        </div>
        
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]"></div>
      </div>
    </div>
  );
}
