import type { Metadata } from 'next';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';

export const metadata: Metadata = {
  title: 'AdGenius — Creative Ads Dashboard',
  description: 'Analyze, optimize, and generate high-performance ad creatives with AI',
  icons: {
    icon: '/favicon.svg',
  },
};

const clerkAppearance = {
  variables: {
    colorBackground:      '#111827',
    colorPrimary:         '#10B981',
    colorText:            '#F9FAFB',
    colorTextSecondary:   '#9CA3AF',
    colorInputBackground: '#1F2937',
    colorInputText:       '#F9FAFB',
    colorNeutral:         '#F9FAFB',
    borderRadius:         '12px',
  },
  elements: {
    card:                     { background: '#111827', boxShadow: 'none', border: '1px solid rgba(255,255,255,0.08)' },
    headerTitle:              { color: '#F9FAFB' },
    headerSubtitle:           { color: '#9CA3AF' },
    formFieldLabel:           { color: '#9CA3AF' },
    formFieldInput:           { background: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', color: '#F9FAFB', borderRadius: '10px' },
    formFieldInputShowPasswordButton: { color: '#9CA3AF' },
    // OTP / verification code inputs
    otpCodeField:             { gap: '8px' },
    otpCodeFieldInput:        { background: '#1F2937', border: '1px solid rgba(16,185,129,0.35)', color: '#F9FAFB', borderRadius: '10px', fontSize: '20px', fontWeight: '700' },
    // Buttons
    formButtonPrimary:        { background: 'linear-gradient(135deg,#10B981,#059669)', boxShadow: '0 4px 14px rgba(16,185,129,0.25)' },
    socialButtonsBlockButton: { border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#E5E7EB' },
    // Links & dividers
    dividerLine:              { background: 'rgba(255,255,255,0.08)' },
    dividerText:              { color: '#6B7280' },
    footerActionLink:         { color: '#34D399' },
    identityPreviewText:      { color: '#F9FAFB' },
    identityPreviewEditButton:{ color: '#34D399' },
  },
} as const;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const html = (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  );

  // If Clerk keys are present, wrap with ClerkProvider; otherwise serve demo mode
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return html;

  return (
    <ClerkProvider afterSignOutUrl="/sign-in" appearance={clerkAppearance}>
      {html}
    </ClerkProvider>
  );
}
