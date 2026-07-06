import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Phone, Users, Calendar, FileText, TrendingUp, Clock,
  ArrowRight, AlertCircle, CheckCircle2, ScanLine, UserPlus,
  ListChecks, CalendarCheck, ChevronDown, Briefcase, UserCheck,
  X, PhoneMissed, PhoneOff, PhoneCall, ClipboardList,
  UserX, Building2, BadgeCheck, Clipboard, Loader2, Mail, CheckSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { getGreeting } from '../../utils/greetingUtils';

// ─── Date Filter ────────────────────────────────────────────
type DateRange = 'Day' | 'Week' | 'Quarter' | 'Year' | 'All' | 'Custom';

// ─── Status Cards Icons ───────────────────────────────────────
const STATUS_ICON_MAP: Record<string, any> = {
  'Eligible Candidates': UserCheck,
  'Wrong Number': PhoneOff,
  'Did Not Pick': PhoneMissed,
  'Call Back': PhoneCall,
  'HR Shortlist': ClipboardList,
  'Written Test': FileText,
  'Operations Round': Building2,
  'Selected': BadgeCheck,
  'Documentation': Clipboard,
  'Yet To Join': UserX,
  'Joined': CheckCircle2,
  'New': UserPlus,
  'Contacted': Phone,
  'Interested': CheckCircle2,
  'Interview Scheduled': Calendar,
  'Rejected': X,
};

const STATUS_COLOR_LIST = ['emerald','red','orange','amber','violet','indigo','cyan','teal','sky','pink','green'];

const STATUS_COLOR_MAP: Record<string, { card: string; icon: string; badge: string }> = {
  emerald: { card: 'border-emerald-100 bg-emerald-50/60 hover:bg-emerald-50',     icon: 'bg-emerald-100 text-emerald-600', badge: 'text-emerald-700' },
  red:     { card: 'border-red-100     bg-red-50/60     hover:bg-red-50',          icon: 'bg-red-100     text-red-500',     badge: 'text-red-600' },
  orange:  { card: 'border-orange-100  bg-orange-50/60  hover:bg-orange-50',       icon: 'bg-orange-100  text-orange-600',  badge: 'text-orange-700' },
  amber:   { card: 'border-amber-100   bg-amber-50/60   hover:bg-amber-50',        icon: 'bg-amber-100   text-amber-600',   badge: 'text-amber-700' },
  violet:  { card: 'border-violet-100  bg-violet-50/60  hover:bg-violet-50',       icon: 'bg-violet-100  text-violet-600',  badge: 'text-violet-700' },
  indigo:  { card: 'border-indigo-100  bg-indigo-50/60  hover:bg-indigo-50',       icon: 'bg-indigo-100  text-indigo-600',  badge: 'text-indigo-700' },
  cyan:    { card: 'border-cyan-100    bg-cyan-50/60    hover:bg-cyan-50',         icon: 'bg-cyan-100    text-cyan-600',    badge: 'text-cyan-700' },
  teal:    { card: 'border-teal-100    bg-teal-50/60    hover:bg-teal-50',         icon: 'bg-teal-100    text-teal-600',    badge: 'text-teal-700' },
  sky:     { card: 'border-sky-100     bg-sky-50/60     hover:bg-sky-50',          icon: 'bg-sky-100     text-sky-600',     badge: 'text-sky-700' },
  pink:    { card: 'border-pink-100    bg-pink-50/60    hover:bg-pink-50',         icon: 'bg-pink-100    text-pink-600',    badge: 'text-pink-700' },
  green:   { card: 'border-green-100   bg-green-50/60   hover:bg-green-50',        icon: 'bg-green-100   text-green-600',   badge: 'text-green-700' },
};

// ─── Top Metrics ─────────────────────────────────────────────
const colorMap: Record<string, { card: string; icon: string; badge: string; text: string }> = {
  blue:    { card: 'border-green-100  bg-green-50/40',    icon: 'bg-green-100  text-green-600',   badge: 'bg-green-100  text-green-700',  text: 'text-green-600' },
  amber:   { card: 'border-amber-100  bg-amber-50/40',    icon: 'bg-amber-100  text-amber-600',   badge: 'bg-amber-100  text-amber-700',  text: 'text-amber-600' },
  violet:  { card: 'border-violet-100 bg-violet-50/40',   icon: 'bg-violet-100 text-violet-600',  badge: 'bg-violet-100 text-violet-700', text: 'text-violet-600' },
  emerald: { card: 'border-emerald-100 bg-emerald-50/40', icon: 'bg-emerald-100 text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', text: 'text-emerald-600' },
};

const activityColors: Record<string, string> = {
  call:   'bg-green-100 text-green-600',
  status: 'bg-violet-100 text-violet-600',
  resume: 'bg-emerald-100 text-emerald-600',
  walkin: 'bg-amber-100 text-amber-600',
  follow: 'bg-slate-100 text-slate-500',
};

export function RecruiterDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const [dateRange, setDateRange] = useState<DateRange>('Day');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [dashData, setDashData] = useState<any>(null);

  const DATE_TABS: DateRange[] = ['Day', 'Week', 'Quarter', 'Year', 'All', 'Custom'];

  useEffect(() => {
    loadDashboard();
  }, [dateRange, customFrom, customTo]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { range: dateRange.toLowerCase() };
      if (dateRange === 'Custom' && customFrom) params.from = customFrom;
      if (dateRange === 'Custom' && customTo) params.to = customTo;
      const data = await api.getRecruiterDashboard(params);
      setDashData(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const STATUS_CARDS = dashData?.pipeline
    ? Object.entries(dashData.pipeline).map(([label, count]: any, i: number) => ({
        label,
        count: count || 0,
        color: STATUS_COLOR_LIST[i % STATUS_COLOR_LIST.length],
        icon: STATUS_ICON_MAP[label] || UserCheck,
      }))
    : [];

  const followUps = dashData?.followUps || [];
  const metrics = {
    todayCalls: dashData?.metrics?.todayCalls ?? dashData?.todayCalls ?? 0,
    followUpsDue: dashData?.metrics?.followUpsDue ?? dashData?.followUpsDue ?? (dashData?.followUps?.length || 0),
    interviewsScheduled: dashData?.metrics?.scheduledInterviews ?? dashData?.interviewsScheduled ?? 0,
    resumeInflow: dashData?.metrics?.totalCandidates ?? dashData?.resumeInflow ?? 0,
    dailyTarget: dashData?.callTarget?.target ?? dashData?.dailyTarget ?? 50,
  };

  // Navigate to resume list with a status filter passed via router state
  const goToStatus = (status: string) => {
    navigate('/recruiter/resumes', { state: { statusFilter: status } });
  };

  // "Today's Calls" click
  const goToTodayCalls = () => {
    navigate('/recruiter/calls/today');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-slate-800" style={{ fontWeight: 700, fontSize: '1.5rem' }}>
            {getGreeting()}, {user?.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{today}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            to="/recruiter/resumes"
            className="px-4 py-2 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition-colors"
            style={{ fontWeight: 500 }}
          >
            View Resumes
          </Link>
          <Link
            to="/recruiter/walkins"
            className="px-4 py-2 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition-colors"
            style={{ fontWeight: 500 }}
          >
            Register Walk-In
          </Link>
        </div>
      </div>

      {/* ── Date Filter Bar ── */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 mr-1" style={{ fontWeight: 600 }}>FILTER BY:</span>
          <div className="flex gap-1 flex-wrap">
            {DATE_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setDateRange(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs transition-colors ${
                  dateRange === tab
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                style={{ fontWeight: dateRange === tab ? 600 : 500 }}
              >
                {tab}
              </button>
            ))}
          </div>
          {dateRange === 'Custom' && (
            <div className="flex items-center gap-2 ml-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">From</span>
                <input
                  type="date"
                  value={customFrom}
                  onChange={e => setCustomFrom(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-green-400 bg-white"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">To</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={e => setCustomTo(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-green-400 bg-white"
                />
              </div>
              <button
                className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700"
                style={{ fontWeight: 600 }}
              >
                Apply
              </button>
              {(customFrom || customTo) && (
                <button
                  onClick={() => { setCustomFrom(''); setCustomTo(''); }}
                  className="p-1.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
          {dateRange !== 'Custom' && dateRange !== 'All' && (
            <span className="ml-auto text-xs text-slate-400 hidden sm:block">
              Showing data for: <span style={{ fontWeight: 600 }} className="text-slate-600">{dateRange === 'Day' ? today : `This ${dateRange}`}</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Top Metrics (4 cards, Today's Calls clickable) ── */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
        </div>
      ) : (
      <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Calls", value: String(metrics.todayCalls), change: `+${metrics.todayCalls}`, color: 'blue', icon: Phone, clickable: true },
          { label: 'Follow-Ups Due', value: String(metrics.followUpsDue), change: 'Urgent', color: 'amber', icon: AlertCircle, clickable: false },
          { label: 'Interviews Scheduled', value: String(metrics.interviewsScheduled), change: 'This week', color: 'violet', icon: Calendar, clickable: false },
          { label: 'Resume Inflow', value: String(metrics.resumeInflow), change: `+${metrics.resumeInflow} today`, color: 'emerald', icon: FileText, clickable: false },
        ].map((m, i) => {
          const Icon = m.icon;
          const c = colorMap[m.color];
          const content = (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.icon}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${c.badge}`} style={{ fontWeight: 500 }}>
                  {m.change}
                </span>
              </div>
              <div className="text-slate-800" style={{ fontWeight: 700, fontSize: '1.75rem' }}>{m.value}</div>
              <div className="text-slate-500 text-sm mt-0.5 flex items-center gap-1">
                {m.label}
                {m.clickable && <ArrowRight className="w-3 h-3 text-green-500 ml-auto" />}
              </div>
            </>
          );
          return m.clickable ? (
            <button
              key={i}
              onClick={goToTodayCalls}
              className={`bg-white rounded-xl p-5 border shadow-sm text-left transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${c.card}`}
            >
              {content}
            </button>
          ) : (
            <div key={i} className={`bg-white rounded-xl p-5 border shadow-sm ${c.card}`}>
              {content}
            </div>
          );
        })}
      </div>

      {/* ── Status Pipeline Cards (11 clickable) ── */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-slate-800 text-sm" style={{ fontWeight: 600 }}>Candidate Pipeline Status</h2>
            <p className="text-slate-400 text-xs mt-0.5">Click any card to view filtered candidate list</p>
          </div>
          <span className="text-xs text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full">
            {STATUS_CARDS.reduce((s, c) => s + c.count, 0)} total
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {STATUS_CARDS.map((s, i) => {
            const Icon = s.icon;
            const c = STATUS_COLOR_MAP[s.color];
            return (
              <div key={i} className="relative">
                <button
                  onClick={() => goToStatus(s.label)}
                  className={`w-full flex flex-col items-start p-3.5 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${c.card}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${c.icon}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className={`text-xl mb-0.5 ${c.badge}`} style={{ fontWeight: 800, lineHeight: 1 }}>
                    {s.count}
                  </div>
                  <div className="text-slate-500 text-xs leading-tight">{s.label}</div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Follow-Ups + Quick Actions ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Follow-Ups */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-slate-800 text-sm" style={{ fontWeight: 600 }}>Today's Follow-Ups</h2>
              <p className="text-slate-400 text-xs mt-0.5">Scheduled callbacks & pending actions</p>
            </div>
            <Link to="/recruiter/resumes" className="text-xs text-green-600 flex items-center gap-1" style={{ fontWeight: 500 }}>
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {followUps.map((f: any, i: number) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-700 text-sm" style={{ fontWeight: 600 }}>
                    {(f.name || f.candidateName || '').split(' ').map((n: string) => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 text-sm truncate" style={{ fontWeight: 500 }}>{f.name || f.candidateName}</p>
                  <p className="text-slate-400 text-xs">{f.skills}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-slate-400 text-xs mb-1">
                    <Clock className="w-3 h-3" />
                    {f.time || f.followUpDate || ''}
                  </div>
                  <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full" style={{ fontWeight: 500 }}>
                    {f.status}
                  </span>
                </div>
                <Link
                  to={`/recruiter/candidate/${f.candidateId || f._id || '1'}`}
                  className="ml-2 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 flex-shrink-0"
                  style={{ fontWeight: 500 }}
                >
                  <Phone className="w-3 h-3" />
                </Link>
              </div>
            ))}
            {followUps.length === 0 && (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">No follow-ups due</div>
            )}
          </div>
        </div>

        {/* Quick Actions + Daily Target */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-slate-800 text-sm mb-4" style={{ fontWeight: 600 }}>Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: 'Add New Candidate',  href: '/recruiter/add',          icon: UserPlus,    color: 'text-green-600' },
                { label: 'Walk-In Queue',       href: '/recruiter/walkin-queue', icon: ListChecks,  color: 'text-emerald-600' },
                { label: 'Interview Schedule',  href: '/recruiter/interviews',   icon: CalendarCheck, color: 'text-violet-600' },
                { label: 'ATS Resume Scanner',  href: '/recruiter/scan',         icon: ScanLine,    color: 'text-amber-600' },
                { label: 'Send Mail',           href: '/email-center',           icon: Mail,        color: 'text-blue-600' },
                { label: 'View All Resumes',    href: '/recruiter/resumes',      icon: FileText,    color: 'text-slate-600' },
              ].map((action, i) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={i}
                    to={action.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <Icon className={`w-4 h-4 ${action.color}`} />
                    <span className="text-slate-600 text-sm group-hover:text-slate-800">{action.label}</span>
                    <ArrowRight className="w-3 h-3 text-slate-300 ml-auto group-hover:text-slate-400" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Daily Target */}
          <div className="bg-green-600 rounded-xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm" style={{ fontWeight: 600 }}>Daily Target</span>
            </div>
            <div className="mb-2" style={{ fontWeight: 700, fontSize: '1.5rem' }}>{metrics.todayCalls} / {metrics.dailyTarget}</div>
            <p className="text-green-200 text-xs mb-3">Calls made today</p>
            <div className="bg-green-500 rounded-full h-2">
              <div className="bg-white rounded-full h-2" style={{ width: `${Math.min(100, Math.round((metrics.todayCalls / metrics.dailyTarget) * 100))}%` }} />
            </div>
            <p className="text-green-200 text-xs mt-2">{Math.round((metrics.todayCalls / metrics.dailyTarget) * 100)}% of daily target</p>
          </div>
        </div>
      </div>

      </>
      )}
    </div>
  );
}
