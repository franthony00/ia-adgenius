'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Zap, BarChart3, Sparkles, TrendingUp, ArrowRight,
  Brain, Image as ImageIcon, Target, Star,
  Play, ChevronRight, Shield, Clock, Users,
} from 'lucide-react';

// ─── Animated counter ─────────────────────────────────────────────────────────

function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const step = to / 40;
    let current = 0;
    const t = setInterval(() => {
      current = Math.min(current + step, to);
      setVal(Math.round(current));
      if (current >= to) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [to]);
  return <>{val}{suffix}</>;
}

// ─── Feature card ─────────────────────────────────────────────────────────────

function FeatureCard({ icon: Icon, color, title, desc }: { icon: React.ElementType; color: string; title: string; desc: string }) {
  return (
    <div
      style={{ borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', padding: '28px 24px', transition: 'border-color .2s, transform .2s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = color + '40'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 12, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Icon size={20} color={color} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#F9FAFB' }}>{title}</h3>
      <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>{desc}</p>
    </div>
  );
}

// ─── Testimonial card ─────────────────────────────────────────────────────────

function TestimonialCard({ name, role, company, text, ctr }: { name: string; role: string; company: string; text: string; ctr: string }) {
  return (
    <div style={{ borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 2 }}>
        {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#F59E0B" color="#F59E0B" />)}
      </div>
      <p style={{ fontSize: 14, color: '#D1D5DB', lineHeight: 1.6, flex: 1 }}>"{text}"</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#F9FAFB' }}>{name}</p>
          <p style={{ fontSize: 12, color: '#6B7280' }}>{role} · {company}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 18, fontWeight: 800, color: '#10B981' }}>{ctr}</p>
          <p style={{ fontSize: 11, color: '#6B7280' }}>mejora CTR</p>
        </div>
      </div>
    </div>
  );
}

// ─── Step card ────────────────────────────────────────────────────────────────

function StepCard({ number, title, desc, color }: { number: string; title: string; desc: string; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: color + '20', border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 16, fontWeight: 800, color }}>{number}</span>
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F9FAFB', margin: 0 }}>{title}</h3>
      <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>{desc}</p>
    </div>
  );
}

// ─── Dashboard preview ────────────────────────────────────────────────────────

function DashboardPreview() {
  return (
    <div style={{ borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', background: '#111827', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>
      {/* Browser chrome */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0D1117', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
        <div style={{ flex: 1, height: 20, borderRadius: 6, background: 'rgba(255,255,255,0.04)', marginLeft: 8, display: 'flex', alignItems: 'center', paddingLeft: 10 }}>
          <span style={{ fontSize: 11, color: '#4B5563' }}>app.adgenius.ai/dashboard</span>
        </div>
      </div>
      <div style={{ padding: 20 }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'ROAS', value: '4.7×', change: '+18%', color: '#10B981' },
            { label: 'CTR',  value: '3.2%', change: '+34%', color: '#22D3EE' },
            { label: 'Spend',value: '$8.4K',change: '-12%', color: '#8B5CF6' },
            { label: 'Rev',  value: '$39K', change: '+28%', color: '#F59E0B' },
          ].map(k => (
            <div key={k.label} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: 10, color: '#6B7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.05em' }}>{k.label}</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: '#F9FAFB', marginBottom: 2 }}>{k.value}</p>
              <p style={{ fontSize: 11, color: k.color, fontWeight: 600 }}>{k.change}</p>
            </div>
          ))}
        </div>
        {/* Chart */}
        <div style={{ borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '14px 16px', marginBottom: 16, height: 90, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
          {[30, 45, 35, 60, 50, 75, 65, 80, 70, 90, 85, 95].map((h, i) => (
            <div key={i} style={{ flex: 1, borderRadius: '4px 4px 0 0', background: 'linear-gradient(to top,#10B981,#34D399)', height: `${h}%`, opacity: 0.7 + (i / 40) }} />
          ))}
        </div>
        {/* Ad cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { name: 'FitLife — Hero Pain Point', score: 91, ctr: '+34%' },
            { name: 'GlowLab — Before/After',    score: 95, ctr: '+41%' },
          ].map(ad => (
            <div key={ad.name} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#F9FAFB', marginBottom: 4 }}>{ad.name}</p>
                <span style={{ fontSize: 10, color: '#22D3EE' }}>{ad.ctr} CTR</span>
              </div>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: `conic-gradient(#10B981 ${ad.score * 3.6}deg,rgba(255,255,255,0.1) 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#10B981' }}>{ad.score}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div style={{ background: '#0B0B0F', minHeight: '100vh', color: '#F9FAFB', overflowX: 'hidden' }}>

      {/* ── Nav ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(11,11,15,0.85)', backdropFilter: 'blur(12px)', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg,#10B981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16,185,129,0.4)' }}>
            <Zap size={16} color="white" fill="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 17, color: '#fff' }}>AdGenius</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link href="#features" style={{ color: '#9CA3AF', fontSize: 14, textDecoration: 'none' }}>Funcionalidades</Link>
          <Link href="#how-it-works" style={{ color: '#9CA3AF', fontSize: 14, textDecoration: 'none' }}>Cómo funciona</Link>
          <Link href="/pricing" style={{ color: '#9CA3AF', fontSize: 14, textDecoration: 'none' }}>Precios</Link>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/sign-in" style={{ color: '#9CA3AF', fontSize: 14, textDecoration: 'none', padding: '7px 14px' }}>Iniciar sesión</Link>
          <Link href="/sign-up" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#10B981,#059669)', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}>
            Empezar gratis
          </Link>
        </div>
      </nav>

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Hero ── */}
        <section style={{ padding: 'clamp(72px,10vw,120px) 24px clamp(48px,8vw,80px)', textAlign: 'center', maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '10%', left: '5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(16,185,129,0.1) 0%,transparent 70%)', pointerEvents: 'none', filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', top: '20%', right: '0%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,0.07) 0%,transparent 70%)', pointerEvents: 'none', filter: 'blur(60px)' }} />

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 99, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', marginBottom: 28 }}>
            <Sparkles size={12} color="#10B981" />
            <span style={{ fontSize: 12, color: '#34D399', fontWeight: 600 }}>Potenciado por Claude AI + GPT Image</span>
          </div>

          <h1 style={{ fontSize: 'clamp(40px,6.5vw,80px)', fontWeight: 900, lineHeight: 1.05, marginBottom: 24, letterSpacing: '-0.03em' }}>
            Convierte tus anuncios en{' '}
            <span style={{ background: 'linear-gradient(135deg,#34D399 0%,#10B981 50%,#059669 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              máquinas de venta
            </span>
          </h1>

          <p style={{ fontSize: 'clamp(16px,2.5vw,21px)', color: '#6B7280', maxWidth: 580, margin: '0 auto 40px', lineHeight: 1.65 }}>
            IA que analiza tus ads, genera variaciones ganadoras e imágenes profesionales en segundos. Más CTR, más ROAS, menos tiempo.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 48 }}>
            <Link href="/sign-up" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '15px 32px', borderRadius: 14, background: 'linear-gradient(135deg,#10B981,#059669)', color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 32px rgba(16,185,129,0.35)' }}>
              <Zap size={18} /> Empezar gratis — sin tarjeta
            </Link>
            <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '15px 28px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', color: '#D1D5DB', fontSize: 16, fontWeight: 600, textDecoration: 'none', background: 'rgba(255,255,255,0.04)' }}>
              <Play size={16} /> Ver demo en vivo
            </Link>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 28, marginBottom: 64 }}>
            {[
              { icon: Shield, text: 'Sin tarjeta requerida' },
              { icon: Clock, text: 'Listo en 2 minutos' },
              { icon: Users, text: '+500 marketers activos' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon size={14} color="#10B981" />
                <span style={{ fontSize: 13, color: '#6B7280' }}>{text}</span>
              </div>
            ))}
          </div>

          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <DashboardPreview />
          </div>
        </section>

        {/* ── Stats bar ── */}
        <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '48px 24px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 48 }}>
            {[
              { to: 34, suffix: '%', label: 'Mejora promedio en CTR', color: '#10B981' },
              { to: 28, suffix: '%', label: 'Mejora promedio en ROAS', color: '#22D3EE' },
              { to: 60, suffix: 's', label: 'Para generar un análisis', color: '#8B5CF6' },
              { to: 500, suffix: '+', label: 'Marketers activos', color: '#F59E0B' },
            ].map(({ to, suffix, label, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 44, fontWeight: 900, color, marginBottom: 6 }}><Counter to={to} suffix={suffix} /></p>
                <p style={{ fontSize: 13, color: '#6B7280' }}>{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" style={{ padding: 'clamp(64px,8vw,100px) 24px', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, color: '#10B981', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 12 }}>Funcionalidades</p>
            <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 16 }}>Todo lo que necesitas para escalar</h2>
            <p style={{ color: '#6B7280', fontSize: 17, maxWidth: 500, margin: '0 auto' }}>Desde el análisis hasta la imagen generada. En una sola plataforma.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
            <FeatureCard icon={Brain} color="#10B981" title="Análisis profundo con IA" desc="Claude analiza cada anuncio: copy, visual, audiencia y hook. Score 0-100 con recomendaciones accionables en segundos." />
            <FeatureCard icon={Sparkles} color="#8B5CF6" title="Variaciones ganadoras" desc="Genera 2-4 variaciones optimizadas por plataforma con CTR, ROAS y CPC predichos por IA." />
            <FeatureCard icon={ImageIcon} color="#22D3EE" title="Imágenes generadas con IA" desc="GPT Image crea imágenes publicitarias profesionales desde el prompt de cada variación. Sin diseñador." />
            <FeatureCard icon={BarChart3} color="#F59E0B" title="Dashboard de rendimiento" desc="Métricas reales de Meta Ads y Google Ads. ROAS, CTR, CPC, CPA en tiempo real en un solo lugar." />
            <FeatureCard icon={Target} color="#EF4444" title="Creative Studio" desc="Crea flyers, posts y stories listos para publicar con tu Brand Kit aplicado automáticamente." />
            <FeatureCard icon={TrendingUp} color="#34D399" title="Recomendaciones inteligentes" desc="La IA aprende de tus patrones ganadores y sugiere acciones concretas para tu próxima campaña." />
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how-it-works" style={{ padding: 'clamp(64px,8vw,100px) 24px', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <p style={{ fontSize: 12, color: '#8B5CF6', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 12 }}>Cómo funciona</p>
              <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, lineHeight: 1.15 }}>De cero a anuncio ganador en minutos</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 36 }}>
              <StepCard number="1" color="#10B981" title="Conecta tu cuenta" desc="Importa campañas de Meta Ads o Google Ads en un click. O sube un anuncio manualmente." />
              <StepCard number="2" color="#8B5CF6" title="La IA analiza" desc="En menos de 60 segundos: análisis completo con fortalezas, debilidades y score de efectividad." />
              <StepCard number="3" color="#22D3EE" title="Genera variaciones" desc="Selecciona modo (copy, visual o ambos) y la IA genera variaciones con imágenes y métricas predichas." />
              <StepCard number="4" color="#F59E0B" title="Publica y mide" desc="Aprueba, exporta y publica. El dashboard trackea cuál gana el A/B test en tiempo real." />
            </div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section style={{ padding: 'clamp(64px,8vw,100px) 24px', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, color: '#F59E0B', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 12 }}>Testimonios</p>
            <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, lineHeight: 1.15 }}>Lo que dicen nuestros usuarios</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
            <TestimonialCard name="María González" role="Media Buyer" company="FitnessPro Agency" text="En 2 semanas mis campañas de Facebook mejoraron un 38% en CTR usando las variaciones de AdGenius. El análisis de copy es brutalmente honesto y acertado." ctr="+38%" />
            <TestimonialCard name="Carlos Méndez" role="Fundador" company="EcomStore" text="Antes pagaba $800/mes a un diseñador para variaciones. Ahora genero imágenes con IA en segundos y los resultados son mejores. ROI desde el primer mes." ctr="+29%" />
            <TestimonialCard name="Ana Rodríguez" role="Dir. de Marketing" company="HealthLab" text="El dashboard me da claridad que no tenía antes. Veo exactamente qué ángulo de copy funciona mejor por plataforma. La IA me explica el por qué." ctr="+45%" />
          </div>
        </section>

        {/* ── Pricing preview ── */}
        <section style={{ padding: 'clamp(64px,8vw,100px) 24px', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: '#10B981', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 12 }}>Precios</p>
            <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 16 }}>Empieza gratis. Escala cuando veas resultados.</h2>
            <p style={{ color: '#6B7280', fontSize: 17, marginBottom: 40 }}>Sin contratos. Sin sorpresas. Cancela cuando quieras.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 36 }}>
              {[
                { name: 'Starter',     price: 'Gratis',   color: '#6B7280', desc: '3 análisis / mes',    highlight: false },
                { name: 'Pro',         price: '$49/mes',  color: '#10B981', desc: 'Análisis ilimitados',  highlight: true  },
                { name: 'Performance', price: '$99/mes',  color: '#8B5CF6', desc: 'Meta + Google Ads',    highlight: false },
                { name: 'Agency',      price: '$199/mes', color: '#F59E0B', desc: 'Multi-cliente',        highlight: false },
              ].map(p => (
                <div key={p.name} style={{ padding: '18px 14px', borderRadius: 16, border: p.highlight ? `2px solid ${p.color}` : '1px solid rgba(255,255,255,0.07)', background: p.highlight ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: p.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>{p.name}</p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: '#F9FAFB', marginBottom: 4 }}>{p.price}</p>
                  <p style={{ fontSize: 11, color: '#6B7280' }}>{p.desc}</p>
                </div>
              ))}
            </div>
            <Link href="/pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#10B981', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              Ver todos los planes y comparación completa <ChevronRight size={16} />
            </Link>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section style={{ padding: 'clamp(64px,8vw,100px) 24px' }}>
          <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', padding: '64px 32px', borderRadius: 28, background: 'linear-gradient(135deg,rgba(16,185,129,0.1),rgba(139,92,246,0.06))', border: '1px solid rgba(16,185,129,0.2)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(16,185,129,0.2) 0%,transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,0.15) 0%,transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#10B981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(16,185,129,0.4)' }}>
                  <Zap size={26} color="white" fill="white" />
                </div>
              </div>
              <h2 style={{ fontSize: 'clamp(24px,4vw,40px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 16 }}>
                Tu próximo anuncio ganador<br />está a un click de distancia
              </h2>
              <p style={{ color: '#6B7280', fontSize: 17, marginBottom: 36, lineHeight: 1.6 }}>
                Únete a más de 500 marketers que ya usan IA para escalar sus resultados.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
                <Link href="/sign-up" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '15px 32px', borderRadius: 14, background: 'linear-gradient(135deg,#10B981,#059669)', color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 24px rgba(16,185,129,0.35)' }}>
                  <Zap size={18} /> Crear cuenta gratis
                </Link>
                <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '15px 24px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', color: '#D1D5DB', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
                  Ver el dashboard <ArrowRight size={16} />
                </Link>
              </div>
              <p style={{ color: '#374151', fontSize: 12, marginTop: 16 }}>Sin tarjeta · 2 minutos para empezar · Cancela cuando quieras</p>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '40px 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg,#10B981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={13} color="white" fill="white" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>AdGenius</span>
              <span style={{ color: '#374151', fontSize: 13, marginLeft: 8 }}>© 2026</span>
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[{ href: '/pricing', label: 'Precios' }, { href: '/sign-up', label: 'Registrarse' }, { href: '/sign-in', label: 'Iniciar sesión' }, { href: '/dashboard', label: 'Dashboard' }].map(({ href, label }) => (
                <Link key={href} href={href} style={{ color: '#6B7280', fontSize: 13, textDecoration: 'none' }}>{label}</Link>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['Claude AI', 'GPT Image', 'Clerk Auth', 'Neon DB'].map(tech => (
                <span key={tech} style={{ padding: '3px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 11, color: '#6B7280' }}>{tech}</span>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
