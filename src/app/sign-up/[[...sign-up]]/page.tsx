import { redirect } from 'next/navigation';
import { SignUp } from '@clerk/nextjs';
import { Lightbulb } from 'lucide-react';

export default function SignUpPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) redirect('/');
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: '#0B0B0F' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}
        >
          <Lightbulb size={20} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white tracking-tight">AdGenius</p>
          <p className="text-[10px] font-medium tracking-widest uppercase" style={{ color: '#10B981' }}>
            Ad Intelligence
          </p>
        </div>
      </div>

      <SignUp />
    </div>
  );
}
