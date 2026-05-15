import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { AlertCircle, Plus, Trash2, Link as LinkIcon, CheckCircle } from 'lucide-react';

export default function EmployeeDashboard() {
  const { profile } = useAuth();
  const [sheet, setSheet] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [sharedLinks, setSharedLinks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    thrust_area: '', title: '', description: '', uom: 'Numeric', target_value: '', weightage: 10
  });

  useEffect(() => {
    if (profile) fetchGoalSheet();
  }, [profile]);

  const fetchGoalSheet = async () => {
    setLoading(true);
    const { data: sheets } = await supabase
      .from('goal_sheets')
      .select('*')
      .eq('user_id', profile?.id)
      .eq('cycle', 'FY2026')
      .order('created_at', { ascending: false })
      .limit(1);

    if (sheets && sheets.length > 0) {
      setSheet(sheets[0]);
      await fetchGoals(sheets[0].id);
    } else {
      const { data: newSheet, error } = await supabase
        .from('goal_sheets')
        .insert({ user_id: profile?.id, cycle: 'FY2026', status: 'Draft' })
        .select()
        .single();
      if (!error && newSheet) setSheet(newSheet);
    }
    setLoading(false);
  };

  const fetchGoals = async (sheetId: string) => {
    const { data: goalsData } = await supabase
      .from('goals')
      .select('*')
      .eq('sheet_id', sheetId)
      .order('created_at', { ascending: true });
    
    setGoals(goalsData || []);

    if (goalsData && goalsData.length > 0) {
      const goalIds = goalsData.map(g => g.id);
      const { data: links } = await supabase
        .from('shared_goal_links')
        .select('employee_goal_id')
        .in('employee_goal_id', goalIds);
      
      if (links) {
        setSharedLinks(new Set(links.map(l => l.employee_goal_id)));
      }
    }
  };

  const totalWeightage = goals.reduce((acc, g) => acc + Number(g.weightage), 0);
  const isValid = totalWeightage === 100 && goals.length <= 8 && goals.length > 0;
  const isDraft = sheet?.status === 'Draft' || sheet?.status === 'Returned';

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheet) return;
    try {
      const { data, error } = await supabase.from('goals').insert({ ...formData, sheet_id: sheet.id }).select().single();
      if (error) throw error;
      setGoals([...goals, data]);
      setIsAdding(false);
      setFormData({ thrust_area: '', title: '', description: '', uom: 'Numeric', target_value: '', weightage: 10 });
    } catch (err: any) { alert(err.message); }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) throw error;
      setGoals(goals.filter(g => g.id !== id));
    } catch (err: any) { alert(err.message); }
  };

  const handleUpdateWeightage = async (id: string, weightage: number) => {
    try {
      const { error } = await supabase.from('goals').update({ weightage }).eq('id', id);
      if (error) throw error;
      setGoals(goals.map(g => g.id === id ? { ...g, weightage } : g));
    } catch (err: any) { alert(err.message); }
  };

  const handleSubmitSheet = async () => {
    if (!isValid) return;
    try {
      const { error } = await supabase.from('goal_sheets').update({ status: 'Submitted' }).eq('id', sheet.id);
      if (error) throw error;
      setSheet({ ...sheet, status: 'Submitted' });
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-navy-900"></div></div>;

  return (
    <div className="space-y-6 h-full pb-10">
      {/* Header Panel */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col lg:flex-row justify-between items-center relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -z-10 group-hover:bg-blue-500/20 transition-colors duration-500"></div>
        <div className="mb-6 lg:mb-0 z-10">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            My Goal Sheet <span className="text-gray-400 font-medium ml-2">FY2026</span>
          </h1>
          <div className="mt-3 flex items-center space-x-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm
              ${sheet?.status === 'Draft' ? 'bg-gray-100 text-gray-700' : ''}
              ${sheet?.status === 'Submitted' ? 'bg-blue-100 text-blue-700' : ''}
              ${sheet?.status === 'Approved' ? 'bg-green-100 text-green-700' : ''}
              ${sheet?.status === 'Returned' ? 'bg-amber-100 text-amber-700' : ''}
              ${sheet?.status === 'Locked' ? 'bg-red-100 text-red-700' : ''}
            `}>
              {sheet?.status}
            </span>
            {sheet?.status === 'Returned' && sheet?.manager_comment && (
              <span className="text-sm text-amber-600 font-medium bg-amber-50 px-3 py-1 rounded-full">
                Note: {sheet.manager_comment}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-6 z-10">
          <div className="flex gap-6">
            <div className="text-center bg-white/50 px-4 py-2 rounded-2xl border border-white/50">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Weightage</p>
              <div className="flex items-center justify-center">
                <span className={`text-2xl font-black ${totalWeightage === 100 ? 'text-green-600' : 'text-orange-500'}`}>
                  {totalWeightage}%
                </span>
                {totalWeightage === 100 && <CheckCircle className="w-5 h-5 ml-2 text-green-500" />}
              </div>
            </div>
            <div className="text-center bg-white/50 px-4 py-2 rounded-2xl border border-white/50">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Goals</p>
              <p className={`text-2xl font-black ${goals.length <= 8 ? 'text-navy-900' : 'text-red-600'}`}>
                {goals.length}<span className="text-gray-400 text-lg">/8</span>
              </p>
            </div>
          </div>
          <button 
            onClick={handleSubmitSheet}
            disabled={!isValid || !isDraft}
            className="px-6 py-3.5 bg-navy-900 text-white rounded-xl shadow-lg hover:bg-navy-800 disabled:opacity-50 disabled:shadow-none transition-all font-semibold text-sm w-full sm:w-auto"
          >
            Submit for Approval
          </button>
        </div>
      </div>

      {isDraft && !isValid && (
        <div className="bg-white/60 backdrop-blur-md border border-orange-200 p-5 rounded-2xl shadow-sm animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-start">
            <div className="bg-orange-100 p-2 rounded-lg">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-900 font-bold">Submission Requirements Not Met</p>
              <div className="mt-2 flex gap-3 text-xs">
                <span className={`px-2.5 py-1 rounded-md font-medium ${totalWeightage === 100 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>Total Weightage: {totalWeightage}% (Target: 100%)</span>
                <span className={`px-2.5 py-1 rounded-md font-medium ${goals.length > 0 && goals.length <= 8 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>Goal Count: {goals.length} (Max 8)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goal List */}
      <div className="space-y-5">
        {goals.map((goal, index) => {
          const isShared = sharedLinks.has(goal.id);
          return (
            <div key={goal.id} className={`glass-panel rounded-2xl overflow-hidden hover:-translate-y-1 transition-all duration-300 animate-fade-in-up border-l-4 ${isShared ? 'border-l-blue-500' : 'border-l-navy-900'}`} style={{ animationDelay: `${0.1 * index}s` }}>
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-navy-50 text-navy-800 border border-navy-100">
                        {goal.thrust_area}
                      </span>
                      {isShared && (
                        <span className="inline-flex items-center text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-lg shadow-sm">
                          <LinkIcon className="w-3.5 h-3.5 mr-1.5" />
                          Org Shared Goal
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight">{index + 1}. {goal.title}</h3>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed max-w-3xl">{goal.description}</p>
                    
                    <div className="mt-6 flex flex-wrap gap-4">
                      <div className="bg-white/50 px-4 py-2.5 rounded-xl border border-white flex-1 min-w-[120px]">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">UOM</p>
                        <p className="text-sm font-bold text-gray-900">{goal.uom}</p>
                      </div>
                      <div className="bg-white/50 px-4 py-2.5 rounded-xl border border-white flex-1 min-w-[120px]">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Target</p>
                        <p className="text-sm font-bold text-gray-900">{goal.target_value}</p>
                      </div>
                      <div className="bg-white/80 px-4 py-2.5 rounded-xl border border-white shadow-sm flex-[2] min-w-[200px]">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Weightage (%)</p>
                        <div className="flex items-center space-x-3">
                          <input
                            type="range"
                            min="10"
                            max="100"
                            step="5"
                            disabled={!isDraft}
                            value={goal.weightage}
                            onChange={(e) => handleUpdateWeightage(goal.id, Number(e.target.value))}
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 accent-navy-900"
                          />
                          <input
                            type="number"
                            min="10"
                            disabled={!isDraft}
                            value={goal.weightage}
                            onChange={(e) => handleUpdateWeightage(goal.id, Number(e.target.value))}
                            className="w-16 px-2 py-1 text-center font-bold text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-transparent disabled:bg-gray-50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {isDraft && !isShared && (
                    <button onClick={() => handleDeleteGoal(goal.id)} className="ml-6 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Goal Form */}
      {isDraft && goals.length < 8 && (
        <div className="glass-panel rounded-2xl border border-white/50 animate-fade-in-up overflow-hidden" style={{ animationDelay: '0.3s' }}>
          {!isAdding ? (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-6 flex items-center justify-center text-sm font-bold text-navy-900 hover:bg-white/50 transition-colors"
            >
              <div className="bg-navy-50 p-2 rounded-lg mr-3">
                <Plus className="h-5 w-5 text-navy-900" />
              </div>
              Add New Goal
            </button>
          ) : (
            <div className="p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Create New Goal</h3>
              <form onSubmit={handleAddGoal} className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Thrust Area</label>
                    <input type="text" required value={formData.thrust_area} onChange={e => setFormData({...formData, thrust_area: e.target.value})} className="w-full px-4 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-500 focus:bg-white transition-colors text-sm" placeholder="e.g. Innovation, Operational Excellence" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
                    <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-500 focus:bg-white transition-colors text-sm" placeholder="Goal objective" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                    <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-500 focus:bg-white transition-colors text-sm" placeholder="Detailed description of how to achieve this goal..." />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Unit of Measurement</label>
                    <select value={formData.uom} onChange={e => setFormData({...formData, uom: e.target.value})} className="w-full px-4 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-500 focus:bg-white transition-colors text-sm">
                      <option>Numeric</option>
                      <option>%</option>
                      <option>Timeline</option>
                      <option>Zero-based</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Target Value</label>
                    <input type="text" required value={formData.target_value} onChange={e => setFormData({...formData, target_value: e.target.value})} className="w-full px-4 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-500 focus:bg-white transition-colors text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Weightage (%)</label>
                    <input type="number" required min="10" value={formData.weightage} onChange={e => setFormData({...formData, weightage: Number(e.target.value)})} className="w-1/2 px-4 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-500 focus:bg-white transition-colors text-sm" />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-100">
                  <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-6 py-2.5 bg-navy-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-navy-800 hover:shadow-lg transition-all">
                    Save Goal
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
