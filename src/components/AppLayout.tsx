'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Icon from '@/components/ui/AppIcon';

interface NavItem {
  href: string;
  label: string;
  iconName: string;
  badge?: number;
  exact?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

function getAdminNav(): NavGroup[] {
  return [
    { label: 'OVERVIEW', items: [
      { href: '/admin', label: 'Platform Overview', iconName: 'Squares2X2Icon', exact: true },
    ]},
    { label: 'SYSTEM', items: [
      { href: '/settings', label: 'Settings', iconName: 'Cog6ToothIcon' },
    ]},
  ];
}

function getSchoolNav(badges: { defaulters: number; unread: number }): NavGroup[] {
  return [
    { label: 'OVERVIEW', items: [
      { href: '/dashboard', label: 'Dashboard', iconName: 'HomeIcon', exact: true },
    ]},
    { label: 'ACADEMICS', items: [
      { href: '/students', label: 'Students', iconName: 'UsersIcon' },
      { href: '/attendance', label: 'Attendance', iconName: 'ClipboardDocumentCheckIcon' },
    ]},
    { label: 'FINANCE', items: [
      { href: '/fees', label: 'Fee Management', iconName: 'BanknotesIcon', badge: badges.defaulters || undefined },
    ]},
    { label: 'COMMUNICATION', items: [
      { href: '/messages', label: 'Messages', iconName: 'ChatBubbleLeftRightIcon', badge: badges.unread || undefined },
      { href: '/templates', label: 'Templates', iconName: 'DocumentTextIcon' },
    ]},
    { label: '', items: [
      { href: '/calendar', label: 'Calendar', iconName: 'CalendarDaysIcon' },
      { href: '/reports', label: 'Reports', iconName: 'ChartBarIcon' },
    ]},
    { label: 'SYSTEM', items: [
      { href: '/settings', label: 'Settings', iconName: 'Cog6ToothIcon' },
    ]},
  ];
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, session, signOut, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [today, setToday] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [badges, setBadges] = useState({ defaulters: 0, unread: 0 });

  useEffect(() => {
    const now = new Date();
    setToday(now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }));
  }, []);

  const fetchSchoolName = useCallback(async () => {
    if (user?.schoolId) {
      const { data } = await supabase.from('schools').select('name').eq('id', user.schoolId).single();
      if (data?.name) setSchoolName(data.name);
    }
  }, [user?.schoolId]);

  const fetchBadges = useCallback(async () => {
    if (!user?.schoolId || user?.role === 'super_admin') return;
    try {
      const [feeRes, queryRes] = await Promise.all([
        supabase.from('fee_records').select('id', { count: 'exact', head: true }).eq('school_id', user.schoolId).in('status', ['overdue']),
        supabase.from('parent_queries').select('id', { count: 'exact', head: true }).eq('school_id', user.schoolId).eq('status', 'pending'),
      ]);
      setBadges({ defaulters: feeRes.count || 0, unread: queryRes.count || 0 });
    } catch { /* ignore badge errors */ }
  }, [user?.schoolId, user?.role]);

  useEffect(() => { fetchSchoolName(); fetchBadges(); }, [fetchSchoolName, fetchBadges]);

  // Redirect to /login ONLY when auth finished AND no session exists.
  // If session is present but user is still being fetched (reload race on
  // initial load after a fresh login), stay on the spinner — never bounce
  // to /login. Wrong-role redirect goes to /teacher, never to /login.
  useEffect(() => {
    if (!loading && !user && !session) router.replace('/login');
    if (!loading && user?.role === 'school_staff' && !pathname.startsWith('/teacher')) router.replace('/teacher');
  }, [user, session, loading, router, pathname]);

  // Spinner while: auth resolving, OR session exists but user not loaded.
  if (loading || (session && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-8 h-8 border-[3px] border-[#0D9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const navGroups = user.role === 'super_admin' ? getAdminNav() : getSchoolNav(badges);

  const isActive = (item: NavItem) => {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-[232px] bg-[#1E3A5F] flex flex-col transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between px-5 h-14 border-b border-white/10 flex-shrink-0">
          <Link href={user.role === 'super_admin' ? '/admin' : '/dashboard'} className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#0D9488] rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-[18px] h-[18px] text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zM12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <span className="text-white font-semibold text-[15px]">Relayra</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/50 hover:text-white">
            <Icon name="XMarkIcon" size={20} className="text-white/50" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-3 overflow-y-auto">
          {navGroups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'mt-5' : ''}>
              {group.label && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest text-white/30 uppercase">{group.label}</p>
              )}
              <div className="space-y-0.5">
                {group.items.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                      isActive(item)
                        ? 'bg-white/10 text-white'
                        : 'text-white/50 hover:bg-white/[0.06] hover:text-white/80'
                    }`}
                  >
                    <Icon name={item.iconName} size={18} className={isActive(item) ? 'text-white' : 'text-white/50'} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 bg-[#0D9488]/80 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-semibold">{user.name?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[13px] font-medium truncate">{user.name}</p>
              <p className="text-white/35 text-[11px] capitalize truncate">{user.role.replace(/_/g, ' ')}</p>
            </div>
            <button onClick={async () => {
              // Clear state first (signOut empties user/session + localStorage),
              // wait a tick so React state settles, then navigate. See Issue 5.
              await signOut();
              await new Promise((r) => setTimeout(r, 100));
              router.replace('/login');
            }} className="text-white/35 hover:text-white transition-colors" title="Sign out">
              <Icon name="ArrowRightOnRectangleIcon" size={16} className="text-white/35 hover:text-white" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-[#E2E8F0] px-4 lg:px-6 h-14 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-[#64748B]">
              <Icon name="Bars3Icon" size={22} className="text-[#64748B]" />
            </button>
            <div>
              <p className="text-[#1E293B] font-semibold text-sm">{user.role === 'super_admin' ? 'Relayra Solutions' : schoolName || 'Dashboard'}</p>
              <p className="text-[#94A3B8] text-[11px]">{today}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="text-[#94A3B8] hover:text-[#64748B] p-2 rounded-lg hover:bg-[#F1F5F9] transition-colors">
              <Icon name="BellIcon" size={18} className="text-[#94A3B8]" />
            </button>
            <div className="w-8 h-8 bg-[#1E3A5F] rounded-full flex items-center justify-center ml-1">
              <span className="text-white text-xs font-semibold">{user.name?.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
