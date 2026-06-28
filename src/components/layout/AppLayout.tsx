'use client';

import dynamic from 'next/dynamic';
import { Component, type ReactNode } from 'react';
import Sidebar from './Sidebar';

// Load NovaChat only on the client — uses localStorage, window, and React state
// that would mismatch during SSR. The error boundary catches any runtime failures
// so a NOVA crash never takes down the entire page.
const NovaChat = dynamic(() => import('@/components/ai/NovaChat'), { ssr: false });

class NovaBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err: unknown) { console.error('[NOVA]', err); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-screen" style={{ background: '#0B0B0F' }}>
      <Sidebar />
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col overflow-x-hidden">
        {children}
      </main>
      <NovaBoundary>
        <NovaChat />
      </NovaBoundary>
    </div>
  );
}
