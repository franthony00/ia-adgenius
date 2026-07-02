'use client';

import { useUser, UserButton, useClerk } from '@clerk/nextjs';
import { LogOut } from 'lucide-react';
import { usePlan } from '@/hooks/usePlan';

const ADMIN_EMAILS_CLIENT = ['franthony007@gmail.com'];

const PLAN_LABEL: Record<string, string> = {
  starter:     'Starter Plan',
  pro:         'Pro Plan',
  performance: 'Performance Plan',
  agency:      'Agency Plan',
  enterprise:  'Enterprise Plan',
};

/**
 * Rendered in the Sidebar only when Clerk is configured.
 * Shows the current user's name, active plan, and a sign-out button.
 */
export default function ClerkUserCard() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { planId, loading: planLoading } = usePlan();

  // Loading skeleton
  if (!isLoaded) {
    return (
      <div
        className="flex items-center gap-2 p-2 rounded-xl animate-pulse"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="w-7 h-7 rounded-lg bg-white/10 shrink-0" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="h-2.5 w-20 bg-white/10 rounded" />
          <div className="h-2 w-12 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  const email           = user?.emailAddresses[0]?.emailAddress;
  const isAdminClient   = ADMIN_EMAILS_CLIENT.includes(email ?? '');
  const effectivePlanId = isAdminClient ? 'enterprise' : planId;
  const name            = user?.fullName ?? email ?? 'User';
  const planLabel       = planLoading ? '…' : (PLAN_LABEL[effectivePlanId] ?? `${effectivePlanId} Plan`);

  return (
    <div
      className="flex items-center gap-2 p-2 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <UserButton
        appearance={{
          variables: { colorPrimary: '#10B981', borderRadius: '8px' },
          elements: {
            userButtonAvatarBox:               'w-7 h-7 rounded-lg',
            userButtonPopoverCard:             'bg-[#111827] border border-white/10 shadow-2xl',
            userButtonPopoverActionButton:     'text-zinc-300 hover:text-white hover:bg-white/5',
            userButtonPopoverActionButtonText: 'text-xs',
            userButtonPopoverFooter:           'hidden',
          },
        }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-zinc-200 truncate">{name}</p>
        <p className="text-[10px] text-zinc-600">{planLabel}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
        <button
          onClick={() => signOut({ redirectUrl: '/sign-in' })}
          title="Sign out"
          className="p-1.5 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-400/10 transition-colors"
        >
          <LogOut size={12} />
        </button>
      </div>
    </div>
  );
}
