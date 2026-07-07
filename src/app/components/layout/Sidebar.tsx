import { Link, useLocation, useNavigate } from 'react-router';
import { useState } from 'react';
import {
  LayoutDashboard, Users, UserCheck, Phone, ClipboardList,
  BarChart2, FileText, Shield, Clock, LogOut,
  DollarSign, TrendingUp, UserCog, Activity, ChevronRight,
  ScanLine, CalendarCheck, UserPlus, ListChecks, Briefcase, FileCheck,
  Building2, Database, ClipboardCheck, CheckSquare, MonitorCheck, Mail, LayoutGrid, Upload, Settings, Globe,
} from 'lucide-react';
import { useAuth, Role } from '../../context/AuthContext';
import logoImg from '../../../assets/Logo.jpeg';
import { FaceVerificationModal } from '../attendance/FaceVerificationModal';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  // Recruiter
  { label: 'Dashboard',        href: '/recruiter',               icon: LayoutDashboard, roles: ['recruiter', 'spoc'] },
  { label: 'Resumes',          href: '/recruiter/resumes',       icon: Users,           roles: ['recruiter', 'spoc', 'tl'] },
  { label: 'Add Candidate',    href: '/recruiter/add',           icon: UserPlus,        roles: ['recruiter', 'tl', 'spoc'] },
  { label: 'Walk-In Queue',    href: '/recruiter/walkin-queue',  icon: ListChecks,      roles: ['recruiter', 'tl', 'spoc'] },
  { label: 'Walk-In Mgmt',    href: '/recruiter/walkins',       icon: UserCheck,       roles: ['recruiter', 'tl', 'spoc'] },
  // { label: 'Assessment Form', href: '/recruiter/walkin-interview', icon: FileText,     roles: ['recruiter', 'tl', 'spoc'] },
  { label: 'Interviews',       href: '/recruiter/interviews',    icon: CalendarCheck,   roles: ['recruiter', 'tl', 'spoc'] },
  { label: 'ATS Scanner',      href: '/recruiter/scan',          icon: ScanLine,        roles: ['recruiter', 'tl'] },
  { label: 'ATS Database',     href: '/recruiter/ats-database',  icon: Database,        roles: ['recruiter', 'tl', 'spoc'] },
  { label: 'Recruiter Portals', href: '/recruiter-portals',       icon: Globe,           roles: ['admin', 'recruiter', 'tl', 'spoc', 'manager'] },
  { label: 'Email Center',     href: '/email',                   icon: Mail,            roles: ['recruiter'] },

  // Team Lead
  { label: 'Overview',         href: '/tl',                      icon: LayoutDashboard, roles: ['tl'] },
  { label: 'My Team',          href: '/tl/my-team',              icon: Users,           roles: ['tl'] },
  { label: 'Eligible Candidates', href: '/tl/follow-ups',        icon: ClipboardCheck,  roles: ['tl', 'manager', 'admin'] },
  { label: 'Job Requirements', href: '/admin/jobs',              icon: Briefcase,        roles: ['tl'] },
  { label: 'Create Job (JR)',  href: '/recruiter/jobs/new',      icon: FileText,         roles: ['tl'] },
  { label: 'Bulk Job Post',   href: '/recruiter/jobs/bulk',     icon: LayoutGrid,       roles: ['tl'] },
  { label: 'Email Center',     href: '/email',                   icon: Mail,            roles: ['tl'] },

  // Manager
  { label: 'Overview',         href: '/manager',                 icon: LayoutDashboard, roles: ['manager'] },
  { label: 'Candidate DB',     href: '/admin/candidates',        icon: Database,         roles: ['manager'] },
  { label: 'Job Requirements', href: '/admin/jobs',              icon: Briefcase,        roles: ['manager'] },
  { label: 'Bulk Job Post',    href: '/recruiter/jobs/bulk',    icon: LayoutGrid,       roles: ['manager'] },
  { label: 'Reports',          href: '/manager/reports',         icon: BarChart2,        roles: ['manager'] },
  { label: 'Revenue',          href: '/revenue',                 icon: TrendingUp,       roles: ['manager'] },
  { label: 'Salary',           href: '/salary',                  icon: DollarSign,       roles: ['manager'] },
  { label: 'TL Login Activity',href: '/manager/tl-activity',    icon: MonitorCheck,     roles: ['manager'] },

  // Admin
  { label: 'Dashboard',        href: '/admin',                   icon: LayoutDashboard, roles: ['admin'] },
  { label: 'User Management',  href: '/admin/users',             icon: UserCog,          roles: ['admin'] },
  { label: 'Attendance',       href: '/admin/attendance',        icon: Clock,            roles: ['admin'] },
  { label: 'Access Control',   href: '/admin/access',            icon: Shield,           roles: ['admin'] },
  { label: 'Candidate DB',     href: '/admin/candidates',        icon: Database,         roles: ['admin'] },
  { label: 'ATS Scan Database',href: '/admin/ats-records',      icon: ScanLine,         roles: ['admin'] },
  { label: 'Excel Import',     href: '/admin/excel-import',      icon: Upload,           roles: ['admin'] },
  { label: 'Field Config',     href: '/admin/field-config',      icon: Settings,         roles: ['admin'] },
  { label: 'Job Requirements', href: '/admin/jobs',              icon: Briefcase,        roles: ['admin'] },
  { label: 'Bulk Job Post',   href: '/recruiter/jobs/bulk',     icon: LayoutGrid,       roles: ['admin'] },
  { label: 'Companies',        href: '/admin/companies',         icon: Building2,        roles: ['admin'] },
  { label: 'Tasks',           href: '/admin/tasks',             icon: CheckSquare,      roles: ['admin', 'tl', 'recruiter'] },
  { label: 'Recruiter Joining Form', href: '/recruiter/joining', icon: FileCheck,        roles: ['admin', 'recruiter', 'tl'] },
  { label: 'Recruiter Records',  href: '/admin/joining',           icon: ClipboardCheck,   roles: ['admin', 'recruiter', 'tl'] },
  { label: 'Email Center',     href: '/email',                   icon: Mail,            roles: ['admin'] },
  { label: 'TL Login Activity',href: '/admin/tl-activity',      icon: MonitorCheck,     roles: ['admin'] },
  { label: 'System Logs',      href: '/admin/logs',              icon: Activity,         roles: ['admin'] },
  { label: 'Salary',           href: '/salary',                  icon: DollarSign,       roles: ['admin'] },
  { label: 'Revenue',          href: '/revenue',                 icon: TrendingUp,       roles: ['admin', 'manager'] },
  { label: 'Credit Notes',     href: '/credit-notes',            icon: FileCheck,        roles: ['admin'] },
];

const ROLE_LABELS: Record<Role, string> = {
  recruiter: 'Recruiter',
  tl: 'Team Lead',
  manager: 'Manager',
  admin: 'Admin',
  spoc: 'SPOC',
};

const ROLE_COLORS: Record<Role, string> = {
  recruiter: 'bg-emerald-100 text-emerald-700',
  tl: 'bg-violet-100 text-violet-700',
  manager: 'bg-amber-100 text-amber-700',
  admin: 'bg-red-100 text-red-700',
  spoc: 'bg-sky-100 text-sky-700',
};

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showCheckOutFaceModal, setShowCheckOutFaceModal] = useState(false);

  if (!user) return null;

  const filteredNav = NAV_ITEMS.filter(item => item.roles.includes(user.role));

  const handleLogout = () => {
    if (user.role === 'admin') {
      completeLogout();
    } else {
      setShowCheckOutFaceModal(true);
    }
  };

  const completeLogout = () => {
    logout();
    navigate('/login');
    onClose?.();
  };

  const isActive = (href: string) => {
    if (href === '/recruiter' || href === '/tl' || href === '/manager' || href === '/admin') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-100">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-slate-100">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="bg-white p-1 rounded-lg border border-slate-50 shadow-sm flex items-center justify-center">
            <img src={logoImg} alt="White Horse Manpower" className="h-8 w-auto object-contain" />
          </div>
          <div>
            <span className="text-slate-800 block" style={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: '1.2' }}>
              White Horse Manpower
            </span>
            <span className="text-green-600 block" style={{ fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.05em' }}>
              ATS SYSTEM
            </span>
          </div>
        </Link>
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm" style={{ fontWeight: 600 }}>
              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-slate-800 text-sm truncate" style={{ fontWeight: 600 }}>{user.name}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${ROLE_COLORS[user.role]}`} style={{ fontWeight: 500 }}>
              {ROLE_LABELS[user.role]}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-0.5">
          {filteredNav.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group ${
                  active
                    ? 'bg-green-600 text-white'
                    : 'text-slate-600 hover:bg-green-50 hover:text-green-800'
                }`}
                style={{ fontWeight: active ? 600 : 400 }}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-green-600'}`} />
                <span className="flex-1">
                  {item.href === '/admin/tasks' && user.role !== 'admin' ? 'My Tasks' : item.label}
                </span>
                {active && <ChevronRight className="w-3 h-3 opacity-70" />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-slate-100">
        {/* Logout Button */}
        <div className="px-3 py-4 space-y-0.5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-left rounded-lg text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            Sign Out
          </button>
        </div>
      </div>

      <FaceVerificationModal
        isOpen={showCheckOutFaceModal}
        onClose={() => setShowCheckOutFaceModal(false)}
        onSuccess={(descriptor, photo) => {
          setShowCheckOutFaceModal(false);
          completeLogout();
        }}
        actionType="checkout"
        preventCancel={false}
        registeredDescriptor={user.faceDescriptor}
      />
    </div>
  );
}
