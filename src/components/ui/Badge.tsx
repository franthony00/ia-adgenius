import { cn } from '@/lib/utils';

type BadgeVariant = 'emerald' | 'cyan' | 'amber' | 'rose' | 'zinc' | 'blue' | 'teal' | 'violet';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

const VARIANTS: Record<BadgeVariant, string> = {
  emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  cyan:    'bg-cyan-500/10    text-cyan-300    border-cyan-500/20',
  amber:   'bg-amber-500/10   text-amber-300   border-amber-500/20',
  rose:    'bg-rose-500/10    text-rose-300    border-rose-500/20',
  zinc:    'bg-zinc-500/10    text-zinc-400    border-zinc-500/20',
  blue:    'bg-blue-500/10    text-blue-300    border-blue-500/20',
  teal:    'bg-teal-500/10    text-teal-300    border-teal-500/20',
  violet:  'bg-violet-500/10  text-violet-300  border-violet-500/20',
};

const DOT_COLORS: Record<BadgeVariant, string> = {
  emerald: 'bg-emerald-400',
  cyan:    'bg-cyan-400',
  amber:   'bg-amber-400',
  rose:    'bg-rose-400',
  zinc:    'bg-zinc-500',
  blue:    'bg-blue-400',
  teal:    'bg-teal-400',
  violet:  'bg-violet-400',
};

export default function Badge({ children, variant = 'emerald', dot = false, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
      VARIANTS[variant], className,
    )}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', DOT_COLORS[variant])} />}
      {children}
    </span>
  );
}
