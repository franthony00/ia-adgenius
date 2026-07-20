'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Palette, CreditCard, Brain, Bell, Plug, Users,
  Check, Globe, Mail, MessageSquare, ChevronRight,
  Wifi, WifiOff, Clock, DollarSign, RefreshCw,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import Header from '@/components/layout/Header';
import BrandKitPane from '@/components/settings/BrandKitPane';
import BillingPane from '@/components/settings/BillingPane';
import { cn } from '@/lib/utils';

// ─── Sections ────────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'workspace',     Icon: LayoutDashboard, label: 'Workspace',     desc: 'Name, timezone, currency' },
  { id: 'brand_kit',     Icon: Palette,          label: 'Brand Kit',     desc: 'Colors, tone, CTAs' },
  { id: 'billing',       Icon: CreditCard,       label: 'Billing Plan',  desc: 'Subscription & invoices' },
  { id: 'ai_model',      Icon: Brain,            label: 'AI Model',      desc: 'Model & parameters' },
  { id: 'notifications', Icon: Bell,             label: 'Notifications', desc: 'Alerts & preferences' },
  { id: 'integrations',  Icon: Plug,             label: 'Integrations',  desc: 'Meta Ads, Google Ads' },
  { id: 'team',          Icon: Users,            label: 'Team',          desc: 'Members & permissions' },
];

// ─── Workspace section ───────────────────────────────────────────────────────
const TIMEZONES = ['UTC-5 (EST)', 'UTC-4 (EDT)', 'UTC-3 (ART)', 'UTC-6 (CST)', 'UTC-7 (MST)', 'UTC-8 (PST)', 'UTC+0 (GMT)', 'UTC+1 (CET)'];
const CURRENCIES = ['USD — US Dollar', 'ARS — Argentine Peso', 'MXN — Mexican Peso', 'COP — Colombian Peso', 'BRL — Brazilian Real', 'EUR — Euro'];

function WorkspacePane() {
  const [form, setForm]     = useState({ name: '', timezone: 'UTC-4 (EDT)', currency: 'USD — US Dollar' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [isDemo, setIsDemo]   = useState(false);

  useEffect(() => {
    fetch('/api/workspace/settings')
      .then(r => r.json())
      .then(d => {
        setIsDemo(d.source === 'demo');
        if (d.settings) {
          setForm({
            name:     d.settings.name     ?? '',
            timezone: d.settings.timezone ?? 'UTC-4 (EDT)',
            currency: d.settings.currency ?? 'USD — US Dollar',
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (isDemo) { setSaved(true); setTimeout(() => setSaved(false), 2000); return; }
    setSaving(true);
    try {
      await fetch('/api/workspace/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, timezone: form.timezone, currency: form.currency }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* silent */ } finally { setSaving(false); }
  }

  const selectStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#E5E7EB' };

  if (loading) return <div className="h-32 flex items-center justify-center text-xs text-zinc-600">Loading…</div>;

  return (
    <div className="space-y-6">
      {isDemo && (
        <div className="rounded-xl px-4 py-3 text-xs text-amber-400 font-semibold"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          Demo mode — changes are not saved
        </div>
      )}

      <section>
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">Workspace Info</p>
        <div>
          <label className="block text-[10px] text-zinc-500 mb-1">Workspace Name</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl text-xs text-white focus:outline-none" style={selectStyle} />
        </div>
      </section>

      <section>
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">Localization</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="flex text-[10px] text-zinc-500 mb-1 items-center gap-1"><Clock size={10} /> Timezone</label>
            <select value={form.timezone} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none" style={selectStyle}>
              {TIMEZONES.map(tz => <option key={tz}>{tz}</option>)}
            </select>
          </div>
          <div>
            <label className="flex text-[10px] text-zinc-500 mb-1 items-center gap-1"><DollarSign size={10} /> Currency</label>
            <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none" style={selectStyle}>
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section>
        <p className="text-[10px] font-bold text-red-700 uppercase tracking-widest mb-3">Danger Zone</p>
        <div className="rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-white">Delete Workspace</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">Permanently delete all data. Cannot be undone.</p>
            </div>
            <button className="px-3 py-1.5 rounded-lg text-[10px] font-semibold"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171' }}>
              Delete
            </button>
          </div>
        </div>
      </section>

      <div className="flex justify-end pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
          style={{ background: saved ? '#059669' : 'linear-gradient(135deg,#10B981,#059669)' }}>
          {saved ? <><Check size={13} /> Saved</>
            : saving ? <><RefreshCw size={13} className="animate-spin" /> Saving…</>
            : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

// ─── AI Model section ────────────────────────────────────────────────────────
const AI_MODELS = [
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', desc: 'Best balance of speed and quality — recommended', badge: 'Default', badgeColor: '#10B981' },
  { id: 'claude-opus-4-6',   name: 'Claude Opus 4.6',   desc: 'Highest quality, slower — ideal for deep analysis', badge: 'Premium', badgeColor: '#818CF8' },
  { id: 'claude-haiku-4-5',  name: 'Claude Haiku 4.5',  desc: 'Fastest response, lower cost — great for bulk tasks', badge: 'Fast',    badgeColor: '#22D3EE' },
];

function AIModelPane() {
  const [selected, setSelected]       = useState('claude-sonnet-4-6');
  const [temperature, setTemperature] = useState(0.7);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);

  useEffect(() => {
    fetch('/api/workspace/settings')
      .then(r => r.json())
      .then(d => {
        if (d.settings) {
          if (d.settings.aiModel)       setSelected(d.settings.aiModel);
          if (d.settings.aiTemperature) setTemperature(d.settings.aiTemperature);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch('/api/workspace/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiModel: selected, aiTemperature: temperature }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* silent */ } finally { setSaving(false); }
  }

  if (loading) return <div className="h-32 flex items-center justify-center text-xs text-zinc-600">Loading…</div>;

  return (
    <div className="space-y-6">
      <section>
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">Default Model</p>
        <div className="space-y-2">
          {AI_MODELS.map(model => (
            <button key={model.id} onClick={() => setSelected(model.id)}
              className="w-full text-left p-4 rounded-xl transition-all"
              style={{
                background: selected === model.id ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.025)',
                border: selected === model.id ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(255,255,255,0.06)',
              }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: selected === model.id ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)',
                      border: selected === model.id ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(255,255,255,0.08)',
                    }}>
                    <Brain size={14} style={{ color: selected === model.id ? '#10B981' : '#6B7280' }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{model.name}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{model.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${model.badgeColor}20`, border: `1px solid ${model.badgeColor}40`, color: model.badgeColor }}>
                    {model.badge}
                  </span>
                  {selected === model.id && <Check size={14} className="text-emerald-400" />}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">Parameters</p>
        <div className="rounded-xl p-4 space-y-4" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-zinc-500">Temperature (creativity)</label>
              <span className="text-[10px] font-bold text-emerald-400">{temperature.toFixed(1)}</span>
            </div>
            <input type="range" min="0" max="1" step="0.1" value={temperature}
              onChange={e => setTemperature(parseFloat(e.target.value))} className="w-full accent-emerald-500" />
            <div className="flex justify-between text-[9px] text-zinc-700 mt-1">
              <span>Conservative</span><span>Creative</span>
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
          style={{ background: saved ? '#059669' : 'linear-gradient(135deg,#10B981,#059669)' }}>
          {saved ? <><Check size={13} /> Saved</>
            : saving ? <><RefreshCw size={13} className="animate-spin" /> Saving…</>
            : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}

// ─── Notifications section ───────────────────────────────────────────────────
const NOTIF_CHANNELS = [
  { id: 'email', label: 'Email Alerts',  desc: 'Campaign performance, sync completions, billing', Icon: Mail,          color: '#10B981' },
  { id: 'inapp', label: 'In-App',        desc: 'Real-time alerts inside the dashboard',           Icon: Bell,          color: '#818CF8' },
  { id: 'slack', label: 'Slack Webhook', desc: 'Send alerts to your Slack channel',               Icon: MessageSquare, color: '#22D3EE' },
];

const NOTIF_EVENTS = [
  { id: 'sync_done',     label: 'Sync completed',     desc: 'When Meta or Google Ads sync finishes' },
  { id: 'low_roas',      label: 'Low ROAS alert',     desc: 'When ROAS drops below your threshold' },
  { id: 'analysis_done', label: 'Analysis ready',     desc: 'When an AI analysis finishes' },
  { id: 'variation',     label: 'Variation approved', desc: 'When a variation is ready for A/B test' },
  { id: 'billing',       label: 'Billing events',     desc: 'Renewals, payment failures, upgrades' },
];

function ToggleSwitch({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="relative w-9 h-5 rounded-full transition-all shrink-0"
      style={{ background: active ? '#10B981' : 'rgba(255,255,255,0.08)' }}>
      <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-[left]"
        style={{ left: active ? '18px' : '2px' }} />
    </button>
  );
}

const DEFAULT_CHANNELS: Record<string, boolean> = { email: true, inapp: true, slack: false };
const DEFAULT_EVENTS:   Record<string, boolean> = { sync_done: true, low_roas: true, analysis_done: true, variation: false, billing: true };

function NotificationsPane() {
  const [channels, setChannels] = useState<Record<string, boolean>>(DEFAULT_CHANNELS);
  const [events, setEvents]     = useState<Record<string, boolean>>(DEFAULT_EVENTS);
  const [slackUrl, setSlackUrl] = useState('');
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    fetch('/api/workspace/settings')
      .then(r => r.json())
      .then(d => {
        if (d.settings) {
          if (d.settings.notifChannels)  setChannels({ ...DEFAULT_CHANNELS, ...(d.settings.notifChannels as Record<string, boolean>) });
          if (d.settings.notifEvents)    setEvents({ ...DEFAULT_EVENTS, ...(d.settings.notifEvents as Record<string, boolean>) });
          if (d.settings.slackWebhookUrl) setSlackUrl(d.settings.slackWebhookUrl);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch('/api/workspace/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifChannels: channels, notifEvents: events, slackWebhookUrl: slackUrl }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* silent */ } finally { setSaving(false); }
  }

  if (loading) return <div className="h-32 flex items-center justify-center text-xs text-zinc-600">Loading…</div>;

  return (
    <div className="space-y-6">
      <section>
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">Channels</p>
        <div className="space-y-2">
          {NOTIF_CHANNELS.map(ch => {
            const Icon = ch.Icon;
            return (
              <div key={ch.id} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${ch.color}18`, border: `1px solid ${ch.color}30` }}>
                  <Icon size={14} style={{ color: ch.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white">{ch.label}</p>
                  <p className="text-[10px] text-zinc-500">{ch.desc}</p>
                  {ch.id === 'slack' && channels.slack && (
                    <input value={slackUrl} onChange={e => setSlackUrl(e.target.value)}
                      placeholder="https://hooks.slack.com/services/..."
                      className="mt-2 w-full px-3 py-1.5 rounded-lg text-[10px] text-white placeholder-zinc-600 focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                  )}
                </div>
                <ToggleSwitch active={!!channels[ch.id]} onToggle={() => setChannels(c => ({ ...c, [ch.id]: !c[ch.id] }))} />
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">Events</p>
        <div className="space-y-1.5">
          {NOTIF_EVENTS.map(ev => (
            <div key={ev.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <p className="text-xs text-white font-medium">{ev.label}</p>
                <p className="text-[10px] text-zinc-600">{ev.desc}</p>
              </div>
              <ToggleSwitch active={!!events[ev.id]} onToggle={() => setEvents(e => ({ ...e, [ev.id]: !e[ev.id] }))} />
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
          style={{ background: saved ? '#059669' : 'linear-gradient(135deg,#10B981,#059669)' }}>
          {saved ? <><Check size={13} /> Saved</>
            : saving ? <><RefreshCw size={13} className="animate-spin" /> Saving…</>
            : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}

// ─── Integrations section ────────────────────────────────────────────────────
const INTEGRATIONS = [
  { id: 'meta',   name: 'Meta Ads',   desc: 'Facebook & Instagram ad campaigns', color: '#818CF8', connected: true,  badge: 'Connected',   badgeColor: '#10B981', detail: '2 ad accounts · Last sync 2h ago' },
  { id: 'google', name: 'Google Ads', desc: 'Search, Display & YouTube campaigns', color: '#22D3EE', connected: false, badge: 'Coming Soon', badgeColor: '#F59E0B', detail: 'Integration in development' },
  { id: 'tiktok', name: 'TikTok Ads', desc: 'Short-form video ad campaigns',    color: '#F87171', connected: false, badge: 'Coming Soon', badgeColor: '#F59E0B', detail: 'Integration in development' },
];

function IntegrationsPane() {
  return (
    <div className="space-y-6">
      <section>
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">Ad Platforms</p>
        <div className="space-y-3">
          {INTEGRATIONS.map(int => (
            <div key={int.id} className="p-4 rounded-xl"
              style={{
                background: int.connected ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.025)',
                border: int.connected ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(255,255,255,0.06)',
              }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${int.color}18`, border: `1px solid ${int.color}30` }}>
                  {int.connected ? <Wifi size={16} style={{ color: int.color }} /> : <WifiOff size={16} style={{ color: int.color }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-white">{int.name}</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: `${int.badgeColor}20`, border: `1px solid ${int.badgeColor}40`, color: int.badgeColor }}>
                      {int.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{int.desc}</p>
                  <p className="text-[10px] text-zinc-600 mt-1">{int.detail}</p>
                </div>
                {int.connected ? (
                  <button className="px-3 py-1.5 rounded-lg text-[10px] font-semibold shrink-0"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171' }}>
                    Disconnect
                  </button>
                ) : (
                  <button disabled={int.id !== 'meta'}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-semibold shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg,#10B981,#059669)', color: '#fff' }}>
                    Connect
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">API Access</p>
        <div className="rounded-xl p-4 space-y-3"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-white">API Key</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Use the API to integrate with your own tools</p>
            </div>
            <button className="px-3 py-1.5 rounded-lg text-[10px] font-semibold"
              style={{ background: 'linear-gradient(135deg,#10B981,#059669)', color: '#fff' }}>
              Generate Key
            </button>
          </div>
          <div className="px-3 py-2 rounded-lg font-mono text-[10px] text-zinc-600 select-all"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
            sk-admind-••••••••••••••••••••••••••••••••
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Team section ────────────────────────────────────────────────────────────
const ROLES = ['Admin', 'Member', 'Viewer'];

const ROLE_COLORS: Record<string, string> = {
  owner: '#10B981', admin: '#818CF8', member: '#22D3EE', viewer: '#6B7280',
};

function TeamPane() {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole]   = useState('Member');
  const [sent, setSent]               = useState(false);
  const [members, setMembers]         = useState<{ id: string; role: string; joinedAt: string; user: { id: string; name: string; email: string; avatarUrl: string | null } }[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    fetch('/api/workspace/settings')
      .then(r => r.json())
      .then(d => {
        if (d.settings?.members) setMembers(d.settings.members);
      })
      .catch(() => {})
      .finally(() => setLoadingMembers(false));
  }, []);

  return (
    <div className="space-y-6">
      <section>
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">Members</p>
        {loadingMembers ? (
          <div className="h-16 flex items-center justify-center text-xs text-zinc-600">Loading…</div>
        ) : (
          <div className="space-y-2">
            {members.map(m => {
              const color   = ROLE_COLORS[m.role] ?? '#6B7280';
              const initials = m.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
              const joined   = new Date(m.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              return (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: `${color}20`, color, border: `1px solid ${color}30` }}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{m.user.name}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{m.user.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full capitalize"
                      style={{ background: `${color}18`, border: `1px solid ${color}30`, color }}>
                      {m.role}
                    </span>
                    <span className="text-[9px] text-zinc-700">since {joined}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">Invite Member</p>
        <div className="rounded-xl p-4 space-y-3"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {sent && (
            <div className="rounded-lg px-3 py-2 text-[10px] font-semibold text-emerald-400 flex items-center gap-2"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <Check size={11} /> Invitation sent!
            </div>
          )}
          <div className="flex gap-2">
            <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="flex-1 px-3 py-2 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#E5E7EB' }}>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <button onClick={() => { if (inviteEmail) { setSent(true); setInviteEmail(''); setTimeout(() => setSent(false), 3000); } }}
            disabled={!inviteEmail}
            className="w-full py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
            Send Invitation
          </button>
          <p className="text-[10px] text-zinc-700 text-center">Team management requires Agency plan or higher</p>
        </div>
      </section>

      <section>
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">Role Permissions</p>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <table className="w-full text-[10px]">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th className="text-left px-4 py-2.5 text-zinc-600 font-semibold">Permission</th>
                {['Owner', 'Admin', 'Member', 'Viewer'].map(r => (
                  <th key={r} className="text-center px-3 py-2.5 text-zinc-600 font-semibold">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Manage ads & campaigns', true, true, true, false],
                ['Run AI analysis',        true, true, true, false],
                ['Generate variations',    true, true, true, false],
                ['Connect platforms',      true, true, false, false],
                ['Manage billing',         true, false, false, false],
                ['Manage team',            true, false, false, false],
              ].map(([label, ...perms]) => (
                <tr key={String(label)} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td className="px-4 py-2.5 text-zinc-400">{label}</td>
                  {perms.map((has, i) => (
                    <td key={i} className="text-center px-3 py-2.5">
                      {has ? <Check size={10} className="text-emerald-400 mx-auto" /> : <span className="text-zinc-700">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ─── Main Settings Content ────────────────────────────────────────────────────
function SettingsContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const [activeSection, setActiveSection] = useState(searchParams.get('tab') ?? 'workspace');
  const [billingToast, setBillingToast]   = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && SECTIONS.find(s => s.id === tab)) setActiveSection(tab);
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('billing') === 'success') {
      setBillingToast(true);
      setTimeout(() => setBillingToast(false), 4000);
      router.replace('/settings?tab=billing');
    }
  }, [searchParams, router]);

  function switchSection(id: string) {
    setActiveSection(id);
    router.replace(`/settings?tab=${id}`, { scroll: false });
  }

  const section = SECTIONS.find(s => s.id === activeSection)!;

  const renderContent = () => {
    switch (activeSection) {
      case 'workspace':     return <WorkspacePane />;
      case 'brand_kit':     return <BrandKitPane />;
      case 'billing':       return <BillingPane onContactSales={() => setBillingToast(true)} />;
      case 'ai_model':      return <AIModelPane />;
      case 'notifications': return <NotificationsPane />;
      case 'integrations':  return <IntegrationsPane />;
      case 'team':          return <TeamPane />;
      default:              return null;
    }
  };

  return (
    <AppLayout>
      <Header title="Settings" subtitle="Manage your workspace, billing, and preferences" />

      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-6">

            {/* Left nav */}
            <nav className="lg:w-52 shrink-0">
              <div className="rounded-2xl overflow-hidden"
                style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="px-3 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Settings</p>
                </div>
                <ul className="p-2 space-y-0.5">
                  {SECTIONS.map(({ id, Icon, label, desc }) => (
                    <li key={id}>
                      <button onClick={() => switchSection(id)}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all group',
                          activeSection === id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5',
                        )}
                        style={activeSection === id ? {
                          background: 'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(5,150,105,0.06))',
                          border: '1px solid rgba(16,185,129,0.2)',
                        } : {}}>
                        <Icon size={14} className={activeSection === id ? 'text-emerald-400' : 'text-zinc-600 group-hover:text-zinc-500'} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold leading-tight">{label}</p>
                          <p className={cn('text-[9px] mt-0.5 leading-tight truncate', activeSection === id ? 'text-zinc-500' : 'text-zinc-700')}>{desc}</p>
                        </div>
                        {activeSection === id && <ChevronRight size={12} className="text-emerald-500 shrink-0" />}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>

            {/* Content panel */}
            <div className="flex-1 min-w-0">
              <div className="rounded-2xl" style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3 px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <section.Icon size={18} className="text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">{section.label}</h2>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{section.desc}</p>
                  </div>
                </div>
                <div className="p-6">{renderContent()}</div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Billing success toast */}
      {billingToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl fade-in-up"
          style={{ background: '#111827', border: '1px solid rgba(16,185,129,0.3)', boxShadow: '0 12px 32px rgba(0,0,0,0.6)', whiteSpace: 'nowrap' }}>
          <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
            <Check size={14} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Subscription activated!</p>
            <p className="text-[10px] text-zinc-500">Your plan has been updated successfully.</p>
          </div>
          <button onClick={() => setBillingToast(false)} className="text-zinc-600 hover:text-zinc-300 ml-2">✕</button>
        </div>
      )}
    </AppLayout>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsContent />
    </Suspense>
  );
}
