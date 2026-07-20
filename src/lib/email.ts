/**
 * email.ts
 * Resend client singleton + helper para enviar emails de notificación.
 * Solo envía si el evento está habilitado en las preferencias del workspace.
 */

import { Resend } from 'resend';
import { prisma } from './db';

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

// Mapping de nombre de evento → clave en notifEvents
const EVENT_KEY_MAP: Record<string, string> = {
  billing_welcome:        'billing',
  billing_trial_ending:   'billing',
  billing_payment_failed: 'billing',
  billing_cancelled:      'billing',
  analysis_done:          'analysis_done',
  variation:              'variation',
};

/**
 * Comprueba si el workspace tiene habilitado el canal email y el evento dado.
 */
async function shouldSendEmail(workspaceId: string, eventType: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;

  try {
    const ws = await prisma.workspace.findUnique({
      where:  { id: workspaceId },
      select: { notifChannels: true, notifEvents: true },
    });

    // Si no hay prefs guardadas, enviar por defecto
    if (!ws) return true;

    const channels = ws.notifChannels as Record<string, boolean> | null;
    const events   = ws.notifEvents   as Record<string, boolean> | null;

    // Comprobar canal email (default: true si no está configurado)
    if (channels && channels['email'] === false) return false;

    // Comprobar evento específico
    const eventKey = EVENT_KEY_MAP[eventType];
    if (events && eventKey && events[eventKey] === false) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Obtiene el email del owner del workspace.
 */
async function getWorkspaceOwnerEmail(workspaceId: string): Promise<string | null> {
  try {
    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId, role: 'owner' },
      include: { user: { select: { email: true } } },
    });
    return member?.user?.email ?? null;
  } catch {
    return null;
  }
}

interface EmailTemplate {
  subject: string;
  html: string;
}

/**
 * Envía un email de notificación al owner del workspace.
 * Silencia errores para no bloquear la respuesta principal.
 */
export async function sendWorkspaceEmail(
  workspaceId: string,
  eventType: string,
  template: EmailTemplate,
): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  try {
    const [enabled, toEmail] = await Promise.all([
      shouldSendEmail(workspaceId, eventType),
      getWorkspaceOwnerEmail(workspaceId),
    ]);

    if (!enabled || !toEmail) return;

    await getResend().emails.send({
      from:    'AdMind AI <notificaciones@admind.ai>',
      to:      toEmail,
      subject: template.subject,
      html:    template.html,
    });
  } catch (err) {
    // Silent — emails never block the main flow
    console.error(`[email] Failed to send "${eventType}":`, err);
  }
}
