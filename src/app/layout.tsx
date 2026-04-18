import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AdGenius — Creative Ads Dashboard',
  description: 'Analyze, optimize, and generate high-performance ad creatives with AI',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
