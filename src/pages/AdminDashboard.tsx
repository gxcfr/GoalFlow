import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Target, Activity, FileDown, CheckCircle, Clock, Unlock, Network, ShieldCheck, BarChart3, AlertTriangle, Star, X } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSearchParams } from 'react-router-dom';

export default function AdminDashboard() {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  
  const [stats, setStats] = useState({
    totalEmployees: 0,
    sheetsSubmitted: 0,
    sheetsApproved: 0,
    sheetsLocked: 0
  });
  
  const [employees, setEmployees] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [sheets, setSheets] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [allGoals, setAllGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmpForKudos, setSelectedEmpForKudos] = useState<any | null>(null);
  const [kudosForm, setKudosForm] = useState({ message: '', badge_type: 'Appreciation' });
  const [isKudosModalOpen, setIsKudosModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch Profiles
    const { data: employeeData } = await supabase.from('profiles').select('*').eq('role', 'Employee');
    const { data: managerData } = await supabase.from('profiles').select('*').eq('role', 'Manager_L1');
    const { data: allSheets } = await supabase.from('goal_sheets').select('*').eq('cycle', 'FY2026');
    const { data: logsData } = await supabase.from('audit_logs').select('*, goals ( title ), profiles!changed_by ( full_name )').order('changed_at', { ascending: false }).limit(100);
    const { data: goalsData } = await supabase.from('goals').select('*, goal_sheets ( user_id, profiles ( full_name, department, manager_id ) )');
    
    if (employeeData) setEmployees(employeeData);
    if (managerData) setManagers(managerData);
    if (logsData) setAuditLogs(logsData);
    if (goalsData) setAllGoals(goalsData);
    
    if (allSheets) {
      setSheets(allSheets);
      setStats({
        totalEmployees: employeeData?.length || 0,
        sheetsSubmitted: allSheets.filter((s: any) => s.status && s.status.includes('Submitted')).length,
        sheetsApproved: allSheets.filter((s: any) => s.status && s.status.includes('Approved')).length,
        sheetsLocked: allSheets.filter((s: any) => s.status === 'Locked').length
      });
    }
    
    setLoading(false);
  };

  const getCompletionStatus = (empId: string) => {
    const sheet = sheets.find((s: any) => s.user_id === empId);
    if (!sheet) return 'Not Started';
    return sheet.status;
  };

  const handleUnlockSheet = async (empId: string) => {
    const sheet = sheets.find((s: any) => s.user_id === empId);
    if (!sheet) return;
    
    try {
      const { error } = await supabase.from('goal_sheets').update({ status: 'Approved' }).eq('id', sheet.id);
      if (error) throw error;
      
      setSheets(sheets.map((s: any) => s.id === sheet.id ? { ...s, status: 'Approved' } : s));
      setStats({
        ...stats,
        sheetsLocked: stats.sheetsLocked - 1,
        sheetsApproved: stats.sheetsApproved + 1
      });
      alert('Sheet successfully unlocked and reverted to Approved status.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAssignManager = async (employeeId: string, managerId: string) => {
    try {
      const { error } = await supabase.from('profiles').update({ manager_id: managerId === '' ? null : managerId }).eq('id', employeeId);
      if (error) throw error;
      setEmployees(employees.map((e: any) => e.id === employeeId ? { ...e, manager_id: managerId === '' ? null : managerId } : e));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSendKudos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpForKudos) return;
    
    try {
      const { error } = await supabase.from('kudos').insert({
        user_id: selectedEmpForKudos.id,
        sender_name: 'Admin',
        message: kudosForm.message,
        badge_type: kudosForm.badge_type
      });
      if (error) throw error;
      alert('Kudos sent successfully!');
      setIsKudosModalOpen(false);
      setKudosForm({ message: '', badge_type: 'Appreciation' });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenKudos = (employee: any) => {
    setSelectedEmpForKudos(employee);
    setIsKudosModalOpen(true);
  };

  const getAnalyticsData = () => {
    // Thrust Area Distribution
    const thrustAreas: Record<string, number> = {};
    allGoals.forEach((g: any) => {
      thrustAreas[g.thrust_area] = (thrustAreas[g.thrust_area] || 0) + 1;
    });
    const pieData = Object.entries(thrustAreas).map(([name, value]) => ({ name, value }));

    // Manager completion rates
    const managerStats = managers.map((m: any) => {
      const reports = employees.filter((e: any) => e.manager_id === m.id);
      const approved = reports.filter((e: any) => {
        const s = sheets.find((s: any) => s.user_id === e.id);
        return s && (s.status.includes('Approved') || s.status === 'Locked');
      }).length;
      return {
        name: m.full_name.split(' ')[0],
        rate: reports.length ? Math.round((approved / reports.length) * 100) : 0
      };
    });

    // Overall submission trend (Mock logic based on current status)
    const trendData = [
      { name: 'Not Started', count: employees.filter((e: any) => !sheets.find((s: any) => s.user_id === e.id)).length },
      { name: 'Draft', count: sheets.filter((s: any) => s.status === 'Draft' || s.status === 'Returned').length },
      { name: 'Submitted', count: sheets.filter((s: any) => s.status.includes('Submitted')).length },
      { name: 'Approved', count: sheets.filter((s: any) => s.status.includes('Approved') || s.status === 'Locked').length },
    ];

    return { pieData, managerStats, trendData };
  };

  const getEscalationsData = () => {
    const escalations: any[] = [];
    const negligence: any[] = [];
    const now = new Date().getTime();
    
    sheets.forEach((sheet: any) => {
      const emp = [...employees, ...managers].find((e: any) => e.id === sheet.user_id);
      if (!emp) return;
      const updatedTime = new Date(sheet.updated_at || sheet.created_at).getTime();
      const daysSinceUpdate = Math.floor((now - updatedTime) / (1000 * 3600 * 24));
      
      const manager = managers.find((m: any) => m.id === emp.manager_id);
      const managerName = manager?.full_name || 'None';

      if (sheet.status === 'Draft' && daysSinceUpdate > 7) {
        escalations.push({ id: `esc-${sheet.id}-draft`, employee: emp.full_name, role: emp.role, manager: managerName, issue: 'Goals not submitted within 7 days of cycle open', severity: 'High', daysOverdue: daysSinceUpdate - 7 });
      } else if (sheet.status === 'Submitted' && daysSinceUpdate > 5) {
        negligence.push({ id: `neg-${sheet.id}-sub`, employee: emp.full_name, role: emp.role, manager: managerName, issue: 'Manager has not approved goals within 5 days of submission', severity: 'Critical', daysOverdue: daysSinceUpdate - 5 });
      } else if (sheet.status.includes('Submitted') && daysSinceUpdate > 5) {
        negligence.push({ id: `neg-${sheet.id}-qsub`, employee: emp.full_name, role: emp.role, manager: managerName, issue: 'Manager has not approved quarterly check-in within 5 days', severity: 'Medium', daysOverdue: daysSinceUpdate - 5 });
      }
    });
    
    return { escalations, negligence };
  };

  const COLORS = ['#1e293b', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-900"></div></div>;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header with quick stats */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Administration</h1>
          <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-wider">Goal Cycle: FY2026</p>
        </div>
        <div className="flex items-center gap-4 bg-white/40 p-2 rounded-2xl shadow-inner border border-white/60">
          <button className="flex items-center px-4 py-2 bg-white text-navy-900 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all">
            <FileDown className="w-4 h-4 mr-2" /> Export Audit Log
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-panel p-6 rounded-3xl bg-white/40 group hover:bg-white/60 transition-all duration-300 border border-white/60">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform"><Users className="w-6 h-6" /></div>
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">LIVE</span>
              </div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Total Employees</p>
              <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.totalEmployees}</h3>
            </div>

            <div className="glass-panel p-6 rounded-3xl bg-white/40 group hover:bg-white/60 transition-all duration-300 border border-white/60">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-100 rounded-2xl text-amber-600 group-hover:scale-110 transition-transform"><Clock className="w-6 h-6" /></div>
                <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">PENDING</span>
              </div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Sheets Submitted</p>
              <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.sheetsSubmitted}</h3>
            </div>

            <div className="glass-panel p-6 rounded-3xl bg-white/40 group hover:bg-white/60 transition-all duration-300 border border-white/60">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-2xl text-green-600 group-hover:scale-110 transition-transform"><CheckCircle className="w-6 h-6" /></div>
                <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-lg">APPROVED</span>
              </div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Sheets Approved</p>
              <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.sheetsApproved}</h3>
            </div>

            <div className="glass-panel p-6 rounded-3xl bg-white/40 group hover:bg-white/60 transition-all duration-300 border border-white/60">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-navy-100 rounded-2xl text-navy-600 group-hover:scale-110 transition-transform"><Target className="w-6 h-6" /></div>
                <span className="text-[10px] font-black text-navy-600 bg-navy-50 px-2 py-1 rounded-lg">FINALIZED</span>
              </div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Sheets Locked</p>
              <h3 className="text-3xl font-black text-gray-900 mt-1">{stats.sheetsLocked}</h3>
            </div>
          </div>

          <div className="glass-panel rounded-3xl overflow-hidden shadow-sm border border-white/40">
            <div className="p-6 border-b border-gray-100 bg-white/40 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center tracking-tight"><Activity className="w-5 h-5 mr-2 text-navy-600" /> Employee Lifecycle Overview</h2>
                <p className="text-sm text-gray-500 font-medium mt-1">Manage sheet locks and organizational recognition.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role / Dept</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Goal Status</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white/60 divide-y divide-gray-100">
                  {employees.map((employee: any) => {
                    const status = getCompletionStatus(employee.id);
                    return (
                      <tr key={employee.id} className="hover:bg-white/80 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-800 to-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">{employee.full_name.charAt(0)}</div>
                            <div className="ml-3">
                              <p className="text-sm font-bold text-gray-900">{employee.full_name}</p>
                              <p className="text-xs text-gray-500 font-medium">{employee.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <p className="font-bold text-gray-900">{employee.role}</p>
                          <p className="text-xs font-medium text-gray-400">{employee.department}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm
                            ${status === 'Not Started' ? 'bg-gray-100 text-gray-500' : ''}
                            ${status === 'Draft' ? 'bg-amber-100 text-amber-700' : ''}
                            ${status.includes('Submitted') ? 'bg-blue-100 text-blue-700' : ''}
                            ${status.includes('Approved') ? 'bg-green-100 text-green-700' : ''}
                            ${status === 'Locked' ? 'bg-red-100 text-red-700' : ''}
                          `}>
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleOpenKudos(employee)} className="p-2 text-navy-600 hover:bg-navy-50 rounded-lg transition-colors border border-transparent hover:border-navy-100" title="Send Kudos">
                              <Star className="w-4 h-4" />
                            </button>
                            {status === 'Locked' && (
                              <button onClick={() => handleUnlockSheet(employee.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100" title="Unlock Sheet">
                                <Unlock className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'org' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center">
                <Network className="w-6 h-6 mr-3 text-navy-600" /> Organizational Design
              </h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Drag and drop employees to assign them to reporting lines.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
            {/* Unassigned Pool */}
            <div 
              className="xl:col-span-1 glass-panel rounded-[2rem] p-6 border border-white/40 bg-white/20 min-h-[400px] flex flex-col"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const employeeId = e.dataTransfer.getData('employeeId');
                handleAssignManager(employeeId, '');
              }}
            >
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center px-2">
                Unassigned Pool <span className="ml-auto bg-gray-200 text-gray-600 px-2 py-0.5 rounded-lg text-[10px]">{employees.filter(e => !e.manager_id).length}</span>
              </h3>
              <div className="space-y-3 flex-1">
                {employees.filter(e => !e.manager_id).map((emp: any) => (
                  <div 
                    key={emp.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('employeeId', emp.id)}
                    className="bg-white/80 p-4 rounded-2xl border border-white shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all group border-l-4 border-l-gray-300"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-xs">{emp.full_name.charAt(0)}</div>
                      <div className="ml-3">
                        <p className="text-sm font-bold text-gray-900 leading-none">{emp.full_name}</p>
                        <p className="text-[10px] text-gray-400 font-medium mt-1">{emp.department}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {employees.filter(e => !e.manager_id).length === 0 && (
                  <div className="h-full flex items-center justify-center text-gray-400 text-xs italic">All employees assigned</div>
                )}
              </div>
            </div>

            {/* Manager Lanes */}
            <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              {managers.map((manager: any) => {
                const reports = employees.filter(e => e.manager_id === manager.id);
                return (
                  <div 
                    key={manager.id}
                    className="glass-panel rounded-[2rem] p-6 border border-white/40 bg-white/40 hover:bg-white/60 transition-colors flex flex-col"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      const employeeId = e.dataTransfer.getData('employeeId');
                      if (employeeId !== manager.id) { // Prevent self-reporting in this UI
                         handleAssignManager(employeeId, manager.id);
                      }
                    }}
                  >
                    <div className="flex items-center mb-6">
                      <div className="w-10 h-10 rounded-xl bg-navy-900 text-white flex items-center justify-center font-bold shadow-lg ring-4 ring-navy-50">
                        {manager.full_name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <h4 className="text-sm font-black text-gray-900">{manager.full_name}</h4>
                        <p className="text-[10px] text-navy-500 font-bold uppercase tracking-widest">Reporting Line Manager</p>
                      </div>
                      <span className="ml-auto bg-navy-100 text-navy-700 px-2 py-0.5 rounded-lg text-[10px] font-bold">{reports.length}</span>
                    </div>

                    <div className="space-y-2 flex-1 min-h-[100px]">
                      {reports.map((emp: any) => (
                        <div 
                          key={emp.id}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData('employeeId', emp.id)}
                          className="bg-white/90 p-3 rounded-xl border border-white shadow-sm cursor-grab active:cursor-grabbing hover:translate-x-1 transition-all border-l-4 border-l-blue-500"
                        >
                          <div className="flex items-center">
                            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px]">{emp.full_name.charAt(0)}</div>
                            <span className="ml-3 text-xs font-bold text-gray-700">{emp.full_name}</span>
                          </div>
                        </div>
                      ))}
                      {reports.length === 0 && (
                        <div className="h-full border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-[10px] text-gray-400 font-medium py-4">
                          Drop to assign reports
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Kudos Modal */}
      {isKudosModalOpen && selectedEmpForKudos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900 flex items-center tracking-tight"><Star className="w-6 h-6 mr-3 text-yellow-500 fill-current"/> Send Recognition</h3>
              <button onClick={() => setIsKudosModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6"/></button>
            </div>
            <form onSubmit={handleSendKudos} className="p-8 space-y-6">
              <div className="bg-navy-50/50 p-4 rounded-2xl border border-navy-100 mb-6">
                <p className="text-xs font-bold text-navy-500 uppercase tracking-widest mb-1">Recipient</p>
                <p className="text-lg font-black text-navy-900">{selectedEmpForKudos.full_name}</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Recognition Badge</label>
                <select value={kudosForm.badge_type} onChange={(e: any) => setKudosForm({...kudosForm, badge_type: e.target.value})} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-500 sm:text-sm font-bold shadow-sm">
                  <option>Appreciation</option>
                  <option>Early Achiever</option>
                  <option>Team Player</option>
                  <option>Excellence</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Personalized Message</label>
                <textarea required rows={4} value={kudosForm.message} onChange={(e: any) => setKudosForm({...kudosForm, message: e.target.value})} placeholder="Describe why you're recognizing this achievement..." className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-500 sm:text-sm font-medium shadow-sm"></textarea>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full py-4 bg-navy-900 text-white rounded-2xl shadow-xl hover:bg-navy-800 text-sm font-black tracking-widest uppercase transition-all transform hover:-translate-y-1">Send Badge</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="glass-panel rounded-3xl overflow-hidden shadow-sm border border-white/40">
          <div className="p-6 border-b border-gray-100 bg-white/40">
            <h2 className="text-xl font-bold text-gray-900 flex items-center tracking-tight"><ShieldCheck className="w-5 h-5 mr-2 text-navy-600" /> Compliance & Audit Log</h2>
            <p className="text-sm text-gray-500 font-medium mt-1">Immutable record of all goal sheet state changes.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Entity (Goal)</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Change Details</th>
                </tr>
              </thead>
              <tbody className="bg-white/60 divide-y divide-gray-100">
                {auditLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-white/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-400 font-mono">{new Date(log.changed_at).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{log.profiles?.full_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-navy-600 font-bold">{log.goals?.title || 'System/Sheet'}</td>
                    <td className="px-6 py-4 text-xs">
                      <div className="max-w-md space-y-1">
                        {Object.entries(log.old_data || {}).map(([key, val]) => (
                          <p key={key} className="text-gray-500">
                            <span className="font-bold text-gray-700">{key}:</span> {JSON.stringify(val)} → <span className="font-bold text-blue-600">{JSON.stringify(log.new_data?.[key])}</span>
                          </p>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'escalations' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="glass-panel rounded-3xl overflow-hidden shadow-sm border border-white/40">
            <div className="p-6 border-b border-gray-100 bg-white/40">
              <h2 className="text-xl font-bold text-gray-900 flex items-center tracking-tight"><AlertTriangle className="w-5 h-5 mr-2 text-amber-600" /> Manager-Raised Escalations</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Employee non-compliance issues flagged to HR.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Severity</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Issue</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Manager</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Days Overdue</th>
                  </tr>
                </thead>
                <tbody className="bg-white/60 divide-y divide-gray-100">
                  {getEscalationsData().escalations.map((esc: any) => (
                    <tr key={esc.id} className="hover:bg-white/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 rounded">{esc.severity}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{esc.employee}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">{esc.issue}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-navy-800">{esc.manager}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-red-600">{esc.daysOverdue} days</td>
                    </tr>
                  ))}
                  {getEscalationsData().escalations.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-10 text-center text-sm font-medium text-gray-500 italic">No manager-raised escalations at this time.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-panel rounded-3xl overflow-hidden shadow-sm border border-white/40">
            <div className="p-6 border-b border-gray-100 bg-white/40">
              <h2 className="text-xl font-bold text-gray-900 flex items-center tracking-tight"><ShieldCheck className="w-5 h-5 mr-2 text-red-600" /> Manager Negligence Notifications</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Automatic alerts for managers missing goal approval SLAs.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Notification</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Manager Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Context</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Overdue SLA</th>
                  </tr>
                </thead>
                <tbody className="bg-white/60 divide-y divide-gray-100">
                  {getEscalationsData().negligence.map((neg: any) => (
                    <tr key={neg.id} className="hover:bg-white/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2"></div>
                          <span className="text-sm font-bold text-red-700">SLA Breach</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-gray-900">{neg.manager}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">{neg.issue} ({neg.employee})</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-red-600">{neg.daysOverdue} days</td>
                    </tr>
                  ))}
                  {getEscalationsData().negligence.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-sm font-medium text-gray-500 italic">All managers are currently within SLA limits.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-panel p-8 rounded-3xl bg-white/40 border border-white/60">
              <h3 className="text-lg font-bold text-gray-900 mb-8 flex items-center uppercase tracking-widest"><BarChart3 className="w-5 h-5 mr-3 text-navy-600" /> Goal Thrust Areas Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={getAnalyticsData().pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                      {getAnalyticsData().pieData.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 700 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel p-8 rounded-3xl bg-white/40 border border-white/60">
              <h3 className="text-lg font-bold text-gray-900 mb-8 flex items-center uppercase tracking-widest"><Activity className="w-5 h-5 mr-3 text-navy-600" /> Organizational Lifecycle Status</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getAnalyticsData().trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
                    <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="count" fill="#1e293b" radius={[8, 8, 0, 0]} barSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel p-8 rounded-3xl bg-white/40 border border-white/60 lg:col-span-2">
              <h3 className="text-lg font-bold text-gray-900 mb-8 flex items-center uppercase tracking-widest"><CheckCircle className="w-5 h-5 mr-3 text-navy-600" /> Manager Performance (Approval Completion Rates)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getAnalyticsData().managerStats} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} width={100} />
                    <RechartsTooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="rate" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
