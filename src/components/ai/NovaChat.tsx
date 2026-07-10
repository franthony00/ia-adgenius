'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { Sparkles, X, Send, Lock, Zap, ThumbsUp, ThumbsDown, Bookmark, Star, Rocket } from 'lucide-react';
import { usePlan } from '@/hooks/usePlan';
import {
  NOVA_QUICK_ACTIONS,
  NOVA_CAPABILITIES,
  NOVA_TIER_MAP,
  tierAtLeast,
  getNovaTier,
  type NovaTier,
} from '@/lib/nova-capabilities';
import type { PlanId } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id:       string;
  role:     'user' | 'nova';
  content:  string;
  loading?: boolean;
  gated?:   boolean;
}

type FeedbackKind = 'useful' | 'not_useful' | 'saved' | 'winner';

// ─── Page-specific suggestion chips ──────────────────────────────────────────

const PAGE_SUGGESTIONS: Record<string, { label: string; prompt: string }[]> = {
  '/': [
    { label: '¿Qué optimizar hoy?',        prompt: '¿Qué debería optimizar primero en mis campañas hoy?' },
    { label: 'Explícame el ROAS',          prompt: 'Explícame qué es el ROAS y si 2.5x es buen resultado.' },
    { label: 'Ideas para esta semana',     prompt: 'Dame 3 ideas de anuncios para trabajar esta semana.' },
  ],
  '/library': [
    { label: '¿Cuál tiene más potencial?', prompt: '¿Cómo identifico cuál anuncio tiene más potencial para escalar?' },
    { label: 'Detecta patrones',           prompt: '¿Qué patrones suelen tener los anuncios ganadores en Facebook e Instagram?' },
    { label: 'Mejora el copy',             prompt: 'Ayúdame a mejorar el copy de un anuncio.' },
  ],
  '/analysis': [
    { label: '¿Qué métrica mejorar primero?', prompt: 'Si mi CTR es bajo pero mi ROAS es bueno, ¿qué debería mejorar primero?' },
    { label: 'Explícame las métricas',     prompt: 'Explícame la diferencia entre CTR, CPC, CPM, CPA y ROAS en términos simples.' },
    { label: 'Benchmark de CTR',           prompt: '¿Cuál es un buen CTR para anuncios en Facebook e Instagram?' },
  ],
  '/generator': [
    { label: 'Mejor A/B test',             prompt: '¿Cómo hago un buen test A/B? ¿Qué debo probar primero?' },
    { label: 'Crea 3 CTAs',               prompt: 'Crea 3 variaciones de CTA para un anuncio de venta directa.' },
    { label: 'Hook más fuerte',            prompt: '¿Cómo escribo un hook más fuerte para el headline de mi anuncio?' },
  ],
  '/history': [
    { label: '¿Qué ha funcionado mejor?', prompt: '¿Qué elementos suelen tener los anuncios con mejor historial de rendimiento?' },
    { label: 'Patrón ganador',            prompt: 'Ayúdame a identificar el patrón en mis anuncios con más conversiones.' },
    { label: 'Estrategia de escalado',    prompt: '¿Cuándo y cómo debería escalar un anuncio que está funcionando?' },
  ],
  '/meta-connect': [
    { label: 'Cómo conectar Meta Ads',    prompt: '¿Cómo sincronizo mi cuenta de Meta Ads con AdGenius?' },
    { label: 'Métricas de Meta',          prompt: 'Explícame las métricas más importantes del dashboard de Meta Ads.' },
    { label: '¿Qué plan necesito?',       prompt: 'Para conectar Meta Ads y ver métricas reales, ¿qué plan de AdGenius necesito?' },
  ],
  '/creative-studio': [
    { label: 'Mejora este titular',       prompt: 'Ayúdame a mejorar el titular de mi creatividad para que sea más impactante.' },
    { label: '3 ideas visuales',          prompt: 'Dame 3 ideas de concepto visual para un anuncio de producto físico.' },
    { label: 'Formato para Instagram',   prompt: '¿Qué formato de creative funciona mejor en Instagram Feed vs Stories en 2025?' },
  ],
};

const DEFAULT_SUGGESTIONS = [
  { label: 'Mejora un copy',            prompt: 'Mejora este copy: [pega tu texto aquí]' },
  { label: 'Idea de anuncio',           prompt: 'Dame una idea de anuncio para mi negocio.' },
  { label: '¿Qué debo probar hoy?',    prompt: '¿Qué debería probar o mejorar en mi marketing hoy?' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function readUsageCount(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(`nova_usage_${getMonthKey()}`) ?? '0', 10);
}

function incrementUsageCount(): number {
  if (typeof window === 'undefined') return 0;
  const next = readUsageCount() + 1;
  localStorage.setItem(`nova_usage_${getMonthKey()}`, String(next));
  return next;
}

/** Minimal inline markdown renderer: **bold**, numbered lists, bullet lines */
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  return lines.map((line, li) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((part, pi) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={pi} style={{ fontWeight: 700, color: '#e2e8f0' }}>{part.slice(2, -2)}</strong>;
      }
      return <span key={pi}>{part}</span>;
    });

    const isBullet  = /^\s*[-•*]\s/.test(line);
    const isNumbered = /^\s*\d+\./.test(line);

    if (isBullet) {
      const stripped = line.trimStart().replace(/^[-•*]\s+/, '');
      const bulletParts = stripped.split(/(\*\*[^*]+\*\*)/g).map((part, pi) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={pi} style={{ fontWeight: 700, color: '#e2e8f0' }}>{part.slice(2, -2)}</strong>
          : <span key={pi}>{part}</span>
      );
      return (
        <span key={li} style={{ display: 'block', paddingLeft: 14, position: 'relative', marginBottom: 2 }}>
          <span style={{ position: 'absolute', left: 0, color: '#8B5CF6' }}>•</span>
          {bulletParts}
          {li < lines.length - 1 && <br />}
        </span>
      );
    }

    if (isNumbered) {
      return (
        <span key={li} style={{ display: 'block', paddingLeft: 20, position: 'relative' }}>
          {rendered}{li < lines.length - 1 && <br />}
        </span>
      );
    }

    return (
      <span key={li} style={{ display: li === 0 ? 'inline' : 'block' }}>
        {rendered}{li < lines.length - 1 && <br />}
      </span>
    );
  });
}

// ─── Tier badge colours ───────────────────────────────────────────────────────

const TIER_BADGE: Record<NovaTier, { bg: string; text: string; label: string }> = {
  FREE: { bg: '#1f2937',  text: '#9ca3af', label: 'FREE'  },
  PLUS: { bg: '#1e1b4b',  text: '#818cf8', label: 'PLUS'  },
  PRO:  { bg: '#1a0533',  text: '#a855f7', label: 'PRO'   },
};

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center', padding: '2px 0' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: '50%', background: '#8B5CF6',
          animation: 'novaDot 1.2s infinite', animationDelay: `${i * 0.2}s`,
        }} />
      ))}
      <style>{`
        @keyframes novaDot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40%            { opacity: 1;   transform: scale(1);   }
        }
        @keyframes novaSlideIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>
    </span>
  );
}

// ─── Feedback row under Nova messages ────────────────────────────────────────

interface FeedbackRowProps {
  msgId:      string;
  msgText:    string;
  userMsg?:   string;
  sent:       FeedbackKind | null;
  onFeedback: (msgId: string, kind: FeedbackKind, msgText: string, userMsg?: string) => void;
}

function FeedbackRow({ msgId, msgText, userMsg, sent, onFeedback }: FeedbackRowProps) {
  if (sent) {
    const labels: Record<FeedbackKind, string> = {
      useful:     '👍 Gracias',
      not_useful: '👎 Anotado',
      saved:      '💾 Guardado',
      winner:     '🏆 Marcado',
    };
    return (
      <div style={{ marginTop: 6, fontSize: 10, color: '#4b5563', paddingLeft: 2 }}>
        {labels[sent]}
      </div>
    );
  }

  const btn = (kind: FeedbackKind, Icon: React.ComponentType<{ size?: number; color?: string }>, label: string, color: string) => (
    <button
      key={kind}
      onClick={() => onFeedback(msgId, kind, msgText, userMsg)}
      title={label}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '3px 7px', borderRadius: 6, cursor: 'pointer',
        background: 'transparent', border: '1px solid rgba(255,255,255,0.06)',
        color: '#6b7280', fontSize: 10, fontWeight: 500, transition: 'all 0.15s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
        (e.currentTarget as HTMLButtonElement).style.color = color;
        (e.currentTarget as HTMLButtonElement).style.borderColor = color;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        (e.currentTarget as HTMLButtonElement).style.color = '#6b7280';
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.06)';
      }}
    >
      <Icon size={10} color="currentColor" />
      {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
      {btn('useful',     ThumbsUp,  'Útil',      '#10b981')}
      {btn('not_useful', ThumbsDown,'No útil',   '#ef4444')}
      {btn('saved',      Bookmark,  'Guardar',   '#6366f1')}
      {btn('winner',     Star,      'Ganador',   '#f59e0b')}
    </div>
  );
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

interface QuickActionsProps {
  tier: NovaTier;
  onQuickAction: (id: string, prompt: string, required: NovaTier) => void;
}

function QuickActions({ tier, onQuickAction }: QuickActionsProps) {
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#4b5563', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 2 }}>
        Acciones rápidas
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {NOVA_QUICK_ACTIONS.map(action => {
          const locked = !tierAtLeast(tier, action.requiredTier);
          return (
            <button
              key={action.id}
              onClick={() => onQuickAction(action.id, action.prompt, action.requiredTier)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 10,
                background: locked ? 'rgba(255,255,255,0.02)' : 'rgba(99,102,241,0.08)',
                border: locked ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(99,102,241,0.2)',
                cursor: 'pointer', textAlign: 'left', width: '100%',
                transition: 'background 0.15s, border-color 0.15s', opacity: locked ? 0.6 : 1,
              }}
              onMouseEnter={e => {
                if (!locked) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.14)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,102,241,0.35)';
                }
              }}
              onMouseLeave={e => {
                if (!locked) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.08)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(99,102,241,0.2)';
                }
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{action.icon}</span>
              <span style={{ flex: 1, fontSize: 13, color: locked ? '#6b7280' : '#d1d5db', fontWeight: 500 }}>
                {action.label}
              </span>
              {locked ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <Lock size={12} color="#6b7280" />
                  <span style={{
                    fontSize: 9, fontWeight: 700,
                    color:      action.requiredTier === 'PRO' ? '#a855f7' : '#818cf8',
                    background: action.requiredTier === 'PRO' ? 'rgba(168,85,247,0.12)' : 'rgba(129,140,248,0.12)',
                    padding: '2px 5px', borderRadius: 4, letterSpacing: '0.3px',
                  }}>
                    {action.requiredTier}
                  </span>
                </span>
              ) : (
                <Zap size={13} color="#6366F1" style={{ flexShrink: 0 }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page suggestion chips ────────────────────────────────────────────────────

interface PageSuggestionsProps {
  currentPage: string;
  onSend: (text: string) => void;
}

function PageSuggestions({ currentPage, onSend }: PageSuggestionsProps) {
  const suggestions = PAGE_SUGGESTIONS[currentPage] ?? DEFAULT_SUGGESTIONS;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#4b5563', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 2 }}>
        Sugerencias para esta pantalla
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSend(s.prompt)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
              background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)',
              color: '#9ca3af', fontSize: 12, textAlign: 'left', width: '100%',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.1)';
              (e.currentTarget as HTMLButtonElement).style.color = '#d1d5db';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(16,185,129,0.3)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.05)';
              (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(16,185,129,0.15)';
            }}
          >
            <Rocket size={11} color="#10b981" style={{ flexShrink: 0 }} />
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Welcome Screen ───────────────────────────────────────────────────────────

interface WelcomeScreenProps {
  tier:        NovaTier;
  currentPage: string;
  caps:        ReturnType<typeof import('@/lib/nova-capabilities').getNovaCapabilities>;
  onQuickAction: (id: string, prompt: string, required: NovaTier) => void;
  onSend:      (text: string) => void;
}

function WelcomeScreen({ tier, currentPage, onQuickAction, onSend }: WelcomeScreenProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '4px 0' }}>
      <div style={{ textAlign: 'center', padding: '16px 8px 8px' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366F1, #A855F7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px', boxShadow: '0 4px 20px rgba(139,92,246,0.35)',
        }}>
          <span style={{ fontWeight: 800, fontSize: 24, color: '#fff' }}>N</span>
        </div>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9', marginBottom: 4 }}>Hola, soy NOVA</div>
        <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
          Tu asistente de marketing en AdGenius.<br />Puedo ayudarte a crear mejores anuncios y campañas.
        </div>
      </div>
      <PageSuggestions currentPage={currentPage} onSend={onSend} />
      <QuickActions tier={tier} onQuickAction={onQuickAction} />
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

interface MessageBubbleProps {
  msg:        ChatMessage;
  userMsg?:   string;
  feedback:   FeedbackKind | null;
  onFeedback: (msgId: string, kind: FeedbackKind, msgText: string, userMsg?: string) => void;
}

function MessageBubble({ msg, userMsg, feedback, onFeedback }: MessageBubbleProps) {
  const isUser = msg.role === 'user';

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{
          maxWidth: '80%',
          background: 'linear-gradient(135deg, #059669, #10b981)',
          borderRadius: '14px 14px 4px 14px',
          padding: '9px 13px', fontSize: 13, color: '#ecfdf5',
          lineHeight: 1.5, wordBreak: 'break-word',
          animation: 'novaSlideIn 0.18s ease',
        }}>
          {msg.content}
        </div>
      </div>
    );
  }

  const showFeedback = !msg.loading && !msg.gated && msg.content.length > 20;

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      {/* Avatar */}
      <div style={{
        width: 26, height: 26, borderRadius: '50%',
        background: 'linear-gradient(135deg, #6366F1, #A855F7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 2,
      }}>
        <span style={{ fontWeight: 800, fontSize: 11, color: '#fff' }}>N</span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          background: msg.gated ? 'rgba(168,85,247,0.08)' : '#1f2937',
          border: msg.gated ? '1px solid rgba(168,85,247,0.25)' : '1px solid rgba(255,255,255,0.05)',
          borderRadius: '4px 14px 14px 14px',
          padding: '9px 13px', fontSize: 13, color: '#d1d5db',
          lineHeight: 1.6, wordBreak: 'break-word',
          animation: 'novaSlideIn 0.18s ease',
        }}>
          {msg.loading ? <TypingDots /> : <>{renderMarkdown(msg.content)}</>}

          {msg.gated && (
            <div style={{ marginTop: 10 }}>
              <a
                href="#"
                onClick={e => { e.preventDefault(); }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: 'linear-gradient(135deg, #6366F1, #A855F7)',
                  color: '#fff', padding: '6px 12px', borderRadius: 8,
                  fontSize: 12, fontWeight: 600, textDecoration: 'none',
                }}
              >
                <Zap size={12} />Mejorar plan
              </a>
            </div>
          )}
        </div>

        {showFeedback && (
          <FeedbackRow
            msgId={msg.id}
            msgText={msg.content}
            userMsg={userMsg}
            sent={feedback}
            onFeedback={onFeedback}
          />
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface NovaChatProps {
  currentPage?: string;
}

export default function NovaChat({ currentPage = '/' }: NovaChatProps) {
  const { planId, loading: planLoading } = usePlan();

  const [isOpen,      setIsOpen]      = useState(false);
  const [messages,    setMessages]    = useState<ChatMessage[]>([]);
  const [input,       setInput]       = useState('');
  const [isLoading,   setIsLoading]   = useState(false);
  const [usageCount,  setUsageCount]  = useState(0);
  const [isDemo,      setIsDemo]      = useState(false);
  // feedbackMap: msgId → FeedbackKind (tracks which messages have received feedback)
  const [feedbackMap, setFeedbackMap] = useState<Record<string, FeedbackKind>>({});
  // Map from Nova msg id → user msg text that prompted it
  const lastUserMsgRef = useRef<string>('');

  const messagesEndRef     = useRef<HTMLDivElement>(null);
  const inputRef           = useRef<HTMLTextAreaElement>(null);
  const abortRef           = useRef<AbortController | null>(null);
  const welcomeInjectedRef = useRef(false);

  useEffect(() => { setUsageCount(readUsageCount()); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 120);
      if (!welcomeInjectedRef.current) {
        welcomeInjectedRef.current = true;
        setMessages([{
          id:      'nova-welcome',
          role:    'nova',
          content: '¡Hola! Soy **NOVA** ✨ Tu asistente de marketing en AdGenius. Puedo ayudarte a crear mejores anuncios, mejorar copies, analizar campañas y más.\n\n¿En qué empezamos?',
        }]);
      }
    }
  }, [isOpen]);

  const tier  = planLoading ? 'PLUS' : getNovaTier(planId as PlanId);
  const caps  = NOVA_CAPABILITIES[NOVA_TIER_MAP[planId as PlanId] ?? 'PLUS'];
  const badge = TIER_BADGE[tier];

  // ── Feedback & memory ──────────────────────────────────────────────────────

  const sendFeedback = useCallback(
    async (msgId: string, kind: FeedbackKind, msgText: string, userMsg?: string) => {
      setFeedbackMap(prev => ({ ...prev, [msgId]: kind }));

      // POST to /api/nova/feedback (fire-and-forget)
      fetch('/api/nova/feedback', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          messageId:   msgId,
          messageText: msgText.slice(0, 2000),
          feedback:    kind === 'useful' ? 'useful'
                     : kind === 'not_useful' ? 'not_useful'
                     : kind === 'saved'  ? 'saved'
                     : 'winner',
          userMessage: userMsg?.slice(0, 500),
        }),
      }).catch(() => {}); // silent

      // If marking as saved or winner → also save to NovaMemory
      if (kind === 'saved' || kind === 'winner') {
        const memType = kind === 'winner' ? 'accepted_recommendation' : 'winning_copy';
        fetch('/api/nova/memory', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            type:       memType,
            content:    msgText.slice(0, 500),
            source:     'user_feedback',
            confidence: kind === 'winner' ? 90 : 70,
          }),
        }).catch(() => {}); // silent
      }
    },
    [],
  );

  // ── Build history ──────────────────────────────────────────────────────────

  function buildHistory(): Array<{ role: 'user' | 'assistant'; content: string }> {
    return messages
      .filter(m => !m.loading && !m.gated && m.content)
      .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));
  }

  // ── Core send ─────────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string, intentId?: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const maxMsgs = caps.maxMessagesPerMonth;
      if (usageCount >= maxMsgs) {
        setMessages(prev => [...prev, {
          id:    `limit-${Date.now()}`,
          role:  'nova',
          content: `Has alcanzado el límite de **${maxMsgs} mensajes** este mes para el plan **${tier}**. Mejora tu plan para seguir usando NOVA sin restricciones. 🚀`,
          gated: true,
        }]);
        return;
      }

      lastUserMsgRef.current = trimmed;

      const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: trimmed };
      const loadingId = `n-${Date.now()}`;
      const loadingMsg: ChatMessage = { id: loadingId, role: 'nova', content: '', loading: true };

      const historySnapshot = buildHistory();

      setMessages(prev => [...prev, userMsg, loadingMsg]);
      setInput('');
      setIsLoading(true);

      const newCount = incrementUsageCount();
      setUsageCount(newCount);

      abortRef.current = new AbortController();

      try {
        const res = await fetch('/api/nova/chat', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            message: trimmed,
            intent:  intentId,
            history: historySnapshot,
            page:    currentPage,
          }),
          signal: abortRef.current.signal,
        });

        const contentType = res.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
          const data = await res.json() as { reply?: string; error?: string; gated?: boolean; mode?: 'demo' | 'live' };
          if (data.mode === 'demo') setIsDemo(true);
          const replyText = data.reply ?? data.error ?? 'Algo salió mal. Intenta de nuevo.';
          setMessages(prev =>
            prev.map(m => m.id === loadingId ? { ...m, content: replyText, loading: false, gated: !!data.gated } : m)
          );
          return;
        }

        const novaMode = res.headers.get('x-nova-mode');
        if (novaMode === 'live') setIsDemo(false);

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response body');
        const decoder = new TextDecoder();
        let accumulated = '';

        setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, loading: false } : m));

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, content: accumulated } : m));
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          setMessages(prev => prev.map(m => m.id === loadingId
            ? { ...m, loading: false, content: m.content || '_(respuesta cancelada)_' }
            : m
          ));
          return;
        }
        setMessages(prev => prev.map(m => m.id === loadingId
          ? { ...m, content: 'NOVA no está disponible en este momento. Intenta de nuevo en unos segundos.', loading: false }
          : m
        ));
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isLoading, usageCount, caps, tier, messages, currentPage],
  );

  function handleSubmit(e: React.FormEvent) { e.preventDefault(); void sendMessage(input); }
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage(input); }
  }

  function handleQuickAction(actionId: string, prompt: string, requiredTier: NovaTier) {
    if (!tierAtLeast(tier, requiredTier)) {
      setMessages(prev => [...prev, {
        id:    `upgrade-${Date.now()}`,
        role:  'nova',
        content: `Esta acción requiere el plan **${requiredTier}**. Mejora tu suscripción para desbloquear ${
          requiredTier === 'PLUS'
            ? 'campañas completas, variaciones de copy y más.'
            : 'análisis avanzado, recomendaciones IA y optimizaciones basadas en datos reales.'
        } 🚀`,
        gated: true,
      }]);
      return;
    }
    void sendMessage(prompt, actionId);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const hasMessages     = messages.length > 0;
  const hasUserMessages = messages.some(m => m.role === 'user');

  // Build map: nova msg id → previous user msg content
  const userMsgForNova: Record<string, string> = {};
  let lastUser = '';
  for (const m of messages) {
    if (m.role === 'user') { lastUser = m.content; }
    else if (m.role === 'nova' && !m.loading) { userMsgForNova[m.id] = lastUser; }
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen(v => !v)}
        aria-label="Abrir NOVA, asistente IA"
        style={{
          position: 'fixed', bottom: 24, right: 24,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A855F7 100%)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 24px rgba(139,92,246,0.45)', zIndex: 9999,
          transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 32px rgba(139,92,246,0.6)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 24px rgba(139,92,246,0.45)';
        }}
      >
        {isOpen ? (
          <X size={22} color="#fff" />
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span style={{ fontWeight: 800, fontSize: 20, color: '#fff', lineHeight: 1, letterSpacing: '-0.5px' }}>N</span>
            <Sparkles size={11} color="rgba(255,255,255,0.85)" />
          </span>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="NOVA AI Chat"
          style={{
            position: 'fixed', bottom: 92, right: 24,
            width: 420, maxWidth: 'calc(100vw - 32px)',
            height: 620, maxHeight: 'calc(100vh - 108px)',
            borderRadius: 16, background: '#111827',
            border: '1px solid rgba(139,92,246,0.2)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.1)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            zIndex: 9997, animation: 'novaSlideIn 0.22s ease',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'linear-gradient(180deg, rgba(99,102,241,0.08) 0%, transparent 100%)',
            flexShrink: 0,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366F1, #A855F7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontWeight: 800, fontSize: 16, color: '#fff', letterSpacing: '-0.5px' }}>N</span>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>NOVA</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                  background: badge.bg, color: badge.text, letterSpacing: '0.5px',
                }}>
                  {badge.label}
                </span>
                {isDemo && (
                  <span style={{
                    fontSize: 9, fontWeight: 600, padding: '2px 5px', borderRadius: 3,
                    background: 'rgba(107,114,128,0.12)', color: '#9ca3af',
                    letterSpacing: '0.4px', border: '1px solid rgba(107,114,128,0.2)',
                  }}>
                    Demo
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>Asistente de marketing IA</div>
            </div>

            <div style={{ fontSize: 10, color: '#6b7280', textAlign: 'right', flexShrink: 0 }}>
              <span style={{ color: usageCount >= caps.maxMessagesPerMonth ? '#ef4444' : '#9ca3af' }}>
                {usageCount}
              </span>
              <span style={{ color: '#4b5563' }}>/{caps.maxMessagesPerMonth}</span>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar NOVA"
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                color: '#6b7280', display: 'flex', borderRadius: 6, transition: 'color 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#e2e8f0'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '12px 14px',
            display: 'flex', flexDirection: 'column', gap: 8,
            scrollbarWidth: 'thin', scrollbarColor: 'rgba(139,92,246,0.25) transparent',
          }}>
            {!hasMessages ? (
              <WelcomeScreen
                tier={tier}
                caps={caps}
                currentPage={currentPage}
                onQuickAction={handleQuickAction}
                onSend={text => void sendMessage(text)}
              />
            ) : (
              <>
                {messages.map(msg => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    userMsg={userMsgForNova[msg.id]}
                    feedback={feedbackMap[msg.id] ?? null}
                    onFeedback={sendFeedback}
                  />
                ))}
                {!hasUserMessages && (
                  <>
                    <PageSuggestions currentPage={currentPage} onSend={text => void sendMessage(text)} />
                    <QuickActions tier={tier} onQuickAction={handleQuickAction} />
                  </>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            style={{
              borderTop: '1px solid rgba(255,255,255,0.06)',
              padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'flex-end',
              background: 'rgba(0,0,0,0.2)', flexShrink: 0,
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pregunta algo a NOVA…"
              rows={1}
              disabled={isLoading}
              style={{
                flex: 1, resize: 'none',
                background: '#1f2937', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10, color: '#e2e8f0', fontSize: 13,
                padding: '9px 12px', outline: 'none',
                minHeight: 38, maxHeight: 120, overflowY: 'auto',
                lineHeight: '1.45', fontFamily: 'inherit', transition: 'border-color 0.15s',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.5)'; }}
              onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Enviar mensaje"
              style={{
                width: 38, height: 38, borderRadius: 10,
                background: isLoading || !input.trim()
                  ? '#1f2937'
                  : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                border: 'none',
                cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s, opacity 0.15s',
                opacity: isLoading || !input.trim() ? 0.4 : 1, flexShrink: 0,
              }}
            >
              <Send size={16} color="#fff" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
