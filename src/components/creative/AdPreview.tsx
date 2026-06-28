'use client';

/**
 * AdPreview — renders a styled HTML/CSS ad mockup.
 * Designed to look like a real flyer/ad creative.
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
  // Brand Kit
  businessName?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  // Render mode
  size?: 'thumb' | 'full';
  /** When true, platform chrome (Instagram header etc.) is hidden — used for export */
  noChrome?: boolean;
}

// ─── Aspect ratios per format ─────────────────────────────────────────────────

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
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function darken(hex: string, amount: number): string {
  const h = hex.replace('#', '');
  const r = Math.max(0, parseInt(h.substring(0, 2), 16) - amount);
  const g = Math.max(0, parseInt(h.substring(2, 4), 16) - amount);
  const b = Math.max(0, parseInt(h.substring(4, 6), 16) - amount);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

function formatWaMe(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : '';
}

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

// ─── CTA wrapper — wraps in wa.me link when phone is set ──────────────────────

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
}

// ─── PREMIUM ──────────────────────────────────────────────────────────────────

function PremiumAd({ headline, copy, cta, phone, business, logoUrl, primary, secondary, isStory, isBanner, fs }: StyleProps) {
  const rgb = hexToRgb(primary);
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(150deg, #0c0c0e 0%, #111113 60%, #0a0a0c 100%)',
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Background glows */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', right: '-10%', top: '-10%',
          width: '55%', paddingBottom: '55%', borderRadius: '50%',
          background: `radial-gradient(circle, rgba(${rgb},0.18) 0%, transparent 70%)`,
          filter: 'blur(30px)',
        }} />
        <div style={{
          position: 'absolute', left: '-15%', bottom: '5%',
          width: '45%', paddingBottom: '45%', borderRadius: '50%',
          background: `radial-gradient(circle, rgba(${rgb},0.08) 0%, transparent 70%)`,
          filter: 'blur(24px)',
        }} />
        {/* Geometric ring */}
        <div style={{
          position: 'absolute', right: '5%', top: '8%',
          width: isBanner ? '12%' : '28%', paddingBottom: isBanner ? '12%' : '28%',
          borderRadius: '50%',
          border: `1px solid rgba(${rgb},0.2)`,
        }} />
        <div style={{
          position: 'absolute', right: '12%', top: '16%',
          width: isBanner ? '7%' : '16%', paddingBottom: isBanner ? '7%' : '16%',
          borderRadius: '50%',
          border: `1px solid rgba(${rgb},0.12)`,
        }} />
      </div>

      {/* Gold top line */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${primary}, ${secondary}, transparent)`, flexShrink: 0 }} />

      {/* Content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: isBanner ? `${fs(12)}px ${fs(20)}px` : `${fs(18)}px ${fs(20)}px ${fs(16)}px`,
        position: 'relative',
        justifyContent: isBanner ? 'center' : 'space-between',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: fs(8), marginBottom: isBanner ? 0 : fs(12) }}>
          <LogoBadge businessName={business} logoUrl={logoUrl} bg={primary} size={fs(26)} radius={fs(6)} />
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: fs(9), fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {business}
          </span>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Accent line */}
          <div style={{ width: fs(28), height: 2, background: primary, borderRadius: 1, marginBottom: fs(10) }} />

          {headline && (
            <div style={{
              color: '#FFFFFF',
              fontSize: fs(isBanner ? 20 : 26),
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: '-0.02em',
              marginBottom: copy ? fs(10) : 0,
            }}>
              {headline}
            </div>
          )}

          {copy && !isBanner && (
            <div style={{
              color: 'rgba(255,255,255,0.42)',
              fontSize: fs(11),
              lineHeight: 1.6,
              marginBottom: fs(4),
            }}>
              {copy}
            </div>
          )}
        </div>

        {/* CTA */}
        {cta && (
          <div style={{ marginTop: fs(14), display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: fs(8) }}>
            <CtaLink phone={phone}>
              <div style={{
                background: `linear-gradient(135deg, ${primary}, ${secondary})`,
                color: '#000',
                padding: `${fs(8)}px ${fs(20)}px`,
                borderRadius: fs(40),
                fontSize: fs(10),
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase' as const,
                whiteSpace: 'nowrap',
              }}>
                {cta}
              </div>
            </CtaLink>
            {!isBanner && (
              <div style={{
                width: fs(32), height: fs(32), borderRadius: '50%',
                border: `1px solid rgba(${rgb},0.2)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: `rgba(${rgb},0.6)`, fontSize: fs(14), flexShrink: 0,
              }}>
                →
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MINIMALISTA ──────────────────────────────────────────────────────────────

function MinimalistaAd({ headline, copy, cta, phone, business, logoUrl, primary, isStory, isBanner, fs }: StyleProps) {
  const rgb = hexToRgb(primary);
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: '#FFFFFF',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Background tint */}
      <div style={{
        position: 'absolute', right: 0, bottom: 0,
        width: '60%', paddingBottom: '60%',
        background: `radial-gradient(circle at bottom right, rgba(${rgb},0.06) 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Left accent bar */}
      {!isBanner && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: 4, background: `linear-gradient(180deg, ${primary}, rgba(${rgb},0.2))`,
          borderRadius: '0 2px 2px 0',
        }} />
      )}

      {/* Content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: isBanner ? `${fs(12)}px ${fs(24)}px` : `${fs(22)}px ${fs(22)}px ${fs(18)}px ${isBanner ? fs(22) : fs(22)}px`,
        justifyContent: isBanner ? 'center' : 'space-between',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: fs(8), marginBottom: isBanner ? 0 : fs(16) }}>
          <LogoBadge businessName={business} logoUrl={logoUrl} bg={primary} color="#fff" size={fs(24)} radius={fs(6)} />
          <span style={{ color: '#999', fontSize: fs(8), fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {business}
          </span>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ width: fs(20), height: 2, background: primary, marginBottom: fs(12), borderRadius: 1 }} />

          {headline && (
            <div style={{
              color: '#0F172A',
              fontSize: fs(isBanner ? 18 : 24),
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              marginBottom: copy ? fs(10) : 0,
            }}>
              {headline}
            </div>
          )}

          {copy && !isBanner && (
            <div style={{
              color: '#94A3B8',
              fontSize: fs(11),
              lineHeight: 1.65,
              marginBottom: fs(4),
            }}>
              {copy}
            </div>
          )}
        </div>

        {/* CTA */}
        {cta && (
          <div style={{ marginTop: fs(16) }}>
            <CtaLink phone={phone}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: fs(6),
                color: primary,
                fontSize: fs(10),
                fontWeight: 700,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
                paddingBottom: 2,
                borderBottom: `2px solid ${primary}`,
              }}>
                {cta}
                <span style={{ fontSize: fs(13) }}>→</span>
              </div>
            </CtaLink>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TECNOLÓGICO ──────────────────────────────────────────────────────────────

function TecnologicoAd({ headline, copy, cta, phone, business, logoUrl, primary, isStory, isBanner, fs }: StyleProps) {
  const rgb = hexToRgb(primary);
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: '#030712',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Grid bg */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(${rgb},0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(${rgb},0.05) 1px, transparent 1px)`,
        backgroundSize: `${fs(20)}px ${fs(20)}px`,
      }} />

      {/* Glow */}
      <div style={{
        position: 'absolute',
        left: isBanner ? '75%' : '50%', top: isStory ? '20%' : '30%',
        transform: 'translate(-50%, -50%)',
        width: isBanner ? '25%' : '65%', paddingBottom: isBanner ? '25%' : '65%',
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(${rgb},0.18) 0%, transparent 65%)`,
        filter: 'blur(24px)', pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: isBanner ? `${fs(10)}px ${fs(20)}px` : `${fs(16)}px ${fs(18)}px ${fs(16)}px`,
        position: 'relative',
        justifyContent: isBanner ? 'center' : 'space-between',
      }}>
        {/* Brand top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: fs(8),
          paddingBottom: isBanner ? 0 : fs(10),
          borderBottom: isBanner ? 'none' : `1px solid rgba(${rgb},0.18)`,
          marginBottom: isBanner ? 0 : fs(12),
        }}>
          <div style={{
            width: fs(8), height: fs(8), borderRadius: '50%',
            background: primary, boxShadow: `0 0 ${fs(8)}px ${primary}`,
            flexShrink: 0,
          }} />
          <span style={{ color: `rgba(${rgb},0.7)`, fontSize: fs(8), letterSpacing: '0.15em' }}>
            {business.toUpperCase()}
          </span>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {headline && (
            <div style={{
              color: '#fff',
              fontSize: fs(isBanner ? 18 : 24),
              fontWeight: 700,
              lineHeight: 1.15,
              marginBottom: copy ? fs(10) : 0,
              textShadow: `0 0 ${fs(20)}px rgba(${rgb},0.5)`,
              letterSpacing: '-0.01em',
            }}>
              {headline}
            </div>
          )}

          {copy && !isBanner && (
            <div style={{
              color: `rgba(${rgb},0.5)`,
              fontSize: fs(10),
              lineHeight: 1.65,
              marginBottom: fs(4),
            }}>
              {copy}
            </div>
          )}
        </div>

        {/* CTA */}
        {cta && (
          <div style={{ marginTop: fs(14) }}>
            <CtaLink phone={phone}>
              <div style={{
                display: 'inline-block',
                border: `1px solid ${primary}`,
                color: primary,
                padding: `${fs(6)}px ${fs(16)}px`,
                borderRadius: fs(4),
                fontSize: fs(9),
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
                boxShadow: `0 0 ${fs(12)}px rgba(${rgb},0.25), inset 0 0 ${fs(12)}px rgba(${rgb},0.04)`,
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

// ─── URBANO ───────────────────────────────────────────────────────────────────

function UrbanoAd({ headline, copy, cta, phone, business, logoUrl, primary, secondary, isStory, isBanner, fs }: StyleProps) {
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: `linear-gradient(145deg, ${primary} 0%, ${darken(primary, 30)} 100%)`,
      fontFamily: "'Arial Black', 'Franklin Gothic Heavy', 'Impact', sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Diagonal cut */}
      <div style={{
        position: 'absolute',
        right: isBanner ? '35%' : '-5%', bottom: isBanner ? '-100%' : '-15%',
        width: isBanner ? '20%' : '60%',
        paddingBottom: isBanner ? '200%' : '120%',
        background: 'rgba(0,0,0,0.2)',
        transform: 'rotate(-12deg)',
        transformOrigin: 'bottom right',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        right: isBanner ? '40%' : '5%', bottom: isBanner ? '-100%' : '-10%',
        width: isBanner ? '15%' : '40%',
        paddingBottom: isBanner ? '200%' : '80%',
        background: 'rgba(0,0,0,0.1)',
        transform: 'rotate(-12deg)',
        transformOrigin: 'bottom right',
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: isBanner ? `${fs(10)}px ${fs(20)}px` : `${fs(18)}px ${fs(18)}px ${fs(16)}px`,
        position: 'relative',
        justifyContent: isBanner ? 'center' : 'space-between',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: fs(8), marginBottom: isBanner ? 0 : fs(10) }}>
          <LogoBadge businessName={business} logoUrl={logoUrl} bg="rgba(255,255,255,0.2)" color="#fff" size={fs(24)} radius={fs(6)} />
          <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: fs(8), fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            {business}
          </span>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {headline && (
            <div style={{
              color: '#fff',
              fontSize: fs(isBanner ? 22 : 30),
              fontWeight: 900,
              lineHeight: 1.0,
              textTransform: 'uppercase' as const,
              letterSpacing: '-0.01em',
              textShadow: '2px 3px 0 rgba(0,0,0,0.25)',
              marginBottom: copy ? fs(10) : 0,
            }}>
              {headline}
            </div>
          )}

          {copy && !isBanner && (
            <div style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: fs(11),
              lineHeight: 1.55,
              fontFamily: 'Arial, sans-serif',
              fontWeight: 400,
              marginBottom: fs(4),
            }}>
              {copy}
            </div>
          )}
        </div>

        {/* CTA */}
        {cta && (
          <div style={{ marginTop: fs(14) }}>
            <CtaLink phone={phone}>
              <div style={{
                display: 'inline-block',
                background: '#fff',
                color: primary,
                padding: `${fs(9)}px ${fs(22)}px`,
                borderRadius: fs(40),
                fontSize: fs(10),
                fontWeight: 900,
                letterSpacing: '0.04em',
                textTransform: 'uppercase' as const,
                whiteSpace: 'nowrap',
              }}>
                {cta}
              </div>
            </CtaLink>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ELEGANTE ─────────────────────────────────────────────────────────────────

function EleganteAd({ headline, copy, cta, phone, business, logoUrl, primary, isStory, isBanner, fs }: StyleProps) {
  const rgb = hexToRgb(primary);
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
        width: isBanner ? '15%' : '35%', paddingBottom: isBanner ? '15%' : '35%',
        borderRadius: '0 0 0 100%',
        background: `rgba(${rgb},0.05)`,
        border: `1px solid rgba(${rgb},0.1)`,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0,
        width: isBanner ? '10%' : '20%', paddingBottom: isBanner ? '10%' : '20%',
        borderRadius: '0 100% 0 0',
        background: `rgba(${rgb},0.04)`,
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        padding: isBanner ? `${fs(10)}px ${fs(24)}px` : `${fs(20)}px ${fs(18)}px`,
        position: 'relative',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: fs(7), marginBottom: fs(14) }}>
          <LogoBadge businessName={business} logoUrl={logoUrl} bg={primary} color="#fff" size={fs(22)} radius={fs(5)} />
          <span style={{ color: '#B8A99A', fontSize: fs(8), letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>
            {business}
          </span>
        </div>

        {/* Ornament top */}
        <div style={{ display: 'flex', alignItems: 'center', gap: fs(8), width: isBanner ? '35%' : '65%', marginBottom: fs(16) }}>
          <div style={{ flex: 1, height: 1, background: `rgba(${rgb},0.25)` }} />
          <div style={{ width: fs(5), height: fs(5), borderRadius: '50%', background: primary, transform: 'rotate(45deg)' }} />
          <div style={{ flex: 1, height: 1, background: `rgba(${rgb},0.25)` }} />
        </div>

        {headline && (
          <div style={{
            color: '#1C1008',
            fontSize: fs(isBanner ? 16 : 22),
            fontWeight: 700,
            fontStyle: 'italic',
            lineHeight: 1.25,
            letterSpacing: '0.01em',
            marginBottom: copy ? fs(10) : 0,
          }}>
            {headline}
          </div>
        )}

        {copy && !isBanner && (
          <div style={{
            color: '#A08070',
            fontSize: fs(10),
            lineHeight: 1.75,
            marginBottom: fs(4),
            maxWidth: '88%',
          }}>
            {copy}
          </div>
        )}

        {/* Ornament bottom */}
        {!isBanner && (
          <div style={{ display: 'flex', alignItems: 'center', gap: fs(8), width: '40%', margin: `${fs(14)}px 0 ${fs(10)}px` }}>
            <div style={{ flex: 1, height: 1, background: `rgba(${rgb},0.18)` }} />
          </div>
        )}

        {/* CTA */}
        {cta && (
          <CtaLink phone={phone}>
            <div style={{
              display: 'inline-block',
              border: `1px solid rgba(${rgb},0.5)`,
              color: primary,
              padding: `${fs(7)}px ${fs(22)}px`,
              borderRadius: fs(24),
              fontSize: fs(9),
              fontWeight: 400,
              fontStyle: 'italic',
              letterSpacing: '0.1em',
            }}>
              {cta}
            </div>
          </CtaLink>
        )}
      </div>
    </div>
  );
}

// ─── COMERCIAL ────────────────────────────────────────────────────────────────

function ComercialAd({ headline, copy, cta, phone, business, logoUrl, primary, secondary, isStory, isBanner, fs }: StyleProps) {
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: `linear-gradient(140deg, ${primary} 0%, ${darken(primary, 20)} 50%, ${secondary} 100%)`,
      fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Burst circles */}
      <div style={{
        position: 'absolute', right: isBanner ? '15%' : '-8%', top: isBanner ? '-60%' : '-12%',
        width: isBanner ? '20%' : '55%', paddingBottom: isBanner ? '20%' : '55%',
        borderRadius: '50%', background: 'rgba(255,255,255,0.12)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', right: isBanner ? '17%' : '-3%', top: isBanner ? '-45%' : '-6%',
        width: isBanner ? '14%' : '38%', paddingBottom: isBanner ? '14%' : '38%',
        borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none',
      }} />

      {/* Offer badge */}
      <div style={{
        position: 'absolute',
        top: isBanner ? fs(10) : fs(12),
        right: isBanner ? undefined : fs(14),
        left: isBanner ? fs(14) : undefined,
        background: '#FFDD00',
        color: '#000',
        padding: `${fs(3)}px ${fs(10)}px`,
        borderRadius: fs(20),
        fontSize: fs(7.5),
        fontWeight: 900,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        zIndex: 2,
      }}>
        ¡Oferta!
      </div>

      {/* Content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: isBanner ? `${fs(10)}px ${fs(20)}px ${fs(10)}px ${fs(100)}px` : `${fs(44)}px ${fs(18)}px ${fs(16)}px`,
        position: 'relative',
        justifyContent: isBanner ? 'center' : 'space-between',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: fs(7), marginBottom: isBanner ? 0 : fs(10) }}>
          <LogoBadge businessName={business} logoUrl={logoUrl} bg="rgba(255,255,255,0.25)" color="#fff" size={fs(22)} radius={fs(5)} />
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: fs(8), fontWeight: 700, letterSpacing: '0.06em' }}>
            {business}
          </span>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {headline && (
            <div style={{
              color: '#fff',
              fontSize: fs(isBanner ? 20 : 28),
              fontWeight: 900,
              lineHeight: 1.05,
              textShadow: '1px 2px 4px rgba(0,0,0,0.2)',
              marginBottom: copy ? fs(10) : 0,
            }}>
              {headline}
            </div>
          )}

          {copy && !isBanner && (
            <div style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: fs(11),
              lineHeight: 1.55,
              marginBottom: fs(4),
            }}>
              {copy}
            </div>
          )}
        </div>

        {/* CTA */}
        {cta && (
          <div style={{ marginTop: fs(14) }}>
            <CtaLink phone={phone}>
              <div style={{
                display: 'inline-block',
                background: '#FFDD00',
                color: '#000',
                padding: `${fs(9)}px ${fs(22)}px`,
                borderRadius: fs(40),
                fontSize: fs(10),
                fontWeight: 900,
                letterSpacing: '0.04em',
                textTransform: 'uppercase' as const,
                whiteSpace: 'nowrap',
              }}>
                {cta}
              </div>
            </CtaLink>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DEPORTIVO ────────────────────────────────────────────────────────────────

function DeportivoAd({ headline, copy, cta, phone, business, logoUrl, primary, secondary, isStory, isBanner, fs }: StyleProps) {
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: '#080808',
      fontFamily: "'Arial Black', 'Franklin Gothic Heavy', 'Impact', sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Dynamic diagonal stripe */}
      <div style={{
        position: 'absolute',
        left: isBanner ? '-5%' : '-25%', top: isBanner ? 0 : '25%',
        width: isBanner ? '30%' : '160%',
        height: isBanner ? '100%' : '60%',
        background: `linear-gradient(90deg, ${primary} 0%, ${secondary} 100%)`,
        transform: isBanner ? 'skewX(-8deg)' : 'rotate(-10deg)',
        opacity: 0.92,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        left: isBanner ? '22%' : '-20%', top: isBanner ? 0 : '27%',
        width: isBanner ? '5%' : '160%',
        height: isBanner ? '100%' : '50%',
        background: `rgba(255,255,255,0.08)`,
        transform: isBanner ? 'skewX(-8deg)' : 'rotate(-10deg)',
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: isBanner ? `${fs(10)}px ${fs(10)}px ${fs(10)}px ${fs(36)}px` : `${fs(16)}px ${fs(18)}px ${fs(16)}px`,
        position: 'relative',
        justifyContent: isBanner ? 'center' : 'space-between',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: fs(7), marginBottom: isBanner ? 0 : fs(10) }}>
          <LogoBadge businessName={business} logoUrl={logoUrl} bg={primary} color="#000" size={fs(24)} radius={fs(5)} />
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: fs(8), fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            {business}
          </span>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {headline && (
            <div style={{
              color: '#fff',
              fontSize: fs(isBanner ? 22 : 30),
              fontWeight: 900,
              lineHeight: 0.98,
              textTransform: 'uppercase' as const,
              letterSpacing: '-0.01em',
              textShadow: `2px 3px 0 ${darken(primary, 40)}, 4px 6px 0 rgba(0,0,0,0.3)`,
              marginBottom: copy ? fs(10) : 0,
            }}>
              {headline}
            </div>
          )}

          {copy && !isBanner && (
            <div style={{
              color: 'rgba(255,255,255,0.45)',
              fontSize: fs(11),
              lineHeight: 1.55,
              fontFamily: 'Arial, sans-serif',
              fontWeight: 400,
              marginBottom: fs(4),
            }}>
              {copy}
            </div>
          )}
        </div>

        {/* CTA */}
        {cta && (
          <div style={{ marginTop: fs(14) }}>
            <CtaLink phone={phone}>
              <div style={{
                display: 'inline-block',
                background: primary,
                color: '#000',
                padding: `${fs(9)}px ${fs(22)}px`,
                borderRadius: fs(4),
                fontSize: fs(10),
                fontWeight: 900,
                letterSpacing: '0.1em',
                textTransform: 'uppercase' as const,
                whiteSpace: 'nowrap',
              }}>
                {cta}
              </div>
            </CtaLink>
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
}: AdPreviewProps) {
  const StyleComponent = STYLE_COMPONENTS[style] ?? PremiumAd;

  const hasSocialChrome = !noChrome && ['instagram_post', 'instagram_story', 'facebook_ad'].includes(format);
  const isStory = format === 'instagram_story' || format === 'whatsapp_status';
  const isBanner = format === 'banner';

  const fs = (base: number) => size === 'thumb'
    ? Math.max(7, Math.round(base * 0.72))
    : base;

  // Padding to compensate for social chrome bars
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
          headline={headline || (size === 'thumb' ? 'Tu titular aquí' : '')}
          copy={copy || (size === 'thumb' ? 'Descripción breve de tu anuncio.' : '')}
          cta={cta || (size === 'thumb' ? 'Ver más' : '')}
          phone={phone}
          business={businessName}
          logoUrl={logoUrl}
          primary={primaryColor}
          secondary={secondaryColor}
          isStory={isStory}
          isBanner={isBanner}
          fs={fs}
        />
      </div>

      {/* Format label (thumb only) */}
      {size === 'thumb' && (
        <div style={{
          position: 'absolute', bottom: 6, right: 6,
          background: 'rgba(0,0,0,0.6)',
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
