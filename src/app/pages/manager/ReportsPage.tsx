import { useState, useEffect } from 'react';
import { Download, Filter, TrendingUp, TrendingDown, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../../services/api';

export function ReportsPage() {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];

  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(todayStr);
  const [sortField, setSortField] = useState<string>('revenue');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [departmentData, setDepartmentData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${(n / 1000).toFixed(0)}K`;

  const loadReports = async (from: string, to: string) => {
    try {
      setLoading(true);
      const data = await api.getManagerReports({ from, to });
      const raw = data.reports || data.performanceData || data.recruiterPerformance || [];
      setPerformanceData(raw.map((r: any) => ({
        recruiter: r.recruiter || r.name || '',
        calls: r.calls ?? r.totalCalls ?? 0,
        interviews: r.interviews ?? 0,
        placed: r.placed ?? r.placements ?? 0,
        convRate: r.convRate || (r.conversionRate != null ? `${r.conversionRate}%` : '0%'),
        revenue: r.revenue ?? ((r.placements || 0) * 25000),
        trend: r.trend || ((r.conversionRate ?? 0) > 30 ? 'up' : 'down'),
      })));
      setMonthlyData(data.monthlyData || data.monthlyOverview || []);

      // Fetch additional dashboard data for department distribution
      const dashData = await api.getManagerDashboard();
      setDepartmentData(dashData.departmentDistribution || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports(dateFrom, dateTo);
  }, []);

  const sorted = [...performanceData].sort((a, b) => {
    const va = (a as any)[sortField];
    const vb = (b as any)[sortField];
    if (typeof va === 'number' && typeof vb === 'number') {
      return sortDir === 'asc' ? va - vb : vb - va;
    }
    return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
  });

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 text-slate-300" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-green-500" /> : <ChevronDown className="w-3 h-3 text-green-500" />;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-slate-800" style={{ fontWeight: 700, fontSize: '1.4rem' }}>Performance Reports</h1>
          <p className="text-slate-500 text-sm mt-0.5">Detailed analytics and recruiter performance breakdown</p>
        </div>
        <button
          onClick={() => {
            const header = 'Recruiter,Calls,Interviews,Placed,Conv Rate,Revenue\n';
            const rows = performanceData.map((r: any) => `${r.recruiter},${r.calls},${r.interviews},${r.placed},${r.convRate},${r.revenue}`).join('\n');
            const blob = new Blob([header + rows], { type: 'text/csv' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `performance_report_${dateFrom}_${dateTo}.csv`; a.click();
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors" style={{ fontWeight: 500 }}>
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Filter className="w-4 h-4 text-slate-400" />
            <span style={{ fontWeight: 500 }}>Date Range:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-400 bg-white"
            />
            <span className="text-slate-400 text-sm">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-green-400 bg-white"
            />
          </div>
          <button onClick={() => loadReports(dateFrom, dateTo)} className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors" style={{ fontWeight: 500 }}>
            Apply
          </button>
          {['This Week', 'This Month', 'Last Month', 'Q1 2026'].map(p => (
            <button key={p} className="px-3 py-2 border border-slate-200 text-slate-600 text-xs rounded-lg hover:bg-slate-50" style={{ fontWeight: 500 }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Calls', value: monthlyData.reduce((s: number, m: any) => s + (m.calls || 0), 0).toLocaleString(), color: 'blue' },
          { label: 'Total Placements', value: monthlyData.reduce((s: number, m: any) => s + (m.placed || 0), 0), color: 'emerald' },
          { label: 'Total Revenue', value: fmt(monthlyData.reduce((s: number, m: any) => s + (m.revenue || 0), 0)), color: 'violet' },
          { label: 'Avg Conv. Rate', value: performanceData.length ? (performanceData.reduce((s: number, r: any) => s + parseFloat(r.convRate || '0'), 0) / performanceData.length).toFixed(1) + '%' : '—', color: 'amber' },
        ].map((s, i) => {
          const bgMap: Record<string, string> = {
            blue: 'text-green-600 bg-green-50',
            emerald: 'text-emerald-600 bg-emerald-50',
            violet: 'text-violet-600 bg-violet-50',
            amber: 'text-amber-600 bg-amber-50',
          };
          return (
            <div key={i} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
              <div className={`text-xl mb-1 ${bgMap[s.color]}`} style={{ fontWeight: 700 }}>{s.value}</div>
              <div className="text-slate-500 text-xs">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-slate-800 text-sm mb-4" style={{ fontWeight: 600 }}>Monthly Overview — Calls vs Placements</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData} barSize={18} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 8 }} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="left" dataKey="calls" name="Calls" fill="#BBF7D0" radius={[3, 3, 0, 0]} />
            <Bar yAxisId="right" dataKey="placed" name="Placed" fill="#16A34A" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Department Distribution Chart */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-slate-800 text-sm mb-4" style={{ fontWeight: 600 }}>Department-wise Candidate Distribution</h3>
        {departmentData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={departmentData} layout="vertical" margin={{ left: 40, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="department" type="category" tick={{ fontSize: 10, fill: '#64748B' }} width={120} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 8 }} />
              <Bar dataKey="count" name="Candidates" fill="#10B981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">
            No department data available for this period.
          </div>
        )}
      </div>

      {/* Performance Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-slate-800 text-sm" style={{ fontWeight: 600 }}>Recruiter Performance Breakdown</h3>
          <span className="text-slate-400 text-xs">Click column headers to sort</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {[
                  { label: 'Recruiter', field: 'recruiter' },
                  { label: 'Calls', field: 'calls' },
                  { label: 'Interviews', field: 'interviews' },
                  { label: 'Placed', field: 'placed' },
                  { label: 'Conv. Rate', field: 'convRate' },
                  { label: 'Revenue', field: 'revenue' },
                  { label: 'Trend', field: 'trend' },
                ].map(col => (
                  <th
                    key={col.field}
                    onClick={() => toggleSort(col.field)}
                    className="px-5 py-3 text-left text-xs text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-700 select-none"
                    style={{ fontWeight: 600 }}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      <SortIcon field={col.field} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sorted.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-700 text-xs" style={{ fontWeight: 600 }}>
                          {r.recruiter.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <span className="text-slate-700 text-sm" style={{ fontWeight: 500 }}>{r.recruiter}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 text-sm">{r.calls.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-slate-600 text-sm">{r.interviews}</td>
                  <td className="px-5 py-3.5">
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>{r.placed}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 text-sm">{r.convRate}</td>
                  <td className="px-5 py-3.5 text-slate-700 text-sm" style={{ fontWeight: 500 }}>{fmt(r.revenue)}</td>
                  <td className="px-5 py-3.5">
                    {r.trend === 'up'
                      ? <span className="flex items-center gap-1 text-emerald-600 text-xs"><TrendingUp className="w-3.5 h-3.5" /> Up</span>
                      : <span className="flex items-center gap-1 text-red-500 text-xs"><TrendingDown className="w-3.5 h-3.5" /> Down</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
