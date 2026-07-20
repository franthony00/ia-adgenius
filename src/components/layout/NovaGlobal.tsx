'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Component, type ReactNode } from 'react';

const NovaChat = dynamic(() => import('@/components/ai/NovaChat'), { ssr: false });

class NovaBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err: unknown) { console.error('[NOVA] crashed in boundary:', err); }
  render() { return this.state.failed ? null : this.props.children; }
}

const PUBLIC_PATHS = ['/', '/pricing', '/sign-in', '/sign-up'];

export default function NovaGlobal() {
  const pathname = usePathname();

  // Don't show Nova on public/marketing pages
  if (PUBLIC_PATHS.some(p => pathname === p || pathname?.startsWith(p + '/'))) {
    return null;
  }

  return (
    <NovaBoundary>
      <NovaChat currentPage={pathname ?? '/'} />
    </NovaBoundary>
  );
}
