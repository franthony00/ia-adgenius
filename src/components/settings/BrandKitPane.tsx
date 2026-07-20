'use client';

import { useState, useEffect } from 'react';
import { Check, RefreshCw, Save } from 'lucide-react';

const TONE_OPTIONS    = ['Profesional', 'Cercano', 'Urgente', 'Inspirador', 'Técnico', 'Juvenil', 'Lujoso'];
const VISUAL_STYLES   = ['Premium', 'Minimalista', 'Tecnológico', 'Urbano', 'Elegante', 'Comercial', 'Deportivo'];

const EMPTY_BRAND_KIT = {
  businessName: '', logoUrl: '', primaryColor: '#10B981', secondaryColor: '#059669',
  businessType: '', phone: '', whatsapp: '', address: '', instagram: '', facebook: '',
  tone: '', targetAudience: '', visualStyle: '', services: '', frequentOffers: '', preferredCTAs: '',
};

export default function BrandKitPane() {
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

  const inputCls = 'w-full px-3 py-2 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500';
  const inputStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' };

  const field = (key: keyof typeof EMPTY_BRAND_KIT, label: string, placeholder: string, type = 'text') => (
    <div>
      <label className="block text-[10px] text-zinc-500 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className={inputCls}
        style={inputStyle}
      />
    </div>
  );

  if (loading) {
    return <div className="h-32 flex items-center justify-center text-xs text-zinc-600">Cargando…</div>;
  }

  return (
    <div className="space-y-6">
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
          {field('businessType', 'Tipo de negocio', 'Ecommerce, Servicio, Restaurante…')}
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
            {field('phone', 'Teléfono', '+54 11…')}
            {field('whatsapp', 'WhatsApp', '+54 11…')}
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
          {field('targetAudience', 'Público objetivo', 'Mujeres 25–45 que buscan…')}
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
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-[10px] text-zinc-500 mb-1">Ofertas frecuentes (separadas por coma)</label>
            <textarea value={form.frequentOffers}
              onChange={e => setForm(f => ({ ...f, frequentOffers: e.target.value }))}
              placeholder="30% OFF en primera compra, Envío gratis"
              rows={2}
              className="w-full px-3 py-2 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 resize-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-[10px] text-zinc-500 mb-1">CTAs preferidos (separados por coma)</label>
            <input value={form.preferredCTAs}
              onChange={e => setForm(f => ({ ...f, preferredCTAs: e.target.value }))}
              placeholder="Comprar ahora, Saber más, Escribinos"
              className={inputCls}
              style={inputStyle}
            />
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
          style={{ background: saved ? '#059669' : 'linear-gradient(135deg,#10B981,#059669)' }}>
          {saved ? <><Check size={13} /> Guardado</> : saving
            ? <><RefreshCw size={13} className="animate-spin" /> Guardando…</>
            : <><Save size={13} /> Guardar Brand Kit</>}
        </button>
      </div>
    </div>
  );
}
