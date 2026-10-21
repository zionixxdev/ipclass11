import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BarChart3,
  BookMarked,
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Moon,
  MoreHorizontal,
  RefreshCw,
  Settings as SettingsIcon,
  Sun,
  Terminal,
  X,
} from 'lucide-react';
import { useProgress } from '../lib/store';
import { cn, daysUntil } from '../lib/utils';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/learn', label: 'Learn Chapters', icon: BookOpen },
  { to: '/practice', label: 'Practice Questions', icon: ClipboardList },
  { to: '/lab', label: 'Python Lab', icon: Terminal },
  { to: '/mocks', label: 'Mock Tests', icon: GraduationCap },
  { to: '/revision', label: 'Revision', icon: RefreshCw },
  { to: '/progress', label: 'Progress', icon: BarChart3 },
  { to: '/bookmarks', label: 'Bookmarks', icon: BookMarked },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

const BOTTOM = NAV.slice(0, 4);
const MORE = NAV.slice(4);

export default function Layout() {
  const { state, updateSettings } = useProgress();
  const { settings } = state;
  const [sheet, setSheet] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSheet(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  const dLeft = daysUntil(settings.examDate);
  const isDark = settings.theme === 'dark';

  const navItem = (item: (typeof NAV)[number], onClick?: () => void) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        onClick={onClick}
        className={({ isActive }) => cn('navlink', isActive && 'navlink-active')}
      >
        <Icon size={18} />
        <span>{item.label}</span>
      </NavLink>
    );
  };

  return (
    <div className="flex min-h-full">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-navy-900/60 p-4 backdrop-blur-md lg:flex">
        <div className="mb-6 flex items-center gap-3 px-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 text-white shadow-glow">
            <GraduationCap size={22} />
          </div>
          <div>
            <div className="text-sm font-extrabold tracking-tight text-slate-100">CompPrep 11</div>
            <div className="text-[11px] text-slate-400">Computer Exam Prep</div>
          </div>
        </div>
        <nav className="flex flex-col gap-1">{NAV.map((i) => navItem(i))}</nav>
        <div className="mt-auto space-y-3 pt-4">
          {dLeft != null && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
              <div className="text-2xl font-extrabold text-slate-100">{dLeft < 0 ? 0 : dLeft}</div>
              <div className="text-[11px] uppercase tracking-wide text-slate-400">days to exam</div>
            </div>
          )}
          <button
            className="btn-ghost w-full"
            onClick={() => updateSettings({ theme: isDark ? 'light' : 'dark' })}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            {isDark ? 'Light theme' : 'Dark theme'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar (mobile + desktop header) */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/10 bg-navy-950/80 px-4 py-3 backdrop-blur-md lg:hidden">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 text-white">
              <GraduationCap size={18} />
            </div>
            <div className="text-sm font-extrabold text-slate-100">CompPrep 11</div>
          </div>
          <div className="flex items-center gap-2">
            {dLeft != null && (
              <span className="chip !text-[11px]">
                {dLeft < 0 ? 'Exam passed' : `${dLeft}d left`}
              </span>
            )}
            <button className="btn-ghost !px-2.5 !py-2" onClick={() => updateSettings({ theme: isDark ? 'light' : 'dark' })} aria-label="Toggle theme">
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 lg:pb-10 lg:pt-8">
          <Outlet />
        </main>

        {/* Bottom nav (mobile) */}
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-navy-950/90 backdrop-blur-md lg:hidden">
          <div className="grid grid-cols-5">
            {BOTTOM.map((item) => {
              const Icon = item.icon;
              const active = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={cn('flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium', active ? 'text-brand-300' : 'text-slate-400')}
                >
                  <Icon size={20} />
                  <span className="max-w-full truncate px-0.5">{item.label.split(' ')[0]}</span>
                </NavLink>
              );
            })}
            <button
              onClick={() => setSheet(true)}
              className={cn('flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium', MORE.some((m) => location.pathname.startsWith(m.to)) ? 'text-brand-300' : 'text-slate-400')}
            >
              <MoreHorizontal size={20} />
              <span>More</span>
            </button>
          </div>
        </nav>

        {/* More sheet */}
        {sheet && (
          <div className="fixed inset-0 z-40 flex items-end bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSheet(false)}>
            <div className="card w-full rounded-b-none p-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <Menu size={16} /> More
                </div>
                <button className="btn-ghost !px-2.5 !py-1.5" onClick={() => setSheet(false)} aria-label="Close menu">
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {MORE.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname.startsWith(item.to);
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setSheet(false)}
                      className={cn('flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm', active ? 'text-brand-300' : 'text-slate-300')}
                    >
                      <Icon size={18} />
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
