'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, ImageIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Ad, Platform, AdStatus } from '@/lib/types';

interface AddAdModalProps {
  onClose: () => void;
  onAdd: (ad: Ad) => void;
}

interface FormState {
  name: string;
  platform: Platform;
  status: AdStatus;
  campaign: string;
  headline: string;
  description: string;
  cta: string;
  imageUrl: string;
  tags: string;
  budget: string;
  ctr: string;
  cpc: string;
  cpa: string;
  roas: string;
  impressions: string;
  conversions: string;
}

const PLATFORMS: Platform[] = ['facebook', 'instagram', 'tiktok', 'google', 'linkedin'];
const STATUSES: AdStatus[]   = ['active', 'paused', 'draft', 'completed'];

const PLATFORM_COLORS: Record<Platform, string> = {
  facebook:  '#1877F2',
  instagram: '#E1306C',
  tiktok:    '#010101',
  google:    '#4285F4',
  linkedin:  '#0A66C2',
};

const FIELD_STYLE = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#E5E7EB',
};

const FIELD_FOCUS_STYLE = {
  border: '1px solid rgba(16,185,129,0.45)',
  background: 'rgba(16,185,129,0.04)',
};

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{label}</label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-[10px] text-rose-400">
          <AlertCircle size={10} /> {error}
        </p>
      )}
    </div>
  );
}

function InputField({
  value, onChange, placeholder, type = 'text', min,
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; min?: string;
}) {
  return (
    <input
      type={type}
      min={min}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all"
      style={FIELD_STYLE}
      onFocus={e => Object.assign(e.target.style, FIELD_FOCUS_STYLE)}
      onBlur={e => Object.assign(e.target.style, FIELD_STYLE)}
    />
  );
}

function TextareaField({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all resize-none"
      style={FIELD_STYLE}
      onFocus={e => Object.assign(e.target.style, FIELD_FOCUS_STYLE)}
      onBlur={e => Object.assign(e.target.style, FIELD_STYLE)}
    />
  );
}

function generateId() {
  return `ad_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

const PLACEHOLDER_IMAGE = '/ads/tech.svg';

export default function AddAdModal({ onClose, onAdd }: AddAdModalProps) {
  const [form, setForm] = useState<FormState>({
    name: '', platform: 'facebook', status: 'draft',
    campaign: '', headline: '', description: '', cta: 'Learn More',
    imageUrl: '', tags: '', budget: '',
    ctr: '', cpc: '', cpa: '', roas: '', impressions: '', conversions: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [activeSection, setActiveSection] = useState<'basic' | 'metrics'>('basic');

  const set = (key: keyof FormState) => (v: string) =>
    setForm(f => ({ ...f, [key]: v }));

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim())        e.name        = 'Name is required';
    if (!form.headline.trim())    e.headline    = 'Headline is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.campaign.trim())    e.campaign    = 'Campaign is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      setActiveSection('basic');
      return;
    }

    const now = new Date().toISOString();
    const spend = parseFloat(form.budget) || 0;
    const ctr   = parseFloat(form.ctr)   || 0;
    const cpc   = parseFloat(form.cpc)   || 0;
    const cpa   = parseFloat(form.cpa)   || 0;
    const roas  = parseFloat(form.roas)  || 0;
    const impr  = parseInt(form.impressions) || 0;
    const conv  = parseInt(form.conversions) || 0;

    const newAd: Ad = {
      id:          generateId(),
      name:        form.name.trim(),
      platform:    form.platform,
      status:      form.status,
      campaign:    form.campaign.trim(),
      campaignId:  `camp_${Date.now()}`,
      headline:    form.headline.trim(),
      description: form.description.trim(),
      cta:         form.cta.trim() || 'Learn More',
      imageUrl:    form.imageUrl.trim() || PLACEHOLDER_IMAGE,
      tags:        form.tags.split(',').map(t => t.trim()).filter(Boolean),
      budget:      parseFloat(form.budget) || 0,
      format:      'image',
      objective:   'conversions',
      createdAt:   now,
      updatedAt:   now,
      metrics: {
        ctr,
        cpc,
        cpa,
        roas,
        impressions: impr,
        conversions: conv,
        clicks:      Math.round(impr * (ctr / 100)),
        reach:       Math.round(impr * 0.85),
        spend,
        revenue:     spend * (roas || 1),
        cpm:         impr > 0 ? (spend / impr) * 1000 : 0,
        frequency:   1.4,
      },
    };

    onAdd(newAd);
    onClose();
  };

  const sections = ['basic', 'metrics'] as const;

  // Guard: never rendered on server (showModal starts false), but be safe
  if (typeof document === 'undefined') return null;

  const modal = (
    /* Overlay */
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 9999 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal card */}
      <div
        className="w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col rounded-2xl overflow-hidden fade-in-up"
        style={{ background: '#111827', border: '1px solid rgba(16,185,129,0.2)', boxShadow: '0 0 60px rgba(16,185,129,0.1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
              <Plus size={15} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Add New Ad</h2>
              <p className="text-[10px] text-zinc-500">Fill in the details to add it to your library</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 px-6 pt-4">
          {sections.map(s => (
            <button key={s} onClick={() => setActiveSection(s)}
              className={cn('px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all',
                activeSection === s ? 'text-white' : 'text-zinc-500 hover:text-zinc-300')}
              style={activeSection === s ? { background: 'linear-gradient(135deg,#10B981,#059669)' } : {}}>
              {s === 'basic' ? 'Basic Info' : 'Metrics'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* ── Basic Info ── */}
          {activeSection === 'basic' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Ad Name *" error={errors.name}>
                  <InputField value={form.name} onChange={set('name')} placeholder="e.g. Summer Sale Banner" />
                </Field>
                <Field label="Campaign *" error={errors.campaign}>
                  <InputField value={form.campaign} onChange={set('campaign')} placeholder="e.g. Q3 Awareness" />
                </Field>
              </div>

              {/* Platform */}
              <Field label="Platform">
                <div className="flex gap-2 flex-wrap">
                  {PLATFORMS.map(p => (
                    <button key={p} onClick={() => set('platform')(p)}
                      className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all border',
                        form.platform === p ? 'text-white' : 'text-zinc-500 border-white/5 hover:border-white/15')}
                      style={form.platform === p
                        ? { background: PLATFORM_COLORS[p], border: `1px solid ${PLATFORM_COLORS[p]}` }
                        : {}}>
                      {p}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Status */}
              <Field label="Status">
                <div className="flex gap-2">
                  {STATUSES.map(s => (
                    <button key={s} onClick={() => set('status')(s)}
                      className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all border',
                        form.status === s ? 'text-white border-emerald-500/40' : 'text-zinc-500 border-white/5 hover:border-white/15')}
                      style={form.status === s ? { background: 'rgba(16,185,129,0.15)' } : {}}>
                      {s}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Headline *" error={errors.headline}>
                <InputField value={form.headline} onChange={set('headline')} placeholder="e.g. Unlock 50% Off This Summer" />
              </Field>

              <Field label="Description *" error={errors.description}>
                <TextareaField value={form.description} onChange={set('description')}
                  placeholder="Write the ad copy description..." rows={3} />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Call to Action">
                  <InputField value={form.cta} onChange={set('cta')} placeholder="e.g. Shop Now" />
                </Field>
                <Field label="Budget ($)">
                  <InputField value={form.budget} onChange={set('budget')} type="number" min="0" placeholder="0.00" />
                </Field>
              </div>

              <Field label="Image URL">
                <div className="flex gap-2">
                  <InputField value={form.imageUrl} onChange={set('imageUrl')}
                    placeholder="https://... (leave empty for placeholder)" />
                  {(form.imageUrl || PLACEHOLDER_IMAGE) && (
                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0"
                      style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={form.imageUrl || PLACEHOLDER_IMAGE}
                        alt="preview"
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-zinc-600 mt-1 flex items-center gap-1">
                  <ImageIcon size={9} /> If empty, a placeholder image will be used
                </p>
              </Field>

              <Field label="Tags (comma separated)">
                <InputField value={form.tags} onChange={set('tags')} placeholder="e.g. summer, sale, promo" />
              </Field>
            </>
          )}

          {/* ── Metrics ── */}
          {activeSection === 'metrics' && (
            <>
              <p className="text-xs text-zinc-500 pb-1">All metrics are optional — leave blank to set as 0.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="CTR (%)">
                  <InputField value={form.ctr} onChange={set('ctr')} type="number" min="0" placeholder="e.g. 2.4" />
                </Field>
                <Field label="CPC ($)">
                  <InputField value={form.cpc} onChange={set('cpc')} type="number" min="0" placeholder="e.g. 1.20" />
                </Field>
                <Field label="CPA ($)">
                  <InputField value={form.cpa} onChange={set('cpa')} type="number" min="0" placeholder="e.g. 18.00" />
                </Field>
                <Field label="ROAS (x)">
                  <InputField value={form.roas} onChange={set('roas')} type="number" min="0" placeholder="e.g. 3.5" />
                </Field>
                <Field label="Impressions">
                  <InputField value={form.impressions} onChange={set('impressions')} type="number" min="0" placeholder="e.g. 50000" />
                </Field>
                <Field label="Conversions">
                  <InputField value={form.conversions} onChange={set('conversions')} type="number" min="0" placeholder="e.g. 120" />
                </Field>
              </div>

              {/* Preview calculados */}
              {(form.impressions || form.ctr || form.roas || form.budget) && (
                <div className="rounded-xl p-4 space-y-2 mt-2"
                  style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.12)' }}>
                  <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Derived metrics preview</p>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-zinc-500">Clicks</p>
                      <p className="text-white font-bold">
                        {Math.round((parseInt(form.impressions) || 0) * ((parseFloat(form.ctr) || 0) / 100)).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Revenue</p>
                      <p className="text-emerald-400 font-bold">
                        ${((parseFloat(form.budget) || 0) * (parseFloat(form.roas) || 1)).toFixed(0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-500">CPM</p>
                      <p className="text-white font-bold">
                        {(parseInt(form.impressions) || 0) > 0
                          ? `$${(((parseFloat(form.budget) || 0) / (parseInt(form.impressions) || 1)) * 1000).toFixed(2)}`
                          : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-4 border-t border-white/[0.06]">
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            Cancel
          </button>
          <div className="flex items-center gap-2 sm:gap-3">
            {activeSection === 'basic' && (
              <button onClick={() => setActiveSection('metrics')}
                className="px-3 sm:px-4 py-2 rounded-xl text-sm font-medium text-emerald-300 hover:text-white transition-colors"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                Next →
              </button>
            )}
            <button onClick={handleSave}
              className="flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg,#10B981,#059669)', boxShadow: '0 4px 14px rgba(16,185,129,0.25)' }}>
              <Plus size={14} />
              Add to Library
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
