import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  Search, Filter, ChevronLeft, ChevronRight, ExternalLink,
  Users, UserCheck, UserX, Flag, RefreshCw, X, Phone, Download,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const SOURCES = ['Naukri', 'LinkedIn', 'Indeed', 'Walk-In', 'Referral', 'Monster', 'Company Website', 'Social Media', 'Other'];

const STATUSES = [
  'New', 'Contacted', 'Interested', 'Interview Scheduled',
  'Selected', 'Rejected', 'Eligible Candidates', 'Wrong Number',
  'Did Not Pick', 'Call Back', 'HR Shortlist', 'Written Test',
  'Operations Round', 'Documentation', 'Yet To Join', 'Joined',
];

const STATUS_COLORS: Record<string, string> = {
  'New': 'bg-slate-100 text-slate-600',
  'Contacted': 'bg-blue-100 text-blue-700',
  'Interested': 'bg-cyan-100 text-cyan-700',
  'Interview Scheduled': 'bg-violet-100 text-violet-700',
  'Selected': 'bg-emerald-100 text-emerald-700',
  'Rejected': 'bg-red-100 text-red-600',
  'Eligible Candidates': 'bg-teal-100 text-teal-700',
  'Wrong Number': 'bg-slate-200 text-slate-500',
  'Did Not Pick': 'bg-orange-100 text-orange-600',
  'Call Back': 'bg-amber-100 text-amber-700',
  'HR Shortlist': 'bg-lime-100 text-lime-700',
  'Written Test': 'bg-indigo-100 text-indigo-700',
  'Operations Round': 'bg-purple-100 text-purple-700',
  'Documentation': 'bg-sky-100 text-sky-700',
  'Yet To Join': 'bg-yellow-100 text-yellow-700',
  'Joined': 'bg-green-100 text-green-700',
};

const SOURCE_COLORS: Record<string, string> = {
  'Naukri': 'bg-amber-50 text-amber-700 border border-amber-200',
  'LinkedIn': 'bg-blue-50 text-blue-700 border border-blue-200',
  'Indeed': 'bg-violet-50 text-violet-700 border border-violet-200',
  'Walk-In': 'bg-green-50 text-green-700 border border-green-200',
  'Referral': 'bg-rose-50 text-rose-700 border border-rose-200',
};

const OWNERSHIP_STATUS_COLORS: Record<string, string> = {
  'Assigned': 'bg-green-50 text-green-700 border border-green-200',
  'Expired': 'bg-orange-50 text-orange-700 border border-orange-200',
  'Unassigned': 'bg-slate-50 text-slate-600 border border-slate-200',
  'General Data': 'bg-purple-50 text-purple-700 border border-purple-200',
};

export function CandidateDatabasePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const stateFilter = (location.state as any)?.sourceFilter as string | undefined;
  const stateStatusFilter = (location.state as any)?.statusFilter as string | undefined;

  // Role-based access: Only Admin and Manager can view candidate database
  useEffect(() => {
    if (user && !['admin', 'manager'].includes(user.role)) {
      navigate('/recruiter');
    }
  }, [user, navigate]);

  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState(stateFilter || '');
  const [statusFilter, setStatusFilter] = useState(stateStatusFilter || '');
  const [reassignFilter, setReassignFilter] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [stats, setStats] = useState({ total: 0, selected: 0, joined: 0, reassignPending: 0 });
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (sourceFilter) params.source = sourceFilter;
      if (statusFilter) params.status = statusFilter;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      
      await api.exportCandidatesExcel(params);
    } catch (err: any) {
      console.error('Export failed:', err);
      alert(err.message || 'Failed to export candidates. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: page.toString(), limit: '25' };
      if (search) params.search = search;
      if (sourceFilter) params.source = sourceFilter;
      if (statusFilter) params.status = statusFilter;
      if (reassignFilter) params.reassignRequested = 'true';
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      const data = await api.getCandidates(params);
      setCandidates(data.candidates || []);
      setPagination(data.pagination || { total: 0, pages: 1 });
    } catch {
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [search, sourceFilter, statusFilter, reassignFilter, fromDate, toDate, page]);

  // Stats fetch (no filters)
  useEffect(() => {
    Promise.all([
      api.getCandidates({ limit: '1' }),
      api.getCandidates({ status: 'Selected', limit: '1' }),
      api.getCandidates({ status: 'Joined', limit: '1' }),
      api.getCandidates({ limit: '1', reassignRequested: 'true' }).catch(() => ({ pagination: { total: 0 } })),
    ]).then(([all, sel, joined, reassign]) => {
      setStats({
        total: all.pagination?.total || 0,
        selected: sel.pagination?.total || 0,
        joined: joined.pagination?.total || 0,
        reassignPending: (reassign as any).pagination?.total || 0,
      });
    }).catch(() => {});
  }, []);

  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, sourceFilter, statusFilter, reassignFilter, fromDate, toDate]);

  const clearFilters = () => {
    setSearch('');
    setSourceFilter('');
    setStatusFilter('');
    setReassignFilter(false);
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const hasFilters = !!(search || sourceFilter || statusFilter || reassignFilter || fromDate || toDate);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-slate-800" style={{ fontWeight: 700 }}>Candidate Database</h1>
            <p className="text-slate-500 text-sm mt-0.5">All candidates across all recruiters and sources</p>
          </div>
          <div className="flex gap-2">
            {user?.role === 'admin' && (
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm px-4 py-2 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                style={{ fontWeight: 500 }}
              >
                {exporting ? (
                  <RefreshCw className="w-4 h-4 text-green-600 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 text-green-600" />
                )}
                {exporting ? 'Exporting...' : 'Export Candidates'}
              </button>
            )}
            <button onClick={() => navigate('/recruiter/add')}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-xl transition-colors"
              style={{ fontWeight: 500 }}>
              + Add Candidate
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Candidates', value: stats.total, icon: Users, color: 'text-slate-700', bg: 'bg-white', filter: false },
            { label: 'Selected', value: stats.selected, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', filter: false },
            { label: 'Joined', value: stats.joined, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50', filter: false },
            { label: 'Reassign Pending', value: stats.reassignPending, icon: RefreshCw, color: 'text-orange-500', bg: reassignFilter ? 'bg-orange-100 ring-2 ring-orange-400' : 'bg-orange-50', filter: true },
          ].map((s, i) => (
            <div key={i}
              onClick={() => s.filter && setReassignFilter(f => !f)}
              className={`${s.bg} rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3 ${s.filter ? 'cursor-pointer hover:bg-orange-100 transition-colors' : ''}`}>
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0">
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <div className={`text-xl ${s.color}`} style={{ fontWeight: 700 }}>{s.value.toLocaleString()}</div>
                <div className="text-slate-500 text-xs">{s.label}</div>
                {s.filter && <div className="text-orange-400 text-xs">{reassignFilter ? 'Click to clear' : 'Click to filter'}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, phone, email, skills…"
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/30"
            />
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <Filter className="w-4 h-4" />
          </div>
          <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
            className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-green-500/30">
            <option value="">All Sources</option>
            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-green-500/30">
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-green-500/30 text-slate-600"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-green-500/30 text-slate-600"
            />
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
          <button onClick={fetchCandidates} className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-400 ml-auto">{pagination.total.toLocaleString()} candidates</span>
        </div>

        {/* Active source filter badge */}
        {sourceFilter && (
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-sm">Filtered by source:</span>
            <span className={`text-xs px-2.5 py-1 rounded-full ${SOURCE_COLORS[sourceFilter] || 'bg-slate-100 text-slate-600'}`} style={{ fontWeight: 500 }}>
              {sourceFilter}
            </span>
            <button onClick={() => setSourceFilter('')} className="text-slate-400 hover:text-red-500">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading candidates…
            </div>
          ) : candidates.length === 0 ? (
            <div className="py-16 text-center">
              <UserX className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No candidates found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Name', 'Phone', 'Department', 'Ownership', 'Experience', 'Source', 'Recruiter', 'Status', 'Added', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs text-slate-500 uppercase tracking-wide" style={{ fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {candidates.map(c => (
                    <tr key={c._id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/recruiter/candidate/${c._id}`)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-green-700 text-xs" style={{ fontWeight: 600 }}>
                              {c.name?.[0]?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="text-slate-700 text-xs" style={{ fontWeight: 600 }}>
                              {c.name} {c.candidateId && <span className="text-[10px] text-slate-400 font-normal ml-1">({c.candidateId})</span>}
                            </p>
                            {c.flagged && <span className="text-red-400 text-xs flex items-center gap-0.5"><Flag className="w-3 h-3" />Flagged</span>}
                            {c.reassignRequested && <span className="text-orange-500 text-xs flex items-center gap-0.5"><RefreshCw className="w-3 h-3" />Reassign Requested</span>}
                            {c.candidateActiveStatus === 'Inactive' && !c.reassignRequested && <span className="text-orange-400 text-xs">Inactive</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-slate-600 text-xs">
                          <Phone className="w-3 h-3 text-slate-300" /> {c.phone}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-600 text-xs truncate max-w-[120px] block" title={c.department || ''}>
                          {c.department || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${OWNERSHIP_STATUS_COLORS[c.ownershipStatus] || 'bg-slate-100 text-slate-500'}`} style={{ fontWeight: 600 }}>
                          {c.ownershipStatus || 'Assigned'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{c.experience || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${SOURCE_COLORS[c.source] || 'bg-slate-100 text-slate-600'}`}>
                          {c.source || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{c.assignedRecruiterName || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status] || 'bg-slate-100 text-slate-500'}`}>
                          {c.status || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <button onClick={() => navigate(`/recruiter/candidate/${c._id}`)}
                          className="text-slate-300 hover:text-green-600 p-1 rounded-lg hover:bg-green-50 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Page {page} of {pagination.pages} · {pagination.total.toLocaleString()} total
              </span>
              <div className="flex gap-1">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-slate-100 text-slate-600 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}
                  className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-slate-100 text-slate-600 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
