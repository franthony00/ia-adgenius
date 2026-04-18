import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Platform, AdStatus, PerformanceLevel } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, compact = false): string {
  if (compact && value >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD',
      notation: 'compact', maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number, compact = false): string {
  if (compact && value >= 1000) {
    return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
  }
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatMultiplier(value: number): string {
  return `${value.toFixed(1)}x`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatRelativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

export function getPlatformColor(platform: Platform): string {
  const map: Record<Platform, string> = {
    facebook: '#1877F2',
    instagram: '#E4405F',
    google: '#4285F4',
    tiktok: '#FF0050',
    linkedin: '#0A66C2',
  };
  return map[platform];
}

export function getPlatformLabel(platform: Platform): string {
  const map: Record<Platform, string> = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    google: 'Google',
    tiktok: 'TikTok',
    linkedin: 'LinkedIn',
  };
  return map[platform];
}

export function getStatusColor(status: AdStatus): string {
  const map: Record<AdStatus, string> = {
    active: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    paused: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    completed: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
    draft: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20',
  };
  return map[status];
}

export function getPerformanceColor(level: PerformanceLevel): string {
  const map: Record<PerformanceLevel, string> = {
    high: 'text-emerald-400',
    medium: 'text-amber-400',
    low: 'text-red-400',
  };
  return map[level];
}

export function getScoreColor(score: number): string {
  if (score >= 85) return 'text-emerald-400';
  if (score >= 70) return 'text-amber-400';
  return 'text-red-400';
}

export function getScoreGradient(score: number): string {
  if (score >= 85) return 'from-emerald-500 to-teal-500';
  if (score >= 70) return 'from-amber-500 to-orange-500';
  return 'from-red-500 to-rose-500';
}

export function getTrendIcon(trend: number): { icon: string; color: string } {
  if (trend > 0) return { icon: '↑', color: 'text-emerald-400' };
  if (trend < 0) return { icon: '↓', color: 'text-red-400' };
  return { icon: '→', color: 'text-zinc-400' };
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
