/**
 * AI Service Layer — Real Claude API integration.
 *
 * All functions call claude-opus-4-6 server-side.
 * Falls back to mock data if ANTHROPIC_API_KEY is not set (demo mode).
 * These run server-side only (called from API routes with runtime = 'nodejs').
 */

import Anthropic from '@anthropic-ai/sdk';
import type { BrandKit, LearningInsight, PerformancePattern, AIRecommendation, AIModel } from './types';

// ─── Client (lazy init) ───────────────────────────────────────────────────────

function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function extractJSON<T>(text: string): T {
  const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!match) throw new Error('No JSON found in AI response');
  return JSON.parse(match[0]) as T;
}

// ─── Copy Generation ──────────────────────────────────────────────────────────

export interface GenerateAdCopyInput {
  headline?: string;
  description?: string;
  cta?: string;
  angle?: string;
  platform?: string;
  brandKit?: BrandKit | null;
}

export interface GenerateAdCopyOutput {
  headline: string;
  description: string;
  cta: string;
  rationale: string;
}

export async function generateAdCopy(
  input: GenerateAdCopyInput,
): Promise<GenerateAdCopyOutput> {
  const client = getClient();

  if (!client) {
    // Demo fallback
    const tone = input.brandKit?.tone ?? 'profesional';
    const business = input.brandKit?.businessName ?? 'tu negocio';
    return {
      headline: input.headline ?? `Descubre lo mejor de ${business}`,
      description: input.description ?? `La solución ${tone} que estabas buscando. Resultados reales, sin complicaciones.`,
      cta: input.cta ?? input.brandKit?.preferredCTAs?.[0] ?? 'Saber más',
      rationale: `Generado con tono ${tone} basado en el Brand Kit.`,
    };
  }

  const brandContext = input.brandKit
    ? `Marca: ${input.brandKit.businessName ?? 'sin nombre'}
Tono: ${input.brandKit.tone ?? 'profesional'}
CTAs preferidos: ${input.brandKit.preferredCTAs?.join(', ') ?? 'ninguno'}`
    : 'Sin Brand Kit configurado.';

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 512,
    system: [
      {
        type: 'text',
        text: 'Eres un experto copywriter publicitario especializado en anuncios digitales de alta conversión. Redactas copy atractivo, conciso y orientado a resultados. Siempre respondes con JSON válido, sin texto adicional antes ni después.',
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Genera copy para un anuncio con los siguientes datos:

${brandContext}
Plataforma: ${input.platform ?? 'general'}
Ángulo creativo: ${input.angle ?? 'directo'}
${input.headline ? `Titular sugerido: ${input.headline}` : ''}
${input.description ? `Descripción sugerida: ${input.description}` : ''}
${input.cta ? `CTA sugerido: ${input.cta}` : ''}

Responde SOLO con este JSON (sin markdown):
{
  "headline": "titular impactante (máx 40 caracteres)",
  "description": "descripción convincente (máx 125 caracteres)",
  "cta": "llamada a la acción clara",
  "rationale": "explicación breve del enfoque creativo (1-2 oraciones)"
}`,
      },
    ],
  });

  const text = response.content.find((b) => b.type === 'text')?.text ?? '{}';
  return extractJSON<GenerateAdCopyOutput>(text);
}

// ─── Creative Prompt Generation ───────────────────────────────────────────────

export interface GenerateCreativePromptInput {
  format?: string;
  style?: string;
  objective?: string;
  headline?: string;
  copy?: string;
  brandKit?: BrandKit | null;
}

export async function generateCreativePrompt(
  input: GenerateCreativePromptInput,
): Promise<string> {
  const client = getClient();

  if (!client) {
    // Demo fallback
    const styleMap: Record<string, string> = {
      premium:      'luxury, high-end, sophisticated lighting, dark background',
      minimalista:  'minimalist, clean white space, sans-serif typography, simple shapes',
      tecnologico:  'tech-forward, neon accents, dark theme, geometric patterns',
      urbano:       'street culture, bold typography, high contrast, grunge texture',
      elegante:     'elegant, refined, soft gradients, serif fonts, muted palette',
      comercial:    'vibrant, promotional, bold colors, product-focused',
      deportivo:    'dynamic, action-oriented, sport photography, energetic composition',
    };
    const formatMap: Record<string, string> = {
      instagram_post:   '1:1 square format, Instagram optimized',
      instagram_story:  '9:16 vertical format, Instagram Story',
      facebook_ad:      '16:9 landscape, Facebook feed ad',
      banner:           'horizontal banner, web display ad',
      flyer:            'A4 flyer design, print-ready',
      whatsapp_status:  '9:16 vertical, WhatsApp Status',
    };
    const objMap: Record<string, string> = {
      awareness:    'brand awareness',
      conversions:  'conversion-focused',
      traffic:      'traffic generation',
      leads:        'lead generation',
      retention:    'customer retention',
    };
    const styleDesc  = styleMap[input.style ?? 'premium'] ?? 'professional';
    const formatDesc = formatMap[input.format ?? 'instagram_post'] ?? 'square';
    const objDesc    = objMap[input.objective ?? 'awareness'] ?? 'awareness';
    return `${styleDesc}, ${formatDesc}, ${objDesc} ad visual${input.headline ? `, featuring headline: "${input.headline}"` : ''}, photorealistic, high quality, commercial photography`;
  }

  const brandContext = input.brandKit
    ? `Color primario: ${input.brandKit.primaryColor ?? 'sin especificar'}
Color secundario: ${input.brandKit.secondaryColor ?? 'sin especificar'}
Estilo visual: ${input.brandKit.visualStyle ?? input.brandKit.tone ?? 'profesional'}`
    : '';

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 300,
    system: [
      {
        type: 'text',
        text: 'Eres un director creativo experto en publicidad digital. Generas prompts precisos y detallados para herramientas de generación de imágenes con IA (DALL-E, Midjourney, Stable Diffusion). Respondes SOLO con el prompt, sin explicaciones ni formato adicional.',
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Genera un prompt de imagen para un anuncio publicitario con estas especificaciones:

Formato: ${input.format ?? 'instagram_post'}
Estilo visual: ${input.style ?? 'premium'}
Objetivo: ${input.objective ?? 'awareness'}
${input.headline ? `Titular del anuncio: "${input.headline}"` : ''}
${input.copy ? `Texto del anuncio: "${input.copy}"` : ''}
${brandContext}

El prompt debe ser en inglés, ultra-detallado, incluir estilo fotográfico, iluminación, composición, colores y cualquier elemento visual relevante. Máximo 200 palabras.`,
      },
    ],
  });

  return response.content.find((b) => b.type === 'text')?.text?.trim() ?? '';
}

// ─── Image Analysis ───────────────────────────────────────────────────────────

export interface AnalyzeImageOutput {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export async function analyzeImage(imageUrl: string): Promise<AnalyzeImageOutput> {
  const client = getClient();

  // Only public HTTPS URLs are supported by Claude
  if (!imageUrl.startsWith('https://')) {
    return {
      score: 72,
      strengths: ['Buena iluminación', 'Producto visible y centrado'],
      weaknesses: ['Fondo puede distraer', 'Texto demasiado pequeño'],
      suggestions: ['Simplificar el fondo', 'Aumentar tamaño del CTA', 'Añadir contraste'],
    };
  }

  if (!client) {
    return {
      score: 72,
      strengths: ['Buena iluminación', 'Producto visible y centrado'],
      weaknesses: ['Fondo puede distraer', 'Texto demasiado pequeño'],
      suggestions: ['Simplificar el fondo', 'Aumentar tamaño del CTA', 'Añadir contraste'],
    };
  }

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 600,
    system: [
      {
        type: 'text',
        text: 'Eres un experto en análisis de creatividades publicitarias digitales. Evalúas imágenes de anuncios según principios de diseño, psicología del consumidor y mejores prácticas de publicidad digital. Respondes SOLO con JSON válido, sin texto adicional.',
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'url', url: imageUrl },
          },
          {
            type: 'text',
            text: `Analiza esta imagen como creatividad publicitaria y responde SOLO con este JSON (sin markdown):
{
  "score": <número del 0 al 100 que representa la efectividad publicitaria>,
  "strengths": ["fortaleza 1", "fortaleza 2", "fortaleza 3"],
  "weaknesses": ["debilidad 1", "debilidad 2"],
  "suggestions": ["sugerencia de mejora 1", "sugerencia 2", "sugerencia 3"]
}

Criterios: claridad del mensaje, jerarquía visual, uso del color, legibilidad, atractivo emocional, adecuación para plataformas digitales.`,
          },
        ],
      },
    ],
  });

  const text = response.content.find((b) => b.type === 'text')?.text ?? '{}';
  try {
    const result = extractJSON<AnalyzeImageOutput>(text);
    // Clamp score to 0-100
    result.score = Math.max(0, Math.min(100, result.score));
    return result;
  } catch {
    return {
      score: 70,
      strengths: ['Imagen analizada correctamente'],
      weaknesses: ['No se pudo obtener análisis detallado'],
      suggestions: ['Intenta con una imagen de mayor resolución'],
    };
  }
}

// ─── Design Variation Generation ─────────────────────────────────────────────

export interface GenerateDesignVariationInput {
  originalImageUrl?: string;
  style?: string;
  format?: string;
  brandKit?: BrandKit | null;
}

export interface GenerateDesignVariationOutput {
  imagePrompt: string;
  rationale: string;
}

export async function generateDesignVariation(
  input: GenerateDesignVariationInput,
): Promise<GenerateDesignVariationOutput> {
  const client = getClient();

  if (!client) {
    const prompt = await generateCreativePrompt({
      style: input.style,
      format: input.format,
      brandKit: input.brandKit,
    });
    return {
      imagePrompt: prompt,
      rationale: `Variación ${input.style ?? 'premium'} generada basada en el Brand Kit.`,
    };
  }

  const brandContext = input.brandKit
    ? `Marca: ${input.brandKit.businessName ?? 'sin nombre'}, Tono: ${input.brandKit.tone ?? 'profesional'}`
    : 'Sin Brand Kit';

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 512,
    system: [
      {
        type: 'text',
        text: 'Eres un director creativo de publicidad digital. Propones variaciones creativas de anuncios con fundamento estratégico. Respondes SOLO con JSON válido, sin markdown ni texto adicional.',
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Genera una variación de diseño publicitario con estas especificaciones:

Estilo: ${input.style ?? 'premium'}
Formato: ${input.format ?? 'instagram_post'}
${brandContext}

Responde SOLO con este JSON:
{
  "imagePrompt": "<prompt detallado en inglés para generación de imagen con IA, incluyendo estilo, iluminación, composición, colores, 100-200 palabras>",
  "rationale": "<justificación estratégica de la variación en español, 1-2 oraciones>"
}`,
      },
    ],
  });

  const text = response.content.find((b) => b.type === 'text')?.text ?? '{}';
  try {
    return extractJSON<GenerateDesignVariationOutput>(text);
  } catch {
    const fallbackPrompt = await generateCreativePrompt({
      style: input.style,
      format: input.format,
      brandKit: input.brandKit,
    });
    return {
      imagePrompt: fallbackPrompt,
      rationale: `Variación ${input.style ?? 'premium'} generada basada en el Brand Kit.`,
    };
  }
}

// ─── Recommendations from History ────────────────────────────────────────────

export interface GenerateRecommendationsInput {
  patterns: PerformancePattern[];
  insights: LearningInsight[];
  brandKit?: BrandKit | null;
  limit?: number;
}

export async function generateRecommendationsFromHistory(
  input: GenerateRecommendationsInput,
): Promise<AIRecommendation[]> {
  const client = getClient();
  const limit = input.limit ?? 5;

  if (!client) {
    // Demo fallback using pattern-based logic
    const recs: AIRecommendation[] = [];
    const topPattern = input.patterns.sort((a, b) => (b.avgROAS ?? 0) - (a.avgROAS ?? 0))[0];
    if (topPattern) {
      recs.push({
        id: `rec-pattern-${topPattern.id}`,
        type: 'test_copy',
        title: `Tu ${topPattern.patternType} más efectivo: "${topPattern.patternValue}"`,
        description: `Basado en ${topPattern.occurrences} anuncios, este patrón genera un ROAS promedio de ${(topPattern.avgROAS ?? 0).toFixed(2)}x.`,
        impact: topPattern.occurrences >= 5 ? 'high' : 'medium',
        confidence: Math.min(95, 40 + topPattern.occurrences * 10),
      });
    }
    for (const insight of input.insights.slice(0, 2)) {
      recs.push({
        id: `rec-insight-${insight.id}`,
        type: 'test_cta',
        title: insight.title,
        description: `${insight.description} (confianza: ${insight.confidence}%)`,
        impact: insight.confidence >= 75 ? 'high' : 'medium',
        confidence: insight.confidence,
      });
    }
    if (recs.length === 0) {
      recs.push({
        id: 'rec-generic-1',
        type: 'test_copy',
        title: 'Crea tu primer test A/B',
        description: 'Genera variaciones de tus anuncios actuales para comenzar a acumular datos.',
        impact: 'medium',
        confidence: 60,
      });
    }
    return recs.slice(0, limit);
  }

  const patternsJson = JSON.stringify(
    input.patterns.slice(0, 10).map((p) => ({
      tipo: p.patternType,
      valor: p.patternValue,
      ocurrencias: p.occurrences,
      roasPromedio: p.avgROAS?.toFixed(2),
      ctrPromedio: p.avgCTR?.toFixed(4),
    })),
    null, 2,
  );

  const insightsJson = JSON.stringify(
    input.insights.slice(0, 5).map((i) => ({
      categoria: i.category,
      titulo: i.title,
      descripcion: i.description,
      confianza: i.confidence,
      plataforma: i.platform,
    })),
    null, 2,
  );

  const brandContext = input.brandKit
    ? `Marca: ${input.brandKit.businessName ?? 'sin nombre'}, Tono: ${input.brandKit.tone ?? 'profesional'}`
    : 'Sin Brand Kit configurado';

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    thinking: { type: 'adaptive' },
    system: [
      {
        type: 'text',
        text: 'Eres un estratega de marketing digital especializado en optimización de anuncios. Analizas patrones de rendimiento histórico e insights de aprendizaje para generar recomendaciones accionables y priorizadas. Respondes SOLO con JSON válido, sin markdown ni texto adicional.',
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Analiza los siguientes datos de rendimiento publicitario y genera ${limit} recomendaciones estratégicas priorizadas.

${brandContext}

PATRONES DE RENDIMIENTO:
${patternsJson}

INSIGHTS DE APRENDIZAJE:
${insightsJson}

Responde SOLO con un array JSON (sin markdown):
[
  {
    "id": "rec-1",
    "type": "test_copy" | "test_cta" | "test_creative" | "scale_winner" | "pause_loser",
    "title": "título corto de la recomendación",
    "description": "descripción detallada y accionable (2-3 oraciones)",
    "impact": "high" | "medium" | "low",
    "confidence": <número 0-100 basado en la solidez de los datos>
  }
]

Prioriza recomendaciones de mayor impacto primero. Basa tu análisis en los patrones y insights reales provistos.`,
      },
    ],
  });

  const text = response.content.find((b) => b.type === 'text')?.text ?? '[]';
  try {
    const recs = extractJSON<AIRecommendation[]>(text);
    return Array.isArray(recs) ? recs.slice(0, limit) : [];
  } catch {
    return [{
      id: 'rec-ai-error',
      type: 'test_copy',
      title: 'Análisis en proceso',
      description: 'Acumula más datos de rendimiento para obtener recomendaciones más precisas.',
      impact: 'medium',
      confidence: 50,
    }];
  }
}

// ─── Learning Insight Capture ─────────────────────────────────────────────────

export interface SaveLearningInsightInput {
  workspaceId: string;
  category: string;
  title: string;
  description: string;
  value: string;
  confidence?: number;
  sampleSize?: number;
  avgCTR?: number;
  avgROAS?: number;
  avgCPC?: number;
  platform?: string;
}

export async function saveLearningInsight(
  input: SaveLearningInsightInput,
): Promise<void> {
  const { prisma } = await import('./db');
  await prisma.learningInsight.create({
    data: {
      workspaceId: input.workspaceId,
      category:    input.category as never,
      title:       input.title,
      description: input.description,
      value:       input.value,
      confidence:  input.confidence ?? 50,
      sampleSize:  input.sampleSize ?? 1,
      avgCTR:      input.avgCTR,
      avgROAS:     input.avgROAS,
      avgCPC:      input.avgCPC,
      platform:    input.platform as never,
    },
  });
}

// ─── Workspace Memory ─────────────────────────────────────────────────────────

export interface WorkspaceMemory {
  brandKit: BrandKit | null;
  topPatterns: PerformancePattern[];
  insights: LearningInsight[];
}

export async function getWorkspaceMemory(
  workspaceId: string,
): Promise<WorkspaceMemory> {
  const { prisma } = await import('./db');
  const [brandKit, topPatterns, insights] = await Promise.all([
    prisma.brandKit.findUnique({ where: { workspaceId } }),
    prisma.performancePattern.findMany({
      where: { workspaceId },
      orderBy: { occurrences: 'desc' },
      take: 10,
    }),
    prisma.learningInsight.findMany({
      where: { workspaceId },
      orderBy: { confidence: 'desc' },
      take: 10,
    }),
  ]);
  return {
    brandKit: brandKit as unknown as BrandKit | null,
    topPatterns: topPatterns as unknown as PerformancePattern[],
    insights: insights as unknown as LearningInsight[],
  };
}

// ─── Full Ad Analysis ─────────────────────────────────────────────────────────

export interface AnalyzeAdInput {
  adId: string;
  adName: string;
  imageUrl?: string | null;
  headline: string;
  description: string;
  cta: string;
  platform: string;
  spend?: number;
  roas?: number;
  ctr?: number;
  model?: AIModel;
}

export interface AnalyzeAdOutput {
  overallScore: number;
  copyScore: number;
  visualScore: number;
  audienceScore: number;
  hookStrength: number;
  estimatedCTR: number;
  estimatedROAS: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  patterns: { name: string; impact: string }[];
  sentiment: 'positive' | 'neutral' | 'negative';
  predictedPerformance: 'high' | 'medium' | 'low';
}

export async function analyzeAd(input: AnalyzeAdInput): Promise<AnalyzeAdOutput> {
  const client = getClient();

  if (!client) {
    // Demo fallback
    return {
      overallScore: 72, copyScore: 68, visualScore: 75,
      audienceScore: 70, hookStrength: 65,
      estimatedCTR: 0.028, estimatedROAS: 2.4,
      strengths: ['Mensaje claro y directo', 'CTA bien visible', 'Paleta de colores coherente'],
      weaknesses: ['Falta urgencia en el copy', 'Imagen podría ser más llamativa'],
      recommendations: ['Añade un elemento de escasez al titular', 'Prueba una variación con fondo más oscuro', 'Incluye prueba social (número de clientes)'],
      patterns: [{ name: 'Pregunta en titular', impact: 'high' }, { name: 'CTA imperativo', impact: 'medium' }],
      sentiment: 'positive',
      predictedPerformance: 'medium',
    };
  }

  const contentBlocks: Anthropic.MessageParam['content'] = [];

  // Include image only if it's a public HTTPS URL (Claude rejects local/HTTP URLs)
  const isPublicHttps = (url?: string | null) =>
    !!url && url.startsWith('https://');

  if (isPublicHttps(input.imageUrl)) {
    contentBlocks.push({
      type: 'image',
      source: { type: 'url', url: input.imageUrl! },
    });
  }

  const perfContext = input.roas
    ? `Rendimiento real: ROAS ${input.roas.toFixed(2)}x, CTR ${((input.ctr ?? 0) * 100).toFixed(2)}%, Gasto $${input.spend ?? 0}`
    : 'Sin datos de rendimiento disponibles aún.';

  contentBlocks.push({
    type: 'text',
    text: `Analiza este anuncio publicitario en detalle y responde SOLO con JSON válido (sin markdown):

DATOS DEL ANUNCIO:
- Nombre: ${input.adName}
- Plataforma: ${input.platform}
- Titular: "${input.headline}"
- Descripción: "${input.description}"
- CTA: "${input.cta}"
- ${perfContext}

Responde con este JSON exacto:
{
  "overallScore": <0-100, efectividad publicitaria general>,
  "copyScore": <0-100, calidad del texto/copy>,
  "visualScore": <0-100, calidad visual${input.imageUrl ? ' según la imagen' : ', estimado sin imagen'}>,
  "audienceScore": <0-100, relevancia para la audiencia objetivo>,
  "hookStrength": <0-100, fuerza del gancho inicial>,
  "estimatedCTR": <decimal como 0.025, CTR estimado>,
  "estimatedROAS": <decimal como 2.8, ROAS estimado>,
  "strengths": ["fortaleza 1", "fortaleza 2", "fortaleza 3"],
  "weaknesses": ["debilidad 1", "debilidad 2"],
  "recommendations": ["recomendación accionable 1", "recomendación 2", "recomendación 3"],
  "patterns": [
    {"name": "nombre del patrón detectado", "impact": "high|medium|low"}
  ],
  "sentiment": "positive|neutral|negative",
  "predictedPerformance": "high|medium|low"
}

Basa tu análisis en principios de neurociencia del consumidor, copywriting persuasivo y mejores prácticas de publicidad en ${input.platform}.`,
  });

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    thinking: { type: 'adaptive' },
    system: [
      {
        type: 'text',
        text: 'Eres un experto en análisis de creatividades publicitarias digitales con 15 años de experiencia en Meta Ads, Google Ads y TikTok Ads. Combinas análisis visual, psicología del consumidor y datos de rendimiento para dar insights accionables. Respondes SOLO con JSON válido.',
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: contentBlocks }],
  });

  const text = response.content.find((b) => b.type === 'text')?.text ?? '{}';
  try {
    const result = extractJSON<AnalyzeAdOutput>(text);
    // Clamp all scores
    const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
    result.overallScore   = clamp(result.overallScore);
    result.copyScore      = clamp(result.copyScore);
    result.visualScore    = clamp(result.visualScore);
    result.audienceScore  = clamp(result.audienceScore);
    result.hookStrength   = clamp(result.hookStrength);
    result.estimatedCTR   = Math.max(0, Math.min(1, result.estimatedCTR));
    result.estimatedROAS  = Math.max(0, result.estimatedROAS);
    return result;
  } catch {
    // Fallback if JSON parsing fails
    return {
      overallScore: 65, copyScore: 65, visualScore: 65,
      audienceScore: 65, hookStrength: 60,
      estimatedCTR: 0.02, estimatedROAS: 2.0,
      strengths: ['Anuncio analizado correctamente'],
      weaknesses: ['No se pudo obtener análisis detallado'],
      recommendations: ['Intenta de nuevo con más contexto'],
      patterns: [],
      sentiment: 'neutral',
      predictedPerformance: 'medium',
    };
  }
}

// ─── Ad Variation Generation ──────────────────────────────────────────────────

export interface GenerateAdVariationsInput {
  adId:        string;
  adName:      string;
  headline:    string;
  description: string;
  cta:         string;
  platform:    string;
  objective:   string;
  imageUrl?:   string | null;
  mode:        'copy' | 'visual' | 'both';
  count:       number; // 1–4
}

export interface GeneratedVariation {
  headline:            string;
  description:         string;
  cta:                 string;
  imagePrompt:         string;
  changeType:          'copy' | 'visual' | 'both' | 'cta';
  rationale:           string;
  predictedCTR:        number;
  predictedCPC:        number;
  predictedROAS:       number;
  confidence:          number;
  angle:               string;
  recommendedPlatform: string;
}

const SALES_ANGLES = [
  'Emocional', 'Directa', 'Urgencia', 'Oferta',
  'Autoridad', 'Problema/Solución', 'Curiosidad', 'Social Proof', 'UGC',
];

/** Demo fallback — generates plausible variations without Claude */
function generateVariationsFallback(input: GenerateAdVariationsInput): GeneratedVariation[] {
  const IMAGE_STYLES = [
    'warm lifestyle photography, natural light, authentic setting',
    'bold product-focused composition, high contrast, minimal props',
    'UGC-style phone camera quality, candid, real environment',
    'clean minimalist design, white background, editorial feel',
  ];
  const changeType =
    input.mode === 'copy'   ? 'copy'   as const :
    input.mode === 'visual' ? 'visual' as const : 'both' as const;

  return Array.from({ length: input.count }, (_, i) => {
    const angle    = SALES_ANGLES[i % SALES_ANGLES.length];
    const headline = input.mode === 'visual' ? input.headline : input.headline;
    return {
      headline,
      description: input.description,
      cta:         input.cta,
      imagePrompt: `${IMAGE_STYLES[i % IMAGE_STYLES.length]}, ${input.platform} ad for "${input.adName}", high quality commercial photography`,
      changeType,
      rationale:   `Demo variation ${i + 1} (${angle} angle). Add ANTHROPIC_API_KEY to .env.local to generate real AI-powered variations.`,
      predictedCTR:  +(2.0 + i * 0.4).toFixed(1),
      predictedCPC:  +(1.8 - i * 0.1).toFixed(2),
      predictedROAS: +(3.0 + i * 0.3).toFixed(1),
      confidence:    60 + i * 5,
      angle,
      recommendedPlatform: input.platform,
    };
  });
}

export async function generateAdVariations(
  input: GenerateAdVariationsInput,
): Promise<GeneratedVariation[]> {
  const client = getClient();
  if (!client) return generateVariationsFallback(input);

  const modeGuide =
    input.mode === 'copy'
      ? 'Generate NEW headlines, descriptions, and CTAs. Keep imagePrompt closely related to the original product/context.'
      : input.mode === 'visual'
      ? 'Keep headline, description, and CTA IDENTICAL to the original. Only generate a new, detailed imagePrompt.'
      : 'Generate entirely new copy AND a new detailed imagePrompt for each variation.';

  const changeType =
    input.mode === 'copy' ? 'copy' : input.mode === 'visual' ? 'visual' : 'both';

  const response = await client.messages.create({
    model:      'claude-opus-4-6',
    max_tokens: 2048,
    thinking:   { type: 'adaptive' },
    system: [
      {
        type: 'text',
        text: 'You are an expert performance marketing strategist and copywriter. You generate high-converting ad variations optimized for paid social platforms. You always respond with a valid JSON array, no markdown, no extra text.',
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Generate ${input.count} distinct ad variation${input.count > 1 ? 's' : ''}.

ORIGINAL AD:
- Platform: ${input.platform}
- Objective: ${input.objective}
- Headline: "${input.headline}"
- Description: "${input.description}"
- CTA: "${input.cta}"

MODE: ${input.mode.toUpperCase()}
${modeGuide}

RULES:
- Each variation must use a DIFFERENT angle from: ${SALES_ANGLES.join(', ')}
- Variations must be genuinely distinct, not minor rewrites
- imagePrompt must be detailed and in English, optimised for ${input.platform}
- changeType must be "${changeType}" for all entries
- Predict realistic performance metrics for the platform/objective combination

Respond ONLY with a JSON array (no markdown fences):
[
  {
    "headline": "...",
    "description": "...",
    "cta": "...",
    "imagePrompt": "...",
    "changeType": "${changeType}",
    "rationale": "1-2 sentence creative strategy explanation",
    "predictedCTR": <number>,
    "predictedCPC": <number>,
    "predictedROAS": <number>,
    "confidence": <integer 50-95>,
    "angle": "<one of the angles listed above>",
    "recommendedPlatform": "<facebook|instagram|tiktok|linkedin|google>"
  }
]`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  const text = textBlock?.type === 'text' ? textBlock.text : '[]';
  try {
    const parsed = extractJSON<GeneratedVariation[]>(text);
    // Clamp numeric fields to safe ranges
    return parsed.map(v => ({
      ...v,
      predictedCTR:  Math.max(0.1, Math.min(20,  v.predictedCTR  ?? 2)),
      predictedCPC:  Math.max(0.01, Math.min(50, v.predictedCPC  ?? 1)),
      predictedROAS: Math.max(0.1,  Math.min(30,  v.predictedROAS ?? 3)),
      confidence:    Math.max(0,    Math.min(100,  v.confidence    ?? 70)),
    }));
  } catch {
    return generateVariationsFallback(input);
  }
}
