'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Check, X, Zap, ArrowLeft, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Plan {
  id: string;
  name: string;
  badge?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  cta: string;
  ctaHref: string;
  highlight: boolean;
  color: string;
  features: string[];
  limits: {
    variations: string;
    analyses: string;
    workspaces: string;
  };
}

// ─── Plans ────────────────────────────────────────────────────────────────────

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'Prueba el poder de la IA en tus anuncios sin compromiso.',
    cta: 'Empezar gratis',
    ctaHref: '/sign-up',
    highlight: false,
    color: '#6B7280',
    limits: { variations: '1 por análisis', analyses: '3 / mes', workspaces: '1' },
    features: [
      'Dashboard de métricas',
      'Librería de anuncios',
      'Vista de Creative Studio',
      '1 variación por análisis',
      '3 análisis con IA / mes',
      'Datos históricos 30 días',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    badge: 'Más popular',
    monthlyPrice: 49,
    yearlyPrice: 39,
    description: 'Para creadores y marketers que quieren resultados reales.',
    cta: 'Empezar Pro',
    ctaHref: '/sign-up?plan=pro',
    highlight: true,
    color: '#10B981',
    limits: { variations: '2 por análisis', analyses: 'Ilimitados', workspaces: '3' },
    features: [
      'Todo lo de Starter',
      'Análisis de IA ilimitados',
      '2 variaciones por análisis',
      'Exportar anuncios (PNG/PDF)',
      'Historial completo',
      'Proyecciones CTR/ROAS/CPC',
      '3 espacios de trabajo',
      'Soporte prioritario',
    ],
  },
  {
    id: 'performance',
    name: 'Performance',
    monthlyPrice: 99,
    yearlyPrice: 79,
    description: 'Conecta tus cuentas reales y optimiza con datos en vivo.',
    cta: 'Empezar Performance',
    ctaHref: '/sign-up?plan=performance',
    highlight: false,
    color: '#8B5CF6',
    limits: { variations: '4 por análisis', analyses: 'Ilimitados', workspaces: '5' },
    features: [
      'Todo lo de Pro',
      '4 variaciones por análisis',
      'Conexión Meta Ads real',
      'Conexión Google Ads real',
      'Dashboard con datos en vivo',
      'Recomendaciones IA inteligentes',
      'Generación de imágenes con IA',
      '5 espacios de trabajo',
    ],
  },
  {
    id: 'agency',
    name: 'Agency',
    monthlyPrice: 199,
    yearlyPrice: 159,
    description: 'Gestiona múltiples clientes y equipos desde un solo lugar.',
    cta: 'Hablar con ventas',
    ctaHref: 'mailto:hello@adgenius.ai',
    highlight: false,
    color: '#F59E0B',
    limits: { variations: 'Ilimitadas', analyses: 'Ilimitados', workspaces: 'Ilimitados' },
    features: [
      'Todo lo de Performance',
      'Variaciones ilimitadas',
      'Múltiples clientes / marcas',
      'Reportes para clientes',
      'Gestión de equipo',
      'Workspaces ilimitados',
      'API access',
      'Account manager dedicado',
    ],
  },
];

// ─── Feature comparison table rows ───────────────────────────────────────────

const COMPARISON_ROWS = [
  { label: 'Dashboard de métricas',           starter: true,   pro: true,   perf: true,   agency: true  },
  { label: 'Análisis de IA',                  starter: '3/mes', pro: '∞',   perf: '∞',   agency: '∞'   },
  { label: 'Variaciones por análisis',        starter: '1',    pro: '2',    perf: '4',    agency: '∞'   },
  { label: 'Creative Studio',                 starter: true,   pro: true,   perf: true,   agency: true  },
  { label: 'Exportar PNG / PDF',              starter: false,  pro: true,   perf: true,   agency: true  },
  { label: 'Proyecciones CTR / ROAS',         starter: false,  pro: true,   perf: true,   agency: true  },
  { label: 'Historial completo',              starter: false,  pro: true,   perf: true,   agency: true  },
  { label: 'Conexión Meta Ads',               starter: false,  pro: false,  perf: true,   agency: true  },
  { label: 'Conexión Google Ads',             starter: false,  pro: false,  perf: true,   agency: true  },
  { label: 'Dashboard datos en vivo',         starter: false,  pro: false,  perf: true,   agency: true  },
  { label: 'Generación de imágenes IA',       starter: false,  pro: false,  perf: true,   agency: true  },
  { label: 'Recomendaciones inteligentes',    starter: false,  pro: false,  perf: true,   agency: true  },
  { label: 'Múltiples clientes / marcas',     starter: false,  pro: false,  perf: false,  agency: true  },
  { label: 'Reportes para clientes',          starter: false,  pro: false,  perf: false,  agency: true  },
  { label: 'Gestión de equipo',               starter: false,  pro: false,  perf: false,  agency: true  },
  { label: 'Workspaces',                      starter: '1',    pro: '3',    perf: '5',    agency: '∞'   },
];

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: '¿Puedo cambiar de plan en cualquier momento?',
    a: 'Sí. Puedes hacer upgrade o downgrade cuando quieras. Los cambios se aplican de forma inmediata y el crédito restante se prorratea automáticamente.',
  },
  {
    q: '¿Necesito tarjeta de crédito para el plan Starter?',
    a: 'No. El plan Starter es completamente gratuito sin necesidad de tarjeta. Solo necesitas crear una cuenta.',
  },
  {
    q: '¿Qué pasa con mis datos si cancelo?',
    a: 'Tus datos se conservan por 30 días tras la cancelación. Puedes exportar todo tu historial, anuncios y variaciones antes de que se eliminen.',
  },
  {
    q: '¿Cómo funciona el descuento anual?',
    a: 'Al pagar anualmente obtienes 2 meses gratis (~20% de descuento). El cobro es único al inicio del período.',
  },
  {
    q: '¿La IA realmente mejora los resultados?',
    a: 'Los usuarios reportan en promedio un 34% de mejora en CTR y 28% en ROAS al usar las variaciones generadas por nuestra IA en sus primeros 30 días.',
  },
];

// ─── Cell renderer ────────────────────────────────────────────────────────────

function Cell({ value }: { value: boolean | string }) {
  if (value === false) return <X size={16} className="mx-auto text-gray-700" />;
  if (value === true)  return <Check size={16} className="mx-auto text-emerald-500" />;
  return <span className="text-sm font-medium text-white">{value}</span>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [annual, setAnnual]       = useState(false);
  const [openFaq, setOpenFaq]     = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const [loading, setLoading]     = useState<Record<string, boolean>>({});
  const [error, setError]         = useState<string | null>(null);
  const { isSignedIn } = useUser();
  const router = useRouter();

  async function handleCheckout(planId: string) {
    if (!isSignedIn) {
      router.push(`/sign-up?plan=${planId}`);
      return;
    }
    setError(null);
    setLoading(prev => ({ ...prev, [planId]: true }));
    try {
      const res  = await fetch('/api/billing/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ planId }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? 'Error al iniciar el pago. Intenta de nuevo.');
        setLoading(prev => ({ ...prev, [planId]: false }));
      }
    } catch {
      setError('Error al conectar con el servidor. Intenta de nuevo.');
      setLoading(prev => ({ ...prev, [planId]: false }));
    }
  }

  return (
    <div style={{ background: '#0B0B0F', minHeight: '100vh', color: '#F9FAFB' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>

      {/* ── Nav ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(11,11,15,0.85)',
        backdropFilter: 'blur(12px)',
        padding: '0 24px',
        height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#10B981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={15} color="white" fill="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>AdMind <span style={{ color: '#10B981' }}>AI</span></span>
        </Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/sign-in" style={{ color: '#9CA3AF', fontSize: 14, textDecoration: 'none' }}>Iniciar sesión</Link>
          <Link href="/sign-up" style={{
            padding: '7px 16px', borderRadius: 10,
            background: 'linear-gradient(135deg,#10B981,#059669)',
            color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none',
          }}>Empezar gratis</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 24px 80px' }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#6B7280', fontSize: 13, textDecoration: 'none', marginBottom: 24 }}>
            <ArrowLeft size={14} /> Volver al inicio
          </Link>
          <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 16 }}>
            Planes simples,{' '}
            <span style={{ background: 'linear-gradient(135deg,#34D399,#10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              resultados reales
            </span>
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: 18, maxWidth: 520, margin: '0 auto 32px' }}>
            Empieza gratis. Escala cuando veas los resultados.
          </p>

          {/* Toggle mensual/anual */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '4px 6px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={() => setAnnual(false)}
              style={{ padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all .2s', background: !annual ? '#10B981' : 'transparent', color: !annual ? '#fff' : '#9CA3AF' }}
            >Mensual</button>
            <button
              onClick={() => setAnnual(true)}
              style={{ padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all .2s', background: annual ? '#10B981' : 'transparent', color: annual ? '#fff' : '#9CA3AF' }}
            >Anual</button>
            {annual && (
              <span style={{ background: 'rgba(16,185,129,0.15)', color: '#34D399', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, marginRight: 4 }}>
                2 meses gratis
              </span>
            )}
          </div>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div style={{ maxWidth: 480, margin: '0 auto 24px', padding: '12px 16px', borderRadius: 12, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', color: '#FCA5A5', fontSize: 13, textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* ── Plan cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 16, marginBottom: 56 }}>
          {PLANS.map(plan => {
            const price = annual ? plan.yearlyPrice : plan.monthlyPrice;
            return (
              <div
                key={plan.id}
                style={{
                  borderRadius: 20,
                  border: plan.highlight
                    ? `2px solid ${plan.color}`
                    : '1px solid rgba(255,255,255,0.08)',
                  background: plan.highlight
                    ? 'linear-gradient(160deg,rgba(16,185,129,0.08),rgba(5,150,105,0.04))'
                    : 'rgba(255,255,255,0.02)',
                  padding: '28px 24px',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: plan.highlight ? `0 0 40px rgba(16,185,129,0.12)` : 'none',
                }}
              >
                {plan.badge && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: plan.color, color: '#fff', fontSize: 11, fontWeight: 700,
                    padding: '3px 12px', borderRadius: 99, whiteSpace: 'nowrap',
                  }}>{plan.badge}</div>
                )}

                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 13, color: plan.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>{plan.name}</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                    {price === 0 ? (
                      <span style={{ fontSize: 36, fontWeight: 800 }}>Gratis</span>
                    ) : (
                      <>
                        <span style={{ fontSize: 36, fontWeight: 800 }}>${price}</span>
                        <span style={{ color: '#6B7280', fontSize: 14 }}>/ mes</span>
                      </>
                    )}
                  </div>
                  {annual && plan.monthlyPrice > 0 && (
                    <p style={{ fontSize: 12, color: '#6B7280' }}>
                      <span style={{ textDecoration: 'line-through' }}>${plan.monthlyPrice}</span>
                      {' '}— facturado anualmente
                    </p>
                  )}
                  <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 8, lineHeight: 1.5 }}>{plan.description}</p>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#D1D5DB' }}>
                      <Check size={14} style={{ color: plan.color, marginTop: 2, flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                {plan.id === 'starter' ? (
                  <Link
                    href="/sign-up"
                    style={{
                      display: 'block', textAlign: 'center',
                      padding: '11px 0', borderRadius: 12,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#D1D5DB', fontSize: 14, fontWeight: 600, textDecoration: 'none',
                    }}
                  >
                    {plan.cta}
                  </Link>
                ) : plan.id === 'agency' ? (
                  <a
                    href="mailto:hello@admind.ai"
                    style={{
                      display: 'block', textAlign: 'center',
                      padding: '11px 0', borderRadius: 12,
                      background: `rgba(245,158,11,0.1)`,
                      border: `1px solid rgba(245,158,11,0.25)`,
                      color: '#FCD34D', fontSize: 14, fontWeight: 600, textDecoration: 'none',
                    }}
                  >
                    {plan.cta}
                  </a>
                ) : (
                  <button
                    onClick={() => handleCheckout(plan.id)}
                    disabled={loading[plan.id]}
                    style={{
                      width: '100%', cursor: loading[plan.id] ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '11px 0', borderRadius: 12, border: 'none',
                      background: plan.highlight
                        ? `linear-gradient(135deg,${plan.color},#059669)`
                        : `rgba(255,255,255,0.06)`,
                      outline: plan.highlight ? 'none' : `1px solid rgba(255,255,255,0.1)`,
                      color: plan.highlight ? '#fff' : '#D1D5DB',
                      fontSize: 14, fontWeight: 600,
                      opacity: loading[plan.id] ? 0.7 : 1,
                      transition: 'opacity .2s',
                    }}
                  >
                    {loading[plan.id]
                      ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Redirigiendo…</>
                      : plan.cta
                    }
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Comparison table toggle ── */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <button
            onClick={() => setShowTable(v => !v)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#9CA3AF', fontSize: 13, padding: '8px 18px', cursor: 'pointer' }}
          >
            {showTable ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showTable ? 'Ocultar comparación' : 'Ver comparación completa de planes'}
          </button>
        </div>

        {/* ── Comparison table ── */}
        {showTable && (
          <div style={{ overflowX: 'auto', marginBottom: 56 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: '#6B7280', fontWeight: 500, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Funcionalidad</th>
                  {PLANS.map(p => (
                    <th key={p.id} style={{ textAlign: 'center', padding: '12px 16px', color: p.highlight ? p.color : '#D1D5DB', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }}>{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr key={row.label} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent' }}>
                    <td style={{ padding: '10px 16px', color: '#9CA3AF' }}>{row.label}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center' }}><Cell value={row.starter} /></td>
                    <td style={{ padding: '10px 16px', textAlign: 'center' }}><Cell value={row.pro} /></td>
                    <td style={{ padding: '10px 16px', textAlign: 'center' }}><Cell value={row.perf} /></td>
                    <td style={{ padding: '10px 16px', textAlign: 'center' }}><Cell value={row.agency} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Social proof strip ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 32, marginBottom: 64, padding: '32px 0', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { stat: '+34%', label: 'CTR promedio' },
            { stat: '+28%', label: 'ROAS promedio' },
            { stat: '2.4×', label: 'Más variaciones en menos tiempo' },
            { stat: '< 60s', label: 'Para generar un análisis completo' },
          ].map(({ stat, label }) => (
            <div key={stat} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#10B981', marginBottom: 4 }}>{stat}</p>
              <p style={{ fontSize: 12, color: '#6B7280' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* ── FAQ ── */}
        <div style={{ maxWidth: 680, margin: '0 auto 64px' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, textAlign: 'center', marginBottom: 32 }}>Preguntas frecuentes</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', background: openFaq === i ? 'rgba(255,255,255,0.03)' : 'transparent', overflow: 'hidden' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'none', border: 'none', color: '#F9FAFB', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left', gap: 12 }}
                >
                  {faq.q}
                  {openFaq === i ? <ChevronUp size={16} style={{ flexShrink: 0, color: '#10B981' }} /> : <ChevronDown size={16} style={{ flexShrink: 0, color: '#6B7280' }} />}
                </button>
                {openFaq === i && (
                  <p style={{ padding: '0 20px 16px', margin: 0, color: '#9CA3AF', fontSize: 14, lineHeight: 1.6 }}>{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom CTA ── */}
        <div style={{ textAlign: 'center', padding: '48px 24px', borderRadius: 24, background: 'linear-gradient(135deg,rgba(16,185,129,0.1),rgba(5,150,105,0.05))', border: '1px solid rgba(16,185,129,0.2)' }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>¿Listo para empezar?</h2>
          <p style={{ color: '#9CA3AF', fontSize: 16, marginBottom: 28 }}>Comienza gratis, sin tarjeta. Ve resultados en las primeras horas.</p>
          <Link href="/sign-up" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 32px', borderRadius: 14,
            background: 'linear-gradient(135deg,#10B981,#059669)',
            color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 8px 24px rgba(16,185,129,0.3)',
          }}>
            <Zap size={18} />
            Empezar gratis ahora
          </Link>
          <p style={{ color: '#4B5563', fontSize: 12, marginTop: 14 }}>Sin tarjeta · Sin contratos · Cancela cuando quieras</p>
        </div>
      </div>
    </div>
  );
}
