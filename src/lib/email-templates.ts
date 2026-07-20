/**
 * email-templates.ts
 * Plantillas HTML para los emails de AdMind AI.
 * Diseño minimalista y compatible con clientes de email.
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ai-adgenius.vercel.app';

// ─── Layout base ──────────────────────────────────────────────────────────────

function layout(content: string, preheader = ''): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AdMind AI</title>
</head>
<body style="margin:0;padding:0;background:#0B0B0F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0B0F;min-height:100vh;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Header -->
        <tr><td style="padding-bottom:28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="font-size:18px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                  AdMind <span style="color:#10B981;">AI</span>
                </span>
              </td>
              <td align="right">
                <span style="font-size:10px;color:#52525b;letter-spacing:1px;text-transform:uppercase;">Dashboard</span>
              </td>
            </tr>
          </table>
          <div style="height:1px;background:rgba(255,255,255,0.06);margin-top:16px;"></div>
        </td></tr>

        <!-- Content -->
        <tr><td style="background:#111827;border-radius:16px;border:1px solid rgba(255,255,255,0.08);padding:32px;">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#3f3f46;">
            AdMind AI · Powered by Claude &amp; GPT-4o<br/>
            <a href="${BASE_URL}/settings?tab=notifications" style="color:#10B981;text-decoration:none;">
              Gestionar preferencias de notificación
            </a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:linear-gradient(135deg,#10B981,#059669);color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;border-radius:10px;">${text}</a>`;
}

function badge(text: string, color = '#10B981'): string {
  return `<span style="display:inline-block;padding:3px 10px;background:${color}20;border:1px solid ${color}40;border-radius:999px;font-size:10px;font-weight:700;color:${color};letter-spacing:0.5px;">${text}</span>`;
}

function metricRow(label: string, value: string, color = '#10B981'): string {
  return `
  <tr>
    <td style="padding:8px 0;font-size:11px;color:#71717a;">${label}</td>
    <td style="padding:8px 0;font-size:13px;font-weight:700;color:${color};text-align:right;">${value}</td>
  </tr>`;
}

// ─── Templates ────────────────────────────────────────────────────────────────

export function billingWelcome(planName: string): { subject: string; html: string } {
  return {
    subject: `¡Bienvenido a AdMind AI ${planName}! 🎉`,
    html: layout(`
      <div style="text-align:center;margin-bottom:28px;">
        <div style="width:56px;height:56px;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.25);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
          <span style="font-size:24px;">🎉</span>
        </div>
        <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;">¡Plan activado!</h1>
        <p style="margin:8px 0 0;font-size:13px;color:#71717a;">Tu suscripción al plan <strong style="color:#10B981;">${planName}</strong> está activa.</p>
      </div>

      <div style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.15);border-radius:12px;padding:20px;margin-bottom:20px;">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#52525b;text-transform:uppercase;letter-spacing:1px;">Lo que tienes disponible</p>
        <table width="100%">
          ${planName === 'Starter' ? metricRow('Análisis de IA', 'Básico') : ''}
          ${['Pro','Performance','Agency','Enterprise'].includes(planName) ? metricRow('Análisis de IA', 'Ilimitado ✓', '#10B981') : ''}
          ${['Pro','Performance','Agency','Enterprise'].includes(planName) ? metricRow('Variaciones A/B', 'Activadas ✓', '#10B981') : ''}
          ${['Performance','Agency','Enterprise'].includes(planName) ? metricRow('Meta & Google Ads', 'Conectados ✓', '#10B981') : ''}
          ${['Agency','Enterprise'].includes(planName) ? metricRow('Múltiples clientes', 'Activado ✓', '#10B981') : ''}
        </table>
      </div>

      <p style="margin:0;font-size:13px;color:#a1a1aa;">
        Tu período de prueba de 7 días ha comenzado. Si tienes alguna pregunta, responde este email y te ayudamos.
      </p>
      ${btn('Ir al Dashboard', `${BASE_URL}/`)}
    `, `Tu plan ${planName} está activo — empieza a optimizar tus anuncios`),
  };
}

export function billingTrialEnding(planName: string, daysLeft: number): { subject: string; html: string } {
  return {
    subject: `Tu prueba de AdMind AI vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`,
    html: layout(`
      <div style="text-align:center;margin-bottom:28px;">
        <div style="width:56px;height:56px;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.25);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
          <span style="font-size:24px;">⏰</span>
        </div>
        <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;">Tu prueba vence pronto</h1>
        <p style="margin:8px 0 0;font-size:13px;color:#71717a;">
          Te quedan <strong style="color:#FBBF24;">${daysLeft} día${daysLeft !== 1 ? 's' : ''}</strong> en tu prueba gratuita del plan <strong>${planName}</strong>.
        </p>
      </div>

      <div style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.15);border-radius:12px;padding:20px;margin-bottom:20px;">
        <p style="margin:0;font-size:13px;color:#a1a1aa;">
          Cuando venza el período de prueba, tu cuenta pasará automáticamente al plan gratuito.
          Para mantener acceso completo, confirma tu método de pago.
        </p>
      </div>
      ${btn('Confirmar suscripción', `${BASE_URL}/settings?tab=billing`)}
    `, `Te quedan ${daysLeft} días de prueba — confirma tu plan`),
  };
}

export function billingPaymentFailed(planName: string): { subject: string; html: string } {
  return {
    subject: 'Problema con el pago de tu suscripción AdMind AI',
    html: layout(`
      <div style="text-align:center;margin-bottom:28px;">
        <div style="width:56px;height:56px;background:rgba(248,113,113,0.12);border:1px solid rgba(248,113,113,0.25);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
          <span style="font-size:24px;">⚠️</span>
        </div>
        <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;">Pago fallido</h1>
        <p style="margin:8px 0 0;font-size:13px;color:#71717a;">
          No pudimos procesar el pago de tu plan <strong>${planName}</strong>.
        </p>
      </div>

      <div style="background:rgba(248,113,113,0.06);border:1px solid rgba(248,113,113,0.15);border-radius:12px;padding:20px;margin-bottom:20px;">
        <p style="margin:0;font-size:13px;color:#a1a1aa;">
          Reintentaremos el cobro en los próximos días. Para evitar la interrupción del servicio, actualiza tu método de pago.
        </p>
      </div>
      ${btn('Actualizar método de pago', `${BASE_URL}/settings?tab=billing`)}
    `, 'No pudimos procesar tu pago — actualiza tu método de pago'),
  };
}

export function billingCancelled(planName: string): { subject: string; html: string } {
  return {
    subject: 'Tu suscripción de AdMind AI fue cancelada',
    html: layout(`
      <div style="text-align:center;margin-bottom:28px;">
        <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;">Suscripción cancelada</h1>
        <p style="margin:8px 0 0;font-size:13px;color:#71717a;">
          Tu plan <strong>${planName}</strong> fue cancelado. Mantendrás el acceso hasta el fin del período actual.
        </p>
      </div>

      <p style="margin:0;font-size:13px;color:#a1a1aa;">
        Lamentamos verte ir. Si cambias de opinión o hubo algún problema, responde este email y te ayudamos.
      </p>
      ${btn('Reactivar suscripción', `${BASE_URL}/settings?tab=billing`)}
    `, `Tu plan ${planName} fue cancelado`),
  };
}

export function analysisDone(adName: string, score: number, adId: string): { subject: string; html: string } {
  const scoreColor = score >= 80 ? '#10B981' : score >= 60 ? '#FBBF24' : '#F87171';
  const scoreLabel = score >= 80 ? 'Excelente' : score >= 60 ? 'Bueno' : 'Necesita mejoras';

  return {
    subject: `Análisis listo: "${adName}" — Score ${score}/100`,
    html: layout(`
      <div style="margin-bottom:24px;">
        ${badge('Análisis completado', '#818CF8')}
        <h1 style="margin:12px 0 4px;font-size:20px;font-weight:800;color:#ffffff;">Tu análisis de IA está listo</h1>
        <p style="margin:0;font-size:13px;color:#71717a;">Ad analizado: <strong style="color:#e4e4e7;">"${adName}"</strong></p>
      </div>

      <div style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.15);border-radius:12px;padding:20px;margin-bottom:20px;text-align:center;">
        <p style="margin:0 0 4px;font-size:11px;color:#52525b;text-transform:uppercase;letter-spacing:1px;">Score general</p>
        <p style="margin:0;font-size:48px;font-weight:900;color:${scoreColor};line-height:1;">${score}</p>
        <p style="margin:4px 0 0;font-size:12px;font-weight:600;color:${scoreColor};">${scoreLabel}</p>
      </div>

      <p style="margin:0;font-size:13px;color:#a1a1aa;">
        Abre el dashboard para ver el desglose completo: puntuación de copy, visual, audiencia, fortalezas, debilidades y recomendaciones accionables.
      </p>
      ${btn('Ver análisis completo', `${BASE_URL}/ads/${adId}`)}
    `, `Score ${score}/100 para "${adName}" — ver desglose completo`),
  };
}

export function variationSaved(adName: string, count: number, adId: string): { subject: string; html: string } {
  return {
    subject: `${count} variación${count !== 1 ? 'es' : ''} generada${count !== 1 ? 's' : ''} para "${adName}"`,
    html: layout(`
      <div style="margin-bottom:24px;">
        ${badge('Variaciones listas', '#22D3EE')}
        <h1 style="margin:12px 0 4px;font-size:20px;font-weight:800;color:#ffffff;">
          ${count} variación${count !== 1 ? 'es' : ''} lista${count !== 1 ? 's' : ''} para testear
        </h1>
        <p style="margin:0;font-size:13px;color:#71717a;">
          Ad original: <strong style="color:#e4e4e7;">"${adName}"</strong>
        </p>
      </div>

      <div style="background:rgba(34,211,238,0.06);border:1px solid rgba(34,211,238,0.15);border-radius:12px;padding:20px;margin-bottom:20px;">
        <p style="margin:0;font-size:13px;color:#a1a1aa;">
          Las variaciones están listas para revisión. Márcalas como <strong style="color:#22D3EE;">Approved</strong> para iniciar los tests A/B o compáralas con el original.
        </p>
      </div>
      ${btn('Ver variaciones', `${BASE_URL}/ads/${adId}`)}
    `, `${count} variaciones listas para "${adName}"`),
  };
}
