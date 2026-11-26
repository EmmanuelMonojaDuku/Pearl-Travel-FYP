import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Bot,
  CheckCircle2,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Route,
  Trash2,
  User,
  Users,
  XCircle,
} from 'lucide-react';
import type { UserProfile } from '../types';
import { fetchAdminOverview, type AdminOverview } from '../utils/apiClient';
import { listLocalAccounts } from '../utils/authStorage';
import {
  MODULES,
  getAiSuggestions,
  getContent,
  getScans,
  newContentId,
  saveAiSuggestions,
  saveContent,
  type AiSuggestion,
  type ContentItem,
  type ContentStatus,
  type ModuleId,
} from '../utils/opsStore';
import { Button, Card, Pill, ScreenHeader, SectionLabel } from './ui';

interface AdminDashboardProps {
  currentUser: UserProfile;
  onLogout: () => void;
}

type Tab = 'dashboard' | 'content' | 'analytics' | 'profile';
type View =
  | { name: 'tab' }
  | { name: 'module'; id: ModuleId | 'users' }
  | { name: 'ai' };

const MODULE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  requirements: FileText,
  faqs: HelpCircle,
  guidance: Route,
  knowledge: BookOpen,
  users: Users,
};

const statusTone = (s: ContentStatus) => (s === 'published' ? 'success' : s === 'pending' ? 'warning' : 'neutral');

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onLogout }) => {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [view, setView] = useState<View>({ name: 'tab' });
  const [content, setContent] = useState<ContentItem[]>(() => getContent());
  const [ai, setAi] = useState<AiSuggestion[]>(() => getAiSuggestions());
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadOverview = useCallback(async () => {
    if (!currentUser.accessToken) {
      setError('This session has no server access token. Sign in again to load live totals.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      setOverview(await fetchAdminOverview(currentUser.accessToken));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load live totals.');
    } finally {
      setLoading(false);
    }
  }, [currentUser.accessToken]);
  useEffect(() => { void loadOverview(); }, [loadOverview]);

  const updateContent = (next: ContentItem[]) => { setContent(next); saveContent(next); };
  const updateAi = (next: AiSuggestion[]) => { setAi(next); saveAiSuggestions(next); };

  const pendingContent = content.filter((c) => c.status === 'pending').length;
  const pendingAi = ai.filter((a) => a.status === 'pending').length;

  const decideAi = (s: AiSuggestion, decision: 'approved' | 'rejected') => {
    updateAi(ai.map((a) => (a.id === s.id ? { ...a, status: decision } : a)));
    if (decision === 'approved') {
      const existing = s.kind === 'UPDATE' ? content.find((c) => c.module === s.module && c.title.toLowerCase() === s.title.toLowerCase()) : undefined;
      updateContent(
        existing
          ? content.map((c) => (c.id === existing.id ? { ...c, body: s.detail, status: 'published', updatedAt: new Date().toISOString() } : c))
          : [{ id: newContentId(), module: s.module, title: s.title, body: s.detail, status: 'published', updatedAt: new Date().toISOString() }, ...content]
      );
    }
  };

  const nav: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  let body: React.ReactNode;
  if (view.name === 'ai') {
    body = <AiReview items={ai} onDecide={decideAi} onBack={() => setView({ name: 'tab' })} />;
  } else if (view.name === 'module') {
    body = view.id === 'users'
      ? <UsersPanel onBack={() => setView({ name: 'tab' })} />
      : <ModulePanel id={view.id} items={content} onChange={updateContent} onBack={() => setView({ name: 'tab' })} />;
  } else if (tab === 'dashboard') {
    body = (
      <Home
        total={content.length}
        pendingContent={pendingContent}
        pendingAi={pendingAi}
        overview={overview}
        loading={loading}
        error={error}
        onRefresh={() => void loadOverview()}
        onOpen={(id) => setView({ name: 'module', id })}
        onAi={() => setView({ name: 'ai' })}
      />
    );
  } else if (tab === 'content') {
    body = <ContentHub items={content} onOpen={(id) => setView({ name: 'module', id })} />;
  } else if (tab === 'analytics') {
    body = <Analytics overview={overview} loading={loading} content={content} />;
  } else {
    body = (
      <Card className="space-y-4">
        <ScreenHeader title="Admin Profile" subtitle="System & requirement controls" />
        <p className="text-sm">{currentUser.name}</p>
        <p className="text-xs text-pearl-placeholder -mt-3">{currentUser.email}</p>
        <Button variant="outline" onClick={onLogout}><LogOut className="w-4 h-4" /> Sign out</Button>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-pearl-slate text-pearl-text flex justify-center">
      <div className="w-full max-w-2xl flex flex-col min-h-screen">
        <main className="flex-1 px-5 pt-6 pb-24">{body}</main>
        <nav aria-label="Admin navigation" className="fixed bottom-0 inset-x-0 z-40 flex justify-center bg-pearl-navy border-t border-pearl-border">
          <div className="w-full max-w-2xl grid grid-cols-4 h-16">
            {nav.map(({ id, label, icon: Icon }) => {
              const active = tab === id && view.name === 'tab';
              return (
                <button
                  key={id}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => { setTab(id); setView({ name: 'tab' }); }}
                  className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold cursor-pointer ${active ? 'text-pearl-gold' : 'text-pearl-placeholder hover:text-pearl-text'}`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};

/* ── Dashboard home ── */
const Home: React.FC<{
  total: number; pendingContent: number; pendingAi: number;
  overview: AdminOverview | null; loading: boolean; error: string;
  onRefresh: () => void; onOpen: (id: ModuleId | 'users') => void; onAi: () => void;
}> = ({ total, pendingContent, pendingAi, overview, loading, error, onRefresh, onOpen, onAi }) => (
  <>
    <ScreenHeader title="Admin Dashboard" subtitle="System & requirement controls" right={
      <button type="button" aria-label="Refresh live totals" onClick={onRefresh} className="w-9 h-9 rounded-xl bg-pearl-surface border border-pearl-border flex items-center justify-center cursor-pointer hover:bg-pearl-input">
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      </button>
    } />
    <div className="grid grid-cols-3 gap-3 mb-6">
      <Card className="text-center py-3"><p className="text-2xl font-bold font-heading tabular-nums">{total}</p><p className="text-[10px] text-pearl-placeholder">Total Content</p></Card>
      <button type="button" onClick={() => onOpen('requirements')} className="text-center py-3 rounded-2xl border border-pearl-gold bg-pearl-dark cursor-pointer"><p className="text-2xl font-bold font-heading text-pearl-gold tabular-nums">{pendingContent}</p><p className="text-[10px] text-pearl-placeholder">Pending Review</p></button>
      <button type="button" onClick={onAi} className="text-center py-3 rounded-2xl border border-pearl-border bg-pearl-dark cursor-pointer hover:border-pearl-gold"><p className="text-2xl font-bold font-heading tabular-nums">{pendingAi}</p><p className="text-[10px] text-pearl-placeholder">AI Suggestions</p></button>
    </div>

    <SectionLabel>Control modules</SectionLabel>
    <ul className="space-y-2 mb-6">
      {[...MODULES, { id: 'users' as const, label: 'User Management', blurb: 'Accounts and roles' }].map((m) => {
        const Icon = MODULE_ICON[m.id];
        return (
          <li key={m.id}>
            <button type="button" onClick={() => onOpen(m.id)} className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-pearl-dark border border-pearl-border hover:border-pearl-gold text-left cursor-pointer">
              <span className="w-9 h-9 rounded-lg bg-pearl-surface text-pearl-gold flex items-center justify-center"><Icon className="w-4 h-4" /></span>
              <span className="flex-1"><span className="block text-sm font-semibold">{m.label}</span><span className="block text-[11px] text-pearl-placeholder">{m.blurb}</span></span>
            </button>
          </li>
        );
      })}
      <li>
        <button type="button" onClick={onAi} className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-pearl-dark border border-pearl-border hover:border-pearl-gold text-left cursor-pointer">
          <span className="w-9 h-9 rounded-lg bg-pearl-surface text-pearl-gold flex items-center justify-center"><Bot className="w-4 h-4" /></span>
          <span className="flex-1"><span className="block text-sm font-semibold">AI Change Review</span><span className="block text-[11px] text-pearl-placeholder">Approve or reject suggested updates</span></span>
          {pendingAi > 0 && <Pill tone="warning">{pendingAi}</Pill>}
        </button>
      </li>
    </ul>

    <SectionLabel>Live operations</SectionLabel>
    {error && <p role="alert" className="mb-3 text-xs text-pearl-danger-light">{error}</p>}
    <div className="grid grid-cols-2 gap-3">
      {[
        ['Registered travellers', overview?.kpis.totalTravellers],
        ['Active journeys', overview?.kpis.activeJourneys],
        ['Readiness assessments', overview?.kpis.totalAssessments],
        ['QR verifications', overview?.kpis.totalQrVerifications],
      ].map(([label, v]) => (
        <Card key={label as string}><p className="text-[11px] text-pearl-placeholder">{label as string}</p><p className="text-xl font-bold font-heading tabular-nums mt-1">{loading ? '—' : (v as number | null | undefined) ?? '—'}</p></Card>
      ))}
    </div>
    {overview && (
      <p className="mt-3 text-[11px] text-pearl-placeholder">
        <Pill tone={overview.systemHealth.database === 'healthy' ? 'success' : 'warning'}>{overview.systemHealth.database}</Pill>{' '}
        API {overview.systemHealth.api} · updated {new Date(overview.generatedAt).toLocaleTimeString()}
      </p>
    )}
  </>
);

const ContentHub: React.FC<{ items: ContentItem[]; onOpen: (id: ModuleId) => void }> = ({ items, onOpen }) => (
  <>
    <ScreenHeader title="Content" subtitle="Manage what travellers and the assistant see" />
    <ul className="space-y-2">
      {MODULES.map((m) => {
        const Icon = MODULE_ICON[m.id];
        const list = items.filter((i) => i.module === m.id);
        return (
          <li key={m.id}>
            <button type="button" onClick={() => onOpen(m.id)} className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-pearl-dark border border-pearl-border hover:border-pearl-gold text-left cursor-pointer">
              <span className="w-9 h-9 rounded-lg bg-pearl-surface text-pearl-gold flex items-center justify-center"><Icon className="w-4 h-4" /></span>
              <span className="flex-1 text-sm font-semibold">{m.label}</span>
              <Pill>{list.length} items</Pill>
            </button>
          </li>
        );
      })}
    </ul>
  </>
);

/* ── Content module CRUD ── */
const ModulePanel: React.FC<{ id: ModuleId; items: ContentItem[]; onChange: (n: ContentItem[]) => void; onBack: () => void }> = ({ id, items, onChange, onBack }) => {
  const meta = MODULES.find((m) => m.id === id)!;
  const list = items.filter((i) => i.module === id);
  const [editing, setEditing] = useState<ContentItem | null>(null);

  const save = (it: ContentItem) => {
    const exists = items.some((x) => x.id === it.id);
    onChange(exists ? items.map((x) => (x.id === it.id ? it : x)) : [it, ...items]);
    setEditing(null);
  };

  if (editing) {
    return (
      <>
        <ScreenHeader title={editing.title ? 'Edit item' : 'New item'} subtitle={meta.label} onBack={() => setEditing(null)} />
        <form
          className="space-y-4"
          onSubmit={(e) => { e.preventDefault(); if (editing.title.trim()) save({ ...editing, updatedAt: new Date().toISOString() }); }}
        >
          <div>
            <label htmlFor="ci-title" className="block text-[11px] font-semibold text-pearl-text-secondary mb-1.5">Title</label>
            <input id="ci-title" required value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full h-12 rounded-xl bg-pearl-input border border-pearl-border px-4 text-sm focus:outline-none focus:border-pearl-gold" />
          </div>
          <div>
            <label htmlFor="ci-body" className="block text-[11px] font-semibold text-pearl-text-secondary mb-1.5">Content</label>
            <textarea id="ci-body" rows={6} value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} className="w-full rounded-xl bg-pearl-input border border-pearl-border p-4 text-sm focus:outline-none focus:border-pearl-gold" />
          </div>
          <div>
            <label htmlFor="ci-status" className="block text-[11px] font-semibold text-pearl-text-secondary mb-1.5">Status</label>
            <select id="ci-status" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as ContentStatus })} className="w-full h-12 rounded-xl bg-pearl-input border border-pearl-border px-4 text-sm">
              <option value="draft">Draft</option>
              <option value="pending">Pending review</option>
              <option value="published">Published</option>
            </select>
          </div>
          <Button type="submit">Save</Button>
        </form>
      </>
    );
  }

  return (
    <>
      <ScreenHeader title={meta.label} subtitle={meta.blurb} onBack={onBack} />
      <Button className="mb-4" onClick={() => setEditing({ id: newContentId(), module: id, title: '', body: '', status: 'draft', updatedAt: new Date().toISOString() })}>
        <Plus className="w-4 h-4" /> Add item
      </Button>
      {list.length === 0 ? <p className="text-sm text-pearl-placeholder">Nothing here yet.</p> : (
        <ul className="space-y-2">
          {list.map((it) => (
            <li key={it.id} className="p-3.5 rounded-xl bg-pearl-dark border border-pearl-border">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{it.title}</p>
                  <p className="text-[11px] text-pearl-placeholder mt-0.5 line-clamp-2">{it.body}</p>
                </div>
                <Pill tone={statusTone(it.status)}>{it.status}</Pill>
              </div>
              <div className="flex gap-2 mt-3">
                <button type="button" aria-label={`Edit ${it.title}`} onClick={() => setEditing(it)} className="px-3 h-8 rounded-lg bg-pearl-surface text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-pearl-input"><Pencil className="w-3 h-3" /> Edit</button>
                {it.status !== 'published' && (
                  <button type="button" onClick={() => onChange(items.map((x) => (x.id === it.id ? { ...x, status: 'published', updatedAt: new Date().toISOString() } : x)))} className="px-3 h-8 rounded-lg bg-pearl-success/15 text-pearl-success-light text-xs font-semibold flex items-center gap-1.5 cursor-pointer"><CheckCircle2 className="w-3 h-3" /> Publish</button>
                )}
                <button
                  type="button"
                  aria-label={`Delete ${it.title}`}
                  onClick={() => { if (window.confirm(`Delete "${it.title}"?`)) onChange(items.filter((x) => x.id !== it.id)); }}
                  className="ml-auto px-3 h-8 rounded-lg bg-pearl-danger/15 text-pearl-danger-light text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                ><Trash2 className="w-3 h-3" /> Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

/* ── AI change review ── */
const AiReview: React.FC<{ items: AiSuggestion[]; onDecide: (s: AiSuggestion, d: 'approved' | 'rejected') => void; onBack: () => void }> = ({ items, onDecide, onBack }) => {
  const [filter, setFilter] = useState<'pending' | 'approved'>('pending');
  const pending = items.filter((i) => i.status === 'pending');
  const approved = items.filter((i) => i.status === 'approved');
  const shown = filter === 'pending' ? pending : approved;
  return (
    <>
      <ScreenHeader title="AI Suggestions" subtitle="Requirement parsing audit" onBack={onBack} right={<Pill tone="info">Agent v1.2</Pill>} />
      <div role="tablist" className="flex gap-2 mb-4">
        {([['pending', `Pending (${pending.length})`], ['approved', `Approved (${approved.length})`]] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={filter === id} type="button" onClick={() => setFilter(id)} className={`px-4 h-9 rounded-full text-xs font-bold cursor-pointer ${filter === id ? 'bg-pearl-gold text-pearl-navy' : 'bg-pearl-surface text-pearl-text-secondary'}`}>{label}</button>
        ))}
      </div>
      <p className="text-[11px] text-pearl-placeholder mb-3">Sample suggestions for review workflow. Approving applies the change to the matching content module.</p>
      {shown.length === 0 ? <p className="text-sm text-pearl-placeholder">No {filter} suggestions.</p> : (
        <ul className="space-y-3">
          {shown.map((s) => (
            <li key={s.id} className="p-4 rounded-xl bg-pearl-dark border border-pearl-border">
              <div className="flex justify-between text-[10px] font-bold mb-1">
                <span className={s.kind === 'ADD' ? 'text-pearl-success-light' : 'text-pearl-gold'}>{s.kind}</span>
                <span className="text-pearl-placeholder">{MODULES.find((m) => m.id === s.module)?.label}</span>
              </div>
              <p className="text-sm font-semibold">{s.title}</p>
              <p className="text-xs text-pearl-text-secondary mt-1">{s.detail}</p>
              {s.status === 'pending' && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <Button onClick={() => onDecide(s, 'approved')}>Review</Button>
                  <Button variant="danger" onClick={() => onDecide(s, 'rejected')}>Reject</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

/* ── User management ── */
const UsersPanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const accounts = useMemo(() => listLocalAccounts(), []);
  return (
    <>
      <ScreenHeader title="User Management" subtitle="Accounts and roles" onBack={onBack} />
      <p className="text-[11px] text-pearl-placeholder mb-3">Roles (traveller, border officer, admin) are assigned by the API after authentication. Server-side user listing is not exposed yet; accounts created in this browser are shown below.</p>
      {accounts.length === 0 ? <p className="text-sm text-pearl-placeholder">No browser-local accounts.</p> : (
        <ul className="space-y-2">
          {accounts.map((a) => (
            <li key={a.email} className="flex items-center justify-between p-3 rounded-xl bg-pearl-dark border border-pearl-border">
              <div><p className="text-sm font-semibold">{a.name || a.email}</p><p className="text-[11px] text-pearl-placeholder">{a.email}</p></div>
              <Pill>Traveller</Pill>
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

/* ── Analytics ── */
const Analytics: React.FC<{ overview: AdminOverview | null; loading: boolean; content: ContentItem[] }> = ({ overview, loading, content }) => {
  const scans = getScans();
  const bars = [
    ['Travellers', overview?.kpis.totalTravellers ?? 0],
    ['Journeys', overview?.kpis.totalJourneys ?? 0],
    ['Assessments', overview?.kpis.totalAssessments ?? 0],
    ['QR verifications', overview?.kpis.totalQrVerifications ?? 0],
  ] as const;
  const max = Math.max(1, ...bars.map((b) => b[1]));
  const published = content.filter((c) => c.status === 'published').length;
  return (
    <>
      <ScreenHeader title="Analytics & Reports" subtitle="Usage across the platform" />
      <Card className="mb-4">
        <SectionLabel>Platform usage {loading && '(loading…)'}</SectionLabel>
        <ul className="space-y-3">
          {bars.map(([label, v]) => (
            <li key={label}>
              <div className="flex justify-between text-xs mb-1"><span>{label}</span><span className="tabular-nums font-semibold">{v}</span></div>
              <div className="h-2 rounded-full bg-pearl-surface"><div className="h-2 rounded-full bg-pearl-gold" style={{ width: `${(v / max) * 100}%` }} /></div>
            </li>
          ))}
        </ul>
        {!overview && !loading && <p className="mt-3 text-[11px] text-pearl-placeholder">Live totals unavailable — start the API to populate these.</p>}
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Card><p className="text-[11px] text-pearl-placeholder">Published content</p><p className="text-2xl font-bold font-heading mt-1">{published}/{content.length}</p></Card>
        <Card><p className="text-[11px] text-pearl-placeholder">Officer decisions (this browser)</p><p className="text-2xl font-bold font-heading mt-1">{scans.length}</p></Card>
      </div>
    </>
  );
};
