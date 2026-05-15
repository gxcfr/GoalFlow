import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, Search, MessageSquare, UserCircle } from 'lucide-react';

export default function ManagerDashboard() {
  const { profile } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<any | null>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (profile) fetchReports();
  }, [profile]);

  const fetchReports = async () => {
    setLoading(true);
    const { data: teamMembers } = await supabase.from('profiles').select('*').eq('manager_id', profile?.id);

    if (teamMembers && teamMembers.length > 0) {
      const userIds = teamMembers.map(t => t.id);
      const { data: sheets } = await supabase
        .from('goal_sheets')
        .select('*, profiles(full_name, department)')
        .in('user_id', userIds)
        .eq('cycle', 'FY2026');
      setReports(sheets || []);
    }
    setLoading(false);
  };

  const handleSelectSheet = async (sheet: any) => {
    setSelectedSheet(sheet);
    setComment(sheet.manager_comment || '');
    const { data } = await supabase.from('goals').select('*').eq('sheet_id', sheet.id).order('created_at', { ascending: true });
    setGoals(data || []);
  };

  const handleUpdateGoal = async (id: string, field: string, value: any) => {
    try {
      const { error } = await supabase.from('goals').update({ [field]: value }).eq('id', id);
      if (error) throw error;
      setGoals(goals.map(g => g.id === id ? { ...g, [field]: value } : g));
    } catch (err: any) { alert(err.message); }
  };

  const handleAction = async (status: 'Approved' | 'Returned' | 'Locked') => {
    if (status === 'Returned' && !comment.trim()) {
      alert('A comment is required when returning a goal sheet.');
      return;
    }
    try {
      const updates = { status, manager_comment: comment };
      const { error } = await supabase.from('goal_sheets').update(updates).eq('id', selectedSheet.id);
      if (error) throw error;
      
      setSelectedSheet({ ...selectedSheet, ...updates });
      setReports(reports.map(r => r.id === selectedSheet.id ? { ...r, ...updates } : r));
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-navy-900"></div></div>;

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-6rem)] animate-fade-in-up">
      {/* Team List Sidebar */}
      <div className="w-full md:w-1/3 glass-panel rounded-3xl overflow-hidden flex flex-col shadow-lg">
        <div className="p-6 border-b border-white/20 bg-white/30 backdrop-blur-md">
          <h2 className="text-xl font-bold text-gray-900">My Team</h2>
          <p className="text-sm text-gray-600 mt-1">FY2026 Goal Sheets</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500">
              <UserCircle className="w-12 h-12 mb-3 text-gray-300" />
              <p className="text-sm font-medium">No direct reports found</p>
            </div>
          ) : (
            reports.map((sheet, index) => (
              <button
                key={sheet.id}
                onClick={() => handleSelectSheet(sheet)}
                className={`w-full text-left p-4 rounded-2xl transition-all duration-200 animate-fade-in-up ${
                  selectedSheet?.id === sheet.id 
                    ? 'bg-white shadow-md border-l-4 border-l-navy-900 translate-x-1' 
                    : 'bg-white/40 hover:bg-white/60 border-l-4 border-l-transparent hover:translate-x-1'
                }`}
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-900">{sheet.profiles?.full_name}</p>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">{sheet.profiles?.department}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm
                    ${sheet.status === 'Draft' ? 'bg-gray-200 text-gray-700' : ''}
                    ${sheet.status === 'Submitted' ? 'bg-blue-100 text-blue-700' : ''}
                    ${sheet.status === 'Approved' ? 'bg-green-100 text-green-700' : ''}
                    ${sheet.status === 'Returned' ? 'bg-amber-100 text-amber-700' : ''}
                    ${sheet.status === 'Locked' ? 'bg-red-100 text-red-700' : ''}
                  `}>
                    {sheet.status}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Review Panel */}
      <div className="w-full md:w-2/3 glass-panel rounded-3xl flex flex-col overflow-hidden shadow-lg relative">
        {selectedSheet ? (
          <>
            <div className="p-6 border-b border-white/20 bg-white/40 backdrop-blur-md flex flex-col sm:flex-row justify-between items-center z-10">
              <div className="mb-4 sm:mb-0">
                <h2 className="text-2xl font-bold text-gray-900">{selectedSheet.profiles?.full_name}</h2>
                <p className="text-sm font-medium text-gray-500">{goals.length} Goals • Total Weightage {goals.reduce((a,b)=>a+Number(b.weightage),0)}%</p>
              </div>
              
              <div className="flex space-x-3">
                {selectedSheet.status === 'Submitted' && (
                  <>
                    <button onClick={() => handleAction('Returned')} className="group inline-flex items-center px-4 py-2 border border-amber-200 shadow-sm text-sm font-bold rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 transition-all">
                      <XCircle className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                      Return
                    </button>
                    <button onClick={() => handleAction('Approved')} className="group inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-bold rounded-xl text-white bg-green-600 hover:bg-green-700 hover:shadow-md transition-all">
                      <CheckCircle className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                      Approve
                    </button>
                  </>
                )}
                {selectedSheet.status === 'Approved' && (
                  <button onClick={() => handleAction('Locked')} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-bold rounded-xl text-white bg-navy-900 hover:bg-navy-800 transition-all">
                    Lock Sheet
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide z-10 relative">
              {/* Subtle background blob for the review area */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/5 rounded-full blur-[60px] -z-10"></div>
              
              {(selectedSheet.status === 'Submitted' || selectedSheet.status === 'Returned') && (
                <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-white shadow-sm animate-fade-in-up">
                  <label className="block text-sm font-bold text-gray-700 flex items-center mb-3">
                    <MessageSquare className="h-5 w-5 mr-2 text-navy-600" />
                    Manager Feedback
                  </label>
                  <textarea
                    rows={2}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Provide constructive feedback (required if returning)..."
                    className="block w-full border border-gray-200 rounded-xl shadow-inner focus:ring-2 focus:ring-navy-500 focus:border-transparent px-4 py-3 sm:text-sm transition-all"
                  />
                </div>
              )}

              {goals.map((goal, index) => (
                <div key={goal.id} className="bg-white/70 backdrop-blur-md border border-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all animate-fade-in-up" style={{ animationDelay: `${0.05 * index}s` }}>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">{index + 1}. {goal.title}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-navy-50 text-navy-800 px-3 py-1 rounded-lg border border-navy-100">{goal.thrust_area}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-6">{goal.description}</p>
                  
                  <div className="flex flex-wrap gap-4 bg-white/50 p-4 rounded-xl">
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">UOM</p>
                      <p className="text-sm font-bold text-gray-900">{goal.uom}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Target</p>
                      {selectedSheet.status === 'Submitted' ? (
                        <input
                          type="text"
                          value={goal.target_value}
                          onChange={(e) => handleUpdateGoal(goal.id, 'target_value', e.target.value)}
                          className="block w-full sm:text-sm border-gray-200 rounded-lg focus:ring-2 focus:ring-navy-500 px-3 py-1.5"
                        />
                      ) : (
                        <p className="text-sm font-bold py-1.5">{goal.target_value}</p>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Weightage (%)</p>
                      {selectedSheet.status === 'Submitted' ? (
                        <input
                          type="number"
                          value={goal.weightage}
                          onChange={(e) => handleUpdateGoal(goal.id, 'weightage', Number(e.target.value))}
                          className="block w-full sm:text-sm border-gray-200 rounded-lg focus:ring-2 focus:ring-navy-500 px-3 py-1.5"
                        />
                      ) : (
                        <p className="text-sm font-bold py-1.5 text-navy-700">{goal.weightage}%</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 flex-col animate-fade-in">
            <div className="w-24 h-24 bg-white/30 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <Search className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-500">Select a team member to review</p>
          </div>
        )}
      </div>
    </div>
  );
}
