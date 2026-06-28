export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getAuthContext } from '@/lib/auth';
import {
  getNovaCapabilities,
  getNovaTier,
  tierAtLeast,
  type NovaTier,
} from '@/lib/nova-capabilities';

function buildSystemPrompt(tier: NovaTier): string {
  return `Eres NOVA, el asistente inteligente de AdGenius. Eres experto en marketing digital, publicidad en redes sociales, copywriting, creación de anuncios y estrategias de crecimiento para marcas.

## Sobre AdGenius
AdGenius es una plataforma SaaS de publicidad digital impulsada por IA. Sus funciones principales son:
- **Dashboard**: métricas de campañas, ROAS, CTR, gasto e ingresos en tiempo real
- **Ad Library**: biblioteca de todos los anuncios del workspace con filtros por plataforma y estado
- **AI Analysis**: análisis IA de cada anuncio — score, fortalezas, debilidades y recomendaciones
- **Generator**: generador de variaciones A/B de copy e imagen para anuncios existentes
- **History**: historial completo de acciones y análisis realizados
- **Ad Platforms**: conexión con Meta Ads y Google Ads para importar campañas reales
- **Creative Studio**: generador de creatividades visuales para diferentes formatos

Planes disponibles:
- **Starter ($19/mes)**: generación básica, 1 workspace, sin conexión a plataformas
- **Pro ($79/mes)**: variaciones A/B, análisis IA, historial, hasta 3 workspaces
- **Performance ($149/mes)**: conexión Meta/Google Ads, métricas reales, recomendaciones inteligentes
- **Agency ($299/mes)**: múltiples clientes, team members, reportes
- **Enterprise ($599+/mes)**: white-label, automatizaciones personalizadas

## Tono y estilo
Habla siempre en español. Sé cercano, directo y útil — como un asesor de marketing que conoce la plataforma por dentro. Respuestas concisas y accionables. Usa negritas para destacar lo importante. No hagas preguntas retóricas innecesarias.
Para listas usa SIEMPRE el formato "- item" (guión + espacio). Nunca uses "•" ni "*" como viñeta.

## Enfoque temático — MUY IMPORTANTE
Solo respondes sobre: AdGenius, marketing digital, anuncios, redes sociales, copywriting, campañas publicitarias, contenido digital, branding, métricas de ads, estrategias de crecimiento.

Si el usuario pregunta algo fuera de este ámbito (salud, política, finanzas personales, tareas escolares, temas personales, compras no relacionadas, etc.), redirige con amabilidad así:
"Ese tema está fuera de mi especialidad, pero si lo relacionas con publicidad o marketing puedo ayudarte. Por ejemplo, si quieres promover [lo que mencionó], puedo ayudarte a crear el anuncio perfecto. ¿Lo intentamos?"

## Información general — disponible PARA TODOS LOS PLANES
Puedes responder libremente sobre:
- Qué es AdGenius y para qué sirve
- Cómo funcionan cada sección de la plataforma
- Qué puede hacer NOVA y cuáles son sus límites por plan
- Diferencias entre planes
- Consejos generales de marketing, copywriting y publicidad en redes

## Capacidades según plan

${tier === 'FREE' ? `**Plan actual: FREE**
✅ Preguntas generales sobre AdGenius y la plataforma
✅ Ideas básicas de anuncios y publicaciones
✅ Tips de copywriting y mejora de textos cortos
✅ Consejos de marketing generales
❌ Generación de campañas completas → disponible en PLUS
❌ Variaciones de copy A/B → disponible en PLUS
❌ Análisis de métricas y rendimiento → disponible en PRO
❌ Recomendaciones basadas en datos reales → disponible en PRO` : ''}

${tier === 'PLUS' ? `**Plan actual: PLUS**
✅ Todo lo del plan FREE
✅ Generación de campañas publicitarias completas (headline, copy, CTA, audiencia)
✅ Variaciones de copy para A/B testing
✅ Estrategias multicanal y sugerencias de campaña
✅ Historial básico de conversación
❌ Análisis de métricas reales (ROAS/CTR/CPC en tiempo real) → disponible en PRO
❌ Recomendaciones basadas en campañas anteriores → disponible en PRO` : ''}

${tier === 'PRO' ? `**Plan actual: PRO — Acceso completo**
✅ Todo lo anterior
✅ Análisis profundo de rendimiento (ROAS, CTR, CPC, conversiones)
✅ Optimizaciones avanzadas y estrategias de escalado
✅ Recomendaciones basadas en historial y anuncios ganadores
✅ Identificación de patrones de audiencia
✅ Alertas de bajo rendimiento y acciones correctivas` : ''}`;
}

// Capability key map for intent gating
const INTENT_CAP_MAP: Record<
  string,
  { capKey: keyof ReturnType<typeof getNovaCapabilities>; requiredTier: 'PLUS' | 'PRO' }
> = {
  full_campaign:         { capKey: 'generateFullCampaign', requiredTier: 'PLUS' },
  copy_variations:       { capKey: 'copyVariations',       requiredTier: 'PLUS' },
  analyze_performance:   { capKey: 'advancedAnalysis',     requiredTier: 'PRO'  },
  smart_recommendations: { capKey: 'smartRecommendations', requiredTier: 'PRO'  },
};

// ── Off-topic detection ───────────────────────────────────────────────────────
function isOffTopic(lower: string): boolean {
  const offTopicPatterns = [
    /\b(salud|médico|medicina|doctor|enfermedad|síntoma|pastilla|vacuna)\b/,
    /\b(pol[ií]tic[ao]|presidente|gobierno|partido|elecci[oó]n|voto)\b/,
    /\b(abogado|legal|demanda|juicio|ley|tribunal|delito)\b/,
    /\b(tarea|escuela|universidad|examen|materia|profesor|asignatura)\b/,
    /\b(receta|cocina|ingrediente|plato|comida|cocinar)\b/,
    /\b(clima|temperatura|lluvia|tormenta|pronóstico)\b/,
    /\b(amor|relaci[oó]n|novio|novia|pareja|divorci)\b/,
    /comprar? (un |una )?(carro|auto|casa|ropa|celular|computadora)/,
  ];
  return offTopicPatterns.some(p => p.test(lower));
}

function getOffTopicReply(message: string): string {
  const topic = message.slice(0, 40).trim();
  return `Ese tema está fuera de mi especialidad 😊 Soy NOVA y me enfoco en publicidad, marketing y AdGenius.\n\nPero si quieres, puedo ayudarte a **crear un anuncio o campaña** relacionada con lo que mencionas. ¿Lo intentamos?`;
}

function getDemoReply(message: string, tier: NovaTier, intent?: string): string {
  const lower = message.toLowerCase();

  // ── Off-topic redirect ────────────────────────────────────────────────────
  if (isOffTopic(lower)) return getOffTopicReply(message);

  // ── Intent-first routing (quick action chips) ─────────────────────────────
  if (intent === 'improve_copy') {
    return 'Para mejorar tu copy, compárteme el texto actual y te doy la versión optimizada. Los 4 principios clave:\n\n1. **Hook en las primeras 3 palabras** — detiene el scroll\n2. **Beneficio, no característica** — "ahorra 2 horas" vs "es eficiente"\n3. **Prueba social o urgencia** — "Más de 5.000 clientes" o "Solo por hoy"\n4. **CTA con verbo de acción** — "Descarga gratis" convierte 40% más que "Enviar"\n\n¿Cuál es el texto que quieres mejorar?';
  }

  if (intent === 'generate_idea') {
    return 'Aquí va una idea lista para usar:\n\n**Headline:** "¿Todavía perdiendo clientes por [problema]?"\n**Copy:** La mayoría de negocios pierde un 30% de ventas por [punto de dolor]. Lo resolvemos en 24h — sin complicaciones.\n**CTA:** "Ver cómo funciona →"\n**Formato:** Video 15s en Instagram Reels o Facebook Feed.\n\n¿Qué producto querés anunciar para personalizarla?';
  }

  if (intent === 'full_campaign') {
    if (!tierAtLeast(tier, 'PLUS')) {
      return 'La generación de campañas completas está disponible en el plan **PLUS** ($79/mes). Incluye headline, copy, CTA, audiencia y distribución en un solo paso. 🚀';
    }
    return '**Campaña completa — Estructura base:**\n\n🎯 **Objetivo:** Conversiones\n**Headline A:** "Consigue [resultado] en [tiempo] sin [objeción]"\n**Headline B:** "El método que usan [referentes] para [resultado]"\n**Copy:** [Hook con dolor] + [Solución] + [Prueba social] + [Urgencia]\n**CTA:** "Quiero empezar ahora" vs "Ver demo gratis" (A/B)\n**Audiencia:** Intereses nicho, 25-44 años, compradores online recientes\n**Budget:** $15–20/día por ad set, 3–5 días de prueba.\n\n¿Cuál es tu producto y público objetivo?';
  }

  if (intent === 'copy_variations') {
    if (!tierAtLeast(tier, 'PLUS')) {
      return 'Las variaciones A/B de copy están disponibles en el plan **PLUS**. 🚀';
    }
    return '**3 variaciones para A/B testing:**\n\n**A — Emocional:** "Imagina despertar sin preocuparte por [problema]. Eso logramos para 2.000+ clientes. Tú eres el siguiente."\n\n**B — Directo:** "[Resultado concreto] en [tiempo]. Sin excusas. [CTA] →"\n\n**C — Urgencia:** "Solo [X] cupos esta semana. Después el precio sube 30%. Decide ahora."\n\n**Estrategia:** Prueba A vs B primero (3 días). El ganador enfrenta a C.\n\n¿Sobre qué producto hacemos las variaciones?';
  }

  if (intent === 'analyze_performance') {
    if (!tierAtLeast(tier, 'PRO')) {
      return 'El análisis de rendimiento avanzado está disponible en el plan **Performance** ($149/mes). Con él analizo tus métricas reales de Meta y Google Ads. 📊';
    }
    return 'En producción con plan Performance analizo tus datos reales. Las señales clave que reviso:\n\n• **CTR < 1%** → problema de creative o audiencia incorrecta\n• **CPC por encima del sector** → baja relevancia, revisar targeting\n• **ROAS < 2x** → problema en landing page u oferta\n• **Frecuencia > 3.5** → fatiga creativa, rotar anuncios ya\n\n¿Tienes alguna métrica específica que quieras interpretar?';
  }

  if (intent === 'smart_recommendations') {
    if (!tierAtLeast(tier, 'PRO')) {
      return 'Las recomendaciones inteligentes basadas en historial están en el plan **Performance** y superiores. 🧠';
    }
    return '**Recomendaciones basadas en patrones ganadores:**\n\n1. **Escala gradual** — ROAS > 3x: aumenta budget 20% cada 3 días\n2. **Pausa rápido** — ROAS < 1x tras $50 invertidos: pausar sin dudar\n3. **Rota creativos** — Cada 2 semanas para evitar fatiga de audiencia\n4. **Lookalike 1-3%** de compradores recientes: mejor ROAS consistente\n5. **Pico de conversión**: Mar-Jue, 7–9pm en la mayoría de nichos\n\n¿Quieres que profundice en algún punto?';
  }

  // ── Preguntas sobre AdGenius / NOVA ──────────────────────────────────────
  if (lower.includes('adgenius') || lower.includes('plataforma') || lower.includes('página') || lower.includes('pagina') || lower.includes('sirve') || lower.includes('para qué') || lower.includes('para que')) {
    return '**AdGenius** es una plataforma de publicidad digital con IA. Desde aquí podés:\n\n• 📊 **Dashboard** — ver métricas de tus campañas en tiempo real\n• 🖼️ **Ad Library** — gestionar todos tus anuncios\n• 🤖 **AI Analysis** — obtener análisis IA de cada anuncio\n• ✨ **Generator** — generar variaciones A/B automáticamente\n• 📡 **Ad Platforms** — conectar Meta Ads y Google Ads (plan Performance+)\n• 🎨 **Creative Studio** — crear creatividades para distintos formatos\n\n¿Querés que te explique alguna sección en detalle?';
  }

  if (lower.includes('nova') || lower.includes('asistente') || lower.includes('qué puedes') || lower.includes('que puedes') || lower.includes('cómo funciona') || lower.includes('como funciona')) {
    return 'Soy **NOVA**, el asistente IA de AdGenius 🤖\n\nPuedo ayudarte con:\n✅ Preguntas sobre la plataforma (todos los planes)\n✅ Ideas y mejoras de copy y anuncios (todos los planes)\n✅ Campañas completas y variaciones A/B (plan PLUS+)\n✅ Análisis de métricas y estrategias avanzadas (plan Performance+)\n\nMi especialidad es todo lo relacionado con **publicidad, marketing y contenido digital**. ¿En qué te ayudo?';
  }

  if (lower.includes('plan') || lower.includes('precio') || lower.includes('cuesta') || lower.includes('diferencia')) {
    return 'Los planes de AdGenius:\n\n• **Starter $19/mes** — generación básica, 1 workspace\n• **Pro $79/mes** — análisis IA, variaciones A/B, historial, 3 workspaces\n• **Performance $149/mes** — conexión Meta/Google Ads, métricas reales\n• **Agency $299/mes** — múltiples clientes, team, reportes\n• **Enterprise $599+/mes** — white-label, automatizaciones custom\n\nPuedes cambiar tu plan en la sección **Billing** del sidebar. ¿Necesitas ayuda para elegir?';
  }

  // ── Keyword fallback por tema ─────────────────────────────────────────────
  if (lower.includes('analiz') || lower.includes('rendimiento') || lower.includes('roas') || lower.includes('ctr') || lower.includes('cpc') || lower.includes('métrica') || lower.includes('metrica')) {
    if (!tierAtLeast(tier, 'PRO')) {
      return 'El análisis avanzado de métricas está disponible en el plan **Performance** ($149/mes). Incluye ROAS real, CTR, CPC y recomendaciones basadas en tus datos.\n\nMientras tanto, ¿qué métrica te preocupa? Te explico qué significa y cómo mejorarla.';
    }
    return 'Dime qué métrica te preocupa y te explico exactamente qué está pasando y cómo mejorarlo:\n\n• **CTR bajo** → creative o audiencia\n• **CPC alto** → relevancia o targeting\n• **ROAS insuficiente** → oferta o landing page\n• **Frecuencia alta** → fatiga de anuncio';
  }

  if (lower.includes('idea') || lower.includes('anuncio') || lower.includes('ángulo') || lower.includes('angulo') || lower.includes('audiencia')) {
    return 'Los ángulos que mejor convierten:\n\n1. **Problema/Solución** — ideal para productos nuevos\n2. **Social Proof** — "X personas ya lo usan"\n3. **Urgencia real** — plazos o cupos limitados\n4. **Curiosidad** — "El error que comete el 90% de negocios"\n5. **Autoridad** — testimonios con resultados concretos\n\n¿Cuál se ajusta mejor a tu producto?';
  }

  if (lower.includes('campaña') || lower.includes('facebook') || lower.includes('instagram') || lower.includes('meta') || lower.includes('tiktok')) {
    return 'Para una campaña efectiva en redes:\n\n**1. Objetivo claro** — Conversiones > Tráfico > Alcance\n**2. Creative fuerte** — Video 15-30s supera a imagen en 60%\n**3. Hook en las primeras 3 palabras** — determina si siguen leyendo\n**4. Audiencia específica** — Lookalike 1% de compradores recientes\n**5. Budget mínimo** — $10/día por ad set para que el algoritmo aprenda\n\n¿Qué estás vendiendo? Te armo la estructura completa.';
  }

  if (lower.includes('copy') || lower.includes('texto') || lower.includes('mejorar') || lower.includes('headline') || lower.includes('cta') || lower.includes('publicación') || lower.includes('publicacion') || lower.includes('post')) {
    return 'Para mejorar cualquier copy o publicación:\n\n1. **Hook fuerte** — las primeras 3 palabras detienen el scroll\n2. **Beneficio concreto** — "ahorra 2h diarias" vs "es eficiente"\n3. **Una sola idea** — no abrumes con información\n4. **CTA directo** — "Descargá gratis" convierte 40% más que "Enviar"\n\nCompárteme el texto y te doy una versión mejorada lista para publicar.';
  }

  if (lower.includes('marca') || lower.includes('branding') || lower.includes('identidad') || lower.includes('brand kit') || lower.includes('logo') || lower.includes('color')) {
    return 'Para un branding sólido en publicidad digital:\n\n• **Consistencia visual** — mismo color, tipografía y tono en todos los anuncios\n• **Voz de marca** — ¿formal, cercano, inspiracional? Define uno y manténlo\n• **Brand Kit en AdGenius** — configurá tus colores, CTAs frecuentes y tono en Settings → Brand Kit\n\n¿Quieres ayuda para definir el tono de comunicación de tu marca?';
  }

  // Saludo genérico
  if (lower.includes('hola') || lower.includes('buenos') || lower.includes('buenas') || lower.includes('hey') || lower.includes('qué tal') || lower.includes('que tal')) {
    return '¡Hola! 👋 ¿En qué te puedo ayudar hoy?\n\nPuedo ayudarte con **anuncios, publicaciones, campañas, copy o cualquier cosa de AdGenius**. Solo dime qué necesitas.';
  }

  // Fallback inteligente
  return `Cuéntame un poco más sobre lo que necesitas. Para darte la mejor respuesta sobre **"${message.slice(0, 50)}${message.length > 50 ? '...' : ''}"** ayuda saber:\n\n• ¿Es para un anuncio, publicación o campaña?\n• ¿En qué plataforma? (Meta, Google, TikTok, Instagram)\n• ¿Cuál es tu objetivo? (ventas, leads, awareness)\n\nCon eso te doy algo concreto y útil.`;
}

export async function POST(req: NextRequest) {
  const authCtx  = await getAuthContext();
  // Admin always gets full PRO access regardless of subscription
  const effectivePlanId = authCtx.isAdmin ? 'enterprise' : authCtx.planId;
  const caps    = getNovaCapabilities(effectivePlanId);
  const tier    = getNovaTier(effectivePlanId);

  let message: string;
  let intent: string | undefined;
  let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;

  try {
    const body         = await req.json();
    message            = String(body.message ?? '').trim();
    intent             = typeof body.intent === 'string' ? body.intent : undefined;
    conversationHistory = Array.isArray(body.history) ? body.history : [];
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!message) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  // Gate intent-based requests before calling the AI
  if (intent && intent in INTENT_CAP_MAP) {
    const gate = INTENT_CAP_MAP[intent];
    if (!caps[gate.capKey]) {
      const { requiredTier } = gate;
      const featureDesc =
        requiredTier === 'PLUS'
          ? 'generación de campañas completas, variaciones de copy y más.'
          : 'análisis avanzado de rendimiento, optimizaciones basadas en ROAS/CTR y recomendaciones inteligentes.';
      return NextResponse.json({
        reply: `Esta función está disponible en el plan **${requiredTier}**. Puedes mejorar tu plan para desbloquear ${featureDesc} 🚀`,
        gated: true,
        requiredTier,
      });
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // Demo mode — no API key configured
    return NextResponse.json({
      reply: getDemoReply(message, tier, intent),
      gated: false,
      demo: true,
    });
  }

  const client       = new Anthropic({ apiKey });
  const systemPrompt = buildSystemPrompt(tier);

  // Keep last 10 turns for context window efficiency
  const recentHistory = conversationHistory.slice(-10);
  const messages: Anthropic.MessageParam[] = [
    ...recentHistory.map(m => ({
      role:    m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: message },
  ];

  const maxTokens =
    tier === 'FREE' ? 500 :
    tier === 'PLUS' ? 1000 :
    2000;

  try {
    const stream = client.messages.stream({
      model:    'claude-opus-4-6',
      max_tokens: maxTokens,
      system:   systemPrompt,
      messages,
      thinking: { type: 'adaptive' },
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type':    'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Nova-Tier':     tier,
      },
    });
  } catch (err) {
    console.error('[POST /api/nova/chat]', err);
    return NextResponse.json(
      { error: 'NOVA is temporarily unavailable' },
      { status: 500 },
    );
  }
}
