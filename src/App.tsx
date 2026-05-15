import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import AdminDashboard from './pages/AdminDashboard';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  
  if (profile) {
    if (allowedRoles && !allowedRoles.includes(profile.role)) {
      if (profile.role === 'Employee') return <Navigate to="/goals" replace />;
      if (profile.role === 'Manager_L1') return <Navigate to="/manager" replace />;
      if (profile.role === 'Admin_HR') return <Navigate to="/admin" replace />;
    }
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/goals" element={
              <ProtectedRoute allowedRoles={['Employee', 'Manager_L1']}>
                <EmployeeDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/manager" element={
              <ProtectedRoute allowedRoles={['Manager_L1']}>
                <ManagerDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['Admin_HR']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            
            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/goals" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
