import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Users, CheckCircle, XCircle, Search, MessageSquare, Activity, Edit2, Save } from 'lucide-react';
import { calculateProgressScore, getStatusColor } from '../lib/scoring';

export default function ManagerDashboard() {
  const { profile } = useAuth();
  const [team, setTeam] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [memberSheet, setMemberSheet] = useState<any | null>(null);
  const [memberGoals, setMemberGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Phase 2 Check-in
  const [demoQuarter, setDemoQuarter] = useState<string | null>(null);

  // Phase 3 Inline Editing
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    if (profile) fetchTeam();
  }, [profile]);

  const fetchTeam = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').eq('manager_id', profile?.id);
    if (data) setTeam(data);
    setLoading(false);
  };

  const handleSelectMember = async (member: any) => {
    setSelectedMember(member);
    setMemberSheet(null);
    setMemberGoals([]);
    
    const { data: sheets } = await supabase.from('goal_sheets').select('*').eq('user_id', member.id).eq('cycle', 'FY2026').order('created_at', { ascending: false }).limit(1);
    
    if (sheets && sheets.length > 0) {
      setMemberSheet(sheets[0]);
      const { data: goals } = await supabase.from('goals').select('*').eq('sheet_id', sheets[0].id).order('created_at', { ascending: true });
      if (goals) setMemberGoals(goals);
    }
  };

  const handleUpdateSheetStatus = async (status: string) => {
    try {
      const { error } = await supabase.from('goal_sheets').update({ status }).eq('id', memberSheet.id);
      if (error) throw error;
      setMemberSheet({ ...memberSheet, status });
      alert(`Sheet ${status} successfully.`);
    } catch (err: any) { alert(err.message); }
  };

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

  const handleUpdateManagerComment = async (goalId: string, quarter: string, comment: string) => {
    try {
      const field = `manager_comment_${quarter.toLowerCase()}`;
      const { error } = await supabase.from('goals').update({ [field]: comment }).eq('id', goalId);
      if (error) throw error;
      setMemberGoals(memberGoals.map(g => g.id === goalId ? { ...g, [field]: comment } : g));
    } catch (err: any) { alert(err.message); }
  };

  const handleEditGoalClick = (goal: any) => {
    setEditingGoalId(goal.id);
    setEditForm({ title: goal.title, description: goal.description, target_value: goal.target_value, weightage: goal.weightage });
  };

  const handleSaveGoalEdit = async (goalId: string) => {
    try {
      const { error } = await supabase.from('goals').update(editForm).eq('id', goalId);
      if (error) throw error;
      setMemberGoals(memberGoals.map(g => g.id === goalId ? { ...g, ...editForm } : g));
      setEditingGoalId(null);
    } catch (err: any) { alert(err.message); }
  };

  const filteredTeam = team.filter(m => m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || m.department?.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-navy-900"></div></div>;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
      {/* Sidebar: Team List */}
      <div className="w-full lg:w-1/3 glass-panel rounded-3xl flex flex-col overflow-hidden">
        <div className="p-6 border-b border-white/20 bg-white/10">
          <h2 className="text-xl font-bold text-gray-900 flex items-center tracking-tight"><Users className="w-5 h-5 mr-2 text-navy-600" /> My Direct Reports</h2>
          <div className="mt-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
            <input type="text" placeholder="Search team..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white/60 border border-white/80 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-navy-500 text-sm" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredTeam.map(member => (
            <button key={member.id} onClick={() => handleSelectMember(member)} className={`w-full text-left p-4 rounded-2xl transition-all duration-200 border ${selectedMember?.id === member.id ? 'bg-white border-navy-200 shadow-md transform scale-[1.02]' : 'bg-white/40 border-transparent hover:bg-white/60 hover:shadow-sm'}`}>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-navy-800 to-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-sm">{member.full_name.charAt(0)}</div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-bold text-gray-900">{member.full_name}</p>
                  <p className="text-xs text-gray-500 font-medium">{member.department}</p>
                </div>
              </div>
            </button>
          ))}
          {filteredTeam.length === 0 && <p className="text-center text-sm text-gray-500 mt-8 font-medium">No team members found.</p>}
        </div>
      </div>

      {/* Main Content: Review Panel */}
      <div className="w-full lg:w-2/3 flex flex-col h-full">
        {!selectedMember ? (
          <div className="flex-1 glass-panel rounded-3xl flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-white/50 rounded-full flex items-center justify-center mb-6 shadow-inner"><Users className="w-10 h-10 text-navy-300" /></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Select a Team Member</h3>
            <p className="text-sm text-gray-500 max-w-sm">Choose a direct report from the list to review their goals and track quarterly progress.</p>
          </div>
        ) : !memberSheet ? (
          <div className="flex-1 glass-panel rounded-3xl flex items-center justify-center">
            <p className="text-sm text-gray-500 font-medium">This employee has not created a goal sheet yet.</p>
          </div>
        ) : (
          <div className="flex-1 glass-panel rounded-3xl flex flex-col overflow-hidden relative">
            {/* Header */}
            <div className="p-6 bg-white/40 border-b border-white/40 shadow-sm relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{selectedMember.full_name}'s Goal Sheet</h2>
                <div className="mt-2 flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm
                    ${memberSheet.status === 'Draft' ? 'bg-gray-200 text-gray-700' : ''}
                    ${memberSheet.status.includes('Submitted') ? 'bg-blue-100 text-blue-700' : ''}
                    ${memberSheet.status.includes('Approved') ? 'bg-green-100 text-green-700' : ''}
                    ${memberSheet.status === 'Locked' ? 'bg-red-100 text-red-700' : ''}
                    ${memberSheet.status === 'Returned' ? 'bg-amber-100 text-amber-700' : ''}
                  `}>
                    Status: {memberSheet.status}
                  </span>
                </div>
              </div>
              
              {/* Phase 1 Approval Actions */}
              {memberSheet.status === 'Submitted' && (
                <div className="flex gap-3 mt-4 sm:mt-0">
                  <button onClick={() => handleUpdateSheetStatus('Returned')} className="px-4 py-2 bg-white text-amber-600 border border-amber-200 rounded-xl hover:bg-amber-50 text-sm font-bold flex items-center shadow-sm transition-all">
                    <XCircle className="w-4 h-4 mr-2" /> Return Goals
                  </button>
                  <button onClick={() => handleUpdateSheetStatus('Approved')} className="px-4 py-2 bg-navy-900 text-white rounded-xl hover:bg-navy-800 text-sm font-bold flex items-center shadow-md transition-all">
                    <CheckCircle className="w-4 h-4 mr-2" /> Approve Goals
                  </button>
                </div>
              )}
              {memberSheet.status === 'Approved' && (
                <button onClick={() => handleUpdateSheetStatus('Locked')} className="mt-4 sm:mt-0 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-bold shadow-md transition-all">
                  Lock Sheet (Finalize)
                </button>
              )}

              {/* Quarterly Check-in Approval Actions */}
              {activeQ && memberSheet.status === `${activeQ} Submitted` && (
                <div className="flex gap-3 mt-4 sm:mt-0">
                  <button onClick={() => handleUpdateSheetStatus('Approved')} className="px-4 py-2 bg-white text-amber-600 border border-amber-200 rounded-xl hover:bg-amber-50 text-sm font-bold flex items-center shadow-sm transition-all">
                    <XCircle className="w-4 h-4 mr-2" /> Return Check-in
                  </button>
                  <button onClick={() => handleUpdateSheetStatus(`${activeQ} Approved`)} className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm font-bold flex items-center shadow-md transition-all">
                    <CheckCircle className="w-4 h-4 mr-2" /> Approve {activeQ}
                  </button>
                </div>
              )}
            </div>

            {/* Phase 2 Demo Toggle (For Managers viewing Check-ins) */}
            {!['Draft', 'Submitted', 'Returned'].includes(memberSheet.status) && (
              <div className="px-6 py-3 bg-blue-50/50 border-b border-blue-100 flex justify-between items-center z-10">
                <div className="flex items-center text-sm text-navy-800 font-bold">
                  <Activity className="w-4 h-4 mr-2 text-navy-600" /> Manager Check-in View
                </div>
                <select 
                  value={demoQuarter || ''} 
                  onChange={e => setDemoQuarter(e.target.value || null)}
                  className="px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-navy-500 shadow-sm"
                >
                  <option value="">System Date Logic</option>
                  <option value="Q1">Force Open Q1</option>
                  <option value="Q2">Force Open Q2</option>
                  <option value="Q3">Force Open Q3</option>
                  <option value="Q4">Force Open Q4</option>
                </select>
              </div>
            )}

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10 bg-white/20">
              {memberGoals.map((goal, index) => {
                const isProgressPhase = !['Draft', 'Submitted', 'Returned'].includes(memberSheet.status);
                
                return (
                  <div key={goal.id} className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      {editingGoalId === goal.id ? (
                        <div className="flex-1 mr-4 space-y-3">
                          <input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg font-bold text-sm focus:ring-2 focus:ring-navy-500" />
                          <textarea rows={2} value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500" />
                        </div>
                      ) : (
                        <div>
                          <span className="inline-flex px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold uppercase tracking-wider mb-2">{goal.thrust_area}</span>
                          <h4 className="text-lg font-bold text-gray-900">{index + 1}. {goal.title}</h4>
                          <p className="text-sm text-gray-600 mt-1 max-w-2xl">{goal.description}</p>
                        </div>
                      )}
                      <div className="text-right bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col items-end">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1">Weightage</p>
                        {editingGoalId === goal.id ? (
                          <input type="number" value={editForm.weightage} onChange={e => setEditForm({...editForm, weightage: Number(e.target.value)})} className="w-16 text-xl font-black text-navy-900 border-b border-gray-300 focus:outline-none text-right" />
                        ) : (
                          <p className="text-xl font-black text-navy-900">{goal.weightage}%</p>
                        )}
                        
                        {memberSheet.status === 'Submitted' && editingGoalId !== goal.id && (
                          <button onClick={() => handleEditGoalClick(goal)} className="mt-2 text-xs text-navy-600 font-bold flex items-center hover:text-navy-800 transition-colors"><Edit2 className="w-3 h-3 mr-1" /> Edit</button>
                        )}
                        {editingGoalId === goal.id && (
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => setEditingGoalId(null)} className="text-[10px] uppercase tracking-wider text-gray-500 font-bold hover:text-gray-700">Cancel</button>
                            <button onClick={() => handleSaveGoalEdit(goal.id)} className="text-[10px] uppercase tracking-wider text-green-600 font-bold flex items-center hover:text-green-800"><Save className="w-3 h-3 mr-1" /> Save</button>
                          </div>
                        )}
                      </div>
                    </div>

                    {!isProgressPhase ? (
                      <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Target / UOM</p>
                        {editingGoalId === goal.id ? (
                          <input type="text" value={editForm.target_value} onChange={e => setEditForm({...editForm, target_value: e.target.value})} className="w-48 px-2 py-1 text-sm font-bold border border-gray-300 rounded focus:ring-2 focus:ring-navy-500" />
                        ) : (
                          <p className="text-sm font-bold text-gray-900">{goal.target_value} ({goal.uom})</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">{goal.target_direction}</p>
                      </div>
                    ) : (
                      <div className="mt-6 space-y-6 border-t border-gray-200 pt-6">
                        {/* Manager Progress Tracking View */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Target</p>
                            <p className="text-lg font-black text-navy-900">{goal.target_value} <span className="text-xs text-gray-500 font-medium">{goal.uom}</span></p>
                          </div>
                          
                          {activeQ && (
                            <>
                              {(() => {
                                const actualField = `actual_${activeQ.toLowerCase()}` as keyof typeof goal;
                                const statusField = `status_${activeQ.toLowerCase()}` as keyof typeof goal;
                                const actual = goal[actualField] || '--';
                                const status = goal[statusField] || 'Not Started';
                                const score = calculateProgressScore(goal.target_value, actual === '--' ? null : actual, goal.uom, goal.target_direction);
                                
                                return (
                                  <>
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                      <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">{activeQ} Actual</p>
                                      <p className="text-lg font-black text-blue-900">{actual}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{activeQ} Status</p>
                                      <div className="flex items-center mt-1">
                                        <div className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(status)}`}></div>
                                        <p className="text-sm font-bold text-gray-900">{status}</p>
                                      </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{activeQ} Score</p>
                                      <div className="flex items-center">
                                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden mr-3">
                                          <div className="h-full bg-navy-900 rounded-full" style={{ width: `${Math.min(score || 0, 100)}%` }}></div>
                                        </div>
                                        <p className="text-sm font-black text-navy-900">{score !== null ? Math.round(score) + '%' : '--'}</p>
                                      </div>
                                    </div>
                                  </>
                                );
                              })()}
                            </>
                          )}
                        </div>

                        {/* Check-in Comment */}
                        {activeQ && (
                          <div className="bg-navy-50/50 p-5 rounded-xl border border-navy-100">
                            <label className="flex items-center text-sm font-bold text-navy-900 mb-3">
                              <MessageSquare className="w-4 h-4 mr-2" /> Manager Check-in Comment ({activeQ})
                            </label>
                            <textarea 
                              rows={3} 
                              placeholder="Document discussion, feedback, or blockers here..."
                              defaultValue={goal[`manager_comment_${activeQ.toLowerCase()}` as keyof typeof goal] || ''}
                              onBlur={(e) => handleUpdateManagerComment(goal.id, activeQ, e.target.value)}
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-500 sm:text-sm shadow-sm"
                            />
                            <p className="text-xs text-gray-500 mt-2 font-medium">Auto-saves when you click away.</p>
                          </div>
                        )}
                        
                        {/* History */}
                        <div className="mt-4">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Historical Comments</p>
                          <div className="space-y-3">
                            {['Q1', 'Q2', 'Q3', 'Q4'].filter(q => q !== activeQ).map(q => {
                              const c = goal[`manager_comment_${q.toLowerCase()}` as keyof typeof goal];
                              if (!c) return null;
                              return (
                                <div key={q} className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm text-gray-700">
                                  <span className="font-bold text-gray-900 mr-2">{q}:</span> {c}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
