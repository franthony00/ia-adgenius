import dynamic from 'next/dynamic';
import Sidebar from './Sidebar';

// Load NovaChat only on the client — it uses localStorage, window, and portals
// that cause hydration mismatches when server-rendered.
const NovaChat = dynamic(() => import('@/components/ai/NovaChat'), { ssr: false });

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-screen" style={{ background: '#0B0B0F' }}>
      <Sidebar />
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col overflow-x-hidden">
        {children}
      </main>
      <NovaChat />
    </div>
  );
}
