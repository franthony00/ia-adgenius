'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { Sparkles, X, Send, Lock, Zap } from 'lucide-react';
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
  id: string;
  role: 'user' | 'nova';
  content: string;
  loading?: boolean;
  gated?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function readUsageCount(): number {
  if (typeof window === 'undefined') return 0;
  const key = `nova_usage_${getMonthKey()}`;
  return parseInt(localStorage.getItem(key) ?? '0', 10);
}

function incrementUsageCount(): number {
  if (typeof window === 'undefined') return 0;
  const key = `nova_usage_${getMonthKey()}`;
  const next = readUsageCount() + 1;
  localStorage.setItem(key, String(next));
  return next;
}

/** Minimal inline markdown renderer: **bold**, \n → <br>, bullet lines */
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  return lines.map((line, li) => {
    // Split on **bold** markers
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((part, pi) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={pi} style={{ fontWeight: 700, color: '#e2e8f0' }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={pi}>{part}</span>;
    });

    const isBullet = line.trimStart().startsWith('• ') || line.trimStart().startsWith('* ') || line.trimStart().startsWith('- ');
    const isNumbered = /^\s*\d+\./.test(line);

    if (isBullet) {
      // Strip the leading bullet char so we don't render double bullets
      const stripped = line.trimStart().replace(/^[•*-]\s+/, '');
      const bulletParts = stripped.split(/(\*\*[^*]+\*\*)/g).map((part, pi) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pi} style={{ fontWeight: 700, color: '#e2e8f0' }}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={pi}>{part}</span>;
      });
      return (
        <span key={li} style={{ display: 'block', paddingLeft: '14px', position: 'relative', marginBottom: '2px' }}>
          <span style={{ position: 'absolute', left: 0, color: '#8B5CF6' }}>•</span>
          {bulletParts}
          {li < lines.length - 1 && <br />}
        </span>
      );
    }

    if (isNumbered) {
      return (
        <span key={li} style={{ display: 'block', paddingLeft: '20px', position: 'relative' }}>
          {rendered}
          {li < lines.length - 1 && <br />}
        </span>
      );
    }

    return (
      <span key={li} style={{ display: li === 0 ? 'inline' : 'block' }}>
        {rendered}
        {li < lines.length - 1 && <br />}
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
    <span style={{ display: 'inline-flex', gap: '3px', alignItems: 'center', padding: '2px 0' }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#8B5CF6',
            animation: 'novaDot 1.2s infinite',
            animationDelay: `${i * 0.2}s`,
          }}
        />
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
                display:      'flex',
                alignItems:   'center',
                gap:          10,
                padding:      '9px 12px',
                borderRadius: 10,
                background:   locked ? 'rgba(255,255,255,0.02)' : 'rgba(99,102,241,0.08)',
                border:       locked ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(99,102,241,0.2)',
                cursor:       'pointer',
                textAlign:    'left',
                width:        '100%',
                transition:   'background 0.15s, border-color 0.15s',
                opacity:      locked ? 0.6 : 1,
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
                    color:       action.requiredTier === 'PRO' ? '#a855f7' : '#818cf8',
                    background:  action.requiredTier === 'PRO' ? 'rgba(168,85,247,0.12)' : 'rgba(129,140,248,0.12)',
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

// ─── Welcome Screen ───────────────────────────────────────────────────────────

interface WelcomeScreenProps {
  tier: NovaTier;
  caps: ReturnType<typeof import('@/lib/nova-capabilities').getNovaCapabilities>;
  onQuickAction: (id: string, prompt: string, required: NovaTier) => void;
}

function WelcomeScreen({ tier, onQuickAction }: WelcomeScreenProps) {
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
        <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>Tu asistente de publicidad IA. ¿En qué te ayudo hoy?</div>
      </div>
      <QuickActions tier={tier} onQuickAction={onQuickAction} />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function NovaChat() {
  const { planId, loading: planLoading } = usePlan();

  const [isOpen,    setIsOpen]    = useState(false);
  const [messages,  setMessages]  = useState<ChatMessage[]>([]);
  const [input,     setInput]     = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  // isDemo: true when the server responds without ANTHROPIC_API_KEY or Anthropic fails
  const [isDemo,    setIsDemo]    = useState(false);

  const messagesEndRef      = useRef<HTMLDivElement>(null);
  const inputRef            = useRef<HTMLTextAreaElement>(null);
  const abortRef            = useRef<AbortController | null>(null);
  const welcomeInjectedRef  = useRef(false);

  // Read usage from localStorage on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUsageCount(readUsageCount());
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input + inject welcome message when panel first opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 120);
      if (!welcomeInjectedRef.current) {
        welcomeInjectedRef.current = true;
        setMessages([{
          id:      'nova-welcome',
          role:    'nova',
          content: '¡Hola! Soy **NOVA** ✨ Tu asistente de publicidad en AdGenius. ¿En qué te ayudo hoy?',
        }]);
      }
    }
  }, [isOpen]);

  const tier = planLoading ? 'PLUS' : getNovaTier(planId as PlanId);
  const caps = NOVA_CAPABILITIES[NOVA_TIER_MAP[planId as PlanId] ?? 'PLUS'];
  const badge = TIER_BADGE[tier];

  // Log Nova mode whenever it changes
  useEffect(() => {
    console.log('[NOVA] mode:', isDemo ? 'demo' : 'live');
  }, [isDemo]);

  // Build history from messages for the API
  function buildHistory(): Array<{ role: 'user' | 'assistant'; content: string }> {
    return messages
      .filter(m => !m.loading && !m.gated && m.content)
      .map(m => ({
        role:    m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }));
  }

  // Core send function
  const sendMessage = useCallback(
    async (text: string, intentId?: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const maxMsgs = caps.maxMessagesPerMonth;
      if (usageCount >= maxMsgs) {
        setMessages(prev => [
          ...prev,
          {
            id:      `limit-${Date.now()}`,
            role:    'nova',
            content: `Has alcanzado el límite de **${maxMsgs} mensajes** este mes para el plan **${tier}**. Mejora tu plan para seguir usando NOVA sin restricciones. 🚀`,
            gated:   true,
          },
        ]);
        return;
      }

      // Add user message
      const userMsg: ChatMessage = {
        id:      `u-${Date.now()}`,
        role:    'user',
        content: trimmed,
      };

      // Add loading placeholder for NOVA
      const loadingId = `n-${Date.now()}`;
      const loadingMsg: ChatMessage = {
        id:      loadingId,
        role:    'nova',
        content: '',
        loading: true,
      };

      const historySnapshot = buildHistory();

      setMessages(prev => [...prev, userMsg, loadingMsg]);
      setInput('');
      setIsLoading(true);

      // Increment usage
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
          }),
          signal: abortRef.current.signal,
        });

        // Check if response is JSON (demo / gated / error) vs a stream
        const contentType = res.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
          const data = await res.json() as {
            reply?: string;
            error?: string;
            gated?: boolean;
            mode?:  'demo' | 'live';
          };

          // Track demo mode: server has no API key or Anthropic fell back
          if (data.mode === 'demo') setIsDemo(true);

          const replyText =
            data.reply ??
            data.error ??
            'Algo salió mal. Intenta de nuevo.';

          setMessages(prev =>
            prev.map(m =>
              m.id === loadingId
                ? { ...m, content: replyText, loading: false, gated: !!data.gated }
                : m,
            ),
          );
          return;
        }

        // Streaming response — always live mode
        const novaMode = res.headers.get('x-nova-mode');
        if (novaMode === 'live') setIsDemo(false);

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let accumulated = '';

        // Remove loading flag immediately once streaming starts
        setMessages(prev =>
          prev.map(m =>
            m.id === loadingId ? { ...m, loading: false } : m,
          ),
        );

        while (true) { // streaming loop — exits on done
          const { done, value } = await reader.read();
          if (done) break;

          accumulated += decoder.decode(value, { stream: true });

          setMessages(prev =>
            prev.map(m =>
              m.id === loadingId ? { ...m, content: accumulated } : m,
            ),
          );
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // User cancelled — leave partial content as-is
          setMessages(prev =>
            prev.map(m =>
              m.id === loadingId
                ? { ...m, loading: false, content: m.content || '_(respuesta cancelada)_' }
                : m,
            ),
          );
          return;
        }

        setMessages(prev =>
          prev.map(m =>
            m.id === loadingId
              ? {
                  ...m,
                  content: 'NOVA no está disponible en este momento. Intenta de nuevo en unos segundos.',
                  loading: false,
                }
              : m,
          ),
        );
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isLoading, usageCount, caps, tier, messages],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void sendMessage(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  }

  function handleQuickAction(actionId: string, prompt: string, requiredTier: NovaTier) {
    if (!tierAtLeast(tier, requiredTier)) {
      // Show inline upgrade nudge instead of sending
      const upgradeMsg: ChatMessage = {
        id:      `upgrade-${Date.now()}`,
        role:    'nova',
        content: `Esta acción requiere el plan **${requiredTier}**. Mejora tu suscripción para desbloquear ${
          requiredTier === 'PLUS'
            ? 'campañas completas, variaciones de copy y más.'
            : 'análisis avanzado, recomendaciones IA y optimizaciones basadas en datos reales.'
        } 🚀`,
        gated: true,
      };
      setMessages(prev => [...prev, upgradeMsg]);
      return;
    }
    void sendMessage(prompt, actionId);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const hasMessages     = messages.length > 0;
  const hasUserMessages = messages.some(m => m.role === 'user');

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen(v => !v)}
        aria-label="Abrir NOVA, asistente IA"
        style={{
          position:     'fixed',
          bottom:       24,
          right:        24,
          width:        56,
          height:       56,
          borderRadius: '50%',
          background:   'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A855F7 100%)',
          border:       'none',
          cursor:       'pointer',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          boxShadow:    '0 4px 24px rgba(139,92,246,0.45)',
          zIndex:       9999,
          transition:   'transform 0.18s ease, box-shadow 0.18s ease',
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
            <span style={{
              fontWeight: 800,
              fontSize:   20,
              color:      '#fff',
              lineHeight: 1,
              letterSpacing: '-0.5px',
            }}>N</span>
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
            position:     'fixed',
            bottom:       92,
            right:        24,
            width:        420,
            maxWidth:     'calc(100vw - 32px)',
            height:       600,
            maxHeight:    'calc(100vh - 108px)',
            borderRadius: 16,
            background:   '#111827',
            border:       '1px solid rgba(139,92,246,0.2)',
            boxShadow:    '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.1)',
            display:      'flex',
            flexDirection: 'column',
            overflow:     'hidden',
            zIndex:       9997,
            animation:    'novaSlideIn 0.22s ease',
          }}
        >
          {/* ── Header ── */}
          <div style={{
            display:        'flex',
            alignItems:     'center',
            gap:            10,
            padding:        '14px 16px',
            borderBottom:   '1px solid rgba(255,255,255,0.06)',
            background:     'linear-gradient(180deg, rgba(99,102,241,0.08) 0%, transparent 100%)',
            flexShrink:     0,
          }}>
            {/* Logo mark */}
            <div style={{
              width:        36,
              height:       36,
              borderRadius: '50%',
              background:   'linear-gradient(135deg, #6366F1, #A855F7)',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              flexShrink:   0,
            }}>
              <span style={{ fontWeight: 800, fontSize: 16, color: '#fff', letterSpacing: '-0.5px' }}>N</span>
            </div>

            {/* Name + status */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>NOVA</span>
                {/* Plan badge */}
                <span style={{
                  fontSize:     10,
                  fontWeight:   700,
                  padding:      '2px 6px',
                  borderRadius: 4,
                  background:   badge.bg,
                  color:        badge.text,
                  letterSpacing: '0.5px',
                }}>
                  {badge.label}
                </span>
                {/* Demo mode badge — only when API key is absent */}
                {isDemo && (
                  <span style={{
                    fontSize:      9,
                    fontWeight:    600,
                    padding:       '2px 5px',
                    borderRadius:  3,
                    background:    'rgba(107,114,128,0.12)',
                    color:         '#9ca3af',
                    letterSpacing: '0.4px',
                    border:        '1px solid rgba(107,114,128,0.2)',
                  }}>
                    Demo
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>
                Asistente de publicidad IA
              </div>
            </div>

            {/* Usage counter */}
            <div style={{
              fontSize:   10,
              color:      '#6b7280',
              textAlign:  'right',
              flexShrink: 0,
            }}>
              <span style={{ color: usageCount >= caps.maxMessagesPerMonth ? '#ef4444' : '#9ca3af' }}>
                {usageCount}
              </span>
              <span style={{ color: '#4b5563' }}>/{caps.maxMessagesPerMonth}</span>
            </div>

            {/* Close */}
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar NOVA"
              style={{
                background: 'none',
                border:     'none',
                cursor:     'pointer',
                padding:    4,
                color:      '#6b7280',
                display:    'flex',
                borderRadius: 6,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#e2e8f0'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}
            >
              <X size={18} />
            </button>
          </div>

          {/* ── Body ── */}
          <div style={{
            flex:       1,
            overflowY:  'auto',
            padding:    '12px 14px',
            display:    'flex',
            flexDirection: 'column',
            gap:        8,
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(139,92,246,0.25) transparent',
          }}>
            {!hasMessages ? (
              // Fallback welcome screen (shown only before welcome message injects)
              <WelcomeScreen
                tier={tier}
                caps={caps}
                onQuickAction={handleQuickAction}
              />
            ) : (
              <>
                {messages.map(msg => (
                  <MessageBubble key={msg.id} msg={msg} />
                ))}
                {/* Show quick actions below welcome message until user starts chatting */}
                {!hasUserMessages && (
                  <QuickActions
                    tier={tier}
                    onQuickAction={handleQuickAction}
                  />
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Input area ── */}
          <form
            onSubmit={handleSubmit}
            style={{
              borderTop:  '1px solid rgba(255,255,255,0.06)',
              padding:    '10px 12px',
              display:    'flex',
              gap:        8,
              alignItems: 'flex-end',
              background: 'rgba(0,0,0,0.2)',
              flexShrink: 0,
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
                flex:       1,
                resize:     'none',
                background: '#1f2937',
                border:     '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10,
                color:      '#e2e8f0',
                fontSize:   13,
                padding:    '9px 12px',
                outline:    'none',
                minHeight:  38,
                maxHeight:  120,
                overflowY:  'auto',
                lineHeight: '1.45',
                fontFamily: 'inherit',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.5)'; }}
              onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Enviar mensaje"
              style={{
                width:        38,
                height:       38,
                borderRadius: 10,
                background:   isLoading || !input.trim()
                  ? '#1f2937'
                  : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                border:       'none',
                cursor:       isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                transition:   'background 0.15s, opacity 0.15s',
                opacity:      isLoading || !input.trim() ? 0.4 : 1,
                flexShrink:   0,
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

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{
          maxWidth:     '80%',
          background:   'linear-gradient(135deg, #059669, #10b981)',
          borderRadius: '14px 14px 4px 14px',
          padding:      '9px 13px',
          fontSize:     13,
          color:        '#ecfdf5',
          lineHeight:   1.5,
          wordBreak:    'break-word',
          animation:    'novaSlideIn 0.18s ease',
        }}>
          {msg.content}
        </div>
      </div>
    );
  }

  // NOVA message
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      {/* Small avatar */}
      <div style={{
        width:          26,
        height:         26,
        borderRadius:   '50%',
        background:     'linear-gradient(135deg, #6366F1, #A855F7)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexShrink:     0,
        marginTop:      2,
      }}>
        <span style={{ fontWeight: 800, fontSize: 11, color: '#fff' }}>N</span>
      </div>

      <div style={{
        flex:         1,
        background:   msg.gated ? 'rgba(168,85,247,0.08)' : '#1f2937',
        border:       msg.gated
          ? '1px solid rgba(168,85,247,0.25)'
          : '1px solid rgba(255,255,255,0.05)',
        borderRadius: '4px 14px 14px 14px',
        padding:      '9px 13px',
        fontSize:     13,
        color:        '#d1d5db',
        lineHeight:   1.6,
        wordBreak:    'break-word',
        animation:    'novaSlideIn 0.18s ease',
      }}>
        {msg.loading ? (
          <TypingDots />
        ) : (
          <>{renderMarkdown(msg.content)}</>
        )}

        {msg.gated && (
          <div style={{ marginTop: 10 }}>
            <a
              href="/settings/billing"
              style={{
                display:        'inline-flex',
                alignItems:     'center',
                gap:            5,
                background:     'linear-gradient(135deg, #6366F1, #A855F7)',
                color:          '#fff',
                padding:        '6px 12px',
                borderRadius:   8,
                fontSize:       12,
                fontWeight:     600,
                textDecoration: 'none',
                transition:     'opacity 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.85'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1'; }}
            >
              <Zap size={12} />
              Mejorar plan
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
