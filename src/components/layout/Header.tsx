'use client';

import { useState, useRef } from 'react';
import { Search, Plus, RefreshCw, X, Layers, Megaphone, Sparkles, Download, Check } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  /** Arbitrary ReactNode rendered to the right of the '+' button */
  action?: React.ReactNode;
  onRefresh?: () => void;
}

// ─── Create New modal ──────────────────────────────────────────────────────────
const CREATE_OPTIONS = [
  { id: 'campaign',  icon: Layers,     label: 'New Campaign',  desc: 'Create a new ad campaign from scratch',          color: '#10B981' },
  { id: 'ad',        icon: Megaphone,  label: 'New Ad',        desc: 'Add a new creative to an existing campaign',     color: '#22D3EE' },
  { id: 'variation', icon: Sparkles,   label: 'New Variation', desc: 'Generate an AI variation of an existing ad',     color: '#818CF8' },
  { id: 'import',    icon: Download,   label: 'Import',        desc: 'Import campaigns from Meta Ads or Google Ads',   color: '#F59E0B' },
] as const;

function CreateModal({ onClose }: { onClose: () => void }) {
  const [chosen, setChosen] = useState<string | null>(null);

  return (
    // Backdrop closes on click; content uses stopPropagation
    <div
      className="fixed inset-0 z-50"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div className="absolute inset-0 flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
      <div
        className="w-full max-w-md rounded-2xl p-6 fade-in-up"
        style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-white">Create New</h2>
            <p className="text-xs text-zinc-500 mt-0.5">What would you like to create?</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Chosen state */}
        {chosen ? (
          <div className="py-6 text-center space-y-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}
            >
              <Check size={24} className="text-emerald-400" />
            </div>
            <p className="text-sm font-bold text-white">
              {CREATE_OPTIONS.find(o => o.id === chosen)?.label}
            </p>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto">
              This creation flow is being implemented. It will connect to your ad accounts once backend is wired up.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setChosen(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Back
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Option grid */
          <div className="grid grid-cols-2 gap-3">
            {CREATE_OPTIONS.map(opt => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  onClick={() => setChosen(opt.id)}
                  className="p-4 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: `${opt.color}18`, color: opt.color, border: `1px solid ${opt.color}30` }}
                  >
                    <Icon size={18} />
                  </div>
                  <p className="text-xs font-bold text-white mb-1">{opt.label}</p>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
export default function Header({ title, subtitle, action, onRefresh }: HeaderProps) {
  const [query, setQuery]           = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const handleRefresh = () => {
    if (!onRefresh) return;
    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 1200);
  };

  return (
    <>
      <header
        className="sticky top-0 z-30 flex items-center gap-3 px-4 lg:px-8 py-4"
        style={{
          background: 'rgba(11,11,15,0.88)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Title */}
        <div className="flex-1 min-w-0 pl-10 lg:pl-0">
          <h1 className="text-base lg:text-lg font-bold text-white truncate">{title}</h1>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{subtitle}</p>}
        </div>

        {/* Search */}
        <div className="relative hidden md:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            ref={searchRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') { setQuery(''); searchRef.current?.blur(); } }}
            placeholder="Search ads, campaigns..."
            className="pl-9 pr-8 py-2 text-sm rounded-xl w-56 outline-none transition-all"
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
          {query && (
            <button
              onClick={() => { setQuery(''); searchRef.current?.focus(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
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

        {/* Always-visible "+" button */}
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 shrink-0"
          style={{ background: 'linear-gradient(135deg,#10B981,#059669)', boxShadow: '0 4px 14px rgba(16,185,129,0.25)' }}
          aria-label="Create new"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">New</span>
        </button>

        {/* Action slot (arbitrary content) */}
        {action}

        {/* Model badge */}
        <div
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-300">Claude 3.5 Sonnet</span>
        </div>
      </header>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
    </>
  );
}
