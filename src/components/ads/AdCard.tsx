'use client';

import SafeAdImage from '@/components/ui/SafeAdImage';
import Link from 'next/link';
import { TrendingUp, Eye, MousePointer, Star } from 'lucide-react';
import type { Ad } from '@/lib/types';
import { cn, formatCurrency, formatNumber, formatPercent, formatMultiplier, getStatusColor, getPlatformLabel, getPlatformColor } from '@/lib/utils';
import Badge from '@/components/ui/Badge';

interface AdCardProps { ad: Ad; delay?: number; }

const PLATFORM_ICONS: Record<string, string> = {
  facebook: 'f', instagram: '▣', google: 'G', tiktok: '♪', linkedin: 'in',
};

export default function AdCard({ ad, delay = 0 }: AdCardProps) {
  const hasMetrics = ad.metrics.impressions > 0;

  return (
    <Link href={`/ads/${ad.id}`}>
      <div
        className="group rounded-2xl overflow-hidden cursor-pointer fade-in-up transition-all duration-200 hover:-translate-y-0.5"
        style={{
          background: '#0F0F1A',
          border: '1px solid rgba(255,255,255,0.06)',
          animationDelay: `${delay}ms`,
          boxShadow: '0 2px 20px rgba(0,0,0,0.4)',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(124,58,237,0.25)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(124,58,237,0.12)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(255,255,255,0.06)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 20px rgba(0,0,0,0.4)';
        }}>

        {/* Image */}
        <div className="relative h-44 overflow-hidden">
          <SafeAdImage src={ad.imageUrl} alt={ad.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(0,0,0,0.1) 0%,rgba(8,8,15,0.85) 100%)' }} />

          {/* Platform badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold text-white"
            style={{ background: `${getPlatformColor(ad.platform)}CC`, backdropFilter: 'blur(8px)' }}>
            <span>{PLATFORM_ICONS[ad.platform]}</span>
            {getPlatformLabel(ad.platform)}
          </div>

          {/* Status */}
          <div className="absolute top-3 right-3">
            <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold border', getStatusColor(ad.status))}>
              {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
            </span>
          </div>

          {/* AI Score */}
          {ad.aiScore !== undefined && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
              <Star size={10} className="text-amber-400 fill-amber-400" />
              <span className="text-amber-300">{ad.aiScore}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-sm font-semibold text-white mb-1 line-clamp-1">{ad.name}</h3>
          <p className="text-xs text-zinc-500 line-clamp-1 mb-3">{ad.headline}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-3">
            {ad.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md text-zinc-500"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                #{tag}
              </span>
            ))}
            {ad.tags.length > 2 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md text-zinc-600"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                +{ad.tags.length - 2}
              </span>
            )}
          </div>

          {/* Metrics grid */}
          {hasMetrics ? (
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5">
              <Stat icon={<MousePointer size={10} />} label="CTR" value={formatPercent(ad.metrics.ctr)} up={ad.metrics.ctr > 3} />
              <Stat icon={<TrendingUp size={10} />} label="ROAS" value={formatMultiplier(ad.metrics.roas)} up={ad.metrics.roas > 3} />
              <Stat icon={<Eye size={10} />} label="Reach" value={formatNumber(ad.metrics.reach, true)} />
            </div>
          ) : (
            <div className="pt-3 border-t border-white/5 flex items-center gap-2">
              <Badge variant="zinc">{ad.status.charAt(0).toUpperCase() + ad.status.slice(1)} — no metrics yet</Badge>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function Stat({ icon, label, value, up }: { icon: React.ReactNode; label: string; value: string; up?: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-0.5 mb-0.5 text-zinc-600">{icon}
        <span className="text-[9px] uppercase tracking-wide">{label}</span>
      </div>
      <span className={cn('text-xs font-bold', up ? 'text-emerald-400' : 'text-white')}>{value}</span>
    </div>
  );
}
