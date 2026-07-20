'use client';

/**
 * AdPreview — renders styled HTML/CSS ad mockups.
 * High-impact designs with dark backgrounds, massive typography,
 * neon glow effects and decorative elements.
 * Phone number is used ONLY as wa.me link href — never rendered as visible text.
 */

import type { CreativeFormat, CreativeStyle } from '@/lib/types';

export interface AdPreviewProps {
  headline?: string;
  copy?: string;
  cta?: string;
  /** WhatsApp/phone number — used for wa.me link, NOT shown visually */
  phone?: string;
  style: CreativeStyle;
  format: CreativeFormat;
  businessName?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  size?: 'thumb' | 'full';
  /** When true, platform chrome is hidden — used for export */
  noChrome?: boolean;
  /** Optional business category hint for smart defaults */
  businessCategory?: string;
  /** Optional extra data: schedule, location, instagram, benefits, heroImageUrl, heroEmoji */
  extras?: {
    schedule?: string;
    location?: string;
    instagram?: string;
    benefits?: string[];
    heroImageUrl?: string;
    heroEmoji?: string;
  };
}

// ─── Aspect ratios ────────────────────────────────────────────────────────────

const ASPECT: Record<CreativeFormat, string> = {
  instagram_post:  '1 / 1',
  instagram_story: '9 / 16',
  whatsapp_status: '9 / 16',
  facebook_ad:     '16 / 9',
  banner:          '4 / 1',
  flyer:           '1 / 1.414',
};

const PLATFORM_LABEL: Record<CreativeFormat, string> = {
  instagram_post:  'Instagram',
  instagram_story: 'Story',
  whatsapp_status: 'WhatsApp',
  facebook_ad:     'Facebook',
  banner:          'Banner',
  flyer:           'Flyer',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): string {
  const h = (hex || '#10B981').replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) || 16;
  const g = parseInt(h.substring(2, 4), 16) || 185;
  const b = parseInt(h.substring(4, 6), 16) || 129;
  return `${r}, ${g}, ${b}`;
}

function darken(hex: string, amount: number): string {
  const h = (hex || '#10B981').replace('#', '');
  const r = Math.max(0, parseInt(h.substring(0, 2), 16) - amount);
  const g = Math.max(0, parseInt(h.substring(2, 4), 16) - amount);
  const b = Math.max(0, parseInt(h.substring(4, 6), 16) - amount);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

function formatWaMe(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (/^(809|829|849)/.test(digits) && digits.length === 10) {
    return `https://wa.me/1${digits}`;
  }
  return `https://wa.me/${digits}`;
}

/** Split headline: first ~55% white, rest gets accent/glow color */
function splitHeadline(text: string): { top: string; glow: string } {
  const words = text.trim().split(/\s+/);
  if (words.length <= 1) return { top: '', glow: text };
  if (words.length === 2) return { top: words[0], glow: words[1] };
  const split = Math.ceil(words.length * 0.55);
  return { top: words.slice(0, split).join(' '), glow: words.slice(split).join(' ') };
}

// ─── Smart defaults by business category ──────────────────────────────────────

type BusinessCategory = 'celulares' | 'gimnasio' | 'restaurante' | 'barberia' | 'educacion' | 'tienda' | 'belleza' | 'tecnologia' | 'generic';

function detectCategory(businessName: string, hint?: string): BusinessCategory {
  const text = `${businessName} ${hint ?? ''}`.toLowerCase();
  if (/celular|phone|móvil|movil|pantalla|batería|bateria|repair|técnico|tecnico/.test(text)) return 'celulares';
  if (/gym|gimnasio|fitness|crossfit|sport|entrena/.test(text)) return 'gimnasio';
  if (/restaurante|comida|food|pizza|burger|sushi|deliver|cocina|menú|menu/.test(text)) return 'restaurante';
  if (/barber|barbería|barberia|peluquer|corte|pelo|hair/.test(text)) return 'barberia';
  if (/curso|educac|aprend|school|academia|clases|capacitac/.test(text)) return 'educacion';
  if (/tienda|store|shop|ropa|moda|fashion|zapato|accesorio/.test(text)) return 'tienda';
  if (/beauty|belleza|estética|estetica|spa|uñas|unas|manicure/.test(text)) return 'belleza';
  if (/tech|tecnolog|software|app|web|digital|develop|programac/.test(text)) return 'tecnologia';
  return 'generic';
}

const SMART_DEFAULTS: Record<BusinessCategory, { headline: string; copy: string; cta: string }> = {
  celulares:  { headline: 'Repara tu celular hoy mismo',        copy: 'Pantallas, baterías y diagnósticos con atención rápida y garantizada.',        cta: 'Escríbenos por WhatsApp' },
  gimnasio:   { headline: 'Transforma tu cuerpo en 30 días',    copy: 'Entrenadores certificados y planes personalizados para resultados reales.',     cta: 'Empieza hoy gratis'       },
  restaurante:{ headline: 'Sabor que conquista',                 copy: 'Platos frescos listos para ti. Pide ahora y recibe en tu puerta.',              cta: 'Pedir por WhatsApp'       },
  barberia:   { headline: 'Tu mejor versión empieza aquí',       copy: 'Cortes de calidad, atención personalizada y un estilo que habla por ti.',       cta: 'Reserva tu cita'          },
  educacion:  { headline: 'Aprende lo que el mercado paga',      copy: 'Cursos prácticos con certificación. Avanza a tu ritmo desde cualquier lugar.',  cta: 'Ver todos los cursos'     },
  tienda:     { headline: 'Ofertas que no puedes dejar pasar',   copy: 'Los mejores productos al mejor precio. Envío rápido y pago seguro.',            cta: 'Comprar ahora'            },
  belleza:    { headline: 'Brilla como mereces',                 copy: 'Tratamientos profesionales para realzar tu belleza natural.',                   cta: 'Reserva tu cita'          },
  tecnologia: { headline: 'Tecnología que impulsa tu negocio',   copy: 'Soluciones digitales a medida para crecer más rápido y con menos esfuerzo.',   cta: 'Hablemos hoy'             },
  generic:    { headline: 'La mejor opción para ti',             copy: 'Calidad, confianza y resultados comprobados. Estamos aquí para ayudarte.',      cta: 'Contáctanos ahora'        },
};

// ─── Logo badge ───────────────────────────────────────────────────────────────

function LogoBadge({ businessName, logoUrl, bg, color = '#fff', size = 32, radius = 8 }: {
  businessName: string; logoUrl?: string; bg: string; color?: string; size: number; radius?: number;
}) {
  const letter = (businessName || 'A').trim()[0].toUpperCase();
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt={businessName}
        style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', flexShrink: 0 }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: bg, color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: size * 0.44, flexShrink: 0,
    }}>
      {letter}
    </div>
  );
}

// ─── CTA link wrapper ─────────────────────────────────────────────────────────

function CtaLink({ phone, children }: { phone: string; children: React.ReactNode }) {
  const link = phone ? formatWaMe(phone) : '';
  if (link) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer"
        style={{ textDecoration: 'none', display: 'inline-block' }}>
        {children}
      </a>
    );
  }
  return <>{children}</>;
}

// ─── Style props ──────────────────────────────────────────────────────────────

interface StyleProps {
  headline: string;
  copy: string;
  cta: string;
  phone: string;
  business: string;
  logoUrl?: string;
  primary: string;
  secondary: string;
  isStory: boolean;
  isBanner: boolean;
  fs: (base: number) => number;
  extras?: {
    schedule?: string;
    location?: string;
    instagram?: string;
    benefits?: string[];
    heroImageUrl?: string;
    heroEmoji?: string;
  };
}

// ─── PREMIUM — dark layout, split headline with glow, metric widget ───────────

function PremiumAd({ headline, copy, cta, phone, business, logoUrl, primary, secondary, isStory, isBanner, fs }: StyleProps) {
  const rgb = hexToRgb(primary);
  const { top, glow } = splitHeadline(headline);

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: '#09090b',
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', left: '-10%', top: '20%',
        width: '60%', paddingBottom: '60%', borderRadius: '50%',
        background: `radial-gradient(circle, rgba(${rgb},0.14) 0%, transparent 70%)`,
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />
      {/* Subtle grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(${rgb},0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(${rgb},0.04) 1px, transparent 1px)`,
        backgroundSize: `${fs(24)}px ${fs(24)}px`,
      }} />

      {/* Top accent line */}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${primary} 0%, ${secondary} 50%, transparent 100%)`, flexShrink: 0 }} />

      {/* Content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: isBanner ? `${fs(10)}px ${fs(18)}px` : `${fs(16)}px ${fs(18)}px ${fs(14)}px`,
        position: 'relative',
        justifyContent: 'space-between',
      }}>

        {/* Header row: logo + badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: fs(7) }}>
            <div style={{
              width: fs(22), height: fs(22), borderRadius: fs(6),
              background: primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: fs(11), fontWeight: 900, color: '#000',
            }}>
              {logoUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: fs(5), objectFit: 'cover' }} />
                : business[0]?.toUpperCase()}
            </div>
            <span style={{ color: '#fff', fontSize: fs(9), fontWeight: 700 }}>{business}</span>
          </div>
          {!isBanner && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: fs(4),
              padding: `${fs(3)}px ${fs(8)}px`, borderRadius: fs(20),
              border: `1px solid rgba(${rgb},0.35)`,
              fontSize: fs(7.5), color: primary, fontWeight: 600, letterSpacing: '0.05em',
            }}>
              <span style={{ width: fs(5), height: fs(5), borderRadius: '50%', background: primary, display: 'inline-block' }} />
              Impulsado por IA
            </div>
          )}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `${fs(10)}px 0` }}>
          {!isBanner && (
            <div style={{
              fontSize: fs(7.5), fontWeight: 700, color: primary,
              letterSpacing: '0.12em', textTransform: 'uppercase' as const,
              marginBottom: fs(8),
            }}>
              {(() => {
                const cat = detectCategory(business);
                const labels: Record<string, string> = {
                  celulares: 'REPARACIÓN · SERVICIO TÉCNICO',
                  gimnasio: 'FITNESS · ENTRENAMIENTO',
                  restaurante: 'GASTRONOMÍA · DELIVERY',
                  barberia: 'ESTILO · BARBERÍA',
                  educacion: 'CURSOS · CAPACITACIÓN',
                  tienda: 'TIENDA · OFERTAS',
                  belleza: 'BELLEZA · SPA',
                  tecnologia: 'TECNOLOGÍA · DIGITAL',
                  generic: 'SERVICIOS PROFESIONALES',
                };
                return labels[cat] ?? 'SERVICIOS PROFESIONALES';
              })()}
            </div>
          )}

          {/* Headline: split white + glow */}
          <div style={{
            lineHeight: 1.08, letterSpacing: '-0.03em',
            fontSize: fs(isBanner ? 20 : isStory ? 30 : 26),
            fontWeight: 900,
          }}>
            {top && (
              <span style={{ color: '#ffffff', display: 'block' }}>{top}</span>
            )}
            {glow && (
              <span style={{
                color: primary,
                display: 'block',
                textShadow: `0 0 ${fs(20)}px rgba(${rgb},0.7), 0 0 ${fs(40)}px rgba(${rgb},0.35)`,
              }}>
                {glow}
              </span>
            )}
          </div>

          {copy && !isBanner && (
            <div style={{
              color: 'rgba(255,255,255,0.45)',
              fontSize: fs(10.5),
              lineHeight: 1.6,
              marginTop: fs(10),
              maxWidth: '85%',
            }}>
              {copy}
            </div>
          )}
        </div>

        {/* Bottom: CTA + mini metric widget */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: fs(8) }}>
          {cta && (
            <CtaLink phone={phone}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: fs(6),
                background: primary,
                color: '#000',
                padding: `${fs(8)}px ${fs(16)}px`,
                borderRadius: fs(40),
                fontSize: fs(9.5),
                fontWeight: 800,
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
              }}>
                {cta} <span style={{ fontSize: fs(12) }}>→</span>
              </div>
            </CtaLink>
          )}

          {/* Mini metric card (decorative) */}
          {!isBanner && !isStory && (
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid rgba(${rgb},0.18)`,
              borderRadius: fs(8),
              padding: `${fs(6)}px ${fs(9)}px`,
              flexShrink: 0,
            }}>
              <div style={{ fontSize: fs(7), color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', marginBottom: fs(2) }}>CTR</div>
              <div style={{ fontSize: fs(13), fontWeight: 800, color: primary, lineHeight: 1 }}>4.8%</div>
              <div style={{ fontSize: fs(6.5), color: primary, marginTop: fs(1) }}>▲ +38%</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── URBANO — massive type, neon glow, full-bleed impact ──────────────────────

function UrbanoAd({ headline, copy, cta, phone, business, logoUrl, primary, secondary, isStory, isBanner, fs }: StyleProps) {
  const rgb = hexToRgb(primary);
  const words = headline.trim().split(/\s+/);
  // Each word on its own line for maximum impact
  const topWords  = words.slice(0, Math.ceil(words.length / 2));
  const glowWords = words.slice(Math.ceil(words.length / 2));

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: '#050505',
      fontFamily: "'Arial Black', 'Franklin Gothic Heavy', Impact, sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Big ambient glow center */}
      <div style={{
        position: 'absolute',
        left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
        width: '80%', paddingBottom: '80%', borderRadius: '50%',
        background: `radial-gradient(circle, rgba(${rgb},0.12) 0%, transparent 65%)`,
        filter: 'blur(50px)', pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: isBanner ? `${fs(8)}px ${fs(18)}px` : `${fs(14)}px ${fs(14)}px ${fs(12)}px`,
        position: 'relative',
        justifyContent: 'space-between',
      }}>

        {/* Header: logo + badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: fs(6) }}>
            <span style={{ color: primary, fontSize: fs(12), lineHeight: 1 }}>✦</span>
            <span style={{ color: '#fff', fontSize: fs(9), fontWeight: 700, letterSpacing: '0.02em' }}>
              {business}
            </span>
          </div>
          {!isBanner && (
            <div style={{
              background: primary,
              color: '#000',
              padding: `${fs(3)}px ${fs(9)}px`,
              borderRadius: fs(20),
              fontSize: fs(7), fontWeight: 900,
              letterSpacing: '0.06em', textTransform: 'uppercase' as const,
              display: 'flex', alignItems: 'center', gap: fs(4),
            }}>
              <span>⚡</span> ANUNCIOS CON IA
            </div>
          )}
        </div>

        {/* Massive headline */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'center',
          padding: `${fs(8)}px 0`,
          gap: fs(2),
        }}>
          {/* First words — outlined/traced white */}
          {topWords.map((word, i) => (
            <div key={i} style={{
              fontSize: fs(isBanner ? 22 : isStory ? 36 : 30),
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: '-0.03em',
              textTransform: 'uppercase' as const,
              color: 'transparent',
              WebkitTextStroke: `${fs(1.2)}px rgba(255,255,255,0.75)`,
            }}>
              {word}
            </div>
          ))}
          {/* Glow words — solid green with neon effect */}
          {glowWords.map((word, i) => (
            <div key={i} style={{
              fontSize: fs(isBanner ? 22 : isStory ? 36 : 30),
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: '-0.03em',
              textTransform: 'uppercase' as const,
              color: primary,
              textShadow: `0 0 ${fs(20)}px rgba(${rgb},0.9), 0 0 ${fs(50)}px rgba(${rgb},0.45), 0 0 ${fs(80)}px rgba(${rgb},0.2)`,
            }}>
              {word}
            </div>
          ))}

          {copy && !isBanner && (
            <div style={{
              color: 'rgba(255,255,255,0.45)',
              fontSize: fs(9.5),
              lineHeight: 1.55,
              marginTop: fs(8),
              fontFamily: 'Arial, sans-serif',
              fontWeight: 400,
              maxWidth: '85%',
            }}>
              {copy}
            </div>
          )}
        </div>

        {/* Bottom: CTA + mini ad cards decoration */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: fs(8) }}>
          {cta && (
            <CtaLink phone={phone}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: fs(8),
                background: primary,
                color: '#000',
                padding: `${fs(9)}px ${fs(18)}px`,
                borderRadius: fs(40),
                fontSize: fs(9.5),
                fontWeight: 900,
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
                boxShadow: `0 0 ${fs(20)}px rgba(${rgb},0.5)`,
              }}>
                {cta} <span style={{ fontSize: fs(13) }}>→</span>
              </div>
            </CtaLink>
          )}

          {/* Mini decorative ad cards */}
          {!isBanner && !isStory && (
            <div style={{ display: 'flex', gap: fs(4), alignItems: 'flex-end', flexShrink: 0 }}>
              {['A', 'B'].map((label, idx) => (
                <div key={label} style={{
                  width: fs(38), height: fs(28),
                  background: idx === 0 ? `rgba(${rgb},0.15)` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${idx === 0 ? `rgba(${rgb},0.4)` : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: fs(5),
                  display: 'flex', flexDirection: 'column',
                  padding: `${fs(3)}px ${fs(4)}px`,
                  justifyContent: 'space-between',
                }}>
                  <div style={{ fontSize: fs(5.5), color: idx === 0 ? primary : 'rgba(255,255,255,0.3)', fontWeight: 700, fontFamily: 'Arial, sans-serif' }}>
                    CREATIVO {label}
                  </div>
                  <div style={{ fontSize: fs(5), color: idx === 0 ? primary : 'rgba(255,255,255,0.25)', fontFamily: 'Arial, sans-serif' }}>
                    ▲ CTR {idx === 0 ? '4.8%' : '3.1%'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MINIMALISTA — clean white, bold type, brand accent ───────────────────────

function MinimalistaAd({ headline, copy, cta, phone, business, logoUrl, primary, isStory, isBanner, fs }: StyleProps) {
  const rgb = hexToRgb(primary);
  const { top, glow } = splitHeadline(headline);
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: '#FAFAFA',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Subtle color wash bottom-right */}
      <div style={{
        position: 'absolute', right: 0, bottom: 0,
        width: '55%', paddingBottom: '55%',
        background: `radial-gradient(circle at bottom right, rgba(${rgb},0.07) 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      {/* Left accent bar */}
      {!isBanner && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: 3, background: `linear-gradient(180deg, ${primary} 0%, rgba(${rgb},0.1) 100%)`,
        }} />
      )}

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: isBanner ? `${fs(12)}px ${fs(22)}px` : `${fs(18)}px ${fs(20)}px ${fs(16)}px`,
        justifyContent: 'space-between',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: fs(8) }}>
          <LogoBadge businessName={business} logoUrl={logoUrl} bg={primary} color="#fff" size={fs(24)} radius={fs(6)} />
          <span style={{ color: '#888', fontSize: fs(8), fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
            {business}
          </span>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `${fs(10)}px 0` }}>
          <div style={{ width: fs(24), height: 2, background: primary, marginBottom: fs(12), borderRadius: 1 }} />
          <div style={{ lineHeight: 1.1, letterSpacing: '-0.02em', fontSize: fs(isBanner ? 18 : 24), fontWeight: 800 }}>
            {top && <span style={{ color: '#0F172A', display: 'block' }}>{top}</span>}
            {glow && <span style={{ color: primary, display: 'block' }}>{glow}</span>}
          </div>
          {copy && !isBanner && (
            <div style={{ color: '#94A3B8', fontSize: fs(10.5), lineHeight: 1.65, marginTop: fs(10) }}>
              {copy}
            </div>
          )}
        </div>

        {/* CTA */}
        {cta && (
          <CtaLink phone={phone}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: fs(6),
              color: primary, fontSize: fs(10), fontWeight: 700,
              textTransform: 'uppercase' as const, letterSpacing: '0.08em',
              borderBottom: `2px solid ${primary}`, paddingBottom: 2,
            }}>
              {cta} <span style={{ fontSize: fs(13) }}>→</span>
            </div>
          </CtaLink>
        )}
      </div>
    </div>
  );
}

// ─── TECNOLÓGICO — dark tech grid, neon glow headline ─────────────────────────

function TecnologicoAd({ headline, copy, cta, phone, business, logoUrl, primary, isStory, isBanner, fs }: StyleProps) {
  const rgb = hexToRgb(primary);
  const { top, glow } = splitHeadline(headline);
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: '#030712',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(${rgb},0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(${rgb},0.07) 1px, transparent 1px)`,
        backgroundSize: `${fs(20)}px ${fs(20)}px`,
      }} />
      {/* Center glow */}
      <div style={{
        position: 'absolute', left: '50%', top: '40%', transform: 'translate(-50%, -50%)',
        width: '70%', paddingBottom: '70%', borderRadius: '50%',
        background: `radial-gradient(circle, rgba(${rgb},0.15) 0%, transparent 65%)`,
        filter: 'blur(30px)', pointerEvents: 'none',
      }} />
      {/* Large faded icon */}
      <div style={{
        position: 'absolute', right: '3%', bottom: isBanner ? '-5%' : '5%',
        fontSize: isBanner ? fs(50) : fs(72),
        opacity: 0.05, pointerEvents: 'none', lineHeight: 1, userSelect: 'none' as const,
      }}>⚡</div>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: isBanner ? `${fs(10)}px ${fs(18)}px` : `${fs(14)}px ${fs(16)}px`,
        position: 'relative', justifyContent: 'space-between',
      }}>
        {/* Brand bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: fs(8),
          paddingBottom: isBanner ? 0 : fs(10),
          borderBottom: isBanner ? 'none' : `1px solid rgba(${rgb},0.15)`,
          marginBottom: isBanner ? 0 : fs(10),
        }}>
          <div style={{
            width: fs(7), height: fs(7), borderRadius: '50%',
            background: primary, boxShadow: `0 0 ${fs(8)}px ${primary}`, flexShrink: 0,
          }} />
          <span style={{ color: `rgba(${rgb},0.7)`, fontSize: fs(7.5), letterSpacing: '0.15em' }}>
            {business.toUpperCase()}
          </span>
        </div>

        {/* Headline */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ lineHeight: 1.1, fontSize: fs(isBanner ? 18 : 24), fontWeight: 700 }}>
            {top && <span style={{ color: '#fff', display: 'block' }}>{top}</span>}
            {glow && (
              <span style={{
                color: primary, display: 'block',
                textShadow: `0 0 ${fs(16)}px rgba(${rgb},0.8), 0 0 ${fs(32)}px rgba(${rgb},0.4)`,
              }}>{glow}</span>
            )}
          </div>
          {copy && !isBanner && (
            <div style={{ color: `rgba(${rgb},0.45)`, fontSize: fs(10), lineHeight: 1.6, marginTop: fs(10) }}>
              {copy}
            </div>
          )}
        </div>

        {/* CTA */}
        {cta && (
          <div style={{ marginTop: fs(12) }}>
            <CtaLink phone={phone}>
              <div style={{
                display: 'inline-block',
                border: `1px solid ${primary}`,
                color: primary,
                padding: `${fs(6)}px ${fs(16)}px`,
                borderRadius: fs(4),
                fontSize: fs(8.5),
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
                boxShadow: `0 0 ${fs(12)}px rgba(${rgb},0.25)`,
              }}>
                {cta.toUpperCase()} ›
              </div>
            </CtaLink>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ELEGANTE — cream background, serif, split headline ───────────────────────

function EleganteAd({ headline, copy, cta, phone, business, logoUrl, primary, isStory, isBanner, fs }: StyleProps) {
  const rgb = hexToRgb(primary);
  const { top, glow } = splitHeadline(headline);
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(160deg, #FAF8F5 0%, #F2EDE6 100%)',
      fontFamily: "'Georgia', 'Palatino Linotype', 'Book Antiqua', serif",
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Corner ornament */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: isBanner ? '12%' : '32%', paddingBottom: isBanner ? '12%' : '32%',
        borderRadius: '0 0 0 100%',
        background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.1)`,
        pointerEvents: 'none',
      }} />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: isBanner ? `${fs(10)}px ${fs(24)}px` : `${fs(18)}px ${fs(16)}px`,
        position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: fs(7), marginBottom: fs(12) }}>
          <LogoBadge businessName={business} logoUrl={logoUrl} bg={primary} color="#fff" size={fs(22)} radius={fs(5)} />
          <span style={{ color: '#B8A99A', fontSize: fs(8), letterSpacing: '0.18em', textTransform: 'uppercase' as const }}>
            {business}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: fs(8), width: isBanner ? '30%' : '60%', marginBottom: fs(14) }}>
          <div style={{ flex: 1, height: 1, background: `rgba(${rgb},0.25)` }} />
          <div style={{ width: fs(5), height: fs(5), borderRadius: '50%', background: primary, transform: 'rotate(45deg)' }} />
          <div style={{ flex: 1, height: 1, background: `rgba(${rgb},0.25)` }} />
        </div>

        <div style={{ lineHeight: 1.2, fontSize: fs(isBanner ? 16 : 22), fontWeight: 700 }}>
          {top && <span style={{ color: '#1C1008', display: 'block', fontStyle: 'italic' }}>{top}</span>}
          {glow && <span style={{ color: primary, display: 'block', fontStyle: 'italic' }}>{glow}</span>}
        </div>

        {copy && !isBanner && (
          <div style={{ color: '#A08070', fontSize: fs(10), lineHeight: 1.75, marginTop: fs(10), maxWidth: '88%' }}>
            {copy}
          </div>
        )}

        {!isBanner && <div style={{ width: '35%', height: 1, background: `rgba(${rgb},0.18)`, margin: `${fs(12)}px 0 ${fs(8)}px` }} />}

        {cta && (
          <CtaLink phone={phone}>
            <div style={{
              display: 'inline-block',
              border: `1px solid rgba(${rgb},0.5)`, color: primary,
              padding: `${fs(7)}px ${fs(22)}px`, borderRadius: fs(24),
              fontSize: fs(9), fontWeight: 400, fontStyle: 'italic', letterSpacing: '0.1em',
            }}>
              {cta}
            </div>
          </CtaLink>
        )}
      </div>
    </div>
  );
}

// ─── COMERCIAL — high-energy offer style, big discount badge ──────────────────

function ComercialAd({ headline, copy, cta, phone, business, logoUrl, primary, secondary, isStory, isBanner, fs, extras }: StyleProps) {
  const rgb = hexToRgb(primary);
  const { top, glow } = splitHeadline(headline);
  const benefits = extras?.benefits?.slice(0, 4) ?? [];
  const hasChips = !isBanner && (extras?.schedule || extras?.location);

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: `linear-gradient(140deg, #0d0d0d 0%, #111 100%)`,
      fontFamily: "'Arial Black', 'Helvetica Neue', Arial, sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Color burst top-right */}
      <div style={{
        position: 'absolute', right: isBanner ? '10%' : '-10%', top: isBanner ? '-80%' : '-15%',
        width: isBanner ? '22%' : '65%', paddingBottom: isBanner ? '22%' : '65%',
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(${rgb},0.35) 0%, transparent 65%)`,
        filter: 'blur(20px)', pointerEvents: 'none',
      }} />

      {/* Big % badge */}
      <div style={{
        position: 'absolute',
        top: isBanner ? '50%' : fs(14),
        right: isBanner ? fs(14) : undefined,
        left: isBanner ? undefined : fs(14),
        transform: isBanner ? 'translateY(-50%)' : 'none',
        width: fs(isBanner ? 40 : 52), height: fs(isBanner ? 40 : 52), borderRadius: '50%',
        background: primary,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 ${fs(20)}px rgba(${rgb},0.6)`,
        zIndex: 2,
      }}>
        <span style={{ color: '#000', fontSize: fs(isBanner ? 7 : 8.5), fontWeight: 900, lineHeight: 1 }}>%</span>
        <span style={{ color: '#000', fontSize: fs(isBanner ? 5.5 : 6.5), fontWeight: 700, letterSpacing: '0.05em' }}>OFF</span>
      </div>

      {/* Content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: isBanner ? `${fs(10)}px ${fs(60)}px ${fs(10)}px ${fs(18)}px` : `${fs(72)}px ${fs(16)}px ${fs(14)}px`,
        position: 'relative', justifyContent: 'space-between',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: fs(7) }}>
          <LogoBadge businessName={business} logoUrl={logoUrl} bg="rgba(255,255,255,0.1)" color="#fff" size={fs(20)} radius={fs(5)} />
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: fs(8), fontWeight: 700 }}>{business}</span>
        </div>

        {/* Headline */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: `${fs(8)}px 0` }}>
          <div style={{ lineHeight: 1.05, fontSize: fs(isBanner ? 20 : 26), fontWeight: 900 }}>
            {top && <span style={{ color: '#fff', display: 'block' }}>{top}</span>}
            {glow && (
              <span style={{
                color: primary, display: 'block',
                textShadow: `0 0 ${fs(18)}px rgba(${rgb},0.7)`,
              }}>{glow}</span>
            )}
          </div>
          {copy && !isBanner && (
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: fs(10), lineHeight: 1.55, marginTop: fs(8) }}>
              {copy}
            </div>
          )}

          {/* Benefits list */}
          {benefits.length > 0 && !isBanner && (
            <div style={{ marginTop: fs(8), display: 'flex', flexDirection: 'column', gap: fs(4) }}>
              {benefits.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: fs(5) }}>
                  <div style={{
                    width: fs(12), height: fs(12), borderRadius: '50%',
                    background: `rgba(${rgb},0.2)`, border: `1px solid rgba(${rgb},0.4)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span style={{ color: primary, fontSize: fs(7), lineHeight: 1 }}>✓</span>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: fs(8.5) }}>{b}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Schedule + location chips */}
        {hasChips && (
          <div style={{ display: 'flex', gap: fs(5), flexWrap: 'wrap', marginBottom: fs(6) }}>
            {extras?.schedule && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: fs(3),
                padding: `${fs(3)}px ${fs(7)}px`, borderRadius: fs(20),
                background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.25)`,
                fontSize: fs(7.5), color: 'rgba(255,255,255,0.7)',
              }}>
                <span>📅</span> {extras.schedule}
              </div>
            )}
            {extras?.location && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: fs(3),
                padding: `${fs(3)}px ${fs(7)}px`, borderRadius: fs(20),
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                fontSize: fs(7.5), color: 'rgba(255,255,255,0.7)',
              }}>
                <span>📍</span> {extras.location}
              </div>
            )}
          </div>
        )}

        {/* CTA + urgency */}
        <div>
          {cta && (
            <CtaLink phone={phone}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: fs(8),
                background: primary, color: '#000',
                padding: `${fs(8)}px ${fs(18)}px`, borderRadius: fs(40),
                fontSize: fs(9.5), fontWeight: 900, letterSpacing: '0.02em',
                boxShadow: `0 0 ${fs(16)}px rgba(${rgb},0.45)`,
                whiteSpace: 'nowrap',
              }}>
                {cta} <span style={{ fontSize: fs(12) }}>→</span>
              </div>
            </CtaLink>
          )}
          {!isBanner && (
            <div style={{ fontSize: fs(7.5), color: 'rgba(255,255,255,0.25)', marginTop: fs(6), display: 'flex', alignItems: 'center', gap: fs(4) }}>
              <span>⏱</span> Oferta por tiempo limitado
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── DEPORTIVO — "Acción" style, Sharks flyer-inspired ────────────────────────

function DeportivoAd({ headline, copy, cta, phone, business, logoUrl, primary, secondary, isStory, isBanner, fs, extras }: StyleProps) {
  const rgb = hexToRgb(primary);
  const { top, glow } = splitHeadline(headline);
  const heroImageUrl = extras?.heroImageUrl;
  const heroEmoji    = extras?.heroEmoji ?? '🏆';
  const benefits     = extras?.benefits?.slice(0, 4) ?? [];
  const hasChips     = !isBanner && (extras?.schedule || extras?.location);
  const hasFooter    = !isBanner && (phone || extras?.instagram);

  const bgStyle = heroImageUrl
    ? { background: '#060606' }
    : {
        background: `radial-gradient(ellipse at 70% 20%, rgba(${rgb},0.4) 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(${rgb},0.15) 0%, transparent 45%), linear-gradient(180deg, #060606 0%, #0a0a0a 100%)`,
      };

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      ...bgStyle,
      fontFamily: "'Arial Black', 'Franklin Gothic Heavy', Impact, 'Helvetica Neue', sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Hero image layer */}
      {heroImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={heroImageUrl}
          alt=""
          crossOrigin="anonymous"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            opacity: 0.35,
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Dark gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: heroImageUrl
          ? 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.97) 100%)'
          : 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.6) 100%)',
        zIndex: 1,
        pointerEvents: 'none',
      }} />

      {/* Color accent line at top */}
      <div style={{
        position: 'relative', zIndex: 2,
        height: 3,
        background: `linear-gradient(90deg, ${primary} 0%, ${secondary} 60%, transparent 100%)`,
        flexShrink: 0,
      }} />

      {/* Big sport emoji — decorative background art */}
      {!isBanner && (
        <div style={{
          position: 'absolute', right: '15%', top: '8%',
          fontSize: '45%',
          lineHeight: 1, userSelect: 'none' as const,
          opacity: 0.1, pointerEvents: 'none',
          zIndex: 2,
        }}>
          {heroEmoji}
        </div>
      )}

      {/* Content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: isBanner ? `${fs(10)}px ${fs(10)}px ${fs(10)}px ${fs(18)}px` : `${fs(12)}px ${fs(16)}px ${fs(12)}px`,
        position: 'relative', zIndex: 2,
        justifyContent: 'space-between',
      }}>

        {/* Header row: logo circle + business name | brand badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: fs(7) }}>
            <div style={{
              width: fs(26), height: fs(26), borderRadius: '50%',
              background: primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: fs(12), color: '#000',
              flexShrink: 0, overflow: 'hidden',
            }}>
              {logoUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : business[0]?.toUpperCase()}
            </div>
            <span style={{
              color: '#fff', fontSize: fs(8.5), fontWeight: 900,
              letterSpacing: '0.1em', textTransform: 'uppercase' as const,
            }}>
              {business}
            </span>
          </div>
          {!isBanner && (
            <div style={{
              background: `rgba(${rgb},0.15)`,
              border: `1px solid rgba(${rgb},0.35)`,
              color: primary,
              padding: `${fs(2)}px ${fs(7)}px`,
              borderRadius: fs(20),
              fontSize: fs(7), fontWeight: 700,
              letterSpacing: '0.05em',
            }}>
              ⚡ PROMO
            </div>
          )}
        </div>

        {/* Hero zone — massive split headline */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: `${fs(isBanner ? 6 : 10)}px 0`,
        }}>
          {/* Outlined top words */}
          {top && (
            <div style={{
              fontSize: fs(isBanner ? 22 : isStory ? 38 : 32),
              fontWeight: 900,
              lineHeight: 0.93,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase' as const,
              color: 'transparent',
              WebkitTextStroke: `${fs(1.5)}px rgba(255,255,255,0.8)`,
            }}>
              {top}
            </div>
          )}
          {/* Solid neon glow bottom words */}
          {glow && (
            <div style={{
              fontSize: fs(isBanner ? 22 : isStory ? 38 : 32),
              fontWeight: 900,
              lineHeight: 0.93,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase' as const,
              color: primary,
              textShadow: `0 0 ${fs(18)}px rgba(${rgb},0.9), 0 0 ${fs(40)}px rgba(${rgb},0.45)`,
            }}>
              {glow}
            </div>
          )}

          {/* Copy text */}
          {copy && !isBanner && (
            <div style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: fs(9.5),
              lineHeight: 1.5,
              marginTop: fs(8),
              fontFamily: 'Arial, sans-serif',
              fontWeight: 400,
            }}>
              {copy}
            </div>
          )}

          {/* Benefits list */}
          {benefits.length > 0 && !isBanner && (
            <div style={{ marginTop: fs(10), display: 'flex', flexDirection: 'column', gap: fs(5) }}>
              {benefits.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: fs(6) }}>
                  <div style={{
                    width: fs(14), height: fs(14), borderRadius: '50%',
                    background: `rgba(${rgb},0.2)`, border: `1px solid rgba(${rgb},0.5)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span style={{ color: primary, fontSize: fs(8), lineHeight: 1 }}>✓</span>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: fs(9) }}>{b}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Schedule + Location chips */}
        {hasChips && (
          <div style={{ display: 'flex', gap: fs(5), flexWrap: 'wrap', marginBottom: fs(8) }}>
            {extras?.schedule && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: fs(4),
                padding: `${fs(4)}px ${fs(8)}px`, borderRadius: fs(20),
                background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.3)`,
                fontSize: fs(8), color: 'rgba(255,255,255,0.8)',
                fontFamily: 'Arial, sans-serif', fontWeight: 500,
              }}>
                <span>📅</span> {extras.schedule}
              </div>
            )}
            {extras?.location && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: fs(4),
                padding: `${fs(4)}px ${fs(8)}px`, borderRadius: fs(20),
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
                fontSize: fs(8), color: 'rgba(255,255,255,0.8)',
                fontFamily: 'Arial, sans-serif', fontWeight: 500,
              }}>
                <span>📍</span> {extras.location}
              </div>
            )}
          </div>
        )}

        {/* CTA Button — full width, brand color, neon shadow */}
        {cta && (
          <div style={{ marginBottom: hasFooter ? fs(8) : 0 }}>
            <CtaLink phone={phone}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: fs(6),
                width: '100%',
                background: primary, color: '#000',
                padding: `${fs(10)}px ${fs(16)}px`,
                borderRadius: fs(6),
                fontSize: fs(10), fontWeight: 900,
                letterSpacing: '0.08em', textTransform: 'uppercase' as const,
                boxShadow: `0 0 ${fs(20)}px rgba(${rgb},0.55), 0 4px 12px rgba(0,0,0,0.4)`,
              }}>
                {cta} →
              </div>
            </CtaLink>
          </div>
        )}

        {/* Footer row — phone / instagram */}
        {hasFooter && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: fs(8),
            padding: `${fs(5)}px 0`,
            borderTop: `1px solid rgba(255,255,255,0.08)`,
          }}>
            {phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: fs(4) }}>
                <span style={{ fontSize: fs(9) }}>📱</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: fs(7.5), fontFamily: 'Arial, sans-serif' }}>
                  {phone}
                </span>
              </div>
            )}
            {phone && extras?.instagram && (
              <div style={{ width: 1, height: fs(12), background: 'rgba(255,255,255,0.15)' }} />
            )}
            {extras?.instagram && (
              <div style={{ display: 'flex', alignItems: 'center', gap: fs(4) }}>
                <span style={{ fontSize: fs(9) }}>📷</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: fs(7.5), fontFamily: 'Arial, sans-serif' }}>
                  {extras.instagram}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Style router ─────────────────────────────────────────────────────────────

const STYLE_COMPONENTS: Record<CreativeStyle, React.ComponentType<StyleProps>> = {
  premium:     PremiumAd,
  minimalista: MinimalistaAd,
  tecnologico: TecnologicoAd,
  urbano:      UrbanoAd,
  elegante:    EleganteAd,
  comercial:   ComercialAd,
  deportivo:   DeportivoAd,
};

// ─── Platform chrome ──────────────────────────────────────────────────────────

function PlatformChrome({ format, business, size }: { format: CreativeFormat; business: string; size: 'thumb' | 'full' }) {
  const fs = (n: number) => size === 'thumb' ? Math.round(n * 0.65) : n;

  if (format === 'instagram_story' || format === 'whatsapp_status') {
    return (
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: `${fs(8)}px ${fs(12)}px`,
        display: 'flex', alignItems: 'center', gap: fs(8),
        background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 100%)',
        zIndex: 10,
      }}>
        <div style={{
          width: fs(28), height: fs(28), borderRadius: '50%',
          background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
          padding: 2, flexShrink: 0,
        }}>
          <div style={{
            width: '100%', height: '100%', borderRadius: '50%',
            background: '#111', border: '1.5px solid #111',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: fs(10), fontWeight: 800, color: '#fff',
          }}>
            {business[0]?.toUpperCase()}
          </div>
        </div>
        <div>
          <div style={{ color: '#fff', fontSize: fs(10), fontWeight: 700, lineHeight: 1 }}>{business}</div>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: fs(8) }}>tu historia</div>
        </div>
        <div style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.6)', fontSize: fs(16), lineHeight: 1 }}>···</div>
      </div>
    );
  }

  if (format === 'instagram_post') {
    return (
      <>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          padding: `${fs(8)}px ${fs(12)}px`,
          display: 'flex', alignItems: 'center', gap: fs(8),
          background: '#fff', zIndex: 10,
          borderBottom: '1px solid #efefef',
        }}>
          <div style={{
            width: fs(26), height: fs(26), borderRadius: '50%',
            background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366)',
            padding: 2, flexShrink: 0,
          }}>
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%', background: '#ccc',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: fs(9), fontWeight: 800, color: '#fff',
            }}>
              {business[0]?.toUpperCase()}
            </div>
          </div>
          <span style={{ fontSize: fs(10), fontWeight: 700, color: '#111', fontFamily: 'system-ui, sans-serif' }}>{business}</span>
          <span style={{ marginLeft: 'auto', fontSize: fs(18), color: '#111', lineHeight: 1 }}>···</span>
        </div>
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: `${fs(7)}px ${fs(12)}px`,
          background: '#fff', zIndex: 10,
          borderTop: '1px solid #efefef',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', gap: fs(14) }}>
            <span style={{ fontSize: fs(18) }}>♡</span>
            <span style={{ fontSize: fs(18) }}>💬</span>
            <span style={{ fontSize: fs(18) }}>↗</span>
          </div>
          <span style={{ fontSize: fs(18) }}>🔖</span>
        </div>
      </>
    );
  }

  if (format === 'facebook_ad') {
    return (
      <>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          padding: `${fs(8)}px ${fs(12)}px`,
          background: '#fff',
          display: 'flex', alignItems: 'center', gap: fs(8),
          zIndex: 10, borderBottom: '1px solid #e4e6ea',
        }}>
          <div style={{
            width: fs(32), height: fs(32), borderRadius: '50%',
            background: '#1877F2', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: fs(11), fontWeight: 800, color: '#fff',
          }}>
            {business[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: fs(10), fontWeight: 700, color: '#050505', fontFamily: 'system-ui, sans-serif', lineHeight: 1 }}>{business}</div>
            <div style={{ fontSize: fs(8), color: '#65676b', fontFamily: 'system-ui, sans-serif' }}>Patrocinado · 🌐</div>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: fs(16), color: '#65676b' }}>···</span>
        </div>
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: `${fs(6)}px ${fs(12)}px`,
          background: '#f0f2f5', zIndex: 10,
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          borderTop: '1px solid #e4e6ea',
        }}>
          {['👍 Me gusta', '💬 Comentar', '↗ Compartir'].map(a => (
            <div key={a} style={{
              fontSize: fs(9), color: '#65676b', fontWeight: 600,
              fontFamily: 'system-ui, sans-serif', padding: `${fs(4)}px ${fs(8)}px`,
            }}>
              {a}
            </div>
          ))}
        </div>
      </>
    );
  }

  return null;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function AdPreview({
  headline = '',
  copy = '',
  cta = '',
  phone = '',
  style,
  format,
  businessName = 'Mi Marca',
  logoUrl,
  primaryColor = '#10B981',
  secondaryColor = '#059669',
  size = 'thumb',
  noChrome = false,
  businessCategory,
  extras,
}: AdPreviewProps) {
  const StyleComponent = STYLE_COMPONENTS[style] ?? PremiumAd;

  const hasSocialChrome = !noChrome && ['instagram_post', 'instagram_story', 'facebook_ad'].includes(format);
  const isStory  = format === 'instagram_story' || format === 'whatsapp_status';
  const isBanner = format === 'banner';

  const fs = (base: number) => size === 'thumb'
    ? Math.max(7, Math.round(base * 0.72))
    : base;

  // Resolve smart defaults
  const category = detectCategory(businessName, businessCategory);
  const defaults = SMART_DEFAULTS[category] ?? SMART_DEFAULTS.generic;

  const resolvedHeadline = headline || defaults.headline;
  const resolvedCopy     = copy     || defaults.copy;
  const resolvedCta      = cta      || defaults.cta;

  const chromeTop = hasSocialChrome
    ? (size === 'thumb' ? 22 : 42)
    : 0;
  const chromeBottom = hasSocialChrome && format === 'instagram_post'
    ? (size === 'thumb' ? 20 : 38)
    : 0;

  return (
    <div style={{
      width: '100%',
      aspectRatio: ASPECT[format],
      position: 'relative',
      overflow: 'hidden',
      borderRadius: size === 'full' ? 12 : 8,
      flexShrink: 0,
    }}>
      {hasSocialChrome && (
        <PlatformChrome format={format} business={businessName} size={size} />
      )}

      <div style={{
        position: 'absolute',
        top: chromeTop, left: 0, right: 0, bottom: chromeBottom,
      }}>
        <StyleComponent
          headline={resolvedHeadline}
          copy={resolvedCopy}
          cta={resolvedCta}
          phone={phone}
          business={businessName}
          logoUrl={logoUrl}
          primary={primaryColor}
          secondary={secondaryColor}
          isStory={isStory}
          isBanner={isBanner}
          fs={fs}
          extras={extras}
        />
      </div>

      {/* Format label (thumb only) */}
      {size === 'thumb' && (
        <div style={{
          position: 'absolute', bottom: 6, right: 6,
          background: 'rgba(0,0,0,0.65)',
          color: '#fff', fontSize: 8, fontWeight: 600,
          padding: '2px 6px', borderRadius: 4,
          backdropFilter: 'blur(4px)',
          letterSpacing: '0.04em', zIndex: 5,
        }}>
          {PLATFORM_LABEL[format]}
        </div>
      )}
    </div>
  );
}
