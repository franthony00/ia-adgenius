import Sidebar from './Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-screen" style={{ background: '#0B0B0F' }}>
      <Sidebar />
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
