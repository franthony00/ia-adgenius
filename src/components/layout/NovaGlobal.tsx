'use client';

import dynamic from 'next/dynamic';
import { Component, type ReactNode } from 'react';

const NovaChat = dynamic(() => import('@/components/ai/NovaChat'), { ssr: false });

class NovaBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err: unknown) { console.error('[NOVA] crashed in boundary:', err); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function NovaGlobal() {
  console.log('[NOVA] rendering floating button');
  return (
    <NovaBoundary>
      <NovaChat />
    </NovaBoundary>
  );
}
