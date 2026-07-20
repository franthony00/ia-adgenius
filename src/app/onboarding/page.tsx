'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Target,
  Palette,
  Users,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  businessName: string;
  businessType: string;
  primaryColor: string;
  targetAudience: string;
  tone: string;
  visualStyle: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BUSINESS_TYPES: { value: string; label: string }[] = [
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'saas', label: 'SaaS' },
  { value: 'agency', label: 'Agency' },
  { value: 'local_business', label: 'Local Business' },
  { value: 'creator', label: 'Creator' },
  { value: 'other', label: 'Other' },
];

const TONES = ['professional', 'casual', 'playful', 'urgent', 'inspirational'];
const VISUAL_STYLES = ['minimalist', 'bold', 'elegant', 'vibrant', 'corporate'];

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PillSelector({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            style={
              selected
                ? {
                    background: 'rgba(16,185,129,0.15)',
                    border: '1px solid #10B981',
                    color: '#10B981',
                  }
                : {
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#9ca3af',
                  }
            }
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer"
          >
            {capitalize(opt)}
          </button>
        );
      })}
    </div>
  );
}

function BusinessTypePills({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {BUSINESS_TYPES.map(({ value: v, label }) => {
        const selected = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            style={
              selected
                ? {
                    background: 'rgba(16,185,129,0.15)',
                    border: '1px solid #10B981',
                    color: '#10B981',
                  }
                : {
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#9ca3af',
                  }
            }
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer"
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function StepDots({ current }: { current: number }) {
  // Only shown on steps 1 and 2 (Brand and Audience)
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2].map((step) => (
        <div
          key={step}
          style={
            current === step
              ? { background: '#10B981', width: '24px' }
              : { background: 'rgba(255,255,255,0.15)', width: '8px' }
          }
          className="h-2 rounded-full transition-all duration-300"
        />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [formData, setFormData] = React.useState<FormData>({
    businessName: '',
    businessType: '',
    primaryColor: '#10B981',
    targetAudience: '',
    tone: '',
    visualStyle: '',
  });

  // Check if user has already onboarded
  React.useEffect(() => {
    fetch('/api/onboarding/status')
      .then((r) => r.json())
      .then((data: { hasOnboarded: boolean }) => {
        if (data.hasOnboarded) {
          router.push('/dashboard');
        }
      })
      .catch(() => {
        // Non-critical — proceed with onboarding
      });
  }, [router]);

  function update(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleComplete() {
    setIsLoading(true);
    try {
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    } catch {
      // Non-critical — proceed regardless
    } finally {
      setIsLoading(false);
      router.push('/dashboard');
    }
  }

  // ── Input shared style ────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
  };

  const inputClass =
    'w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-zinc-600 transition-all';

  // ── Steps ─────────────────────────────────────────────────────────────────

  const stepContent = () => {
    switch (step) {
      // ── Step 0: Welcome ──────────────────────────────────────────────────
      case 0:
        return (
          <div className="flex flex-col items-center text-center gap-6">
            {/* Animated logo */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))',
                border: '1px solid rgba(16,185,129,0.3)',
                boxShadow: '0 0 40px rgba(16,185,129,0.15)',
              }}
            >
              <Sparkles className="w-10 h-10 text-emerald-400" />
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Welcome to AdMind AI
              </h1>
              <p className="text-zinc-400 text-base leading-relaxed">
                Let&apos;s set up your workspace in 2 minutes
              </p>
            </div>

            <div className="flex flex-col gap-2 w-full pt-2">
              {[
                { icon: Palette, text: 'Set up your brand identity' },
                { icon: Users, text: 'Define your target audience' },
                { icon: Target, text: 'Create high-converting ads' },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <Icon className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-sm text-zinc-300">{text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(1)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all duration-150 mt-2"
              style={{
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
              }}
            >
              Get started
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        );

      // ── Step 1: Your Brand ───────────────────────────────────────────────
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white">Your Brand</h2>
              <p className="text-zinc-400 text-sm">Tell us about your business</p>
            </div>

            {/* Business name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">
                Business name
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => update('businessName', e.target.value)}
                placeholder="e.g. FitLife Pro"
                style={inputStyle}
                className={inputClass}
              />
            </div>

            {/* Business type */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">
                Business type
              </label>
              <BusinessTypePills
                value={formData.businessType}
                onChange={(v) => update('businessType', v)}
              />
            </div>

            {/* Brand color */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">
                Brand color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => update('primaryColor', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0.5 bg-transparent shrink-0"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => update('primaryColor', e.target.value)}
                  placeholder="#10B981"
                  style={inputStyle}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        );

      // ── Step 2: Your Audience ────────────────────────────────────────────
      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white">Your Audience</h2>
              <p className="text-zinc-400 text-sm">Help us craft the right message</p>
            </div>

            {/* Target audience */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">
                Target audience
              </label>
              <input
                type="text"
                value={formData.targetAudience}
                onChange={(e) => update('targetAudience', e.target.value)}
                placeholder="e.g. Fitness enthusiasts 25-45"
                style={inputStyle}
                className={inputClass}
              />
            </div>

            {/* Tone */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">
                Tone of voice
              </label>
              <PillSelector
                options={TONES}
                value={formData.tone}
                onChange={(v) => update('tone', v)}
              />
            </div>

            {/* Visual style */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">
                Visual style
              </label>
              <PillSelector
                options={VISUAL_STYLES}
                value={formData.visualStyle}
                onChange={(v) => update('visualStyle', v)}
              />
            </div>
          </div>
        );

      // ── Step 3: All Set! ─────────────────────────────────────────────────
      case 3:
        return (
          <div className="flex flex-col items-center text-center gap-6">
            {/* Animated checkmark */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(16,185,129,0.08))',
                border: '2px solid #10B981',
                boxShadow: '0 0 40px rgba(16,185,129,0.2)',
              }}
            >
              <Check className="w-10 h-10 text-emerald-400" strokeWidth={2.5} />
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-white tracking-tight">
                You&apos;re all set!
              </h2>
              <p className="text-zinc-400 text-base leading-relaxed">
                Your workspace is ready. Let&apos;s create your first ad.
              </p>
            </div>

            {/* Summary */}
            {(formData.businessName || formData.businessType) && (
              <div
                className="w-full text-left px-4 py-4 rounded-xl space-y-2"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
              >
                {formData.businessName && (
                  <p className="text-sm text-zinc-300">
                    <span className="text-zinc-500">Business: </span>
                    <span className="text-white font-medium">{formData.businessName}</span>
                  </p>
                )}
                {formData.primaryColor && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-500">Brand color: </span>
                    <span
                      className="inline-block w-4 h-4 rounded"
                      style={{ background: formData.primaryColor }}
                    />
                    <span className="text-sm text-white font-medium">{formData.primaryColor}</span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleComplete}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all duration-150"
              style={{
                background: isLoading
                  ? 'rgba(16,185,129,0.5)'
                  : 'linear-gradient(135deg, #10B981, #059669)',
                color: '#fff',
                boxShadow: isLoading ? 'none' : '0 4px 14px rgba(16,185,129,0.3)',
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  Go to Dashboard
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  // ── Navigation buttons (shown on steps 1–2) ───────────────────────────────

  const showNav = step === 1 || step === 2;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: '#0A0F1A' }}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-8"
        style={{
          background: '#111827',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}
      >
        {/* Step dots — only on steps 1 & 2 */}
        {(step === 1 || step === 2) && <StepDots current={step} />}

        {/* Step content */}
        {stepContent()}

        {/* Back / Next navigation */}
        {showNav && (
          <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 transition-all duration-150"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
              style={{
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(16,185,129,0.25)',
              }}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
