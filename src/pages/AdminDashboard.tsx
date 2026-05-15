import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Send, Users, Check } from 'lucide-react';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState({
    thrust_area: 'Department KPI',
    title: '',
    description: '',
    uom: 'Numeric',
    target_value: '',
    weightage: 10
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'Employee').order('full_name', { ascending: true });
    setEmployees(data || []);
  };

  const handleToggleEmployee = (id: string) => {
    const newSet = new Set(selectedEmployees);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedEmployees(newSet);
  };

  const handleSelectAll = () => {
    if (selectedEmployees.size === employees.length) setSelectedEmployees(new Set());
    else setSelectedEmployees(new Set(employees.map(e => e.id)));
  };

  const handlePushGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmployees.size === 0) {
      alert("Please select at least one employee.");
      return;
    }
    
    setLoading(true);
    try {
      const employeeIds = Array.from(selectedEmployees);
      const { data: sheets } = await supabase.from('goal_sheets').select('id, user_id').eq('cycle', 'FY2026').in('user_id', employeeIds);
      const sheetMap = new Map(sheets?.map(s => [s.user_id, s.id]));
      
      for (const empId of employeeIds) {
        let sheetId = sheetMap.get(empId);
        if (!sheetId) {
          const { data: newSheet, error: sheetError } = await supabase.from('goal_sheets').insert({ user_id: empId, cycle: 'FY2026', status: 'Draft' }).select().single();
          if (sheetError) continue;
          sheetId = newSheet.id;
        }

        const { data: goal, error: goalError } = await supabase.from('goals').insert({ sheet_id: sheetId, ...formData }).select().single();
        if (goalError) continue;

        await supabase.from('shared_goal_links').insert({ employee_goal_id: goal.id, assigned_by: profile?.id, assigned_to: empId });
      }
      
      alert("Shared goal pushed successfully!");
      setFormData({ thrust_area: 'Department KPI', title: '', description: '', uom: 'Numeric', target_value: '', weightage: 10 });
      setSelectedEmployees(new Set());
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-6rem)] animate-fade-in-up">
      {/* Create Shared Goal Form */}
      <div className="w-full md:w-3/5 glass-panel rounded-3xl p-8 overflow-y-auto scrollbar-hide shadow-lg relative">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/40 to-transparent"></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center relative z-10 tracking-tight">
          <div className="bg-navy-900 p-2.5 rounded-xl mr-3 shadow-md">
            <Send className="h-5 w-5 text-white" />
          </div>
          Push Organization KPI
        </h2>
        
        <form onSubmit={handlePushGoal} className="space-y-6 relative z-10">
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white shadow-sm space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Thrust Area</label>
                <input type="text" required value={formData.thrust_area} onChange={e => setFormData({...formData, thrust_area: e.target.value})} className="w-full px-4 py-2.5 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-500 focus:bg-white transition-colors sm:text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Goal Title</label>
                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2.5 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-500 focus:bg-white transition-colors sm:text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2.5 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-500 focus:bg-white transition-colors sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">UOM</label>
                <select value={formData.uom} onChange={e => setFormData({...formData, uom: e.target.value})} className="w-full px-4 py-2.5 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-500 focus:bg-white transition-colors sm:text-sm">
                  <option>Numeric</option>
                  <option>%</option>
                  <option>Timeline</option>
                  <option>Zero-based</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Target Value</label>
                <input type="text" required value={formData.target_value} onChange={e => setFormData({...formData, target_value: e.target.value})} className="w-full px-4 py-2.5 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-500 focus:bg-white transition-colors sm:text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Default Weightage</label>
                <input type="number" required min="10" value={formData.weightage} onChange={e => setFormData({...formData, weightage: Number(e.target.value)})} className="w-1/2 px-4 py-2.5 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-500 focus:bg-white transition-colors sm:text-sm" />
                <p className="mt-1 text-xs text-gray-500">Employees can adjust this on their end.</p>
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading || selectedEmployees.size === 0}
            className="group w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-lg text-sm font-bold text-white bg-navy-900 hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-900 disabled:opacity-50 transition-all hover:-translate-y-0.5"
          >
            {loading ? 'Pushing to Database...' : `Push Goal to ${selectedEmployees.size} Selected Employees`}
          </button>
        </form>
      </div>

      {/* Select Employees Panel */}
      <div className="w-full md:w-2/5 glass-panel rounded-3xl flex flex-col overflow-hidden shadow-lg">
        <div className="p-6 border-b border-white/20 bg-white/30 backdrop-blur-md">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center tracking-tight">
              <Users className="mr-2 h-5 w-5 text-navy-600" />
              Target Audience
            </h2>
            <span className="bg-white/80 text-navy-900 border border-navy-100 py-1.5 px-3 rounded-full text-xs font-bold shadow-sm">
              {selectedEmployees.size} / {employees.length}
            </span>
          </div>
          <button onClick={handleSelectAll} className="text-xs font-bold text-navy-600 hover:text-navy-800 hover:underline">
            {selectedEmployees.size === employees.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
          {employees.map((emp, index) => (
            <label 
              key={emp.id} 
              className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-200 animate-fade-in-up
                ${selectedEmployees.has(emp.id) ? 'bg-navy-50 border-navy-300 shadow-sm' : 'bg-white/50 border-transparent hover:bg-white/80'}
              `}
              style={{ animationDelay: `${0.05 * index}s` }}
            >
              <div className={`w-5 h-5 rounded border flex items-center justify-center mr-4 transition-colors
                ${selectedEmployees.has(emp.id) ? 'bg-navy-600 border-navy-600' : 'border-gray-300 bg-white'}
              `}>
                {selectedEmployees.has(emp.id) && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              
              <div className="flex-1">
                <span className="block text-sm font-bold text-gray-900">{emp.full_name}</span>
                <span className="block text-xs font-medium text-gray-500 mt-0.5">{emp.department}</span>
              </div>
              
              {/* Invisible checkbox for accessibility */}
              <input
                type="checkbox"
                className="sr-only"
                checked={selectedEmployees.has(emp.id)}
                onChange={() => handleToggleEmployee(emp.id)}
              />
            </label>
          ))}
          {employees.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
              <Users className="w-12 h-12 mb-2 text-gray-300" />
              <p className="text-sm font-medium">No employees found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
