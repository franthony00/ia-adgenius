'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Images, BarChart3, Sparkles, History,
  Lightbulb, ChevronRight, Settings, Bell, TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/',          icon: LayoutDashboard, label: 'Dashboard',   badge: null },
  { href: '/library',   icon: Images,          label: 'Ad Library',  badge: '8'  },
  { href: '/analysis',  icon: BarChart3,        label: 'AI Analysis', badge: '3'  },
  { href: '/generator', icon: Sparkles,         label: 'Generator',   badge: null },
  { href: '/history',   icon: History,          label: 'History',     badge: null },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 h-full w-64 flex flex-col z-40"
      style={{
        background: '#0D1117',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* ── Logo ── */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center relative shrink-0"
            style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}
          >
            <Lightbulb size={18} className="text-white" fill="rgba(255,255,255,0.15)" />
            <div className="absolute inset-0 rounded-xl pulse-glow" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight">AdGenius</p>
            <p className="text-[10px] font-medium tracking-widest uppercase"
              style={{ color: '#10B981' }}>
              Ad Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-3 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
          Main Menu
        </p>

        {NAV.map(({ href, icon: Icon, label, badge }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                active
                  ? 'text-white'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5',
              )}
              style={active ? {
                background: 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(5,150,105,0.1))',
                border: '1px solid rgba(16,185,129,0.25)',
              } : {}}
            >
              <Icon
                size={17}
                className={cn(
                  active ? 'text-emerald-400' : 'text-zinc-600 group-hover:text-zinc-400',
                )}
              />
              <span className="flex-1">{label}</span>
              {badge && (
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(16,185,129,0.18)', color: '#6EE7B7' }}
                >
                  {badge}
                </span>
              )}
              {active && <ChevronRight size={14} className="text-emerald-500" />}
            </Link>
          );
        })}

        {/* ── Divider + Insights mini widget ── */}
        <div className="pt-4 mt-4 border-t border-white/5">
          <p className="px-3 mb-3 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
            Insights
          </p>
          <div
            className="rounded-xl p-3 mx-0 space-y-2"
            style={{
              background: 'rgba(16,185,129,0.05)',
              border: '1px solid rgba(16,185,129,0.12)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-300">Weekly Trend</span>
            </div>
            <div className="flex items-end gap-0.5 h-8">
              {[40, 55, 45, 70, 60, 80, 75].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bar-grow"
                  style={{
                    height: `${h}%`,
                    background: i === 6
                      ? 'linear-gradient(180deg,#34D399,#10B981)'
                      : 'rgba(16,185,129,0.28)',
                    animationDelay: `${i * 60}ms`,
                  }}
                />
              ))}
            </div>
            <p className="text-[10px] text-zinc-500">ROAS ↑ 12% vs last week</p>
          </div>
        </div>
      </nav>

      {/* ── Bottom ── */}
      <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
        <div className="flex items-center gap-2">
          <button className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors text-xs">
            <Settings size={14} />
            Settings
          </button>
          <button className="px-3 py-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors relative">
            <Bell size={14} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </button>
        </div>
        <div
          className="flex items-center gap-2 p-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}
          >
            M
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-zinc-200 truncate">Marketing Team</p>
            <p className="text-[10px] text-zinc-600">Pro Plan</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
        </div>
      </div>
    </aside>
  );
}
