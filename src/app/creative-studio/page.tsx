'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Plus, Trash2, CheckCircle, Clock, Sparkles,
  Image as ImageIcon, Zap, LayoutGrid, RefreshCw, X, Maximize2, Download,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import Header from '@/components/layout/Header';
import AdPreview from '@/components/creative/AdPreview';
import type { CreativeVariation, CreativeFormat, CreativeStyle, CreativeObjective, BrandKit } from '@/lib/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const FORMAT_OPTIONS: { value: CreativeFormat; label: string }[] = [
  { value: 'instagram_post',   label: 'Instagram Post 1:1'   },
  { value: 'instagram_story',  label: 'Instagram Story 9:16' },
  { value: 'facebook_ad',      label: 'Facebook Ad 16:9'     },
  { value: 'banner',           label: 'Banner Web'            },
  { value: 'flyer',            label: 'Flyer A4'              },
  { value: 'whatsapp_status',  label: 'WhatsApp Status'       },
];

const STYLE_OPTIONS: { value: CreativeStyle; label: string; color: string }[] = [
  { value: 'premium',      label: 'Premium',      color: '#D4AF37' },
  { value: 'minimalista',  label: 'Minimalista',  color: '#94A3B8' },
  { value: 'tecnologico',  label: 'Tecnológico',  color: '#38BDF8' },
  { value: 'urbano',       label: 'Urbano',       color: '#F97316' },
  { value: 'elegante',     label: 'Elegante',     color: '#C084FC' },
  { value: 'comercial',    label: 'Comercial',    color: '#F43F5E' },
  { value: 'deportivo',    label: 'Deportivo',    color: '#34D399' },
];

const OBJECTIVE_OPTIONS: { value: CreativeObjective; label: string }[] = [
  { value: 'awareness',    label: 'Reconocimiento de marca' },
  { value: 'conversions',  label: 'Conversiones'            },
  { value: 'traffic',      label: 'Tráfico al sitio'        },
  { value: 'leads',        label: 'Generación de leads'     },
  { value: 'retention',    label: 'Retención de clientes'   },
];

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft:      { label: 'Borrador',  color: '#6B7280', icon: <Clock size={12} />       },
  generating: { label: 'Generando', color: '#FBBF24', icon: <RefreshCw size={12} className="animate-spin" /> },
  ready:      { label: 'Lista',     color: '#34D399', icon: <CheckCircle size={12} /> },
  approved:   { label: 'Aprobada',  color: '#10B981', icon: <CheckCircle size={12} /> },
  rejected:   { label: 'Rechazada', color: '#EF4444', icon: <Trash2 size={12} />      },
};

const EMPTY_FORM = {
  title: '', description: '',
  format: 'instagram_post' as CreativeFormat,
  style: 'premium' as CreativeStyle,
  objective: 'awareness' as CreativeObjective,
  headline: '', copy: '', cta: '', phone: '', notes: '',
};

// ─── Full-screen preview modal ────────────────────────────────────────────────

function PreviewModal({
  variation, brandKit, onClose,
}: {
  variation: CreativeVariation;
  brandKit: BrandKit | null;
  onClose: () => void;
}) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  async function handleExportPng() {
    if (!exportRef.current || exporting) return;
    setExporting(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(exportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        style: { borderRadius: '0' },
      });
      const link = document.createElement('a');
      link.download = `${variation.title.replace(/\s+/g, '-').toLowerCase() || 'flyer'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExporting(false);
    }
  }

  const phone = variation.phone || brandKit?.whatsapp || brandKit?.phone || undefined;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 70,
        overflowY: 'auto',
        background: 'rgba(0,0,0,0.90)',
        backdropFilter: 'blur(14px)',
        padding: '20px 16px 40px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 520,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top bar: close + export */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <button
            onClick={handleExportPng}
            disabled={exporting}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 16px',
              borderRadius: 40,
              background: exporting ? 'rgba(16,185,129,0.15)' : '#10B981',
              border: 'none',
              color: exporting ? '#10B981' : '#000',
              fontSize: 12, fontWeight: 700,
              cursor: exporting ? 'not-allowed' : 'pointer',
              letterSpacing: '0.02em',
              transition: 'background 0.15s',
            }}
          >
            {exporting
              ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Exportando...</>
              : <><Download size={13} /> Export PNG</>}
          </button>

          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Preview — what the user sees (with chrome) */}
        <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.8)' }}>
          <AdPreview
            headline={variation.headline}
            copy={variation.copy}
            cta={variation.cta}
            phone={phone}
            style={variation.style}
            format={variation.format}
            businessName={brandKit?.businessName || undefined}
            logoUrl={brandKit?.logoUrl || undefined}
            primaryColor={brandKit?.primaryColor || undefined}
            secondaryColor={brandKit?.secondaryColor || undefined}
            size="full"
          />
        </div>

        {/* Meta */}
        <div style={{
          borderRadius: 14,
          background: 'rgba(17,24,39,0.95)',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 3 }}>{variation.title}</p>
            <p style={{ fontSize: 11, color: '#6B7280' }}>
              {FORMAT_OPTIONS.find(f => f.value === variation.format)?.label} ·{' '}
              {STYLE_OPTIONS.find(s => s.value === variation.style)?.label} ·{' '}
              {OBJECTIVE_OPTIONS.find(o => o.value === variation.objective)?.label}
            </p>
          </div>
          {phone && (
            <a
              href={`https://wa.me/${phone.replace(/\D/g, '')}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 20,
                background: 'rgba(37,211,102,0.12)',
                border: '1px solid rgba(37,211,102,0.25)',
                color: '#25D366',
                fontSize: 11, fontWeight: 600,
                textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 13 }}>✓</span> WhatsApp
            </a>
          )}
        </div>

        {/* Hidden export target (noChrome, full resolution for clean PNG) */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0, width: 600, pointerEvents: 'none' }}>
          <div ref={exportRef}>
            <AdPreview
              headline={variation.headline}
              copy={variation.copy}
              cta={variation.cta}
              phone={phone}
              style={variation.style}
              format={variation.format}
              businessName={brandKit?.businessName || undefined}
              logoUrl={brandKit?.logoUrl || undefined}
              primaryColor={brandKit?.primaryColor || undefined}
              secondaryColor={brandKit?.secondaryColor || undefined}
              size="full"
              noChrome
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Variation card ───────────────────────────────────────────────────────────

function VariationCard({
  v, brandKit, onStatusChange, onDelete, onPreview,
}: {
  v: CreativeVariation;
  brandKit: BrandKit | null;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onPreview: (v: CreativeVariation) => void;
}) {
  const status = STATUS_META[v.status] ?? STATUS_META.draft;
  const styleOpt = STYLE_OPTIONS.find(s => s.value === v.style);

  return (
    <div className="rounded-2xl border border-white/10 bg-gray-900/60 flex flex-col overflow-hidden hover:border-white/20 transition-colors group">

      {/* Ad preview thumbnail — clickable */}
      <button
        onClick={() => onPreview(v)}
        className="relative w-full shrink-0 overflow-hidden focus:outline-none"
        style={{ background: '#111' }}
        aria-label="Ver preview completo"
      >
        <AdPreview
          headline={v.headline}
          copy={v.copy}
          cta={v.cta}
          phone={v.phone || brandKit?.whatsapp || brandKit?.phone || undefined}
          style={v.style}
          format={v.format}
          businessName={brandKit?.businessName || undefined}
          logoUrl={brandKit?.logoUrl || undefined}
          primaryColor={brandKit?.primaryColor || undefined}
          secondaryColor={brandKit?.secondaryColor || undefined}
          size="thumb"
        />
        {/* Expand overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold">
            <Maximize2 size={12} />
            Ver completo
          </div>
        </div>
      </button>

      {/* Card body */}
      <div className="p-3 flex flex-col gap-2.5 flex-1">
        {/* Title + status */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-white leading-tight truncate">{v.title}</h4>
            <p className="text-[10px] text-gray-600 mt-0.5 truncate">
              {FORMAT_OPTIONS.find(f => f.value === v.format)?.label}
            </p>
          </div>
          <span
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium shrink-0"
            style={{ color: status.color, background: `${status.color}18` }}
          >
            {status.icon}
            {status.label}
          </span>
        </div>

        {/* Style chip */}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: styleOpt?.color ?? '#6B7280' }} />
          <span className="text-[10px] text-gray-500">{styleOpt?.label}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 mt-auto pt-0.5">
          {v.status !== 'approved' && (
            <button
              onClick={() => onStatusChange(v.id, 'approved')}
              className="flex-1 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-medium transition-colors flex items-center justify-center gap-1"
            >
              <CheckCircle size={11} /> Aprobar
            </button>
          )}
          {v.status !== 'rejected' && (
            <button
              onClick={() => onStatusChange(v.id, 'rejected')}
              className="flex-1 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-medium transition-colors flex items-center justify-center gap-1"
            >
              Rechazar
            </button>
          )}
          <button
            onClick={() => onDelete(v.id)}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-600 hover:text-red-400 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreativeStudioPage() {
  const [variations, setVariations] = useState<CreativeVariation[]>([]);
  const [brandKit, setBrandKit]     = useState<BrandKit | null>(null);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [toast, setToast]           = useState<string | null>(null);
  const [isDemo, setIsDemo]         = useState(false);
  const [preview, setPreview]       = useState<CreativeVariation | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { Promise.all([fetchVariations(), fetchBrandKit()]); }, []);

  async function fetchVariations() {
    setLoading(true);
    try {
      const res  = await fetch('/api/creative-variations');
      const data = await res.json();
      setVariations(data.variations ?? []);
      setIsDemo(data.source === 'demo');
    } catch {
      setVariations([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchBrandKit() {
    try {
      const res  = await fetch('/api/brand-kit');
      const data = await res.json();
      const bk = data.brandKit ?? null;
      setBrandKit(bk);
      // Pre-fill phone from Brand Kit if form field is still empty
      if (bk) {
        const bkPhone = bk.whatsapp || bk.phone || '';
        setForm(f => ({ ...f, phone: f.phone || bkPhone }));
      }
    } catch { /* silent */ }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleCreate() {
    if (isDemo) { showToast('Disponible en cuenta real'); return; }
    if (!form.title.trim()) { showToast('El título es requerido'); return; }
    setSaving(true);
    try {
      // Resolve phone: form field → Brand Kit whatsapp → Brand Kit phone
      const resolvedPhone =
        form.phone.trim() ||
        brandKit?.whatsapp?.trim() ||
        brandKit?.phone?.trim() ||
        '';
      const res = await fetch('/api/creative-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, phone: resolvedPhone }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setVariations(v => [data.variation, ...v]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      showToast('Variación creada');
    } catch {
      showToast('Error al crear variación');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id: string, status: string) {
    if (isDemo) { showToast('Disponible en cuenta real'); return; }
    try {
      await fetch(`/api/creative-variations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setVariations(v => v.map(x => x.id === id ? { ...x, status: status as CreativeVariation['status'] } : x));
    } catch { showToast('Error al actualizar'); }
  }

  async function handleDelete(id: string) {
    if (isDemo) { showToast('Disponible en cuenta real'); return; }
    try {
      await fetch(`/api/creative-variations/${id}`, { method: 'DELETE' });
      setVariations(v => v.filter(x => x.id !== id));
      showToast('Variación eliminada');
    } catch { showToast('Error al eliminar'); }
  }

  // Effective brand kit for live preview (merge with form if BK loaded)
  const previewBrandKit = {
    businessName:   brandKit?.businessName   || 'Mi Marca',
    logoUrl:        brandKit?.logoUrl,
    primaryColor:   brandKit?.primaryColor   || '#10B981',
    secondaryColor: brandKit?.secondaryColor || '#059669',
  };

  return (
    <AppLayout>
      <Header
        title="Creative Studio"
        subtitle="Genera variaciones visuales de anuncios basadas en tu Brand Kit"
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <LayoutGrid size={15} />
            <span>{variations.length} variación{variations.length !== 1 ? 'es' : ''}</span>
            {isDemo && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs">Demo</span>
            )}
            {brandKit?.businessName && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: brandKit.primaryColor ?? '#10B981' }} />
                {brandKit.businessName}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-900 text-sm font-semibold transition-colors"
          >
            <Plus size={15} />
            Nueva variación
          </button>
        </div>

        {/* ─── Create form with live preview ─────────────────────────────── */}
        {showForm && (
          <div className="rounded-2xl border border-white/10 bg-gray-900/80 overflow-hidden">

            {/* Form header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles size={15} className="text-emerald-400" />
                Nueva variación creativa
              </h3>
              <button
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex flex-col lg:flex-row">

              {/* Left — form fields */}
              <div className="flex-1 p-5 space-y-3 min-w-0">

                {/* Title */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Título *</label>
                  <input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Ej: Promo verano Instagram"
                    className="w-full px-3 py-2 rounded-xl bg-gray-800 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Format */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Formato</label>
                    <select
                      value={form.format}
                      onChange={e => setForm(f => ({ ...f, format: e.target.value as CreativeFormat }))}
                      className="w-full px-3 py-2 rounded-xl bg-gray-800 border border-white/10 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      {FORMAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>

                  {/* Style */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Estilo</label>
                    <select
                      value={form.style}
                      onChange={e => setForm(f => ({ ...f, style: e.target.value as CreativeStyle }))}
                      className="w-full px-3 py-2 rounded-xl bg-gray-800 border border-white/10 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      {STYLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>

                  {/* Objective */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Objetivo</label>
                    <select
                      value={form.objective}
                      onChange={e => setForm(f => ({ ...f, objective: e.target.value as CreativeObjective }))}
                      className="w-full px-3 py-2 rounded-xl bg-gray-800 border border-white/10 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      {OBJECTIVE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>

                  {/* CTA */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">CTA</label>
                    <input
                      value={form.cta}
                      onChange={e => setForm(f => ({ ...f, cta: e.target.value }))}
                      placeholder="Ej: Escríbenos por WhatsApp"
                      className="w-full px-3 py-2 rounded-xl bg-gray-800 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Phone / WhatsApp */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Teléfono / WhatsApp</label>
                    <input
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="Ej: 809-123-4567"
                      className="w-full px-3 py-2 rounded-xl bg-gray-800 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Headline */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Titular</label>
                  <input
                    value={form.headline}
                    onChange={e => setForm(f => ({ ...f, headline: e.target.value }))}
                    placeholder="Ej: Hasta 50% de descuento esta semana"
                    className="w-full px-3 py-2 rounded-xl bg-gray-800 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Copy */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Copy</label>
                  <textarea
                    value={form.copy}
                    onChange={e => setForm(f => ({ ...f, copy: e.target.value }))}
                    placeholder="Texto principal del anuncio..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl bg-gray-800 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                    className="px-4 py-2 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-gray-900 text-sm font-semibold transition-colors"
                  >
                    {saving ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                    {saving ? 'Guardando...' : 'Generar variación'}
                  </button>
                </div>
              </div>

              {/* Right — live preview */}
              <div className="lg:w-72 xl:w-80 shrink-0 p-5 border-t lg:border-t-0 lg:border-l border-white/8 flex flex-col gap-3">
                <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                  <Sparkles size={12} className="text-emerald-400" />
                  Preview en vivo
                </p>
                <div className="w-full">
                  <AdPreview
                    headline={form.headline}
                    copy={form.copy}
                    cta={form.cta}
                    phone={
                      form.phone.trim() ||
                      brandKit?.whatsapp?.trim() ||
                      brandKit?.phone?.trim() ||
                      ''
                    }
                    style={form.style}
                    format={form.format}
                    businessName={previewBrandKit.businessName}
                    logoUrl={previewBrandKit.logoUrl}
                    primaryColor={previewBrandKit.primaryColor}
                    secondaryColor={previewBrandKit.secondaryColor}
                    size="thumb"
                  />
                </div>
                {!brandKit?.businessName && (
                  <p className="text-[10px] text-gray-600 text-center leading-relaxed">
                    Configura tu Brand Kit en Settings para ver tus colores y logo aplicados
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── Variations grid ──────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-2xl border border-white/10 bg-gray-900/40 aspect-square animate-pulse" />
            ))}
          </div>
        ) : variations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-gray-900/20 p-10 text-center">
            <ImageIcon size={32} className="mx-auto text-gray-600 mb-3" />
            <p className="text-gray-400 text-sm">No hay variaciones aún</p>
            <p className="text-gray-600 text-xs mt-1">Crea tu primera variación con el botón de arriba</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {variations.map(v => (
              <VariationCard
                key={v.id}
                v={v}
                brandKit={brandKit}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onPreview={setPreview}
              />
            ))}
          </div>
        )}
      </div>

      {/* Full-screen preview modal */}
      {preview && (
        <PreviewModal
          variation={preview}
          brandKit={brandKit}
          onClose={() => setPreview(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 px-4 py-3 rounded-2xl bg-gray-800 border border-white/10 text-sm text-white shadow-xl text-center pointer-events-none">
          {toast}
        </div>
      )}
    </AppLayout>
  );
}
