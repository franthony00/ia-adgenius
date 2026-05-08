'use client';

import { useState, useRef, useEffect } from 'react';
import SafeAdImage from '@/components/ui/SafeAdImage';
import {
  Sparkles, Wand2, RefreshCw, Check, ChevronRight,
  ImageIcon, FileText, Zap, GitBranch, BarChart2,
  X, TrendingUp, Info,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import Header from '@/components/layout/Header';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import VariationCard from '@/components/ai/VariationCard';
import { mockAds, mockVariations } from '@/lib/mock-data';
import { cn, sleep, formatPercent, formatMultiplier } from '@/lib/utils';
import type { Ad, AIModel, AdVariation, SalesAngle, Platform } from '@/lib/types';

type GenerateMode = 'copy' | 'visual' | 'both';
type Step = 'config' | 'generating' | 'results';

const LOADING_MSGS = [
  'Reading original ad patterns...',
  'Analysing top-performing elements...',
  'Applying persuasion frameworks...',
  'Crafting headline variations...',
  'Optimising CTAs...',
  'Building image prompts...',
  'Scoring variations...',
  'Finalising output...',
];

// ─── Variation template (per ad) ─────────────────────────────────────────────
interface VariationTemplate {
  headline: string;
  description: string;
  cta: string;
  imagePrompt: string;
  changeType: AdVariation['changeType'];
  rationale: string;
  predictedCTR: number;
  predictedCPC: number;
  predictedROAS: number;
  confidence: number;
  angle: SalesAngle;
  recommendedPlatform: Platform;
}

// ─── Per-ad variation pools ───────────────────────────────────────────────────
const AD_VARIATION_POOL: Record<string, VariationTemplate[]> = {

  // ── ad1: FitLife — fitness / facebook / conversions ─────────────────────────
  ad1: [
    {
      headline: 'The 20-Minute Workout Secret 50,000 Athletes Swear By',
      description: 'Stop spending 2 hours at the gym for worse results. Our AI coach designs your perfect short session — personalised to your body, goals, and schedule.',
      cta: 'Build My Workout',
      imagePrompt: 'Split-screen: left frustrated person in crowded gym, right confident athlete finishing 20-min home workout, bright natural light, authentic UGC style',
      changeType: 'both',
      rationale: 'Curiosity hook replaces pain-point framing — tests whether aspiration outperforms frustration for this audience.',
      predictedCTR: 5.4, predictedCPC: 0.82, predictedROAS: 7.8, confidence: 87,
      angle: 'Curiosidad', recommendedPlatform: 'facebook',
    },
    {
      headline: 'Stop Wasting Hours at the Gym — 20 Minutes Is All You Need',
      description: '94% of our users see real results in 30 days. If you don\'t, you pay nothing. Your AI coach is waiting.',
      cta: 'Start Free Trial',
      imagePrompt: 'Real person doing home workout, sweating authentically, natural morning light, phone showing workout app on floor beside them',
      changeType: 'copy',
      rationale: 'Adds time specificity to headline while keeping proven pain-point structure. Low-risk, high-confidence test.',
      predictedCTR: 5.1, predictedCPC: 0.88, predictedROAS: 7.2, confidence: 91,
      angle: 'Directa', recommendedPlatform: 'facebook',
    },
    {
      headline: 'Why Are You Still Spending 2 Hours at the Gym?',
      description: 'Top athletes use AI-optimised 20-minute sessions. 94% of FitLife users outperform their previous 2-hour routines. Try it free — no credit card needed.',
      cta: 'Try It Free',
      imagePrompt: 'Overhead shot of athlete checking fitness watch post-20-min session, clean modern home gym, sweat glint on forehead, satisfied expression',
      changeType: 'both',
      rationale: 'Question hook triggers self-reflection — audiences who already waste time in the gym will feel seen immediately.',
      predictedCTR: 4.9, predictedCPC: 0.96, predictedROAS: 6.9, confidence: 79,
      angle: 'Problema/Solución', recommendedPlatform: 'facebook',
    },
    {
      headline: 'Stop Wasting Hours at the Gym',
      description: 'Our AI coach builds your perfect 20-min workout. 94% of users see results in 30 days or they get their money back.',
      cta: 'Start Free Trial',
      imagePrompt: 'Before/after side-by-side: same person left in cluttered gym looking tired, right at home post-workout looking energised, same outfit, authentic not staged',
      changeType: 'visual',
      rationale: 'Copy proven — test whether UGC-style before/after visual boosts CTR without touching the winning headline.',
      predictedCTR: 5.6, predictedCPC: 0.79, predictedROAS: 7.4, confidence: 84,
      angle: 'Social Proof', recommendedPlatform: 'instagram',
    },
  ],

  // ── ad2: BrewHaven — coffee / instagram / sales ──────────────────────────────
  ad2: [
    {
      headline: 'Your Coffee Was Roasted 48 Hours Ago. Most Aren\'t.',
      description: 'Single-origin beans. Roasted to order. At your door before you can finish your current bag.',
      cta: 'Get Fresh Coffee',
      imagePrompt: 'Close-up of coffee beans being poured, warm amber light, steam rising, artisan roastery feel, golden hour tones',
      changeType: 'copy',
      rationale: 'Contrast hook makes competitor staleness visceral without naming anyone — creates instant perceived superiority.',
      predictedCTR: 4.1, predictedCPC: 1.28, predictedROAS: 5.2, confidence: 76,
      angle: 'Directa', recommendedPlatform: 'instagram',
    },
    {
      headline: 'The Last Coffee Subscription You\'ll Ever Need',
      description: 'Your morning deserves single-origin beans roasted to order and delivered within 48 hours. 4.9 ⭐ from 8,400+ subscribers.',
      cta: 'Start My Subscription',
      imagePrompt: 'Aesthetic morning flat-lay: coffee mug, BrewHaven bag, open journal, warm window light, Instagram-native composition, cosy tones',
      changeType: 'both',
      rationale: 'Finality framing reduces comparison shopping — social proof number anchors credibility.',
      predictedCTR: 3.8, predictedCPC: 1.42, predictedROAS: 4.9, confidence: 71,
      angle: 'Emocional', recommendedPlatform: 'instagram',
    },
    {
      headline: 'Your Morning Ritual, Upgraded',
      description: 'Single-origin beans. Roasted to your order. Delivered fresh within 48 hours of roasting — because mediocre coffee is a terrible way to start the day.',
      cta: 'Shop Now',
      imagePrompt: 'Barista pouring latte art in minimalist white mug, cafe counter backdrop blurred, steam rising, warm afternoon light filtering through window',
      changeType: 'visual',
      rationale: 'Original copy wins — test whether an artisan café-style visual outperforms the home-ritual imagery.',
      predictedCTR: 3.5, predictedCPC: 1.55, predictedROAS: 4.5, confidence: 68,
      angle: 'Emocional', recommendedPlatform: 'instagram',
    },
    {
      headline: 'What If Your Morning Coffee Was Actually Good?',
      description: 'BrewHaven sources single-origin beans roasted to order and ships within 48 hours. First bag 20% off — no commitment.',
      cta: 'Claim 20% Off',
      imagePrompt: 'Person holding coffee mug with both hands, close crop on hands and mug, steam rising, cosy morning light, worn wooden table, simple and intimate',
      changeType: 'both',
      rationale: 'Question hook + discount intro offer to convert new audiences unfamiliar with premium coffee subscriptions.',
      predictedCTR: 4.3, predictedCPC: 1.19, predictedROAS: 5.6, confidence: 81,
      angle: 'Oferta', recommendedPlatform: 'facebook',
    },
  ],

  // ── ad3: NovaSole — shoes / tiktok / traffic ──────────────────────────────────
  ad3: [
    {
      headline: 'Stop Choosing Between Fast and Fresh. NovaSole Does Both.',
      description: 'PRs on Monday. Brunch fits on Saturday. 12K+ runners and streetwear fans agree — this is the last shoe you need. Starting at $129.',
      cta: 'Shop the Drop',
      imagePrompt: 'Dynamic split: left track/running action shot, right urban café scene, same shoe in both, bold graphic transition, Gen-Z energy',
      changeType: 'both',
      rationale: 'Removes pause in original copy and makes the dual-identity benefit explicit with social proof + price anchor.',
      predictedCTR: 6.2, predictedCPC: 0.64, predictedROAS: 5.8, confidence: 85,
      angle: 'Directa', recommendedPlatform: 'tiktok',
    },
    {
      headline: 'They Said You Can\'t Have Performance AND Style. We Built the Proof.',
      description: 'NovaSole — fast enough for PRs, clean enough for brunch. 4.9 ⭐ from 12K+ runners. Free 30-day returns.',
      cta: 'See the Drop',
      imagePrompt: 'TikTok-native vertical video thumbnail: shoe in centre, gradient split background, bold sans-serif text overlay, high contrast',
      changeType: 'both',
      rationale: 'Contrarian hook challenges a category belief — ideal for TikTok where polarising statements drive comment engagement.',
      predictedCTR: 6.7, predictedCPC: 0.59, predictedROAS: 6.1, confidence: 88,
      angle: 'Emocional', recommendedPlatform: 'tiktok',
    },
    {
      headline: 'Fast Enough for PRs. Clean Enough for Brunch.',
      description: '4.9 ⭐ from 12K+ runners. The shoe that doesn\'t make you choose between the track and the table. Starting at $129 — free 30-day returns.',
      cta: 'Shop the Drop',
      imagePrompt: 'Slow-motion close-up of NovaSole hitting track then transitioning to cobblestone street, cinematic depth-of-field, golden-hour light, no people',
      changeType: 'visual',
      rationale: 'Winning copy unchanged — test cinematic shoe-focus video against lifestyle imagery to find higher-converting creative format.',
      predictedCTR: 5.9, predictedCPC: 0.71, predictedROAS: 5.5, confidence: 82,
      angle: 'Social Proof', recommendedPlatform: 'tiktok',
    },
    {
      headline: 'This Shoe Broke My PR. Then I Wore It to Dinner.',
      description: 'NovaSole — the running shoe the streetwear crowd accidentally adopted. 12K+ ⭐ reviews. Shop the drop before it\'s gone.',
      cta: 'Get Mine Now',
      imagePrompt: 'UGC-style phone-camera quality: runner\'s feet on track, cut to same shoes under restaurant table, candid, raw, TikTok-native aesthetic',
      changeType: 'both',
      rationale: 'First-person UGC narrative mirrors TikTok storytelling patterns — authentic over polished converts better on this platform.',
      predictedCTR: 7.1, predictedCPC: 0.55, predictedROAS: 6.3, confidence: 79,
      angle: 'UGC', recommendedPlatform: 'tiktok',
    },
  ],

  // ── ad4: GlowLab — skincare / instagram / conversions ───────────────────────
  ad4: [
    {
      headline: 'Start My 21-Day Skin Transformation',
      description: 'Dermatologist-formulated. 98% see visible results. No harsh chemicals — just the science your skin has been waiting for.',
      cta: 'Claim My Free Sample',
      imagePrompt: 'Clean flatlay of skincare products with subtle before/after skin texture cards, clinical but warm aesthetic, pastel laboratory backdrop',
      changeType: 'both',
      rationale: 'Moves CTA copy into headline as action-first hook. Free sample offer lowers barrier vs. risk-free purchase.',
      predictedCTR: 6.8, predictedCPC: 0.71, predictedROAS: 8.1, confidence: 88,
      angle: 'Oferta', recommendedPlatform: 'instagram',
    },
    {
      headline: 'Dermatologist-Developed. Actually Works. Here\'s the Proof.',
      description: '98% of users see visible skin improvement in exactly 21 days — or their money back. No harsh chemicals, no empty promises. Just peer-reviewed science.',
      cta: 'Try Risk-Free',
      imagePrompt: 'Close-up of clear, glowing skin texture, soft natural light, no makeup, clinical white background fading into warm skin tone, high-end editorial feel',
      changeType: 'copy',
      rationale: '"Here\'s the proof" extends the authority claim into a curiosity hook — makes the user lean forward before seeing the body copy.',
      predictedCTR: 6.4, predictedCPC: 0.79, predictedROAS: 7.9, confidence: 85,
      angle: 'Autoridad', recommendedPlatform: 'instagram',
    },
    {
      headline: 'Dermatologist-Developed. Actually Works.',
      description: '98% see visible improvement in 21 days. No harsh chemicals. No empty promises. Just science.',
      cta: 'Start My 21-Day Trial',
      imagePrompt: 'Carousel-style side-by-side: Day 1 vs Day 21 skin texture close-up, clinical lighting, dermatologist\'s gloved hands visible, trust-building aesthetic',
      changeType: 'visual',
      rationale: 'Before/after carousel on Instagram typically outperforms single-image for skincare — same proven copy, new creative format.',
      predictedCTR: 7.0, predictedCPC: 0.67, predictedROAS: 8.4, confidence: 89,
      angle: 'Social Proof', recommendedPlatform: 'instagram',
    },
    {
      headline: '"My skin cleared in 14 days." — Real GlowLab Customer',
      description: 'Dermatologist-developed formula. 98% see visible improvement in 21 days. No harsh chemicals. Try risk-free — money back if it doesn\'t work for you.',
      cta: 'See the Results',
      imagePrompt: 'UGC-style selfie of woman with clear glowing skin, natural bathroom lighting, slight smile, authentic expression, not overly posed or polished',
      changeType: 'both',
      rationale: 'Social proof as headline — quote format on Instagram feels native and disarming, especially for beauty sceptics.',
      predictedCTR: 6.9, predictedCPC: 0.74, predictedROAS: 8.0, confidence: 83,
      angle: 'UGC', recommendedPlatform: 'instagram',
    },
  ],

  // ── ad5: Nexus AI — SaaS / linkedin / leads ──────────────────────────────────
  ad5: [
    {
      headline: 'Your Competitors Cut Costs 34% Last Year. Did You?',
      description: 'Over 500 enterprise ops teams use Nexus AI to surface revenue leaks in real-time. Calculate your potential savings in 60 seconds — no commitment.',
      cta: 'Calculate My ROI',
      imagePrompt: 'Dashboard interface showing cost reduction graph trending up, dark professional UI, boardroom reflection in monitor, confident executive reviewing data',
      changeType: 'both',
      rationale: 'Competitive contrast hook creates FOMO at the executive level — more motivating than generic benefit claims on LinkedIn.',
      predictedCTR: 2.6, predictedCPC: 3.82, predictedROAS: 10.2, confidence: 83,
      angle: 'Urgencia', recommendedPlatform: 'linkedin',
    },
    {
      headline: 'How Much Revenue Is Your Ops Team Leaving on the Table?',
      description: '500+ enterprise teams have answered this question with Nexus AI — average finding: 34% cost reduction in the first 90 days. Calculate yours now.',
      cta: 'Run My Free Audit',
      imagePrompt: 'Clean B2B illustration: ops workflow diagram with Nexus AI overlaid, green efficiency arrows, minimal design, LinkedIn-native professional aesthetic',
      changeType: 'copy',
      rationale: 'Original question hook kept — swapping CTA to "Free Audit" raises perceived value for enterprise decision-makers.',
      predictedCTR: 2.3, predictedCPC: 4.10, predictedROAS: 9.6, confidence: 78,
      angle: 'Oferta', recommendedPlatform: 'linkedin',
    },
    {
      headline: '500 Enterprise Teams. Avg. 34% Cost Reduction. 90 Days.',
      description: 'Nexus AI analyses your operations in real-time to find what\'s costing you. How much revenue is your team leaving on the table? Find out in 60 seconds.',
      cta: 'Calculate My Savings',
      imagePrompt: 'Split infographic: left shows tangled ops workflow (before), right shows clean streamlined flow (after Nexus AI), professional blue-green palette, no clutter',
      changeType: 'both',
      rationale: 'Data-first headline leads with proof before the question — ideal for LinkedIn audiences sceptical of ROI claims.',
      predictedCTR: 2.8, predictedCPC: 3.64, predictedROAS: 11.0, confidence: 86,
      angle: 'Autoridad', recommendedPlatform: 'linkedin',
    },
    {
      headline: 'How Much Revenue Is Your Ops Team Leaving on the Table?',
      description: 'Calculate your savings in 60 seconds. 500+ enterprise teams cut costs by avg. 34% with Nexus AI.',
      cta: 'Calculate My ROI',
      imagePrompt: 'Executive at glass desk reviewing Nexus AI dashboard on large monitor, city skyline through floor-to-ceiling windows, confident posture, professional attire',
      changeType: 'visual',
      rationale: 'Winning copy unchanged — test executive lifestyle visual against product UI screenshot to identify which trust signal converts enterprise leads faster.',
      predictedCTR: 2.4, predictedCPC: 3.95, predictedROAS: 9.8, confidence: 80,
      angle: 'Social Proof', recommendedPlatform: 'linkedin',
    },
  ],

  // ── ad6: Wanderlux — travel / facebook / sales ──────────────────────────────
  ad6: [
    {
      headline: 'Only 9 Bali Packages Left at $649 — Don\'t Wake Up to Sold Out',
      description: 'All-inclusive 7-night escape: 5-star resort, private transfers, and daily breakfast. Price locked until Sunday midnight.',
      cta: 'Lock My Price Now',
      imagePrompt: 'Aerial drone shot of Bali rice terraces at golden hour, couple in distance on viewing platform, lush greens and warm sky, aspirational and real simultaneously',
      changeType: 'both',
      rationale: 'Tightens the scarcity number and adds consequence — loss aversion outperforms FOMO at this audience stage.',
      predictedCTR: 8.9, predictedCPC: 0.49, predictedROAS: 5.1, confidence: 82,
      angle: 'Urgencia', recommendedPlatform: 'facebook',
    },
    {
      headline: '72-Hour Flash Sale: Bali from $649',
      description: 'Only 23 packages left at this price. All-inclusive 7-night escapes with 5-star resorts. Sale ends Sunday.',
      cta: 'Claim My Package',
      imagePrompt: 'Split: pool infinity edge overlooking Bali jungle on left, package price badge with countdown timer overlay on right, luxury-meets-urgency visual tension',
      changeType: 'visual',
      rationale: 'Original copy kept — test whether a pool/price overlay visual outperforms landscape-only creative at the bottom of the funnel.',
      predictedCTR: 8.4, predictedCPC: 0.54, predictedROAS: 4.7, confidence: 76,
      angle: 'Oferta', recommendedPlatform: 'facebook',
    },
    {
      headline: 'You\'re 3 Clicks Away from Bali. $649. 7 Nights. All-In.',
      description: '5-star resorts, daily breakfast, private transfers — 23 packages left at this price. Sale ends Sunday at midnight.',
      cta: 'Book Before It\'s Gone',
      imagePrompt: 'Close-up of hands typing on laptop with Bali resort pool in soft-focus background — buying intent visual meets aspirational destination',
      changeType: 'both',
      rationale: 'Process simplification reduces perceived friction for fence-sitters — combines ease with urgency without feeling pushy.',
      predictedCTR: 9.1, predictedCPC: 0.47, predictedROAS: 5.4, confidence: 84,
      angle: 'Directa', recommendedPlatform: 'facebook',
    },
    {
      headline: 'Warning: This Bali Deal Expires in 72 Hours',
      description: 'Flash sale — Bali from $649 all-inclusive. 5-star resorts, private transfers, 7 nights. Only 23 packages remain. Don\'t miss it.',
      cta: 'See the Deal',
      imagePrompt: 'Bold graphic with Bali temple silhouette at sunset, large price badge, ticking urgency design element, warm amber palette, feed-stopping composition',
      changeType: 'both',
      rationale: '"Warning" pattern interrupt is contrarian for travel ads — creates a reflexive stop-and-read response in a crowded feed.',
      predictedCTR: 8.6, predictedCPC: 0.52, predictedROAS: 4.9, confidence: 79,
      angle: 'Urgencia', recommendedPlatform: 'facebook',
    },
  ],

  // ── ad7: TasteLab — food / tiktok / conversions ──────────────────────────────
  ad7: [
    {
      headline: 'What If Dinner Actually Impressed People?',
      description: 'TasteLab delivers restaurant-grade ingredients + foolproof chef recipes. First box 50% off — no cooking experience needed.',
      cta: 'Get My First Box',
      imagePrompt: 'TikTok-native: hands plating pasta with tweezers, steam rising, close-up cinematic, warm kitchen lighting, blurred background, aspirational home-chef energy',
      changeType: 'both',
      rationale: 'Question hook targets social motivation — impressing people is more powerful than skill-building on TikTok.',
      predictedCTR: 5.8, predictedCPC: 0.88, predictedROAS: 4.2, confidence: 74,
      angle: 'Emocional', recommendedPlatform: 'tiktok',
    },
    {
      headline: 'I Made Michelin-Star Pasta in 15 Minutes. Here\'s How.',
      description: 'TasteLab chef boxes come with restaurant-grade ingredients and step-by-step recipes anyone can follow. First box 50% off.',
      cta: 'Get My First Box',
      imagePrompt: 'UGC phone camera: finished pasta dish on wooden table, natural kitchen light, imperfect but delicious-looking, chopsticks and fork beside plate, real home setting',
      changeType: 'visual',
      rationale: 'Winning copy kept — test authentic phone-cam UGC aesthetic vs. polished food photography on TikTok to see which converts faster.',
      predictedCTR: 6.1, predictedCPC: 0.81, predictedROAS: 4.5, confidence: 78,
      angle: 'UGC', recommendedPlatform: 'tiktok',
    },
    {
      headline: 'The Box That Made Me Look Like I Went to Culinary School',
      description: 'Restaurant-grade ingredients. Chef-designed recipes. 15 minutes. TasteLab delivers everything you need to cook like a pro — first box 50% off.',
      cta: 'Try TasteLab',
      imagePrompt: 'First-person POV: hands opening TasteLab box revealing neatly packaged ingredients, recipe card visible, fresh produce, cinematic unboxing, TikTok vertical',
      changeType: 'both',
      rationale: 'Unboxing hook captures TikTok "haul" culture — high completion rate format for subscription food products.',
      predictedCTR: 6.4, predictedCPC: 0.76, predictedROAS: 4.8, confidence: 81,
      angle: 'Curiosidad', recommendedPlatform: 'tiktok',
    },
    {
      headline: 'I Made Michelin-Star Pasta in 15 Minutes. Here\'s How.',
      description: 'Our chefs box delivers restaurant-grade ingredients and foolproof recipes. First box 50% off.',
      cta: 'Start Cooking',
      imagePrompt: 'Trending TikTok recipe video thumbnail: ingredients laid out flat on marble, text overlay "15 min Michelin pasta", bold font, warm kitchen tones, viral format',
      changeType: 'visual',
      rationale: 'Recipe-thumbnail format mirrors viral TikTok cooking content — native-feeling creative typically outperforms produced ads 2:1 on this platform.',
      predictedCTR: 7.0, predictedCPC: 0.71, predictedROAS: 5.2, confidence: 76,
      angle: 'Social Proof', recommendedPlatform: 'tiktok',
    },
  ],

  // ── ad8: LuxeThread — fashion / instagram / awareness ─────────────────────
  ad8: [
    {
      headline: 'Your Wardrobe Called. It Wants to Be Curated.',
      description: 'Sustainable luxury fashion selected by stylists who\'ve dressed for Vogue and Net-a-Porter — and now for your closet.',
      cta: 'Explore My Edit',
      imagePrompt: 'Minimalist closet rail with curated sustainable luxury pieces, warm accent lighting, white walls, editorial calm — aspirational but achievable',
      changeType: 'both',
      rationale: 'Personalised hook mirrors how LuxeThread\'s curation feels — creates ownership before purchase.',
      predictedCTR: 3.4, predictedCPC: 1.65, predictedROAS: 3.5, confidence: 72,
      angle: 'Emocional', recommendedPlatform: 'instagram',
    },
    {
      headline: 'Sustainable Doesn\'t Have to Mean Boring.',
      description: 'LuxeThread proves it every season. Luxury pieces curated by stylists who\'ve worked with Vogue — made from materials that don\'t cost the earth.',
      cta: 'Explore Collection',
      imagePrompt: 'Model in minimalist sustainable luxury outfit against textured natural backdrop, earth tones, confidence posture, editorial lighting, no busy props',
      changeType: 'both',
      rationale: 'Directly challenges the #1 objection to sustainable fashion — sceptics who click are already pre-qualified.',
      predictedCTR: 3.2, predictedCPC: 1.71, predictedROAS: 3.3, confidence: 69,
      angle: 'Directa', recommendedPlatform: 'instagram',
    },
    {
      headline: 'Dress Like You Mean It',
      description: 'Sustainable luxury fashion curated by stylists who\'ve dressed for Vogue, Net-a-Porter, and your closet.',
      cta: 'Explore Collection',
      imagePrompt: 'Carousel Instagram: each frame a different styled outfit from LuxeThread, consistent warm editorial palette, model and flat-lay alternating, cohesive luxury story',
      changeType: 'visual',
      rationale: 'Proven copy, new format — Instagram carousel with styled outfit series drives saves and profile visits better than single-image awareness ads.',
      predictedCTR: 3.6, predictedCPC: 1.58, predictedROAS: 3.8, confidence: 74,
      angle: 'Social Proof', recommendedPlatform: 'instagram',
    },
    {
      headline: 'The Pieces Stylists Actually Wear. Now Available to You.',
      description: 'LuxeThread is curated by the same stylists who dress for Vogue. Sustainable. Luxurious. Yours.',
      cta: 'Shop the Edit',
      imagePrompt: 'Behind-the-scenes: stylist\'s own wardrobe rail, handwritten notes on labels, personal feel, sunlight through window — insider access aesthetic',
      changeType: 'both',
      rationale: 'Authority transfer hook — "stylists actually wear" implies insider knowledge, which drives aspiration better than generic luxury claims.',
      predictedCTR: 3.1, predictedCPC: 1.78, predictedROAS: 3.0, confidence: 66,
      angle: 'Autoridad', recommendedPlatform: 'instagram',
    },
  ],
};

// ─── Generate variations ───────────────────────────────────────────────────────
function generateVariationsForAd(
  ad: Ad,
  mode: GenerateMode,
  count: number,
  model: AIModel,
): AdVariation[] {
  const pool = AD_VARIATION_POOL[ad.id] ?? [];

  const templates: VariationTemplate[] = pool.length > 0
    ? pool
    : [{
        headline: `${ad.headline} — Proven.`,
        description: ad.description,
        cta: ad.cta,
        imagePrompt: `Professional ad creative for "${ad.name}" — ${ad.platform} format, ${ad.objective} objective`,
        changeType: 'copy' as const,
        rationale: 'Adds authority signal to original headline while keeping proven copy structure.',
        predictedCTR: +(ad.metrics.ctr * 1.1).toFixed(2),
        predictedCPC: +(ad.metrics.cpc * 0.95).toFixed(2),
        predictedROAS: +(ad.metrics.roas * 1.05).toFixed(2),
        confidence: 72,
        angle: 'Directa' as SalesAngle,
        recommendedPlatform: ad.platform,
      }];

  const now = new Date().toISOString();

  return templates.slice(0, count).map((tpl, i): AdVariation => {
    const headline    = mode === 'visual' ? ad.headline    : tpl.headline;
    const description = mode === 'visual' ? ad.description : tpl.description;
    const cta         = mode === 'visual' ? ad.cta         : tpl.cta;
    const changeType  = mode === 'copy'   ? 'copy'
                      : mode === 'visual' ? 'visual'
                      : tpl.changeType;

    return {
      id: `gen-${ad.id}-${mode}-${i}-${Date.now()}`,
      originalAdId: ad.id,
      originalAdName: ad.name,
      createdAt: now,
      headline,
      description,
      cta,
      imagePrompt: tpl.imagePrompt,
      imageUrl: ad.imageUrl,
      predictedCTR: tpl.predictedCTR,
      predictedCPC: tpl.predictedCPC,
      predictedROAS: tpl.predictedROAS,
      confidence: tpl.confidence,
      angle: tpl.angle,
      recommendedPlatform: tpl.recommendedPlatform,
      status: 'pending',
      model,
      rationale: tpl.rationale,
      changeType,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────

export default function GeneratorPage() {
  const [ads, setAds]                 = useState<Ad[]>(mockAds);
  const [selectedAd, setSelectedAd]   = useState<Ad>(mockAds[0]);

  useEffect(() => {
    fetch('/api/ads')
      .then(r => r.json())
      .then(data => {
        const loaded = data.ads ?? mockAds;
        setAds(loaded);
        if (loaded.length > 0) setSelectedAd(loaded[0]);
      })
      .catch(() => { /* keep mock defaults */ });
  }, []);
  const [mode, setMode]               = useState<GenerateMode>('both');
  const [model, setModel]             = useState<AIModel>('claude-3-5-sonnet');
  const [count, setCount]             = useState(2);
  const [step, setStep]               = useState<Step>('config');
  const [progress, setProgress]       = useState(0);
  const [loadMsg, setLoadMsg]         = useState('');
  const [results, setResults]         = useState<AdVariation[]>([]);

  // Per-variation action state
  const [usedIds, setUsedIds]         = useState<Set<string>>(new Set());
  const [draftIds, setDraftIds]       = useState<Set<string>>(new Set());
  const [abTestIds, setAbTestIds]     = useState<Set<string>>(new Set());
  const [compareIds, setCompareIds]   = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);

  const runIdRef = useRef(0);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const resetResults = () => {
    setResults([]);
    setUsedIds(new Set());
    setDraftIds(new Set());
    setAbTestIds(new Set());
    setCompareIds(new Set());
    setShowCompare(false);
  };

  const selectAd = (ad: Ad) => {
    runIdRef.current++;
    setSelectedAd(ad);
    setStep('config');
    resetResults();
  };

  const getStatus = (id: string): AdVariation['status'] => {
    if (usedIds.has(id))   return 'approved';
    if (abTestIds.has(id)) return 'testing';
    if (draftIds.has(id))  return 'draft';
    return 'pending';
  };

  // ── Actions ───────────────────────────────────────────────────────────────────
  const handleUse = (id: string) => {
    setUsedIds(s => new Set([...s, id]));
    setDraftIds(s => { const n = new Set(s); n.delete(id); return n; });
    setAbTestIds(s => { const n = new Set(s); n.delete(id); return n; });
  };

  const handleSaveDraft = (id: string) => {
    if (usedIds.has(id)) return;
    setDraftIds(s => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const handleMarkABTest = (id: string) => {
    if (usedIds.has(id)) return;
    setAbTestIds(s => new Set([...s, id]));
    setDraftIds(s => { const n = new Set(s); n.delete(id); return n; });
  };

  const handleCompare = (id: string) => {
    setCompareIds(s => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  // ── Generate ──────────────────────────────────────────────────────────────────
  const generate = async () => {
    const runId       = ++runIdRef.current;
    const adSnapshot  = selectedAd;

    resetResults();
    setStep('generating');
    setProgress(0);

    try {
      for (let i = 0; i < LOADING_MSGS.length; i++) {
        setLoadMsg(LOADING_MSGS[i]);
        setProgress(Math.round(((i + 1) / LOADING_MSGS.length) * 100));
        await sleep(500 + Math.random() * 300);
        if (runId !== runIdRef.current) return;
      }
      const variations = generateVariationsForAd(adSnapshot, mode, count, model);
      if (runId !== runIdRef.current) return;
      setResults(variations);
      setStep('results');
    } catch {
      if (runId === runIdRef.current) setStep('config');
    }
  };

  // ── Compare data ──────────────────────────────────────────────────────────────
  const compareVariations = results.filter(v => compareIds.has(v.id));

  return (
    <AppLayout>
      <Header
        title="Variation Generator"
        subtitle="AI-powered A/B variations with projections"
        onRefresh={() => { runIdRef.current++; setStep('config'); resetResults(); }}
      />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">

        {/* ── Config panel ── */}
        {(step === 'config' || step === 'results') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Source ad selector */}
            <div className="rounded-2xl p-6 space-y-4"
              style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 className="text-sm font-semibold text-white">Source Ad</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {ads.map(ad => (
                  <button key={ad.id} onClick={() => selectAd(ad)}
                    className={cn('w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border',
                      selectedAd.id === ad.id ? 'border-emerald-500/30' : 'border-transparent hover:bg-white/5')}
                    style={selectedAd.id === ad.id ? { background: 'rgba(16,185,129,0.08)' } : {}}>
                    <div className="relative w-10 h-9 rounded-lg overflow-hidden shrink-0">
                      <SafeAdImage src={ad.imageUrl} alt={ad.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{ad.name}</p>
                      <p className="text-[10px] text-zinc-500 capitalize">
                        {ad.platform} · {ad.status === 'draft' ? 'Draft' : `Score: ${ad.aiScore ?? '—'}`}
                      </p>
                    </div>
                    {selectedAd.id === ad.id && <Check size={12} className="text-emerald-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Generation settings */}
            <div className="rounded-2xl p-6 space-y-5"
              style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 className="text-sm font-semibold text-white">Generation Settings</h2>

              {/* Mode */}
              <div>
                <p className="text-xs text-zinc-500 mb-2">What to generate</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: 'copy',   label: 'Copy',   icon: <FileText  size={13} /> },
                    { id: 'visual', label: 'Visual', icon: <ImageIcon size={13} /> },
                    { id: 'both',   label: 'Both',   icon: <Sparkles  size={13} /> },
                  ] as const).map(({ id, label, icon }) => (
                    <button key={id} onClick={() => setMode(id)}
                      className={cn('flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-medium transition-all border',
                        mode === id ? 'text-white border-emerald-500/30' : 'text-zinc-500 border-white/5 hover:border-white/10')}
                      style={mode === id ? { background: 'rgba(16,185,129,0.12)' } : {}}>
                      {icon}{label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Count */}
              <div>
                <p className="text-xs text-zinc-500 mb-2">
                  Variations: <span className="text-white font-bold">{count}</span>
                </p>
                <input type="range" min={1} max={4} value={count}
                  onChange={e => setCount(+e.target.value)}
                  className="w-full accent-emerald-500" />
                <div className="flex justify-between text-[10px] text-zinc-700 mt-1">
                  {[1,2,3,4].map(n => <span key={n}>{n}</span>)}
                </div>
              </div>

              {/* Model */}
              <div>
                <p className="text-xs text-zinc-500 mb-2">AI Model</p>
                <div className="space-y-1.5">
                  {(['claude-3-5-sonnet','claude-opus-4','gpt-4o','gemini-1.5-pro'] as AIModel[]).map(m => (
                    <button key={m} onClick={() => setModel(m)}
                      className={cn('w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all border',
                        model === m ? 'text-emerald-300 border-emerald-500/25' : 'text-zinc-500 border-white/5 hover:text-zinc-300')}
                      style={model === m ? { background: 'rgba(16,185,129,0.08)' } : {}}>
                      <span>{{
                        'claude-3-5-sonnet': 'Claude 3.5 Sonnet',
                        'claude-opus-4':     'Claude Opus 4',
                        'gpt-4o':            'GPT-4o',
                        'gemini-1.5-pro':    'Gemini 1.5 Pro',
                      }[m]}</span>
                      {model === m && <Check size={11} className="text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview + Generate CTA */}
            <div className="rounded-2xl overflow-hidden flex flex-col"
              style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="relative h-36">
                <SafeAdImage src={selectedAd.imageUrl} alt={selectedAd.name} fill className="object-cover opacity-70" />
                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(180deg,rgba(0,0,0,0.1),rgba(8,8,15,0.95))' }} />
              </div>
              <div className="p-5 flex-1 flex flex-col gap-3">
                <p className="text-sm font-bold text-white leading-snug">{selectedAd.headline}</p>
                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{selectedAd.description}</p>

                <div className="flex gap-2 mt-auto flex-wrap">
                  <Badge variant="emerald">{mode} generation</Badge>
                  <Badge variant="zinc">{count} variant{count > 1 ? 's' : ''}</Badge>
                  <Badge variant="zinc">{selectedAd.platform}</Badge>
                </div>

                <button onClick={generate}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#10B981,#059669)', boxShadow: '0 8px 24px rgba(16,185,129,0.25)' }}>
                  <Wand2 size={16} />Generate Variations
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Generating ── */}
        {step === 'generating' && (
          <div className="rounded-2xl p-10 text-center space-y-6 fade-in-up"
            style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: 'linear-gradient(135deg,#10B981,#059669)', boxShadow: '0 8px 32px rgba(16,185,129,0.3)' }}>
              <Sparkles size={24} className="text-white animate-pulse" />
            </div>
            <div>
              <p className="text-lg font-bold text-white mb-1">Creating variations for {selectedAd.name}</p>
              <p className="text-sm text-zinc-400">{loadMsg}<span className="cursor-blink">_</span></p>
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <ProgressBar value={progress} color="#10B981" height={6} />
              <p className="text-xs text-zinc-600">{progress}% complete</p>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {step === 'results' && results.length > 0 && (
          <div className="space-y-5 fade-in-up">

            {/* Results header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-white">{results.length} Variations Generated</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {selectedAd.name} · {mode} mode ·{' '}
                  {usedIds.size > 0 && <span className="text-emerald-400">{usedIds.size} using </span>}
                  {abTestIds.size > 0 && <span className="text-blue-400">{abTestIds.size} in A/B </span>}
                  {draftIds.size > 0 && <span className="text-violet-400">{draftIds.size} drafted </span>}
                  {usedIds.size === 0 && abTestIds.size === 0 && draftIds.size === 0 && 'Review and act on each variation'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {compareIds.size >= 2 && (
                  <button
                    onClick={() => setShowCompare(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: showCompare ? 'rgba(34,211,238,0.15)' : 'rgba(34,211,238,0.08)',
                      border: '1px solid rgba(34,211,238,0.3)',
                      color: '#22D3EE',
                    }}>
                    <BarChart2 size={13} />
                    Compare {compareIds.size}
                  </button>
                )}
                <button onClick={generate}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <RefreshCw size={13} />Regenerate
                </button>
              </div>
            </div>

            {/* Compare panel */}
            {showCompare && compareVariations.length >= 2 && (
              <div className="rounded-2xl p-5 fade-in-up"
                style={{ background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.2)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart2 size={14} className="text-cyan-400" />
                    <h3 className="text-sm font-semibold text-white">Comparison View</h3>
                    <Badge variant="cyan">Proyección estimada</Badge>
                  </div>
                  <button onClick={() => setShowCompare(false)}
                    className="text-zinc-600 hover:text-zinc-400 transition-colors">
                    <X size={14} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <td className="text-zinc-600 pb-3 pr-4 w-28">Métrica</td>
                        {compareVariations.map((v, i) => (
                          <td key={v.id} className="pb-3 pr-4 min-w-[140px]">
                            <p className="text-white font-semibold line-clamp-1">{v.headline}</p>
                            <p className="text-zinc-600 text-[10px] mt-0.5">Variación {i + 1}</p>
                          </td>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      {[
                        {
                          label: 'Ángulo',
                          render: (v: AdVariation) => v.angle ?? '—',
                          color: () => '#9CA3AF',
                        },
                        {
                          label: 'Plataforma',
                          render: (v: AdVariation) => v.recommendedPlatform ?? '—',
                          color: () => '#9CA3AF',
                        },
                        {
                          label: 'CTA',
                          render: (v: AdVariation) => v.cta,
                          color: () => '#6EE7B7',
                        },
                        {
                          label: 'Est. CTR',
                          render: (v: AdVariation) => formatPercent(v.predictedCTR),
                          color: (v: AdVariation) => {
                            const max = Math.max(...compareVariations.map(x => x.predictedCTR));
                            return v.predictedCTR === max ? '#10B981' : '#9CA3AF';
                          },
                        },
                        {
                          label: 'Est. CPC',
                          render: (v: AdVariation) => v.predictedCPC != null ? `$${v.predictedCPC.toFixed(2)}` : '—',
                          color: (v: AdVariation) => {
                            const min = Math.min(...compareVariations.map(x => x.predictedCPC ?? 99));
                            return v.predictedCPC === min ? '#10B981' : '#9CA3AF';
                          },
                        },
                        {
                          label: 'Est. ROAS',
                          render: (v: AdVariation) => formatMultiplier(v.predictedROAS),
                          color: (v: AdVariation) => {
                            const max = Math.max(...compareVariations.map(x => x.predictedROAS));
                            return v.predictedROAS === max ? '#10B981' : '#9CA3AF';
                          },
                        },
                        {
                          label: 'Confianza',
                          render: (v: AdVariation) => v.confidence != null ? `${v.confidence}%` : '—',
                          color: (v: AdVariation) => {
                            const max = Math.max(...compareVariations.map(x => x.confidence ?? 0));
                            return v.confidence === max ? '#10B981' : '#9CA3AF';
                          },
                        },
                        {
                          label: 'Tipo',
                          render: (v: AdVariation) => ({ copy: 'Copy only', visual: 'Visual only', both: 'Copy + Visual', cta: 'CTA only' }[v.changeType]),
                          color: () => '#9CA3AF',
                        },
                      ].map(row => (
                        <tr key={row.label}>
                          <td className="py-2.5 pr-4 text-zinc-600 font-medium">{row.label}</td>
                          {compareVariations.map(v => (
                            <td key={v.id} className="py-2.5 pr-4 font-semibold capitalize"
                              style={{ color: row.color(v) }}>
                              {row.render(v)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center gap-1.5 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <Info size={9} className="text-zinc-700 shrink-0" />
                  <p className="text-[9px] text-zinc-700">
                    Proyección estimada · Basado en datos disponibles · Los resultados reales pueden variar
                  </p>
                </div>
              </div>
            )}

            {/* Variations grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {results.map((v, i) => (
                <VariationCard
                  key={v.id}
                  variation={{ ...v, status: getStatus(v.id) }}
                  onUse={handleUse}
                  onSaveDraft={handleSaveDraft}
                  onMarkABTest={handleMarkABTest}
                  onCompare={handleCompare}
                  isComparing={compareIds.has(v.id)}
                  delay={i * 80}
                />
              ))}
            </div>

            {/* Action summary banner */}
            {(usedIds.size > 0 || abTestIds.size > 0) && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-2xl fade-in-up"
                style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}>
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(16,185,129,0.15)' }}>
                    <TrendingUp size={15} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {usedIds.size > 0 && `${usedIds.size} variation${usedIds.size > 1 ? 's' : ''} ready to use`}
                      {usedIds.size > 0 && abTestIds.size > 0 && ' · '}
                      {abTestIds.size > 0 && `${abTestIds.size} in A/B testing`}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Proyección estimada basada en datos disponibles · No garantizado
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const selected = results.filter(v => usedIds.has(v.id) || abTestIds.has(v.id));
                    const data = selected.map(v => ({
                      id: v.id, headline: v.headline, description: v.description,
                      cta: v.cta, angle: v.angle, platform: v.recommendedPlatform,
                      predictedCTR: v.predictedCTR, predictedCPC: v.predictedCPC,
                      predictedROAS: v.predictedROAS, confidence: v.confidence,
                      status: usedIds.has(v.id) ? 'approved' : 'testing',
                      changeType: v.changeType, rationale: v.rationale,
                    }));
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url  = URL.createObjectURL(blob);
                    const a    = document.createElement('a');
                    a.href     = url;
                    a.download = `adgenius-variations-${Date.now()}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}>
                  Export Selected <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Variation Library ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Zap size={14} className="text-amber-400" />
              Variation Library
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant="zinc">{mockVariations.length} saved</Badge>
              <span className="text-xs text-zinc-600">
                {mockVariations.filter(v => v.status === 'testing').length} in A/B ·{' '}
                {mockVariations.filter(v => v.status === 'approved').length} approved
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockVariations.map((v, i) => (
              <VariationCard key={v.id} variation={v} delay={i * 60} />
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
