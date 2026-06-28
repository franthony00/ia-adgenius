'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Images, BarChart3, Sparkles, History,
  Lightbulb, ChevronRight, Settings, Bell, TrendingUp, Menu, X, Globe,
  Check, CreditCard, Brain, Users, Plug, AlertTriangle, RefreshCw, Star,
  Zap, Building2, Palette, Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockAds, mockAnalyses, pricingPlans } from '@/lib/mock-data';
import type { PricingPlan } from '@/lib/types';
import { usePlan } from '@/hooks/usePlan';
import { PLAN_ORDER } from '@/lib/plan-gates';
import ClerkUserCard from '@/components/auth/ClerkUserCard';

const HAS_CLERK = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// ─── Nav ──────────────────────────────────────────────────────────────────────
const NAV = [
  { href: '/',             icon: LayoutDashboard, label: 'Dashboard',    badge: null },
  { href: '/library',      icon: Images,          label: 'Ad Library',   badge: String(mockAds.length) },
  { href: '/analysis',     icon: BarChart3,        label: 'AI Analysis',  badge: String(mockAnalyses.length) },
  { href: '/generator',    icon: Sparkles,         label: 'Generator',    badge: null },
  { href: '/history',      icon: History,          label: 'History',      badge: null },
  { href: '/meta-connect',     icon: Globe,    label: 'Ad Platforms',   badge: null },
  { href: '/creative-studio',  icon: Palette,  label: 'Creative Studio', badge: null },
];

// ─── Mock notifications ────────────────────────────────────────────────────────
const MOCK_NOTIFICATIONS = [
  { id: '1', icon: RefreshCw,     color: '#10B981', bg: 'rgba(16,185,129,0.1)',  title: 'Meta sync completed',          desc: '24 ads · 4 campaigns synced',           time: '2h ago', unread: true  },
  { id: '2', icon: Sparkles,      color: '#818CF8', bg: 'rgba(129,140,248,0.1)', title: 'New recommendation generated',  desc: 'Scale "Summer Sale" campaign now',      time: '5h ago', unread: true  },
  { id: '3', icon: AlertTriangle, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  title: 'Campaign underperforming',      desc: '"Holiday Promo" ROAS dropped to 1.8x',  time: '1d ago', unread: false },
  { id: '4', icon: Star,          color: '#22D3EE', bg: 'rgba(34,211,238,0.1)',  title: 'Variation ready for A/B test',  desc: '"Emotional – Nike Run" scored 92/100',  time: '2d ago', unread: false },
];

// ─── Settings sections ────────────────────────────────────────────────────────
const SETTINGS_SECTIONS = [
  { id: 'workspace',     Icon: LayoutDashboard, label: 'Workspace',     desc: 'Name, timezone, default currency' },
  { id: 'brand_kit',     Icon: Palette,          label: 'Brand Kit',     desc: 'Tu marca, colores, tono y CTAs' },
  { id: 'billing',       Icon: CreditCard,       label: 'Billing Plan',  desc: 'Pro Plan · $79/mo · Renews Jun 2026' },
  { id: 'ai_model',      Icon: Brain,            label: 'AI Model',      desc: 'Claude 3.5 Sonnet (default)' },
  { id: 'notifications', Icon: Bell,             label: 'Notifications', desc: 'Email · In-app · Slack webhooks' },
  { id: 'integrations',  Icon: Plug,             label: 'Integrations',  desc: 'Meta Ads connected · Google Ads soon' },
  { id: 'team',          Icon: Users,            label: 'Team Members',  desc: '1 member · Invite collaborators' },
];

const SETTINGS_DETAIL: Record<string, string> = {
  ai_model:      'Default model: Claude 3.5 Sonnet. You can override per-analysis in the AI Analysis screen.',
  workspace:     'Workspace: Marketing Team · Currency: USD · Timezone: UTC-4',
  notifications: 'Receive email alerts for sync completions, campaign alerts, and weekly performance summaries.',
  integrations:  'Meta Ads is connected. Google Ads, TikTok, LinkedIn integrations are in development.',
  team:          'Invite team members to collaborate on campaigns and share AI analysis reports.',
};

// ─── Plan card action button config ───────────────────────────────────────────
const ACTION_STYLE: Record<PricingPlan['action'], { bg: string; border: string; color: string; disabled: boolean }> = {
  current:  { bg: 'rgba(16,185,129,0.08)',  border: '1px solid rgba(16,185,129,0.25)', color: '#34D399',  disabled: true  },
  upgrade:  { bg: 'linear-gradient(135deg,#10B981,#059669)', border: 'none', color: '#fff', disabled: false },
  downgrade:{ bg: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9CA3AF', disabled: false },
  contact:  { bg: 'rgba(34,211,238,0.1)',   border: '1px solid rgba(34,211,238,0.25)', color: '#22D3EE',  disabled: false },
};

const BADGE_STYLE: Record<string, { bg: string; border: string; color: string }> = {
  emerald: { bg: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#34D399' },
  amber:   { bg: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#FBBF24' },
};

// ─── Plan icon mapping ─────────────────────────────────────────────────────────
const PLAN_ICON: Record<string, React.ReactNode> = {
  starter:     <Sparkles size={16} />,
  pro:         <Zap size={16} />,
  performance: <TrendingUp size={16} />,
  agency:      <Users size={16} />,
  enterprise:  <Building2 size={16} />,
};

// ─── Brand Kit pane ───────────────────────────────────────────────────────────
const TONE_OPTIONS = ['Profesional', 'Cercano', 'Urgente', 'Inspirador', 'Técnico', 'Juvenil', 'Lujoso'];
const VISUAL_STYLES = ['Premium', 'Minimalista', 'Tecnológico', 'Urbano', 'Elegante', 'Comercial', 'Deportivo'];

const EMPTY_BRAND_KIT = {
  businessName: '', logoUrl: '', primaryColor: '#10B981', secondaryColor: '#059669',
  businessType: '', phone: '', whatsapp: '', address: '', instagram: '', facebook: '',
  tone: '', targetAudience: '', visualStyle: '', services: '', frequentOffers: '', preferredCTAs: '',
};

function BrandKitPane() {
  const [form, setForm]       = useState(EMPTY_BRAND_KIT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [isDemo, setIsDemo]   = useState(false);

  useEffect(() => {
    fetch('/api/brand-kit')
      .then(r => r.json())
      .then(data => {
        setIsDemo(data.source === 'demo');
        if (data.brandKit) {
          const bk = data.brandKit;
          setForm({
            businessName:   bk.businessName   ?? '',
            logoUrl:        bk.logoUrl         ?? '',
            primaryColor:   bk.primaryColor    ?? '#10B981',
            secondaryColor: bk.secondaryColor  ?? '#059669',
            businessType:   bk.businessType    ?? '',
            phone:          bk.phone           ?? '',
            whatsapp:       bk.whatsapp        ?? '',
            address:        bk.address         ?? '',
            instagram:      bk.instagram       ?? '',
            facebook:       bk.facebook        ?? '',
            tone:           bk.tone            ?? '',
            targetAudience: bk.targetAudience  ?? '',
            visualStyle:    bk.visualStyle     ?? '',
            services:        (bk.services       ?? []).join(', '),
            frequentOffers:  (bk.frequentOffers ?? []).join(', '),
            preferredCTAs:   (bk.preferredCTAs  ?? []).join(', '),
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (isDemo) { setSaved(true); setTimeout(() => setSaved(false), 2000); return; }
    setSaving(true);
    try {
      const splitCSV = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean);
      await fetch('/api/brand-kit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          services:       splitCSV(form.services),
          frequentOffers: splitCSV(form.frequentOffers),
          preferredCTAs:  splitCSV(form.preferredCTAs),
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* silent */ } finally {
      setSaving(false);
    }
  }

  const field = (key: keyof typeof EMPTY_BRAND_KIT, label: string, placeholder: string, type = 'text') => (
    <div>
      <label className="block text-[10px] text-zinc-500 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      />
    </div>
  );

  if (loading) {
    return <div className="h-32 flex items-center justify-center text-xs text-zinc-600">Cargando...</div>;
  }

  return (
    <div className="space-y-5">
      {isDemo && (
        <div className="rounded-xl px-4 py-3 text-xs text-amber-400 font-semibold"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          Modo demo — los datos no se guardan en la base de datos
        </div>
      )}

      {/* Identity */}
      <section>
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">Identidad</p>
        <div className="space-y-2.5">
          {field('businessName', 'Nombre del negocio', 'Mi Empresa S.A.')}
          {field('logoUrl', 'URL del logo', 'https://...')}
          {field('businessType', 'Tipo de negocio', 'Ecommerce, Servicio, Restaurante...')}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">Color primario</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.primaryColor}
                  onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0.5"
                  style={{ background: 'rgba(255,255,255,0.05)' }} />
                <span className="text-xs text-zinc-400 font-mono">{form.primaryColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">Color secundario</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.secondaryColor}
                  onChange={e => setForm(f => ({ ...f, secondaryColor: e.target.value }))}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0.5"
                  style={{ background: 'rgba(255,255,255,0.05)' }} />
                <span className="text-xs text-zinc-400 font-mono">{form.secondaryColor}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section>
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">Contacto</p>
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            {field('phone', 'Teléfono', '+54 11...')}
            {field('whatsapp', 'WhatsApp', '+54 11...')}
          </div>
          {field('address', 'Dirección', 'Av. Corrientes 1234, CABA')}
          <div className="grid grid-cols-2 gap-2">
            {field('instagram', 'Instagram', '@mi_negocio')}
            {field('facebook', 'Facebook', 'facebook.com/mi-negocio')}
          </div>
        </div>
      </section>

      {/* Voice & Audience */}
      <section>
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">Voz y Audiencia</p>
        <div className="space-y-2.5">
          <div>
            <label className="block text-[10px] text-zinc-500 mb-1">Tono de comunicación</label>
            <div className="flex flex-wrap gap-1.5">
              {TONE_OPTIONS.map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, tone: f.tone === t ? '' : t }))}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all"
                  style={form.tone === t
                    ? { background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34D399' }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6B7280' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          {field('targetAudience', 'Público objetivo', 'Mujeres 25-45 que buscan...')}
          <div>
            <label className="block text-[10px] text-zinc-500 mb-1">Estilo visual</label>
            <div className="flex flex-wrap gap-1.5">
              {VISUAL_STYLES.map(s => (
                <button key={s} onClick={() => setForm(f => ({ ...f, visualStyle: f.visualStyle === s ? '' : s }))}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all"
                  style={form.visualStyle === s
                    ? { background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34D399' }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6B7280' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section>
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">Contenido</p>
        <div className="space-y-2.5">
          <div>
            <label className="block text-[10px] text-zinc-500 mb-1">Servicios (separados por coma)</label>
            <textarea value={form.services}
              onChange={e => setForm(f => ({ ...f, services: e.target.value }))}
              placeholder="Diseño web, Redes sociales, Email marketing"
              rows={2}
              className="w-full px-3 py-2 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 resize-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>
          <div>
            <label className="block text-[10px] text-zinc-500 mb-1">Ofertas frecuentes (separadas por coma)</label>
            <textarea value={form.frequentOffers}
              onChange={e => setForm(f => ({ ...f, frequentOffers: e.target.value }))}
              placeholder="30% OFF en primera compra, Envío gratis"
              rows={2}
              className="w-full px-3 py-2 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 resize-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>
          <div>
            <label className="block text-[10px] text-zinc-500 mb-1">CTAs preferidos (separados por coma)</label>
            <input value={form.preferredCTAs}
              onChange={e => setForm(f => ({ ...f, preferredCTAs: e.target.value }))}
              placeholder="Comprar ahora, Saber más, Escribinos"
              className="w-full px-3 py-2 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>
        </div>
      </section>

      {/* Save button */}
      <div className="flex justify-end pt-2">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
          style={{ background: saved ? '#059669' : 'linear-gradient(135deg,#10B981,#059669)' }}>
          {saved ? <><Check size={13} /> Guardado</> : saving ? <><RefreshCw size={13} className="animate-spin" /> Guardando...</> : <><Save size={13} /> Guardar Brand Kit</>}
        </button>
      </div>
    </div>
  );
}

// ─── Billing pane (shown when Settings → Billing Plan is active) ───────────────
function BillingPane({ onAction }: { onAction: () => void }) {
  const { planId, loading: planLoading } = usePlan();
  const activePlanId  = planId ?? 'pro';
  const currentPlan   = pricingPlans.find(p => p.id === activePlanId) ?? pricingPlans[1];
  const currentIdx    = PLAN_ORDER.indexOf(activePlanId);

  return (
    <div className="space-y-5">

      {/* Current plan summary */}
      <div className="rounded-xl p-4"
        style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-zinc-400">Current Plan</p>
              {planLoading ? (
                <span className="text-[10px] text-zinc-600 animate-pulse">Loading…</span>
              ) : (
                <span className="text-xs font-bold text-emerald-400">{currentPlan.name}</span>
              )}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', color: '#34D399' }}>
                Active
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-zinc-600">
              <span>{currentPlan.priceLabel}</span>
              <span>·</span>
              <span>Renewal: Jun 2026</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <button
              onClick={onAction}
              className="px-3 py-1.5 rounded-lg text-[10px] font-semibold text-zinc-400 hover:text-white transition-colors text-center"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              Manage Billing
            </button>
            <button
              onClick={onAction}
              className="px-3 py-1.5 rounded-lg text-[10px] font-semibold text-white transition-all hover:opacity-90 text-center"
              style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
              Change Plan
            </button>
          </div>
        </div>
      </div>

      {/* Plans grid */}
      <div>
        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-3">
          All Plans
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {pricingPlans.map(plan => {
            const thisIdx     = PLAN_ORDER.indexOf(plan.id);
            const derivedAction: PricingPlan['action'] =
              thisIdx === currentIdx ? 'current'
              : thisIdx < currentIdx ? 'downgrade'
              : plan.priceMonthly === null ? 'contact'
              : 'upgrade';
            const actionStyle = ACTION_STYLE[derivedAction];
            const isCurrent   = derivedAction === 'current';
            const badge       = plan.badge && plan.badgeVariant ? BADGE_STYLE[plan.badgeVariant] : null;

            return (
              <div
                key={plan.id}
                className="rounded-xl p-4 flex flex-col gap-3 transition-all"
                style={{
                  background:   isCurrent ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.025)',
                  border:       isCurrent ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(255,255,255,0.06)',
                  boxShadow:    isCurrent ? '0 0 20px rgba(16,185,129,0.06)' : undefined,
                }}
              >
                {/* Plan header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: isCurrent ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)',
                        color:      isCurrent ? '#10B981' : '#6B7280',
                        border:     isCurrent ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(255,255,255,0.08)',
                      }}>
                      {PLAN_ICON[plan.id]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-tight">{plan.name}</p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">{plan.priceLabel}</p>
                    </div>
                  </div>
                  {badge && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
                      style={{ background: badge.bg, border: badge.border, color: badge.color }}>
                      {plan.badge}
                    </span>
                  )}
                </div>

                {/* Short description */}
                <p className="text-[10px] text-zinc-500 leading-relaxed">{plan.shortDesc}</p>

                {/* Features */}
                <ul className="space-y-1.5 flex-1">
                  {plan.features.map(feat => (
                    <li key={feat} className="flex items-start gap-2 text-[10px] text-zinc-400">
                      <Check size={10} className="text-emerald-500 shrink-0 mt-0.5" />
                      {feat}
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                <button
                  onClick={isCurrent ? undefined : onAction}
                  disabled={isCurrent}
                  className="w-full py-2 rounded-lg text-[10px] font-bold transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-default flex items-center justify-center gap-1.5"
                  style={{
                    background: actionStyle.bg,
                    border:     actionStyle.border,
                    color:      actionStyle.color,
                  }}>
                  {isCurrent && <Check size={10} />}
                  {derivedAction === 'current' ? 'Current Plan'
                    : derivedAction === 'upgrade' ? 'Upgrade'
                    : derivedAction === 'downgrade' ? 'Downgrade'
                    : 'Contact Sales'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-zinc-700 text-center pb-1">
        All plans include a 7-day free trial · Cancel anytime · No credit card required for trial
      </p>
    </div>
  );
}

// ─── Settings toast ────────────────────────────────────────────────────────────
function BillingDemoToast({ onClose }: { onClose: () => void }) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const t = setTimeout(() => onCloseRef.current(), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed bottom-6 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-[60] flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl fade-in-up"
      style={{ background: '#111827', border: '1px solid rgba(245,158,11,0.3)', boxShadow: '0 12px 32px rgba(0,0,0,0.6)' }}>
      <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <CreditCard size={14} className="text-amber-400" />
      </div>
      <p className="text-xs font-semibold text-white">Billing actions are in demo mode</p>
      <button onClick={onClose} className="ml-1 text-zinc-600 hover:text-zinc-400 transition-colors shrink-0">
        <X size={13} />
      </button>
    </div>
  );
}

// ─── Settings modal ────────────────────────────────────────────────────────────
function SettingsModal({ onClose }: { onClose: () => void }) {
  const [activeSection, setActiveSection] = useState('workspace');
  const [showBillingToast, setShowBillingToast] = useState(false);

  const isBilling  = activeSection === 'billing';
  const isBrandKit = activeSection === 'brand_kit';
  const isWide     = isBilling || isBrandKit;
  const section    = SETTINGS_SECTIONS.find(s => s.id === activeSection)!;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      {/* Modal — wider when billing to fit plan cards */}
      <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-50 pointer-events-none">
        <div
          className="w-full pointer-events-auto fade-in-up flex flex-col"
          style={{
            maxWidth:     isWide ? '800px' : '512px',
            maxHeight:    '90vh',
            background:   '#111827',
            border:       '1px solid rgba(255,255,255,0.1)',
            boxShadow:    '0 24px 64px rgba(0,0,0,0.6)',
            borderRadius: '16px',
            overflow:     'hidden',
            transition:   'max-width 0.2s ease',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <h2 className="text-base font-bold text-white">Settings</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Manage your workspace preferences</p>
            </div>
            <button onClick={onClose}
              className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Body: horizontal tabs on mobile, nav+detail on sm+ */}
          <div className="flex flex-col sm:flex-row flex-1 min-h-0">

            {/* Section nav — scrollable horizontal on mobile, sidebar on sm+ */}
            <div
              className="flex flex-row sm:flex-col overflow-x-auto sm:overflow-x-visible shrink-0 sm:w-44 p-2 sm:p-3 gap-1 border-b sm:border-b-0 sm:border-r"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              {SETTINGS_SECTIONS.map(({ id, Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-left transition-all whitespace-nowrap sm:w-full',
                    activeSection === id
                      ? 'text-white'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5',
                  )}
                  style={activeSection === id ? {
                    background: 'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(5,150,105,0.08))',
                    border: '1px solid rgba(16,185,129,0.2)',
                  } : {}}
                >
                  <Icon size={13} className={activeSection === id ? 'text-emerald-400' : 'text-zinc-600'} />
                  {label}
                </button>
              ))}
            </div>

            {/* Detail pane — scrollable */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6">

                {/* Section header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <section.Icon size={16} className="text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">{section.label}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5 break-words">{section.desc}</p>
                  </div>
                </div>

                {/* Section content */}
                {isBilling ? (
                  <BillingPane onAction={() => setShowBillingToast(true)} />
                ) : isBrandKit ? (
                  <BrandKitPane />
                ) : (
                  <div className="rounded-xl p-4 space-y-2"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {SETTINGS_DETAIL[activeSection]}
                    </p>
                    <p className="text-[10px] text-amber-400 font-semibold pt-1">
                      Full settings editor coming in next release
                    </p>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 flex justify-end shrink-0"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={onClose}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
              <Check size={12} />Done
            </button>
          </div>
        </div>
      </div>

      {/* Billing demo toast — above the modal */}
      {showBillingToast && (
        <BillingDemoToast onClose={() => setShowBillingToast(false)} />
      )}
    </>
  );
}

// ─── Notifications panel ───────────────────────────────────────────────────────
interface NotificationsPanelProps {
  onClose: () => void;
  readIds: Set<string>;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

function NotificationsPanel({ onClose, readIds, onMarkRead, onMarkAllRead }: NotificationsPanelProps) {
  const unreadCount = MOCK_NOTIFICATIONS.filter(n => !readIds.has(n.id)).length;
  const markAllRead = () => { onMarkAllRead(); };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Panel */}
      <div
        className="fixed bottom-20 left-4 w-72 z-50 rounded-2xl overflow-hidden fade-in-up"
        style={{
          background:  '#111827',
          border:      '1px solid rgba(255,255,255,0.1)',
          boxShadow:   '0 16px 48px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-white">Notifications</p>
            {unreadCount > 0 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(16,185,129,0.2)', color: '#34D399' }}>
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1">
                Mark all read
              </button>
            )}
            <button onClick={onClose}
              className="p-1 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition-colors">
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Items */}
        <div>
          {MOCK_NOTIFICATIONS.map((notif, idx) => {
            const isRead = readIds.has(notif.id);
            const Icon   = notif.icon;
            return (
              <button
                key={notif.id}
                onClick={() => onMarkRead(notif.id)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left transition-all hover:bg-white/[0.03]"
                style={idx < MOCK_NOTIFICATIONS.length - 1
                  ? { borderBottom: '1px solid rgba(255,255,255,0.04)' }
                  : {}}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: notif.bg, color: notif.color }}>
                  <Icon size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={cn('text-xs font-semibold truncate', isRead ? 'text-zinc-400' : 'text-white')}>
                      {notif.title}
                    </p>
                    {!isRead && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />}
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-0.5 truncate">{notif.desc}</p>
                  <p className="text-[10px] text-zinc-700 mt-0.5">{notif.time}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 text-center"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={onClose}
            className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">
            View all notifications →
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Sidebar content (pure UI — no modal state) ───────────────────────────────
interface SidebarContentProps {
  onClose?: () => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  unreadCount: number;
}

function SidebarContent({ onClose, onOpenSettings, onOpenNotifications, unreadCount }: SidebarContentProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center relative shrink-0"
            style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
            <Lightbulb size={18} className="text-white" fill="rgba(255,255,255,0.15)" />
            <div className="absolute inset-0 rounded-xl pulse-glow" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight">AdGenius</p>
            <p className="text-[10px] font-medium tracking-widest uppercase" style={{ color: '#10B981' }}>
              Ad Intelligence
            </p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 lg:hidden">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-3 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
          Main Menu
        </p>
        {NAV.map(({ href, icon: Icon, label, badge }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                active ? 'text-white' : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5',
              )}
              style={active ? {
                background: 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(5,150,105,0.1))',
                border: '1px solid rgba(16,185,129,0.25)',
              } : {}}
            >
              <Icon size={17} className={cn(active ? 'text-emerald-400' : 'text-zinc-600 group-hover:text-zinc-400')} />
              <span className="flex-1">{label}</span>
              {badge && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(16,185,129,0.18)', color: '#6EE7B7' }}>
                  {badge}
                </span>
              )}
              {active && <ChevronRight size={14} className="text-emerald-500" />}
            </Link>
          );
        })}

        {/* Insights widget */}
        <div className="pt-4 mt-4 border-t border-white/5">
          <p className="px-3 mb-3 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Insights</p>
          <div className="rounded-xl p-3 space-y-2"
            style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)' }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-300">Weekly Trend</span>
            </div>
            <div className="flex items-end gap-0.5 h-8">
              {[40, 55, 45, 70, 60, 80, 75].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm bar-grow"
                  style={{
                    height: `${h}%`,
                    background: i === 6 ? 'linear-gradient(180deg,#34D399,#10B981)' : 'rgba(16,185,129,0.28)',
                    animationDelay: `${i * 60}ms`,
                  }} />
              ))}
            </div>
            <p className="text-[10px] text-zinc-500">ROAS ↑ 12% vs last week</p>
          </div>
        </div>
      </nav>

      {/* Bottom */}
      <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
        <div className="flex items-center gap-2">
          <button aria-label="Settings" onClick={onOpenSettings}
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors text-xs">
            <Settings size={14} />Settings
          </button>
          <button aria-label="Notifications" onClick={onOpenNotifications}
            className="relative px-3 py-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors">
            <Bell size={14} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </button>
        </div>
        {HAS_CLERK ? (
          <ClerkUserCard />
        ) : (
          <div className="flex items-center gap-2 p-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
              D
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-200 truncate">Demo User</p>
              <p className="text-[10px] text-zinc-600">Pro Plan · Demo</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sidebar root — owns all modal state (one instance per modal) ─────────────
export default function Sidebar() {
  const [mobileOpen, setMobileOpen]               = useState(false);
  const [showSettings, setShowSettings]           = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  // readIds tracks which notifications have been seen — owned here so the bell badge stays in sync
  const [readIds, setReadIds] = useState<Set<string>>(
    () => new Set(MOCK_NOTIFICATIONS.filter(n => !n.unread).map(n => n.id)),
  );

  const unreadCount = MOCK_NOTIFICATIONS.filter(n => !readIds.has(n.id)).length;

  const openSettings      = () => { setShowNotifications(false); setShowSettings(true); };
  const openNotifications = () => { setShowSettings(false); setShowNotifications(v => !v); };

  const handleMarkRead    = (id: string) => setReadIds(prev => new Set([...prev, id]));
  const handleMarkAllRead = () => setReadIds(new Set(MOCK_NOTIFICATIONS.map(n => n.id)));

  const sharedProps = { onOpenSettings: openSettings, onOpenNotifications: openNotifications, unreadCount };

  return (
    <>
      {/* Mobile hamburger */}
      <button aria-label="Open menu" onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl text-zinc-400 hover:text-white transition-colors"
        style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'lg:hidden fixed left-0 top-0 h-full w-64 z-50 transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ background: '#0D1117', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        <SidebarContent onClose={() => setMobileOpen(false)} {...sharedProps} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col z-40"
        style={{ background: '#0D1117', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <SidebarContent {...sharedProps} />
      </aside>

      {/* Modals — single instance each, outside both <aside> trees */}
      {showSettings      && <SettingsModal      onClose={() => setShowSettings(false)} />}
      {showNotifications && (
        <NotificationsPanel
          onClose={() => setShowNotifications(false)}
          readIds={readIds}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
        />
      )}
    </>
  );
}
