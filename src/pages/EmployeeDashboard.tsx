import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { AlertCircle, Plus, Trash2, Link as LinkIcon, CheckCircle, Calendar, User, ThumbsUp, BookOpen, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { calculateProgressScore, getStatusColor } from '../lib/scoring';
import { useSearchParams } from 'react-router-dom';

export default function EmployeeDashboard() {
  const { profile } = useAuth();
  const [sheet, setSheet] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [sharedLinks, setSharedLinks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [manager, setManager] = useState<any>(null);
  const [kudos, setKudos] = useState<any[]>([]);
  const [sentiment, setSentiment] = useState<number>(3);
  
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'builder';
  
  // Demo Quarter Toggle (since time windows are strict)
  const [demoQuarter, setDemoQuarter] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    thrust_area: '', title: '', description: '', uom: 'Numeric', target_value: '', weightage: 10, target_direction: 'Maximize'
  });

  useEffect(() => {
    if (profile) {
      fetchGoalSheet();
      fetchKudos();
      if (profile.manager_id) fetchManager(profile.manager_id);
    }
  }, [profile]);

  const fetchKudos = async () => {
    const { data } = await supabase.from('kudos').select('*').eq('user_id', profile?.id).order('created_at', { ascending: false });
    if (data) setKudos(data);
  };

  const fetchManager = async (managerId: string) => {
    const { data } = await supabase.from('profiles').select('full_name').eq('id', managerId).single();
    if (data) setManager(data);
  };

  const fetchGoalSheet = async () => {
    setLoading(true);
    const { data: sheets } = await supabase.from('goal_sheets').select('*').eq('user_id', profile?.id).eq('cycle', 'FY2026').order('created_at', { ascending: false }).limit(1);

    if (sheets && sheets.length > 0) {
      setSheet(sheets[0]);
      await fetchGoals(sheets[0].id);
      if (!['Draft', 'Submitted', 'Returned'].includes(sheets[0].status) && activeTab === 'builder') {
        const params = new URLSearchParams(window.location.search);
        params.set('tab', 'progress');
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
      }
    } else {
      const { data: newSheet, error } = await supabase.from('goal_sheets').insert({ user_id: profile?.id, cycle: 'FY2026', status: 'Draft' }).select().single();
      if (!error && newSheet) setSheet(newSheet);
    }
    setLoading(false);
  };

  const fetchGoals = async (sheetId: string) => {
    const { data: goalsData } = await supabase.from('goals').select('*').eq('sheet_id', sheetId).order('created_at', { ascending: true });
    setGoals(goalsData || []);

    if (goalsData && goalsData.length > 0) {
      const goalIds = goalsData.map(g => g.id);
      const { data: links } = await supabase.from('shared_goal_links').select('employee_goal_id').in('employee_goal_id', goalIds);
      if (links) setSharedLinks(new Set(links.map(l => l.employee_goal_id)));
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
      setFormData({ thrust_area: '', title: '', description: '', uom: 'Numeric', target_value: '', weightage: 10, target_direction: 'Maximize' });
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

  // Phase 2 Logic
  const getCurrentQuarter = () => {
    if (demoQuarter) return demoQuarter;
    const month = new Date().getMonth();
    if (month === 6) return 'Q1';
    if (month === 9) return 'Q2';
    if (month === 0) return 'Q3';
    if (month === 2 || month === 3) return 'Q4';
    return null;
  };

  const activeQ = getCurrentQuarter();

  const handleUpdateActual = async (id: string, quarter: string, value: string, status: string) => {
    try {
      const updates = { [`actual_${quarter.toLowerCase()}`]: value, [`status_${quarter.toLowerCase()}`]: status };
      const { error } = await supabase.from('goals').update(updates).eq('id', id);
      if (error) throw error;
      setGoals(goals.map(g => g.id === id ? { ...g, ...updates } : g));
    } catch (err: any) { alert(err.message); }
  };

  const isCheckinSubmitted = sheet?.status === `${activeQ} Submitted`;
  const isCheckinApproved = sheet?.status === `${activeQ} Approved`;
  const isLocked = sheet?.status === 'Locked';
  const canEditCheckin = !!activeQ && !isCheckinSubmitted && !isCheckinApproved && !isLocked;

  const handleSubmitCheckin = async (quarter: string) => {
    try {
      const updates = { 
        status: `${quarter} Submitted`,
        [`sentiment_${quarter.toLowerCase()}`]: sentiment 
      };
      const { error } = await supabase.from('goal_sheets').update(updates).eq('id', sheet.id);
      if (error) throw error;
      setSheet({ ...sheet, ...updates });
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-navy-900"></div></div>;

  return (
    <div className="space-y-6 h-full pb-10">
      {/* Header Panel */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col lg:flex-row justify-between items-center relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -z-10 group-hover:bg-blue-500/20 transition-colors duration-500"></div>
        <div className="mb-6 lg:mb-0 z-10 w-full lg:w-auto">
          <div className="flex justify-between lg:justify-start items-center">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              My Goal Sheet <span className="text-gray-400 font-medium ml-2">FY2026</span>
            </h1>
          </div>
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
            {manager && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/80 text-navy-800 border border-gray-200 shadow-sm">
                <User className="w-3.5 h-3.5 mr-1.5 text-navy-500" />
                Reports to: {manager.full_name}
              </span>
            )}
          </div>
        </div>
        
        {/* Header Action Area */}
        <div className="flex flex-col sm:flex-row items-center gap-6 z-10">
          {activeTab === 'builder' && (
            <>
              <div className="flex gap-6">
                <div className="text-center bg-white/50 px-4 py-2 rounded-2xl border border-white/50">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Weightage</p>
                  <div className="flex items-center justify-center">
                    <span className={`text-2xl font-black ${totalWeightage === 100 ? 'text-green-600' : 'text-orange-500'}`}>{totalWeightage}%</span>
                    {totalWeightage === 100 && <CheckCircle className="w-5 h-5 ml-2 text-green-500" />}
                  </div>
                </div>
              </div>
              <button onClick={handleSubmitSheet} disabled={!isValid || !isDraft} className="px-6 py-3.5 bg-navy-900 text-white rounded-xl shadow-lg hover:bg-navy-800 disabled:opacity-50 disabled:shadow-none transition-all font-semibold text-sm w-full sm:w-auto">
                Submit for Approval
              </button>
            </>
          )}
        </div>
      </div>

      {/* ---------------- BUILDER TAB ---------------- */}
      {activeTab === 'builder' && (
        <div className="space-y-5 animate-fade-in-up">
          {isDraft && !isValid && (
            <div className="bg-white/60 backdrop-blur-md border border-orange-200 p-5 rounded-2xl shadow-sm">
              <div className="flex items-start">
                <div className="bg-orange-100 p-2 rounded-lg"><AlertCircle className="h-5 w-5 text-orange-600" /></div>
                <div className="ml-4">
                  <p className="text-sm text-gray-900 font-bold">Submission Requirements Not Met</p>
                  <p className="text-xs text-gray-600 mt-1">Weightage must be 100% and max 8 goals.</p>
                </div>
              </div>
            </div>
          )}

          {goals.map((goal, index) => {
            const isShared = sharedLinks.has(goal.id);
            return (
              <div key={goal.id} className={`glass-panel rounded-2xl overflow-hidden transition-all duration-300 border-l-4 ${isShared ? 'border-l-blue-500' : 'border-l-navy-900'}`}>
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-navy-50 text-navy-800 border border-navy-100">{goal.thrust_area}</span>
                        {isShared && <span className="inline-flex items-center text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-lg"><LinkIcon className="w-3.5 h-3.5 mr-1.5" />Org Shared Goal</span>}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 tracking-tight">{index + 1}. {goal.title}</h3>
                      <p className="mt-2 text-sm text-gray-600 max-w-3xl">{goal.description}</p>
                      
                      <div className="mt-6 flex flex-wrap gap-4">
                        <div className="bg-white/50 px-4 py-2.5 rounded-xl border border-white flex-1 min-w-[120px]">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Target / Direction</p>
                          <p className="text-sm font-bold text-gray-900">{goal.target_value} ({goal.target_direction})</p>
                        </div>
                        <div className="bg-white/80 px-4 py-2.5 rounded-xl border border-white shadow-sm flex-[2] min-w-[200px]">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Weightage (%)</p>
                          <div className="flex items-center space-x-3">
                            <input type="range" min="10" max="100" step="5" disabled={!isDraft} value={goal.weightage} onChange={(e) => handleUpdateWeightage(goal.id, Number(e.target.value))} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 accent-navy-900" />
                            <input type="number" min="10" disabled={!isDraft} value={goal.weightage} onChange={(e) => handleUpdateWeightage(goal.id, Number(e.target.value))} className="w-16 px-2 py-1 text-center font-bold text-sm bg-white border border-gray-200 rounded-lg disabled:bg-gray-50" />
                          </div>
                        </div>
                      </div>
                    </div>
                    {isDraft && !isShared && (
                      <button onClick={() => handleDeleteGoal(goal.id)} className="ml-6 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 className="h-5 w-5" /></button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isDraft && goals.length < 8 && (
            <div className="glass-panel rounded-2xl border border-white/50 overflow-hidden">
              {!isAdding ? (
                <button onClick={() => setIsAdding(true)} className="w-full py-6 flex items-center justify-center text-sm font-bold text-navy-900 hover:bg-white/50 transition-colors">
                  <div className="bg-navy-50 p-2 rounded-lg mr-3"><Plus className="h-5 w-5 text-navy-900" /></div>
                  Add New Goal
                </button>
              ) : (
                <div className="p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Create New Goal</h3>
                  <form onSubmit={handleAddGoal} className="space-y-5">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Thrust Area</label>
                        <input type="text" required value={formData.thrust_area} onChange={e => setFormData({...formData, thrust_area: e.target.value})} className="w-full px-4 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-500 sm:text-sm" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
                        <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-500 sm:text-sm" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                        <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-500 sm:text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">UOM</label>
                        <select value={formData.uom} onChange={e => setFormData({...formData, uom: e.target.value})} className="w-full px-4 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-500 sm:text-sm">
                          <option>Numeric</option>
                          <option>%</option>
                          <option>Timeline</option>
                          <option>Zero-based</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Target Direction</label>
                        <select value={formData.target_direction} onChange={e => setFormData({...formData, target_direction: e.target.value})} className="w-full px-4 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-500 sm:text-sm">
                          <option>Maximize</option>
                          <option>Minimize</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Target Value</label>
                        <input type={formData.uom === 'Timeline' ? 'date' : 'text'} required value={formData.target_value} onChange={e => setFormData({...formData, target_value: e.target.value})} className="w-full px-4 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-500 sm:text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Weightage (%)</label>
                        <input type="number" required min="10" value={formData.weightage} onChange={e => setFormData({...formData, weightage: Number(e.target.value)})} className="w-full px-4 py-2.5 bg-white/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-500 sm:text-sm" />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-100">
                      <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
                      <button type="submit" className="px-6 py-2.5 bg-navy-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-navy-800 transition-all">Save Goal</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ---------------- PROGRESS TAB ---------------- */}
      {activeTab === 'progress' && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="glass-panel p-5 rounded-2xl flex justify-between items-center shadow-sm border border-white/50">
            <div className="flex items-center">
              <Calendar className="w-6 h-6 text-navy-600 mr-3" />
              <div>
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">Quarterly Check-ins</h3>
                <p className="text-sm text-gray-500 font-medium">Update your actuals during designated time windows.</p>
              </div>
            </div>
            
            {/* Demo Mode Toggle */}
            <select 
              value={demoQuarter || ''} 
              onChange={e => setDemoQuarter(e.target.value || null)}
              className="px-4 py-2 bg-white/80 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-navy-500 shadow-sm"
            >
              <option value="">System Date Logic</option>
              <option value="Q1">Force Open Q1</option>
              <option value="Q2">Force Open Q2</option>
              <option value="Q3">Force Open Q3</option>
              <option value="Q4">Force Open Q4</option>
            </select>
          </div>

          {!activeQ ? (
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-center">
              <p className="text-amber-800 font-bold">No update window is currently open.</p>
              <p className="text-sm text-amber-600 mt-1">Check-ins happen in July (Q1), October (Q2), January (Q3), and March/April (Q4).</p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-center shadow-inner">
              <span className="bg-blue-600 text-white text-xs font-black px-3 py-1.5 rounded-lg uppercase tracking-wider mr-3 shadow-md">{activeQ} Window Open</span>
              <p className="text-sm text-blue-900 font-medium">Please enter your actual achievements and status for this quarter.</p>
            </div>
          )}

          {goals.map((goal, index) => {
            const actualField = `actual_${activeQ?.toLowerCase()}` as keyof typeof goal;
            const statusField = `status_${activeQ?.toLowerCase()}` as keyof typeof goal;
            
            const currentActual = goal[actualField] || '';
            const currentStatus = goal[statusField] || 'Not Started';
            
            const score = calculateProgressScore(goal.target_value, currentActual, goal.uom, goal.target_direction);

            return (
              <div key={goal.id} className="glass-panel rounded-2xl overflow-hidden transition-all duration-300 border border-white/50 hover:shadow-md">
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 tracking-tight mb-4">{index + 1}. {goal.title}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white/40 p-4 rounded-xl border border-white/60 shadow-sm">
                    {/* Target Reference */}
                    <div className="md:col-span-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Target</p>
                      <p className="text-lg font-black text-navy-900">{goal.target_value} <span className="text-sm font-medium text-gray-500">({goal.uom})</span></p>
                      <p className="text-xs text-gray-500 mt-1">{goal.target_direction}</p>
                    </div>

                    {/* Actual Input */}
                    <div className="md:col-span-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{activeQ} Actual</p>
                      <input 
                        type={goal.uom === 'Timeline' ? 'date' : 'text'}
                        disabled={!canEditCheckin}
                        value={currentActual}
                        placeholder="Enter actual..."
                        onChange={e => handleUpdateActual(goal.id, activeQ!, e.target.value, currentStatus)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy-500 sm:text-sm font-bold shadow-inner disabled:bg-gray-100 disabled:opacity-70"
                      />
                    </div>

                    {/* Status Dropdown */}
                    <div className="md:col-span-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{activeQ} Status</p>
                      <div className="relative">
                        <select 
                          disabled={!canEditCheckin}
                          value={currentStatus}
                          onChange={e => handleUpdateActual(goal.id, activeQ!, currentActual, e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy-500 sm:text-sm font-bold shadow-inner disabled:bg-gray-100 appearance-none pl-8"
                        >
                          <option>Not Started</option>
                          <option>On Track</option>
                          <option>Behind</option>
                          <option>Completed</option>
                        </select>
                        <div className={`absolute left-2.5 top-3 w-3 h-3 rounded-full ${getStatusColor(currentStatus)}`}></div>
                      </div>
                    </div>

                    {/* Score Bar */}
                    <div className="md:col-span-3 flex flex-col justify-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Score</p>
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className="h-full bg-navy-900 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${Math.min(score || 0, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-black text-navy-900 w-10 text-right">{score !== null ? `${Math.round(score)}%` : '--'}</span>
                      </div>
                    </div>
                  </div>

                  {currentStatus === 'Behind' && (
                    <div className="mt-4 bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-start">
                      <BookOpen className="w-5 h-5 text-orange-500 mr-3 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-orange-800 uppercase tracking-widest mb-1">Skill-Bridge Suggestion</p>
                        <p className="text-sm text-orange-900 leading-relaxed">Consider exploring internal learning resources or discussing blockers regarding <span className="font-bold">"{goal.thrust_area}"</span> during your next 1-on-1.</p>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            );
          })}

          {activeQ && canEditCheckin && (
            <div className="mt-8 glass-panel p-6 rounded-2xl border border-white/50 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-gray-900 flex items-center mb-2"><ThumbsUp className="w-4 h-4 mr-2 text-navy-500" />Pulse Sentiment</h4>
                <p className="text-xs text-gray-500 mb-4">How supported do you feel in achieving your goals this quarter?</p>
                <div className="flex gap-2 max-w-md">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button 
                      key={val} 
                      onClick={() => setSentiment(val)}
                      className={`flex-1 py-2.5 rounded-xl font-bold transition-all text-sm ${sentiment === val ? 'bg-navy-900 text-white shadow-md scale-105' : 'bg-white/60 text-gray-600 hover:bg-white border border-gray-200'}`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button onClick={() => handleSubmitCheckin(activeQ)} className="px-6 py-3 bg-navy-900 text-white rounded-xl shadow-lg hover:bg-navy-800 font-bold transition-all text-sm">
                  Submit {activeQ} Check-in for Manager Review
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------- PERFORMANCE TAB ---------------- */}
      {activeTab === 'performance' && (() => {
        const weightageData = Object.entries(
          goals.reduce((acc, goal) => {
            acc[goal.thrust_area] = (acc[goal.thrust_area] || 0) + Number(goal.weightage);
            return acc;
          }, {} as Record<string, number>)
        ).map(([name, value]) => ({ name, value }));
        const COLORS = ['#0f172a', '#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899'];

        const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
        const trendData = quarters.map(q => {
          let totalScore = 0; let count = 0;
          goals.forEach(g => {
            if (g[`actual_${q.toLowerCase()}`]) {
              const s = calculateProgressScore(g.target_value, g[`actual_${q.toLowerCase()}`], g.uom, g.target_direction);
              if (s !== null) { totalScore += s; count++; }
            }
          });
          return { name: q, score: count ? Math.round(totalScore / count) : 0 };
        });

        const feedbackLog: { quarter: string; goalTitle: string; comment: string }[] = [];
        quarters.forEach(q => {
          goals.forEach(g => {
            const comment = g[`manager_comment_${q.toLowerCase()}` as keyof typeof g];
            if (comment) feedbackLog.push({ quarter: q, goalTitle: g.title, comment });
          });
        });

        const onTrackCount = goals.filter(g => g[`status_${activeQ?.toLowerCase() || 'q1'}` as keyof typeof g] === 'On Track' || g[`status_${activeQ?.toLowerCase() || 'q1'}` as keyof typeof g] === 'Completed').length;
        const behindCount = goals.filter(g => g[`status_${activeQ?.toLowerCase() || 'q1'}` as keyof typeof g] === 'Behind').length;

        return (
          <div className="space-y-6 animate-fade-in-up">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel p-6 rounded-2xl border border-white/50">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Goal Health</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-black text-navy-900">{onTrackCount}</p>
                    <p className="text-xs font-bold text-green-600 mt-1 flex items-center"><CheckCircle className="w-3 h-3 mr-1"/>On Track / Done</p>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-gray-900">{behindCount}</p>
                    <p className="text-xs font-bold text-orange-500 mt-1 flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>Behind</p>
                  </div>
                </div>
              </div>
              <div className="glass-panel p-6 rounded-2xl border border-white/50 md:col-span-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Recognition & Badges</p>
                {kudos.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No badges earned yet. Keep pushing towards your goals!</p>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {kudos.map(k => (
                      <div key={k.id} className="min-w-[200px] bg-white/60 p-4 rounded-xl border border-white shadow-sm flex flex-col items-center text-center">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mb-3 text-yellow-600">
                          <Star className="w-5 h-5 fill-current" />
                        </div>
                        <p className="text-xs font-bold text-gray-900 mb-1">{k.badge_type}</p>
                        <p className="text-[10px] text-gray-500 mb-2 whitespace-nowrap overflow-hidden text-ellipsis w-full">from {k.sender_name}</p>
                        <p className="text-xs text-gray-700 leading-tight italic">"{k.message}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-panel p-6 rounded-2xl border border-white/50">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Achievement Trend (QoQ %)</p>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} />
                      <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="score" fill="#0f172a" radius={[6, 6, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="glass-panel p-6 rounded-2xl border border-white/50">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Thrust Area Weightage Focus</p>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={weightageData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {weightageData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Feedback Timeline */}
            <div className="glass-panel p-6 rounded-2xl border border-white/50">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Feedback Timeline</p>
              {feedbackLog.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No manager feedback recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {feedbackLog.map((log, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">{log.quarter}</div>
                        {i !== feedbackLog.length - 1 && <div className="w-0.5 h-full bg-blue-50 my-1"></div>}
                      </div>
                      <div className="pb-6 pt-1 flex-1">
                        <p className="text-xs font-bold text-gray-500 mb-1">{log.goalTitle}</p>
                        <div className="bg-white/80 p-4 rounded-xl shadow-sm border border-gray-100 text-sm text-gray-800">
                          "{log.comment}"
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        );
      })()}
    </div>
  );
}
