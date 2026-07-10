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

interface NovaContext {
  brandKit?: {
    businessName?:  string | null;
    businessType?:  string | null;
    tone?:          string | null;
    targetAudience?:string | null;
    visualStyle?:   string | null;
    preferredCTAs?: string[];
    services?:      string[];
  } | null;
  memories?: Array<{ type: string; content: string }>;
  page?: string;
}

const PAGE_LABELS: Record<string, string> = {
  '/':               'Dashboard (métricas de campañas en tiempo real)',
  '/library':        'Ad Library (todos los anuncios del workspace)',
  '/analysis':       'AI Analysis (análisis IA de cada anuncio)',
  '/generator':      'Generator (variaciones A/B de copy e imagen)',
  '/history':        'History (historial de análisis y acciones)',
  '/meta-connect':   'Ad Platforms (conexión Meta Ads / Google Ads)',
  '/creative-studio':'Creative Studio (generador de creatividades visuales)',
};

function buildSystemPrompt(tier: NovaTier, ctx?: NovaContext): string {
  let base = `Eres NOVA, el asistente inteligente de AdGenius. Eres experto en marketing digital, publicidad en redes sociales, copywriting, creación de anuncios y estrategias de crecimiento para marcas.

## Sobre AdGenius
AdGenius es una plataforma de publicidad digital con IA diseñada para ayudar a negocios, marcas y creadores a crear, organizar, analizar y mejorar sus anuncios desde un solo lugar.

Sus secciones principales son:
- **Dashboard**: métricas de campañas en tiempo real — ROAS, CTR, gasto e ingresos
- **Ad Library**: biblioteca de todos los anuncios del workspace con filtros por plataforma y estado
- **AI Analysis**: análisis IA de cada anuncio — score, fortalezas, debilidades y recomendaciones
- **Generator**: generador de variaciones A/B de copy e imagen para anuncios existentes
- **History**: historial completo de acciones y análisis realizados
- **Ad Platforms**: conexión con Meta Ads y Google Ads para importar campañas reales (plan Performance+)
- **Creative Studio**: generador de creatividades visuales para diferentes formatos y plataformas

Planes disponibles:
- **Starter ($19/mes)**: generación básica, 1 workspace, sin conexión a plataformas
- **Pro ($79/mes)**: variaciones A/B, análisis IA, historial, hasta 3 workspaces
- **Performance ($149/mes)**: conexión Meta/Google Ads, métricas reales, recomendaciones inteligentes
- **Agency ($299/mes)**: múltiples clientes, team members, reportes
- **Enterprise ($599+/mes)**: white-label, automatizaciones personalizadas

Cuando el usuario pregunte "¿Qué es AdGenius?", "¿De qué trata la página?" o algo similar, responde de forma conversacional: primero explica el propósito general de la plataforma en 1-2 oraciones, luego lista las funciones principales, y cierra con una frase que resuma el valor (ej: "AdGenius es tu copiloto de marketing"). NO respondas solo con una lista fría.

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

  // ── Inject workspace brand context ─────────────────────────────────────────
  if (ctx?.brandKit) {
    const bk = ctx.brandKit;
    const lines = [
      bk.businessName  && `- Negocio: ${bk.businessName}`,
      bk.businessType  && `- Tipo: ${bk.businessType}`,
      bk.tone          && `- Tono de comunicación: ${bk.tone}`,
      bk.targetAudience && `- Audiencia objetivo: ${bk.targetAudience}`,
      bk.visualStyle   && `- Estilo visual preferido: ${bk.visualStyle}`,
      bk.preferredCTAs?.length && `- CTAs frecuentes: ${bk.preferredCTAs.join(', ')}`,
      bk.services?.length && `- Servicios: ${bk.services.join(', ')}`,
    ].filter(Boolean);
    if (lines.length > 0) {
      base += `\n\n## Contexto del workspace\nUsa estos datos para personalizar tus respuestas:\n${lines.join('\n')}`;
    }
  }

  // ── Inject page context ────────────────────────────────────────────────────
  if (ctx?.page) {
    const pageName = PAGE_LABELS[ctx.page] ?? ctx.page;
    base += `\n\n## Pantalla actual del usuario\nEl usuario está en: **${pageName}**. Cuando sea relevante, adapta tus sugerencias y próximos pasos a lo que puede hacer en esta pantalla.`;
  }

  // ── Inject learned memories ────────────────────────────────────────────────
  if (ctx?.memories?.length) {
    const memLines = ctx.memories.slice(0, 8).map(m => `- ${m.content}`).join('\n');
    base += `\n\n## Preferencias aprendidas de este workspace\nTen en cuenta estos patrones al hacer recomendaciones:\n${memLines}`;
  }

  return base;
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

function getOffTopicReply(_message: string): string {
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
  if (
    lower.includes('adgenius') ||
    lower.includes('plataforma') ||
    lower.includes('página') || lower.includes('pagina') ||
    lower.includes('qué es') || lower.includes('que es') ||
    lower.includes('de qué trata') || lower.includes('de que trata') ||
    lower.includes('explícame') || lower.includes('explicame') ||
    lower.includes('sirve') || lower.includes('para qué') || lower.includes('para que') ||
    lower.includes('trata la') || lower.includes('qué hace') || lower.includes('que hace')
  ) {
    return 'AdGenius es una plataforma de publicidad digital con IA diseñada para ayudarte a **crear mejores anuncios, organizar tus campañas y tomar mejores decisiones de marketing**. La idea es que tengas en un solo lugar tus métricas, anuncios, análisis, ideas creativas y recomendaciones para mejorar el rendimiento de tus campañas.\n\nDentro de la plataforma puedes:\n\n- **Dashboard** — revisar métricas principales de tus campañas en tiempo real\n- **Ad Library** — guardar y organizar todos tus anuncios por plataforma y estado\n- **AI Analysis** — analizar cada pieza publicitaria con IA para entender qué mejorar\n- **Generator** — generar nuevos copies o variaciones A/B a partir de anuncios existentes\n- **Ad Platforms** — conectar Meta Ads o Google Ads e importar campañas reales (plan Performance+)\n- **Creative Studio** — crear y adaptar creatividades visuales para distintos formatos\n\nEn pocas palabras, AdGenius funciona como un **copiloto de marketing**: te ayuda a crear, mejorar y entender tus anuncios para que tu marca pueda comunicar mejor y vender más.\n\n¿Quieres que te explique alguna sección en detalle?';
  }

  if (lower.includes('nova') || lower.includes('asistente') || lower.includes('qué puedes') || lower.includes('que puedes') || lower.includes('cómo funciona') || lower.includes('como funciona')) {
    return 'Soy **NOVA**, el asistente IA de AdGenius 🤖\n\nPuedo ayudarte con:\n✅ Preguntas sobre la plataforma (todos los planes)\n✅ Ideas y mejoras de copy y anuncios (todos los planes)\n✅ Campañas completas y variaciones A/B (plan PLUS+)\n✅ Análisis de métricas y estrategias avanzadas (plan Performance+)\n\nMi especialidad es todo lo relacionado con **publicidad, marketing y contenido digital**. ¿En qué te ayudo?';
  }

  if (lower.includes('plan') || lower.includes('precio') || lower.includes('cuesta') || lower.includes('diferencia')) {
    return 'Los planes de AdGenius:\n\n• **Starter $19/mes** — generación básica, 1 workspace\n• **Pro $79/mes** — análisis IA, variaciones A/B, historial, 3 workspaces\n• **Performance $149/mes** — conexión Meta/Google Ads, métricas reales\n• **Agency $299/mes** — múltiples clientes, team, reportes\n• **Enterprise $599+/mes** — white-label, automatizaciones custom\n\nPuedes cambiar tu plan en la sección **Billing** del sidebar. ¿Necesitas ayuda para elegir?';
  }

  // ── Mejorar copy con texto proporcionado ─────────────────────────────────
  // Detect "mejora este copy: [text]" before generic copy handler
  if (
    (lower.includes('mejora') || lower.includes('mejorar') || lower.includes('optimiza') || lower.includes('reescribe')) &&
    message.includes(':') &&
    message.length > 15
  ) {
    const colonIdx = message.indexOf(':');
    const original = message.slice(colonIdx + 1).trim();
    if (original.length > 3) {
      return `**Versiones mejoradas de: _"${original}"_**\n\n**A — Beneficio directo:**\n"${original} — rápido, confiable y sin sorpresas."\n\n**B — Prueba social:**\n"Más de 1.000 clientes lo eligieron. ¿Eres el siguiente?"\n\n**C — Urgencia + garantía:**\n"Resolvemos eso hoy mismo — con garantía incluida."\n\n**Qué mejoró:** hook más claro, beneficio visible y CTA con acción directa.\n\n¿En qué plataforma va a publicarse? Te ajusto el tono.`;
    }
  }

  // ── Creative Studio ───────────────────────────────────────────────────────
  if (
    lower.includes('creative studio') ||
    lower.includes('creatividad') || lower.includes('creatividades') ||
    lower.includes('visual') || lower.includes('imagen') ||
    lower.includes('formato') || lower.includes('banner') ||
    lower.includes('story') || lower.includes('reel') ||
    lower.includes('diseño') || lower.includes('diseno')
  ) {
    return 'El **Creative Studio** de AdGenius te permite generar y adaptar creatividades visuales para distintos formatos:\n\n- **Post cuadrado (1:1)** → Feed de Instagram y Facebook\n- **Story vertical (9:16)** → Instagram Stories, TikTok y Reels\n- **Banner horizontal (16:9)** → YouTube y Display\n- **Carrusel** → mostrar varios productos o beneficios en secuencia\n\n**Cómo usarlo:**\n1. Ve al sidebar → **Creative Studio**\n2. Sube o describe tu concepto\n3. Elige el formato y plataforma\n4. La IA adapta el texto y el diseño\n\n¿Para qué plataforma y formato necesitas crear la creatividad?';
  }

  // ── A/B Testing ───────────────────────────────────────────────────────────
  if (
    lower.includes('a/b') || lower.includes('ab test') || lower.includes('split test') ||
    lower.includes('variaci') || lower.includes('testear') || lower.includes('comparar anuncio') ||
    (lower.includes('prueba') && (lower.includes('anuncio') || lower.includes('copy') || lower.includes('ad')))
  ) {
    return '**Guía de pruebas A/B en AdGenius:**\n\n**Regla base:** testa un solo elemento por vez.\n\n- **Headline A vs B** → mismo copy, diferente apertura\n- **Imagen A vs B** → mismo texto, diferente visual\n- **CTA A vs B** → "Comprar ahora" vs "Ver oferta"\n\n**Duración mínima:** 3-5 días o 100 conversiones por variante.\n\n**Métricas para elegir ganador:**\n- **CTR** → cuál genera más clics\n- **CPC** → cuál es más eficiente\n- **ROAS** → cuál genera más retorno\n\n**En AdGenius:** usa el **Generator** para crear variaciones y el **AI Analysis** para comparar el score de cada una antes de publicar.\n\n¿Qué elemento quieres testear primero?';
  }

  // ── Métricas: CTR, CPC, CPM, CPA, ROAS ───────────────────────────────────
  if (
    lower.includes('analiz') || lower.includes('rendimiento') ||
    lower.includes('roas') || lower.includes('ctr') || lower.includes('cpc') ||
    lower.includes('cpm') || lower.includes('cpa') ||
    lower.includes('métrica') || lower.includes('metrica') ||
    lower.includes('conversión') || lower.includes('conversion') ||
    lower.includes('impresion') || lower.includes('impresión')
  ) {
    const metricsGuide = '**Guía de métricas publicitarias:**\n\n- **CTR (Click-Through Rate)** → % de personas que hacen clic. Bajo CTR = problema de creative o audiencia\n- **CPC (Costo por Clic)** → cuánto pagas por cada clic. CPC alto = baja relevancia del anuncio\n- **CPM (Costo por Mil impresiones)** → costo de mostrar el anuncio 1.000 veces. CPM alto = audiencia muy competida\n- **CPA (Costo por Adquisición)** → cuánto cuesta conseguir un cliente/lead. CPA alto = problema en landing o embudo\n- **ROAS (Return on Ad Spend)** → retorno por cada $ invertido. ROAS de 3x = ganas $3 por cada $1\n\n**Señales de alarma:**\n- CTR < 1% → cambiar creative\n- ROAS < 2x → revisar oferta o landing page\n- Frecuencia > 3.5 → fatiga creativa, rotar anuncios\n\n¿Cuál de estas métricas te preocupa?';
    if (!tierAtLeast(tier, 'PRO')) {
      return `${metricsGuide}\n\nEl análisis automático de tus métricas reales está disponible en el plan **Performance** ($149/mes).`;
    }
    return metricsGuide;
  }

  // ── Brand Kit ─────────────────────────────────────────────────────────────
  if (
    lower.includes('marca') || lower.includes('branding') || lower.includes('identidad') ||
    lower.includes('brand kit') || lower.includes('logo') || lower.includes('color') ||
    lower.includes('tono de') || lower.includes('voz de')
  ) {
    return 'Para un branding sólido en publicidad digital:\n\n- **Consistencia visual** — mismo color, tipografía y tono en todos los anuncios\n- **Voz de marca** — ¿formal, cercano, inspiracional? Define uno y manténlo\n- **Brand Kit en AdGenius** — configurá tus colores, CTAs frecuentes y tono en Settings → Brand Kit\n\nTener el Brand Kit configurado permite que la IA genere copies y creatividades alineadas con tu identidad de marca automáticamente.\n\n¿Quieres ayuda para definir el tono de comunicación de tu marca?';
  }

  // ── Ideas de anuncios ─────────────────────────────────────────────────────
  if (lower.includes('idea') || lower.includes('anuncio') || lower.includes('ángulo') || lower.includes('angulo') || lower.includes('audiencia')) {
    return 'Los ángulos que mejor convierten:\n\n1. **Problema/Solución** — ideal para productos nuevos\n2. **Social Proof** — "X personas ya lo usan"\n3. **Urgencia real** — plazos o cupos limitados\n4. **Curiosidad** — "El error que comete el 90% de negocios"\n5. **Autoridad** — testimonios con resultados concretos\n\n¿Cuál se ajusta mejor a tu producto?';
  }

  // ── Campañas y redes ──────────────────────────────────────────────────────
  if (lower.includes('campaña') || lower.includes('facebook') || lower.includes('instagram') || lower.includes('meta') || lower.includes('tiktok')) {
    return 'Para una campaña efectiva en redes:\n\n**1. Objetivo claro** — Conversiones > Tráfico > Alcance\n**2. Creative fuerte** — Video 15-30s supera a imagen en 60%\n**3. Hook en las primeras 3 palabras** — determina si siguen leyendo\n**4. Audiencia específica** — Lookalike 1% de compradores recientes\n**5. Budget mínimo** — $10/día por ad set para que el algoritmo aprenda\n\n¿Qué estás vendiendo? Te armo la estructura completa.';
  }

  // ── Copy y textos ─────────────────────────────────────────────────────────
  if (
    lower.includes('copy') || lower.includes('texto') || lower.includes('mejorar') ||
    lower.includes('headline') || lower.includes('cta') ||
    lower.includes('publicación') || lower.includes('publicacion') || lower.includes('post')
  ) {
    return 'Para mejorar cualquier copy o publicación:\n\n1. **Hook fuerte** — las primeras 3 palabras detienen el scroll\n2. **Beneficio concreto** — "ahorra 2h diarias" vs "es eficiente"\n3. **Una sola idea** — no abrumes con información\n4. **CTA directo** — "Descargá gratis" convierte 40% más que "Enviar"\n\nCompárteme el texto así: _"Mejora este copy: [tu texto]"_ y te doy una versión mejorada lista para publicar.';
  }

  // ── Demo / funciones disponibles ──────────────────────────────────────────
  if (
    lower.includes('demo') || lower.includes('gratis') ||
    lower.includes('qué puedo') || lower.includes('que puedo') ||
    lower.includes('funciones') || lower.includes('disponible') ||
    lower.includes('sin plan') || lower.includes('prueba gratuita')
  ) {
    return 'En el **modo demo de AdGenius** tienes acceso a:\n\n✅ **Nova** — asistente de marketing con respuestas sobre AdGenius, copies, campañas y más\n✅ **Dashboard** — vista general de tu workspace\n✅ **Ad Library** — organiza y guarda anuncios\n✅ **Generator** — genera variaciones básicas de copy\n✅ **Creative Studio** — adapta creatividades a distintos formatos\n\n❌ Conexión Meta/Google Ads → plan Performance+\n❌ Análisis IA en tiempo real → plan Pro+\n❌ Historial y recomendaciones → plan Pro+\n\n¿Quieres que te explique alguna función en detalle?';
  }

  // ── Saludo genérico ───────────────────────────────────────────────────────
  if (lower.includes('hola') || lower.includes('buenos') || lower.includes('buenas') || lower.includes('hey') || lower.includes('qué tal') || lower.includes('que tal')) {
    return '¡Hola! 👋 Soy **NOVA**, tu asistente de AdGenius. Puedo ayudarte a crear mejores anuncios, mejorar tus copies, analizar ideas y generar recomendaciones para tus campañas.\n\n¿En qué empezamos?';
  }

  // ── Fallback inteligente ──────────────────────────────────────────────────
  return `Cuéntame un poco más sobre lo que necesitas. Para darte la mejor respuesta sobre **"${message.slice(0, 50)}${message.length > 50 ? '...' : ''}"** ayuda saber:\n\n- ¿Es para un anuncio, publicación o campaña?\n- ¿En qué plataforma? (Meta, Google, TikTok, Instagram)\n- ¿Cuál es tu objetivo? (ventas, leads, awareness)\n\nCon eso te doy algo concreto y útil.`;
}

export async function POST(req: NextRequest) {
  const authCtx  = await getAuthContext();
  // Admin always gets full PRO access regardless of subscription
  const effectivePlanId = authCtx.isAdmin ? 'enterprise' : authCtx.planId;
  const caps    = getNovaCapabilities(effectivePlanId);
  const tier    = getNovaTier(effectivePlanId);

  let message: string;
  let intent:  string | undefined;
  let page:    string | undefined;
  let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  let clientMemories: Array<{ type: string; content: string }> = [];

  try {
    const body          = await req.json();
    message             = String(body.message ?? '').trim();
    intent              = typeof body.intent   === 'string' ? body.intent   : undefined;
    page                = typeof body.page     === 'string' ? body.page     : undefined;
    conversationHistory = Array.isArray(body.history)  ? body.history  : [];
    clientMemories      = Array.isArray(body.memories) ? body.memories : [];
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

  // ── Fetch BrandKit for context (non-blocking) ─────────────────────────────
  let brandKit: NovaContext['brandKit'] = null;
  if (!authCtx.isDemo) {
    try {
      const { prisma } = await import('@/lib/db');
      brandKit = await prisma.brandKit.findUnique({
        where:  { workspaceId: authCtx.workspaceId },
        select: {
          businessName: true, businessType: true, tone: true,
          targetAudience: true, visualStyle: true, preferredCTAs: true, services: true,
        },
      });
    } catch { /* BrandKit fetch is best-effort */ }
  }

  const novaCtx: NovaContext = { brandKit, memories: clientMemories, page };

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // Demo mode — no API key configured
    return NextResponse.json({
      reply: getDemoReply(message, tier, intent),
      mode:  'demo',
      gated: false,
    });
  }

  const client       = new Anthropic({ apiKey });
  const systemPrompt = buildSystemPrompt(tier, novaCtx);

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
        'Content-Type':      'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Nova-Tier':       tier,
        'X-Nova-Mode':       'live',
      },
    });
  } catch (err) {
    console.error('[POST /api/nova/chat]', err);
    // Anthropic unavailable — fall back to demo silently instead of showing an error
    return NextResponse.json({
      reply: getDemoReply(message, tier, intent),
      mode:  'demo',
      gated: false,
    });
  }
}
