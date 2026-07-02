'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Filter, LayoutGrid, List, Plus } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import Header from '@/components/layout/Header';
import AdCard from '@/components/ads/AdCard';
import AddAdModal from '@/components/ads/AddAdModal';
import Badge from '@/components/ui/Badge';
import { mockAds } from '@/lib/mock-data';
import type { Ad, Platform, AdStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list';

const PLATFORMS: (Platform | 'all')[] = ['all', 'facebook', 'instagram', 'tiktok', 'google', 'linkedin'];
const STATUSES:  (AdStatus  | 'all')[] = ['all', 'active', 'paused', 'draft', 'completed'];

export default function LibraryPage() {
  const [ads, setAds]               = useState<Ad[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [view, setView]             = useState<ViewMode>('grid');
  const [platform, setPlatform]     = useState<Platform | 'all'>('all');
  const [status, setStatus]         = useState<AdStatus | 'all'>('all');
  const [sort, setSort]             = useState<'roas' | 'ctr' | 'spend' | 'score' | 'date'>('roas');

  const loadAds = useCallback(() => {
    setIsLoading(true);
    fetch('/api/ads')
      .then(r => r.json())
      .then(data => setAds(data.ads ?? mockAds))
      .catch(() => setAds(mockAds))
      .finally(() => setIsLoading(false));
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadAds(); }, [loadAds]);

  const filtered = useMemo(() => {
    let list = [...ads];
    if (platform !== 'all') list = list.filter(a => a.platform === platform);
    if (status  !== 'all') list = list.filter(a => a.status  === status);
    list.sort((a, b) => {
      if (sort === 'roas')  return b.metrics.roas  - a.metrics.roas;
      if (sort === 'ctr')   return b.metrics.ctr   - a.metrics.ctr;
      if (sort === 'spend') return b.metrics.spend - a.metrics.spend;
      if (sort === 'score') return (b.aiScore ?? 0) - (a.aiScore ?? 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [ads, platform, status, sort]);

  const handleAdd = (newAd: Ad) => {
    setAds(prev => [newAd, ...prev]);
  };

  return (
    <AppLayout>
      <Header
        title="Ad Library"
        subtitle={`${filtered.length} ad${filtered.length !== 1 ? 's' : ''}`}
        action={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 shrink-0"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Add Ad</span>
          </button>
        }
        onRefresh={loadAds}
      />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-5 lg:space-y-6">

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3">
          {/* Platform filter — scrollable on mobile */}
          <div className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto max-w-full"
            style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
            {PLATFORMS.map(p => (
              <button key={p} onClick={() => setPlatform(p)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize whitespace-nowrap',
                  platform === p ? 'text-white' : 'text-zinc-500 hover:text-zinc-300')}
                style={platform === p ? { background: 'linear-gradient(135deg,#10B981,#059669)' } : {}}>
                {p === 'all' ? 'All' : p}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto max-w-full"
            style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
            {STATUSES.map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize whitespace-nowrap',
                  status === s ? 'text-white' : 'text-zinc-500 hover:text-zinc-300')}
                style={status === s ? { background: 'rgba(16,185,129,0.25)' } : {}}>
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>

          <div className="sm:ml-auto flex items-center gap-2">
            <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
              className="px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 outline-none cursor-pointer"
              style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)' }}>
              <option value="roas">Sort: ROAS</option>
              <option value="ctr">Sort: CTR</option>
              <option value="spend">Sort: Spend</option>
              <option value="score">Sort: AI Score</option>
              <option value="date">Sort: Date</option>
            </select>

            <div className="flex p-1 rounded-xl"
              style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => setView('grid')}
                className={cn('p-1.5 rounded-lg transition-all',
                  view === 'grid' ? 'text-white bg-white/10' : 'text-zinc-600 hover:text-zinc-400')}>
                <LayoutGrid size={14} />
              </button>
              <button onClick={() => setView('list')}
                className={cn('p-1.5 rounded-lg transition-all',
                  view === 'list' ? 'text-white bg-white/10' : 'text-zinc-600 hover:text-zinc-400')}>
                <List size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Stats row — dynamic from current ads state */}
        <div className="flex gap-4 flex-wrap">
          {[
            { label: 'Active',    count: ads.filter(a => a.status === 'active').length,    color: 'emerald' as const },
            { label: 'Paused',    count: ads.filter(a => a.status === 'paused').length,    color: 'amber'   as const },
            { label: 'Draft',     count: ads.filter(a => a.status === 'draft').length,     color: 'zinc'    as const },
            { label: 'Completed', count: ads.filter(a => a.status === 'completed').length, color: 'cyan'    as const },
          ].map(({ label, count, color }) => (
            <Badge key={label} variant={color} dot>{count} {label}</Badge>
          ))}
        </div>

        {/* Grid / List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <div className={cn('grid gap-5',
            view === 'grid'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1')}>
            {filtered.map((ad, i) => (
              <AdCard key={ad.id} ad={ad} delay={i * 40} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 rounded-2xl"
            style={{ border: '1px dashed rgba(255,255,255,0.08)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(16,185,129,0.1)' }}>
              <Filter size={20} className="text-emerald-400" />
            </div>
            <p className="text-zinc-300 font-semibold mb-1">No ads match these filters</p>
            <p className="text-zinc-600 text-sm">Try adjusting your platform or status filters</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <AddAdModal
          onClose={() => setShowModal(false)}
          onAdd={handleAdd}
        />
      )}
    </AppLayout>
  );
}
