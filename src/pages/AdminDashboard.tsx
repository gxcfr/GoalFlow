import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Target, Activity, FileDown, CheckCircle, Clock, Unlock, Network, ShieldCheck, BarChart3, AlertTriangle, Star, X, Radio, Megaphone, Send, Check, AlertCircle, Search } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AdminDashboard() {
  const { profile } = useAuth();
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

  // Broadcast states
  const [broadcastForm, setBroadcastForm] = useState({
    thrust_area: '',
    title: '',
    description: '',
    uom: 'Numeric',
    target_value: '',
    target_direction: 'Maximize',
    weightage: 10
  });
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSearchQuery, setBroadcastSearchQuery] = useState('');
  const [broadcastDeptFilter, setBroadcastDeptFilter] = useState('All');

  const getEmployeeQuota = (empId: string) => {
    const sheet = sheets.find((s: any) => s.user_id === empId);
    if (!sheet) {
      return { total: 0, remaining: 100, status: 'Not Started', goalsCount: 0 };
    }
    const empGoals = allGoals.filter((g: any) => g.sheet_id === sheet.id);
    const total = empGoals.reduce((sum, g) => sum + Number(g.weightage), 0);
    return {
      total,
      remaining: 100 - total,
      status: sheet.status,
      goalsCount: empGoals.length
    };
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmployees.size === 0) {
      alert('Please select at least one employee to broadcast to.');
      return;
    }
    if (broadcastForm.weightage < 10) {
      alert('Goal weightage must be at least 10%.');
      return;
    }

    setIsBroadcasting(true);
    let successCount = 0;
    let errorCount = 0;

    const currentSheets = [...sheets];

    try {
      for (const empId of selectedEmployees) {
        try {
          let sheetId = null;
          const existingSheet = currentSheets.find((s: any) => s.user_id === empId);

          if (existingSheet) {
            sheetId = existingSheet.id;
          } else {
            // Create a draft goal sheet
            const { data: newSheet, error: sheetError } = await supabase
              .from('goal_sheets')
              .insert({
                user_id: empId,
                cycle: 'FY2026',
                status: 'Draft'
              })
              .select()
              .single();

            if (sheetError) throw sheetError;
            sheetId = newSheet.id;
            currentSheets.push(newSheet);
          }

          // Insert goal
          const { data: newGoal, error: goalError } = await supabase
            .from('goals')
            .insert({
              sheet_id: sheetId,
              thrust_area: broadcastForm.thrust_area,
              title: broadcastForm.title,
              description: broadcastForm.description,
              uom: broadcastForm.uom,
              target_value: broadcastForm.target_value,
              target_direction: broadcastForm.target_direction,
              weightage: broadcastForm.weightage
            })
            .select()
            .single();

          if (goalError) throw goalError;

          // Insert link in shared_goal_links
          const { error: linkError } = await supabase
            .from('shared_goal_links')
            .insert({
              employee_goal_id: newGoal.id,
              assigned_by: profile?.id,
              assigned_to: empId
            });

          if (linkError) throw linkError;
          successCount++;
        } catch (err) {
          console.error(`Error broadcasting to employee ${empId}:`, err);
          errorCount++;
        }
      }

      alert(`Broadcast complete! Successfully assigned goal to ${successCount} employees.` + (errorCount > 0 ? ` Failed for ${errorCount} employees.` : ''));
      
      setSelectedEmployees(new Set());
      setBroadcastForm({
        thrust_area: '',
        title: '',
        description: '',
        uom: 'Numeric',
        target_value: '',
        target_direction: 'Maximize',
        weightage: 10
      });

      await fetchData();
    } catch (err: any) {
      alert(`An error occurred during broadcasting: ${err.message}`);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleExportAuditLog = async () => {
    try {
      const { data: allLogs, error } = await supabase
        .from('audit_logs')
        .select('*, goals ( title ), profiles!changed_by ( full_name )')
        .order('changed_at', { ascending: false });

      if (error) throw error;

      if (!allLogs || allLogs.length === 0) {
        alert('No audit logs available to export.');
        return;
      }

      const headers = ['Timestamp', 'Changed By', 'Goal Title / Entity', 'Field', 'Old Value', 'New Value'];
      const csvRows = [headers.join(',')];

      allLogs.forEach((log: any) => {
        const timestamp = new Date(log.changed_at).toLocaleString();
        const changedBy = `"${(log.profiles?.full_name || 'System').replace(/"/g, '""')}"`;
        const goalTitle = `"${(log.goals?.title || 'System/Sheet').replace(/"/g, '""')}"`;
        
        const oldData = log.old_data || {};
        const newData = log.new_data || {};
        const keys = Array.from(new Set([...Object.keys(oldData), ...Object.keys(newData)]));
        
        if (keys.length > 0) {
          keys.forEach((key) => {
            const oldVal = oldData[key] !== undefined ? JSON.stringify(oldData[key]) : '';
            const newVal = newData[key] !== undefined ? JSON.stringify(newData[key]) : '';
            
            const row = [
              `"${timestamp}"`,
              changedBy,
              goalTitle,
              `"${key.replace(/"/g, '""')}"`,
              `"${oldVal.replace(/"/g, '""')}"`,
              `"${newVal.replace(/"/g, '""')}"`
            ];
            csvRows.push(row.join(','));
          });
        } else {
          const row = [
            `"${timestamp}"`,
            changedBy,
            goalTitle,
            '""',
            '""',
            '""'
          ];
          csvRows.push(row.join(','));
        }
      });

      const csvContent = "\uFEFF" + csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `GoalFlow_All_Audit_Logs_${new Date().toISOString().slice(0,10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(`Failed to export audit logs: ${err.message}`);
    }
  };

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

      {activeTab === 'broadcast' && (
        <div className="space-y-8 animate-fade-in-up">
          {/* Banner Header Card */}
          <div className="relative overflow-hidden rounded-[2rem] p-8 bg-gradient-to-br from-navy-900 via-navy-950 to-blue-950 text-white shadow-2xl border border-white/10 group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.2),transparent_60%)]"></div>
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] -z-10 group-hover:bg-blue-500/20 transition-all duration-500"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <span className="px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-blue-500/20 text-blue-300 border border-blue-400/20">Strategic Governance</span>
                <h2 className="text-3xl font-black tracking-tight mt-3 flex items-center">
                  <Megaphone className="w-8 h-8 mr-3 text-blue-400 animate-pulse" /> Strategic Goal Broadcasting
                </h2>
                <p className="text-sm text-blue-100/80 font-medium mt-2 max-w-3xl leading-relaxed">
                  Directly deploy organization-wide objectives, shared OKRs, or compliance goals into selected employee goal sheets. Target specific departments, view real-time quota remaining, and ensure aligned accountability.
                </p>
              </div>
              <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 min-w-[150px] shadow-lg self-stretch md:self-auto text-center">
                <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Active Audience</span>
                <span className="text-3xl font-black text-white mt-1">{selectedEmployees.size}</span>
                <span className="text-xs font-semibold text-blue-200 mt-1">Employees Selected</span>
              </div>
            </div>
          </div>

          {/* Main Workspace */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            {/* Left Panel: Form Template Builder */}
            <div className="xl:col-span-5 glass-panel rounded-[2rem] p-8 border border-white/60 bg-white/40 shadow-xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center tracking-tight">
                  <Radio className="w-5 h-5 mr-2 text-navy-600" /> Goal Specifications
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-1">Design the strategic initiative templates below.</p>
              </div>

              <form onSubmit={handleBroadcast} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Thrust Area</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Operational Security, Revenue Expansion"
                    value={broadcastForm.thrust_area}
                    onChange={e => setBroadcastForm({ ...broadcastForm, thrust_area: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-500 sm:text-sm font-bold shadow-sm"
                  />
                  {/* Suggestions Pills */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['Product Excellence', 'Revenue Growth', 'Customer Success', 'Compliance & Security'].map(area => (
                      <button
                        key={area}
                        type="button"
                        onClick={() => setBroadcastForm({ ...broadcastForm, thrust_area: area })}
                        className="px-2.5 py-1 bg-white hover:bg-navy-50 border border-gray-100 rounded-lg text-[10px] font-bold text-gray-600 transition-colors"
                      >
                        + {area}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Goal Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Implement Multi-Factor Authentication Compliance"
                    value={broadcastForm.title}
                    onChange={e => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-500 sm:text-sm font-bold shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe the scope, background context, and alignment requirements of this shared strategic goal..."
                    value={broadcastForm.description}
                    onChange={e => setBroadcastForm({ ...broadcastForm, description: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-500 sm:text-sm font-medium shadow-sm"
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Unit of Measure</label>
                    <select
                      value={broadcastForm.uom}
                      onChange={e => setBroadcastForm({ ...broadcastForm, uom: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-500 sm:text-sm font-bold shadow-sm"
                    >
                      <option>Numeric</option>
                      <option>%</option>
                      <option>Timeline</option>
                      <option>Zero-based</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Target Direction</label>
                    <select
                      value={broadcastForm.target_direction}
                      onChange={e => setBroadcastForm({ ...broadcastForm, target_direction: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-500 sm:text-sm font-bold shadow-sm"
                    >
                      <option>Maximize</option>
                      <option>Minimize</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Target Value</label>
                  <input
                    type={broadcastForm.uom === 'Timeline' ? 'date' : 'text'}
                    required
                    placeholder={broadcastForm.uom === 'Timeline' ? '' : 'e.g. 100, 95%'}
                    value={broadcastForm.target_value}
                    onChange={e => setBroadcastForm({ ...broadcastForm, target_value: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy-500 sm:text-sm font-bold shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex justify-between">
                    <span>Goal Weightage Allocation</span>
                    <span className="text-navy-700 font-black">{broadcastForm.weightage}%</span>
                  </label>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center space-x-4 shadow-sm mt-1">
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={broadcastForm.weightage}
                      onChange={e => setBroadcastForm({ ...broadcastForm, weightage: Number(e.target.value) })}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-navy-900"
                    />
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={broadcastForm.weightage}
                      onChange={e => setBroadcastForm({ ...broadcastForm, weightage: Math.max(10, Math.min(100, Number(e.target.value))) })}
                      className="w-16 px-2 py-1.5 text-center font-bold text-sm bg-gray-50 border border-gray-200 rounded-lg"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 font-semibold mt-1">Weightage must be at least 10% per database check constraint guidelines.</p>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isBroadcasting || selectedEmployees.size === 0}
                    className="w-full py-4 bg-gradient-to-r from-navy-900 to-blue-900 text-white rounded-2xl shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:shadow-none hover:-translate-y-0.5 transition-all text-sm font-black tracking-widest uppercase flex items-center justify-center gap-2"
                  >
                    {isBroadcasting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Broadcasting Goal...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Deploy Broadcast ({selectedEmployees.size})
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Panel: Audience Selection & Quota Audit */}
            <div className="xl:col-span-7 space-y-6">
              <div className="glass-panel rounded-[2rem] p-8 border border-white/60 bg-white/40 shadow-xl flex flex-col min-h-[550px]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 tracking-tight flex items-center">
                      <Users className="w-5 h-5 mr-2 text-navy-600" /> Target Employee Roster
                    </h3>
                    <p className="text-xs text-gray-500 font-medium mt-1">Select recipients & audit weightage allocations.</p>
                  </div>

                  <div className="flex items-center gap-2 self-stretch sm:self-auto">
                    <button
                      onClick={() => {
                        const filtered = employees.filter(e => {
                          const nameMatch = e.full_name.toLowerCase().includes(broadcastSearchQuery.toLowerCase());
                          const deptMatch = broadcastDeptFilter === 'All' || e.department === broadcastDeptFilter;
                          return nameMatch && deptMatch;
                        });
                        const allSelected = filtered.every(e => selectedEmployees.has(e.id));
                        if (allSelected) {
                          const updated = new Set(selectedEmployees);
                          filtered.forEach(e => updated.delete(e.id));
                          setSelectedEmployees(updated);
                        } else {
                          const updated = new Set(selectedEmployees);
                          filtered.forEach(e => updated.add(e.id));
                          setSelectedEmployees(updated);
                        }
                      }}
                      className="px-3 py-2 bg-white hover:bg-navy-50 text-navy-800 border border-gray-200 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" /> Toggle All Visible
                    </button>
                  </div>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 bg-white/10 rounded-2xl mt-4 px-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search employees..."
                      value={broadcastSearchQuery}
                      onChange={e => setBroadcastSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-navy-500 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <select
                      value={broadcastDeptFilter}
                      onChange={e => setBroadcastDeptFilter(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-navy-500 text-sm font-bold"
                    >
                      {['All', ...Array.from(new Set(employees.map(e => e.department).filter(Boolean)))].map(dept => (
                        <option key={dept} value={dept}>{dept === 'All' ? 'All Departments' : dept}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Employees Cards Container */}
                <div className="flex-1 overflow-y-auto max-h-[500px] pr-2 mt-4 space-y-3 scrollbar-thin">
                  {(() => {
                    const filtered = employees.filter(e => {
                      const nameMatch = e.full_name.toLowerCase().includes(broadcastSearchQuery.toLowerCase());
                      const deptMatch = broadcastDeptFilter === 'All' || e.department === broadcastDeptFilter;
                      return nameMatch && deptMatch;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="py-12 text-center text-gray-400 font-medium text-sm italic">
                          No employees matched the current filters.
                        </div>
                      );
                    }

                    return filtered.map(emp => {
                      const isSelected = selectedEmployees.has(emp.id);
                      const quota = getEmployeeQuota(emp.id);
                      const proposedTotal = quota.total + (isSelected ? broadcastForm.weightage : 0);
                      const isOverAllocated = proposedTotal > 100;
                      
                      // Fetch manager name
                      const manager = managers.find(m => m.id === emp.manager_id);
                      const managerName = manager ? manager.full_name : 'No Manager';

                      return (
                        <div
                          key={emp.id}
                          onClick={() => {
                            const updated = new Set(selectedEmployees);
                            if (updated.has(emp.id)) {
                              updated.delete(emp.id);
                            } else {
                              updated.add(emp.id);
                            }
                            setSelectedEmployees(updated);
                          }}
                          className={`group cursor-pointer rounded-2xl p-5 border transition-all duration-300 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                            isSelected
                              ? 'bg-gradient-to-br from-blue-50/80 to-white border-blue-300 shadow-md ring-1 ring-blue-200'
                              : 'bg-white/80 border-gray-100 hover:bg-white hover:border-gray-200 hover:shadow-sm'
                          }`}
                        >
                          {/* Selected Left Highlight line */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-all ${
                            isSelected ? 'bg-blue-600' : 'bg-transparent'
                          }`}></div>

                          <div className="flex items-center gap-4 flex-1">
                            {/* Checkbox */}
                            <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-gray-300 group-hover:border-gray-400'
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>

                            {/* Avatar */}
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-navy-900 to-blue-700 text-white flex items-center justify-center text-base font-bold shadow-md shrink-0">
                              {emp.full_name.charAt(0)}
                            </div>

                            {/* Info */}
                            <div className="space-y-0.5">
                              <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                                {emp.full_name}
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider
                                  ${quota.status === 'Not Started' ? 'bg-gray-100 text-gray-500' : ''}
                                  ${quota.status === 'Draft' ? 'bg-amber-100 text-amber-700' : ''}
                                  ${quota.status.includes('Submitted') ? 'bg-blue-100 text-blue-700' : ''}
                                  ${quota.status.includes('Approved') ? 'bg-green-100 text-green-700' : ''}
                                  ${quota.status === 'Locked' ? 'bg-red-100 text-red-700' : ''}
                                `}>
                                  {quota.status}
                                </span>
                              </h4>
                              <p className="text-xs text-gray-500 font-semibold">{emp.email}</p>
                              <div className="flex flex-wrap gap-x-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                <span>Dept: {emp.department || 'General'}</span>
                                <span>•</span>
                                <span>Mgr: {managerName}</span>
                              </div>
                            </div>
                          </div>

                          {/* Quota indicator right side */}
                          <div className="w-full md:w-56 space-y-2 shrink-0 pt-2 md:pt-0">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                              <span className="text-gray-400">Quota Allocation</span>
                              {isOverAllocated ? (
                                <span className="text-red-600 flex items-center gap-0.5 font-black">
                                  <AlertCircle className="w-3 h-3" /> Exceeds: {proposedTotal}%
                                </span>
                              ) : isSelected ? (
                                <span className="text-blue-600 font-bold">Proposed: {proposedTotal}%</span>
                              ) : (
                                <span className="text-navy-900 font-bold">Current: {quota.total}%</span>
                              )}
                            </div>

                            {/* visual progress bar */}
                            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-inner relative border border-gray-100">
                              {/* Current allocated weightage */}
                              <div
                                className="h-full bg-navy-800 transition-all duration-500 rounded-l-full"
                                style={{ width: `${Math.min(quota.total, 100)}%` }}
                              ></div>

                              {/* Broadcast weightage addition (pulsing preview) */}
                              {isSelected && !isOverAllocated && (
                                <div
                                  className="h-full bg-blue-500 bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[bar-progress_1s_linear_infinite] transition-all duration-500"
                                  style={{ width: `${Math.min(broadcastForm.weightage, 100 - quota.total)}%` }}
                                ></div>
                              )}

                              {/* Over allocated part (red) */}
                              {isSelected && isOverAllocated && (
                                <>
                                  <div
                                    className="h-full bg-blue-500 bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[bar-progress_1s_linear_infinite] transition-all duration-500"
                                    style={{ width: `${Math.min(broadcastForm.weightage - (proposedTotal - 100), 100 - quota.total)}%` }}
                                  ></div>
                                  <div
                                    className="h-full bg-red-500 transition-all duration-500"
                                    style={{ width: `${proposedTotal - 100}%` }}
                                  ></div>
                                </>
                              )}
                            </div>

                            {/* Details text */}
                            <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                              <span>Remaining Quota:</span>
                              <span className={quota.remaining <= 0 ? 'text-red-500 font-extrabold' : 'font-extrabold text-gray-700'}>
                                {quota.remaining}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
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
          <div className="p-6 border-b border-gray-100 bg-white/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center tracking-tight"><ShieldCheck className="w-5 h-5 mr-2 text-navy-600" /> Compliance & Audit Log</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Immutable record of all goal sheet state changes.</p>
            </div>
            <button onClick={handleExportAuditLog} className="flex items-center justify-center px-4 py-2.5 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-sm font-bold shadow-sm transition-all sm:self-center self-stretch">
              <FileDown className="w-4 h-4 mr-2" /> Export Audit Log
            </button>
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
