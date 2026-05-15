import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Target, Activity, FileDown, CheckCircle, Clock } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    sheetsSubmitted: 0,
    sheetsApproved: 0,
    sheetsLocked: 0
  });
  
  const [employees, setEmployees] = useState<any[]>([]);
  const [sheets, setSheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch Employees
    const { data: profiles } = await supabase.from('profiles').select('*').eq('role', 'Employee');
    const { data: allSheets } = await supabase.from('goal_sheets').select('*').eq('cycle', 'FY2026');
    
    if (profiles) setEmployees(profiles);
    if (allSheets) {
      setSheets(allSheets);
      setStats({
        totalEmployees: profiles?.length || 0,
        sheetsSubmitted: allSheets.filter(s => s.status === 'Submitted').length,
        sheetsApproved: allSheets.filter(s => s.status === 'Approved').length,
        sheetsLocked: allSheets.filter(s => s.status === 'Locked').length
      });
    }
    
    setLoading(false);
  };

  const getCompletionStatus = (empId: string) => {
    const sheet = sheets.find(s => s.user_id === empId);
    if (!sheet) return 'Not Started';
    return sheet.status;
  };

  const handleExportCSV = async () => {
    // Phase 2: Export CSV of Planned vs Actual
    const { data: goals, error } = await supabase
      .from('goals')
      .select(`
        *,
        goal_sheets (
          user_id,
          profiles ( full_name, department )
        )
      `);
      
    if (error || !goals) {
      alert("Failed to export data.");
      return;
    }

    const headers = ['Employee', 'Department', 'Thrust Area', 'Goal', 'Target', 'UOM', 'Q1 Actual', 'Q1 Status', 'Q2 Actual', 'Q2 Status'];
    const rows = goals.map((g: any) => [
      `"${g.goal_sheets?.profiles?.full_name || 'Unknown'}"`,
      `"${g.goal_sheets?.profiles?.department || 'Unknown'}"`,
      `"${g.thrust_area}"`,
      `"${g.title}"`,
      `"${g.target_value}"`,
      `"${g.uom}"`,
      `"${g.actual_q1 || ''}"`,
      `"${g.status_q1 || ''}"`,
      `"${g.actual_q2 || ''}"`,
      `"${g.status_q2 || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `GoalFlow_Achievement_Report.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-navy-900"></div></div>;

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">Enterprise oversight and governance.</p>
        </div>
        
        <button 
          onClick={handleExportCSV}
          className="mt-4 sm:mt-0 px-5 py-2.5 bg-white text-navy-900 border border-navy-200 rounded-xl hover:bg-navy-50 text-sm font-bold flex items-center shadow-sm transition-all"
        >
          <FileDown className="w-4 h-4 mr-2" /> Export Achievement Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -z-10 group-hover:bg-blue-500/20 transition-all"></div>
          <div className="flex items-center">
            <div className="p-3 bg-white/60 rounded-xl"><Users className="h-6 w-6 text-navy-600" /></div>
            <div className="ml-4">
              <p className="text-sm font-bold text-gray-500">Total Employees</p>
              <p className="text-3xl font-black text-gray-900">{stats.totalEmployees}</p>
            </div>
          </div>
        </div>
        
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -z-10 group-hover:bg-amber-500/20 transition-all"></div>
          <div className="flex items-center">
            <div className="p-3 bg-white/60 rounded-xl"><Clock className="h-6 w-6 text-amber-600" /></div>
            <div className="ml-4">
              <p className="text-sm font-bold text-gray-500">Pending Approval</p>
              <p className="text-3xl font-black text-gray-900">{stats.sheetsSubmitted}</p>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl -z-10 group-hover:bg-green-500/20 transition-all"></div>
          <div className="flex items-center">
            <div className="p-3 bg-white/60 rounded-xl"><CheckCircle className="h-6 w-6 text-green-600" /></div>
            <div className="ml-4">
              <p className="text-sm font-bold text-gray-500">Approved</p>
              <p className="text-3xl font-black text-gray-900">{stats.sheetsApproved}</p>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl -z-10 group-hover:bg-red-500/20 transition-all"></div>
          <div className="flex items-center">
            <div className="p-3 bg-white/60 rounded-xl"><Target className="h-6 w-6 text-red-600" /></div>
            <div className="ml-4">
              <p className="text-sm font-bold text-gray-500">Locked & Final</p>
              <p className="text-3xl font-black text-gray-900">{stats.sheetsLocked}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Completion Dashboard */}
      <div className="glass-panel rounded-3xl overflow-hidden shadow-sm border border-white/40">
        <div className="p-6 border-b border-gray-100 bg-white/40">
          <h2 className="text-xl font-bold text-gray-900 flex items-center tracking-tight"><Activity className="w-5 h-5 mr-2 text-navy-600" /> Quarterly Completion Dashboard</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">Monitor which employees have completed their goal sheets.</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Employee Name</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Goal Sheet Status</th>
              </tr>
            </thead>
            <tbody className="bg-white/60 divide-y divide-gray-100">
              {employees.map((employee) => {
                const status = getCompletionStatus(employee.id);
                return (
                  <tr key={employee.id} className="hover:bg-white/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy-800 to-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                          {employee.full_name.charAt(0)}
                        </div>
                        <div className="ml-3 font-bold text-gray-900 text-sm">{employee.full_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                      {employee.department || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm
                        ${status === 'Not Started' ? 'bg-gray-100 text-gray-600' : ''}
                        ${status === 'Draft' ? 'bg-gray-100 text-gray-700' : ''}
                        ${status === 'Submitted' ? 'bg-blue-100 text-blue-700' : ''}
                        ${status === 'Approved' ? 'bg-green-100 text-green-700' : ''}
                        ${status === 'Locked' ? 'bg-red-100 text-red-700' : ''}
                        ${status === 'Returned' ? 'bg-amber-100 text-amber-700' : ''}
                      `}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {employees.length === 0 && (
            <div className="p-8 text-center text-gray-500 font-medium text-sm">No employees found in the system.</div>
          )}
        </div>
      </div>
    </div>
  );
}
