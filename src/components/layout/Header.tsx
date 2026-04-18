'use client';

import { useState } from 'react';
import { Search, Plus, RefreshCw } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: { label: string; icon?: React.ReactNode; onClick: () => void };
  onRefresh?: () => void;
}

export default function Header({ title, subtitle, action, onRefresh }: HeaderProps) {
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 1200);
  };

  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-4 px-8 py-4"
      style={{
        background: 'rgba(11,11,15,0.88)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold text-white truncate">{title}</h1>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{subtitle}</p>}
      </div>

      {/* Search */}
      <div className="relative hidden md:block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search ads, campaigns..."
          className="pl-9 pr-4 py-2 text-sm rounded-xl w-56 outline-none transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#E5E7EB',
          }}
          onFocus={e => {
            e.target.style.border = '1px solid rgba(16,185,129,0.45)';
            e.target.style.background = 'rgba(16,185,129,0.05)';
          }}
          onBlur={e => {
            e.target.style.border = '1px solid rgba(255,255,255,0.08)';
            e.target.style.background = 'rgba(255,255,255,0.04)';
          }}
        />
      </div>

      {/* Refresh */}
      {onRefresh && (
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors"
          aria-label="Refresh"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
        </button>
      )}

      {/* Action */}
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#10B981,#059669)', boxShadow: '0 4px 14px rgba(16,185,129,0.25)' }}
        >
          {action.icon ?? <Plus size={15} />}
          {action.label}
        </button>
      )}

      {/* Model badge */}
      <div
        className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
        style={{
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.18)',
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-emerald-300">Claude 3.5 Sonnet</span>
      </div>
    </header>
  );
}
