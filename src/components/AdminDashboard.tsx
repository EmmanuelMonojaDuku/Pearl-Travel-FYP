import React, { useCallback, useEffect, useState } from 'react';
import { Activity, Bot, FileText, LayoutDashboard, ListChecks, LogOut, Plus, RefreshCw, ShieldCheck, User, Users } from 'lucide-react';
import type { UserProfile } from '../types';
import { ApiRequestError, ApiUnavailableError, type AdminOverview } from '../utils/apiClient';
import * as A from '../utils/api';
import { AppBar, Button, Card, Pill, ScreenHeader, SectionLabel } from './ui';
import { Footer } from './Footer';

interface AdminDashboardProps {
  currentUser: UserProfile;
  onLogout: () => void;
}

type Tab = 'dashboard' | 'content' | 'people' | 'activity' | 'profile';
type Sub = 'guidance' | 'rules' | 'ai';

const errText = (e: unknown) =>
  e instanceof ApiUnavailableError ? 'The server cannot be reached.' : e instanceof ApiRequestError || e instanceof Error ? e.message : 'Something went wrong.';

const statusTone = (s: string) => (s === 'published' || s === 'approved' ? 'success' : s === 'pending_review' || s === 'pending' ? 'warning' : s === 'rejected' || s === 'archived' ? 'danger' : 'neutral');

const GROUPS = ['citizen', 'eac', 'visa_exempt', 'visa_required'] as const;
const PURPOSES = ['tourism', 'business', 'family', 'studies', 'transit', 'employment'] as const;
const inputCls = 'w-full rounded-xl bg-pearl-input border border-pearl-border px-3 py-2.5 text-sm focus:outline-none focus:border-pearl-gold';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onLogout }) => {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [sub, setSub] = useState<Sub>('guidance');
  const [notice, setNotice] = useState('');

  const nav: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'people', label: 'People', icon: Users },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-pearl-slate text-pearl-text flex flex-col">
      <AppBar role="Administrator" name={currentUser.name} />
      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-2xl flex flex-col">
          <main className="flex-1 px-5 pt-6 pb-24">
            {notice && <p role="status" className="mb-3 p-3 rounded-xl bg-pearl-surface border border-pearl-border text-xs">{notice}</p>}
            {tab === 'dashboard' && <Home onOpen={(s) => { setSub(s); setTab('content'); }} />}
            {tab === 'content' && (
              <>
                <ScreenHeader title="Content" subtitle="Every change is reviewed before travellers see it" />
                <div role="tablist" className="flex gap-2 mb-4 overflow-x-auto">
                  {([['guidance', 'Guidance'], ['rules', 'Rules'], ['ai', 'AI suggestions']] as const).map(([id, label]) => (
                    <button key={id} role="tab" aria-selected={sub === id} type="button" onClick={() => setSub(id)}
                      className={`px-4 h-9 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer ${sub === id ? 'bg-pearl-gold text-pearl-navy' : 'bg-pearl-surface text-pearl-text-secondary'}`}>{label}</button>
                  ))}
                </div>
                {sub === 'guidance' && <WorkflowPanel kind="content" onNotice={setNotice} />}
                {sub === 'rules' && <WorkflowPanel kind="requirements" onNotice={setNotice} />}
                {sub === 'ai' && <AiPanel onNotice={setNotice} />}
              </>
            )}
            {tab === 'people' && <People onNotice={setNotice} />}
            {tab === 'activity' && <ActivityLog />}
            {tab === 'profile' && (
              <Card className="space-y-4">
                <ScreenHeader title="Admin Profile" subtitle="System and requirement controls" />
                <p className="text-sm">{currentUser.name}</p>
                <p className="text-xs text-pearl-placeholder -mt-3">{currentUser.email}</p>
                <Button variant="outline" onClick={onLogout}><LogOut className="w-4 h-4" /> Sign out</Button>
              </Card>
            )}
          </main>
          <Footer variant="compact" quickLinks={[]} className="mb-16" />
          <nav aria-label="Admin navigation" className="fixed bottom-0 inset-x-0 z-40 flex justify-center bg-pearl-navy border-t border-pearl-border">
            <div className="w-full max-w-2xl grid grid-cols-5 h-16">
              {nav.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" aria-current={tab === id ? 'page' : undefined} onClick={() => { setNotice(''); setTab(id); }}
                  className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold cursor-pointer ${tab === id ? 'text-pearl-gold' : 'text-pearl-placeholder hover:text-pearl-text'}`}>
                  <Icon className="w-5 h-5" />{label}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};

/* ───────── Dashboard ───────── */
const Home: React.FC<{ onOpen: (s: Sub) => void }> = ({ onOpen }) => {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [pending, setPending] = useState({ content: 0, rules: 0, ai: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [assistant, setAssistant] = useState<{ configured: boolean; indexedChunks: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [o, c, r, a, st] = await Promise.all([A.adminOverview(), A.wfList('content', 'pending_review'), A.wfList('requirements', 'pending_review'), A.aiSuggestions('pending'), A.assistantStatus()]);
      setOverview(o);
      setPending({ content: c.length, rules: r.length, ai: a.length });
      setAssistant(st);
    } catch (e) {
      setError(errText(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const tile = (label: string, n: number | string, onClick?: () => void) => (
    <button type="button" onClick={onClick} disabled={!onClick} className="text-center py-3 rounded-2xl border border-pearl-border bg-pearl-dark enabled:cursor-pointer enabled:hover:border-pearl-gold">
      <p className="text-2xl font-bold font-heading tabular-nums">{loading ? '—' : n}</p><p className="text-[10px] text-pearl-placeholder">{label}</p>
    </button>
  );
  const k = overview?.kpis;
  return (
    <>
      <ScreenHeader title="Admin Dashboard" subtitle="System and requirement controls" right={
        <button type="button" aria-label="Refresh" onClick={() => void load()} className="w-9 h-9 rounded-xl bg-pearl-surface border border-pearl-border flex items-center justify-center cursor-pointer hover:bg-pearl-input"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>} />
      {error && <p role="alert" className="mb-3 text-xs text-pearl-danger-light">{error}</p>}
      <SectionLabel>Waiting for review</SectionLabel>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {tile('Guidance', pending.content, () => onOpen('guidance'))}
        {tile('Rules', pending.rules, () => onOpen('rules'))}
        {tile('AI suggestions', pending.ai, () => onOpen('ai'))}
      </div>
      <SectionLabel>Live operations</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
        {([['Travellers', k?.totalTravellers], ['Active journeys', k?.activeJourneys], ['Readiness assessments', k?.totalAssessments], ['QR verifications', k?.totalQrVerifications], ['Valid QR passes', k?.validQrSummaries], ['Pending reviews', k?.pendingContentReviews]] as const).map(([l, v]) => (
          <Card key={l}><p className="text-[11px] text-pearl-placeholder">{l}</p><p className="text-xl font-bold font-heading tabular-nums mt-1">{loading ? '—' : v ?? '—'}</p></Card>
        ))}
      </div>
      {overview && (
        <p className="mt-3 text-[11px] text-pearl-placeholder flex flex-wrap items-center gap-2">
          <Pill tone={overview.systemHealth.database === 'healthy' ? 'success' : 'warning'}>database {overview.systemHealth.database}</Pill>
          <Pill tone={assistant?.configured ? 'success' : 'warning'}>{assistant?.configured ? `AI assistant on · ${assistant.indexedChunks} passages indexed` : 'AI assistant not configured'}</Pill>
        </p>
      )}
    </>
  );
};

/* ───────── Guidance and rules workflow ───────── */
const WorkflowPanel: React.FC<{ kind: A.Workflow; onNotice: (m: string) => void }> = ({ kind, onNotice }) => {
  const [rows, setRows] = useState<A.WorkflowRow[]>([]);
  const [filter, setFilter] = useState('');
  const [creating, setCreating] = useState(false);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const load = useCallback(async () => { try { setRows(await A.wfList(kind, filter || undefined)); } catch (e) { onNotice(errText(e)); } }, [kind, filter, onNotice]);
  useEffect(() => { void load(); }, [load]);

  const act = async (id: string, action: Parameters<typeof A.wfAction>[2], body?: Record<string, unknown>) => {
    try { await A.wfAction(kind, id, action, body); onNotice(''); setRejecting(null); setReason(''); await load(); } catch (e) { onNotice(errText(e)); }
  };

  if (creating) return <CreateForm kind={kind} onDone={() => { setCreating(false); void load(); }} onNotice={onNotice} />;
  return (
    <>
      <div className="flex gap-2 mb-3">
        <select aria-label="Filter by status" value={filter} onChange={(e) => setFilter(e.target.value)} className={inputCls + ' !w-auto'}>
          <option value="">All statuses</option>
          {['draft', 'pending_review', 'approved', 'published', 'rejected', 'archived'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <Button full={false} onClick={() => setCreating(true)}><Plus className="w-4 h-4" /> New</Button>
      </div>
      {rows.length === 0 ? <p className="text-sm text-pearl-placeholder">Nothing here yet.</p> : (
        <ul className="space-y-2">
          {rows.map((r) => {
            const ver = (r.rule_metadata as { verification?: { status: string } } | undefined)?.verification?.status;
            return (
              <li key={r.id} className="p-3.5 rounded-xl bg-pearl-dark border border-pearl-border">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{r.title}</p>
                    <p className="text-[11px] text-pearl-placeholder mt-0.5 line-clamp-2">{String(r.summary)}</p>
                    <p className="text-[10px] text-pearl-placeholder mt-1">v{r.version}{kind === 'requirements' ? ` · ${r.code}` : ''}{ver ? ` · ${ver === 'verified' ? 'verified' : 'awaiting verification'}` : ''}</p>
                  </div>
                  <Pill tone={statusTone(r.workflow_status)}>{r.workflow_status.replace('_', ' ')}</Pill>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {['draft', 'rejected'].includes(r.workflow_status) && <Button full={false} variant="outline" className="!min-h-[34px] text-xs" onClick={() => void act(r.id, 'submit')}>Submit for review</Button>}
                  {r.workflow_status === 'pending_review' && (
                    <>
                      <Button full={false} className="!min-h-[34px] text-xs" onClick={() => void act(r.id, 'publish')}><ShieldCheck className="w-3.5 h-3.5" /> Approve and publish</Button>
                      <Button full={false} variant="danger" className="!min-h-[34px] text-xs" onClick={() => setRejecting(r.id)}>Reject</Button>
                    </>
                  )}
                  {r.workflow_status === 'published' && <Button full={false} variant="outline" className="!min-h-[34px] text-xs" onClick={() => void act(r.id, 'unpublish')}>Unpublish</Button>}
                  {r.workflow_status !== 'archived' && <Button full={false} variant="ghost" className="!min-h-[34px] text-xs ml-auto" onClick={() => void act(r.id, 'archive')}>Archive</Button>}
                </div>
                {rejecting === r.id && (
                  <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); void act(r.id, 'reject', { reason }); }}>
                    <input aria-label="Reason for rejection" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (required)" className={inputCls} />
                    <Button full={false} variant="danger" type="submit" disabled={reason.trim().length < 3}>Reject</Button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
};

const CreateForm: React.FC<{ kind: A.Workflow; onDone: () => void; onNotice: (m: string) => void }> = ({ kind, onDone, onNotice }) => {
  const [f, setF] = useState({ code: '', title: '', summary: '', body: '', category: kind === 'content' ? 'immigration' : 'entry', authority: '', condition: '', mandatory: true, docTitle: '', docDescription: '' });
  const [groups, setGroups] = useState<string[]>([]);
  const [purposes, setPurposes] = useState<string[]>([]);
  const toggle = (list: string[], v: string, set: (l: string[]) => void) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const upd = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (kind === 'content') {
        await A.wfCreateContent({ category: f.category, title: f.title, summary: f.summary, body: f.body, officialAuthority: f.authority });
      } else {
        await A.wfCreateRule({
          code: f.code, category: f.category, title: f.title, summary: f.summary, simpleExplanation: f.body, applicableCondition: f.condition || 'See the rule', officialSource: f.authority, mandatory: f.mandatory,
          metadata: { order: 500, when: { nationalityGroups: groups, purposes }, checklist: f.docTitle ? { id: `doc-${f.code}`, title: f.docTitle, description: f.docDescription || f.docTitle, category: 'supporting' } : null },
        });
      }
      onNotice('Saved as a draft. Submit it for review when it is ready.');
      onDone();
    } catch (err) { onNotice(errText(err)); }
  };
  const field = (label: string, node: React.ReactNode) => <label className="block text-[11px] font-semibold text-pearl-text-secondary">{label}<div className="mt-1.5">{node}</div></label>;
  return (
    <form onSubmit={submit} className="space-y-3">
      <h3 className="font-bold">{kind === 'content' ? 'New guidance' : 'New rule'}</h3>
      {kind === 'requirements' && field('Rule code (lowercase, dashes)', <input required pattern="[a-z0-9-]{3,80}" value={f.code} onChange={upd('code')} className={inputCls} />)}
      {field('Title', <input required minLength={3} value={f.title} onChange={upd('title')} className={inputCls} />)}
      {field('Short summary', <input required minLength={3} value={f.summary} onChange={upd('summary')} className={inputCls} />)}
      {field(kind === 'content' ? 'Full text' : 'Plain-language explanation', <textarea required minLength={10} rows={5} value={f.body} onChange={upd('body')} className={inputCls} />)}
      {field('Category', <select value={f.category} onChange={upd('category')} className={inputCls}>{(kind === 'content' ? ['immigration', 'health', 'customs', 'border_post', 'transport'] : ['entry', 'exit', 'visa', 'health', 'customs']).map((c) => <option key={c}>{c}</option>)}</select>)}
      {field('Official source', <input required minLength={2} value={f.authority} onChange={upd('authority')} className={inputCls} />)}
      {kind === 'requirements' && (
        <>
          {field('When it applies (text shown to the traveller)', <input value={f.condition} onChange={upd('condition')} className={inputCls} />)}
          <fieldset><legend className="text-[11px] font-semibold text-pearl-text-secondary mb-1.5">Nationality groups (none = everyone)</legend>
            <div className="flex flex-wrap gap-2">{GROUPS.map((g) => <label key={g} className="text-xs flex items-center gap-1.5"><input type="checkbox" checked={groups.includes(g)} onChange={() => toggle(groups, g, setGroups)} className="accent-[var(--pearl-gold)]" />{g}</label>)}</div></fieldset>
          <fieldset><legend className="text-[11px] font-semibold text-pearl-text-secondary mb-1.5">Purposes of travel (none = all)</legend>
            <div className="flex flex-wrap gap-2">{PURPOSES.map((g) => <label key={g} className="text-xs flex items-center gap-1.5"><input type="checkbox" checked={purposes.includes(g)} onChange={() => toggle(purposes, g, setPurposes)} className="accent-[var(--pearl-gold)]" />{g}</label>)}</div></fieldset>
          <label className="text-xs flex items-center gap-2"><input type="checkbox" checked={f.mandatory} onChange={(e) => setF((p) => ({ ...p, mandatory: e.target.checked }))} className="accent-[var(--pearl-gold)]" /> Mandatory</label>
          {field('Checklist item title (leave empty for guidance only)', <input value={f.docTitle} onChange={upd('docTitle')} className={inputCls} />)}
          {f.docTitle && field('Checklist item description', <input value={f.docDescription} onChange={upd('docDescription')} className={inputCls} />)}
        </>
      )}
      <div className="grid grid-cols-2 gap-3"><Button variant="outline" onClick={onDone}>Cancel</Button><Button type="submit">Save draft</Button></div>
    </form>
  );
};

/* ───────── AI suggestions ───────── */
const AiPanel: React.FC<{ onNotice: (m: string) => void }> = ({ onNotice }) => {
  const [rows, setRows] = useState<A.AiSuggestion[]>([]);
  const [filter, setFilter] = useState<'pending' | 'approved'>('pending');
  const [draft, setDraft] = useState({ topic: '', text: '' });
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => { try { setRows(await A.aiSuggestions(filter)); } catch (e) { onNotice(errText(e)); } }, [filter, onNotice]);
  useEffect(() => { void load(); }, [load]);

  const run = async (fn: () => Promise<unknown>, ok: string) => { setBusy(true); try { await fn(); onNotice(ok); await load(); } catch (e) { onNotice(errText(e)); } finally { setBusy(false); } };
  return (
    <>
      <div className="flex gap-2 mb-3">
        {(['pending', 'approved'] as const).map((s) => <button key={s} type="button" onClick={() => setFilter(s)} className={`px-4 h-9 rounded-full text-xs font-bold cursor-pointer ${filter === s ? 'bg-pearl-gold text-pearl-navy' : 'bg-pearl-surface text-pearl-text-secondary'}`}>{s === 'pending' ? 'Pending' : 'Approved'}</button>)}
        <Button full={false} variant="outline" className="ml-auto !min-h-[36px] text-xs" disabled={busy} onClick={() => void run(async () => { const r = await A.reindexKb(); onNotice(`Indexed ${r.chunks} passages from ${r.items} articles.`); }, '')}><Bot className="w-3.5 h-3.5" /> Re-index guidance</Button>
      </div>
      <Card className="mb-4 space-y-2">
        <p className="text-xs font-semibold">Draft with AI from official text</p>
        <input aria-label="Topic" value={draft.topic} onChange={(e) => setDraft((d) => ({ ...d, topic: e.target.value }))} placeholder="Topic" className={inputCls} />
        <textarea aria-label="Official source text" rows={3} value={draft.text} onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))} placeholder="Paste the official text to summarise (at least 40 characters)" className={inputCls} />
        <Button disabled={busy || draft.topic.length < 3 || draft.text.length < 40} onClick={() => void run(async () => { await A.aiDraft(draft.topic, draft.text); setDraft({ topic: '', text: '' }); }, 'Draft created. Review it below.')}>Create draft</Button>
        <p className="text-[11px] text-pearl-placeholder">Nothing is published until you approve it. Needs the AI assistant to be configured on the server.</p>
      </Card>
      {rows.length === 0 ? <p className="text-sm text-pearl-placeholder">No {filter} suggestions.</p> : (
        <ul className="space-y-3">
          {rows.map((s) => (
            <li key={s.id} className="p-4 rounded-xl bg-pearl-dark border border-pearl-border">
              <div className="flex justify-between text-[10px] font-bold mb-1"><span className="text-pearl-accent">{s.kind}</span><span className="text-pearl-placeholder">{s.category}{s.model ? ` · ${s.model}` : ''}</span></div>
              <p className="text-sm font-semibold">{s.title}</p>
              <p className="text-xs text-pearl-text-secondary mt-1">{s.proposed_summary}</p>
              {s.status === 'pending' && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <Button disabled={busy} onClick={() => void run(() => A.aiApprove(s.id), 'Approved and published.')}>Approve and publish</Button>
                  <Button variant="danger" disabled={busy} onClick={() => { const r = window.prompt('Reason for rejecting this suggestion?'); if (r && r.trim().length >= 3) void run(() => A.aiReject(s.id, r.trim()), 'Rejected.'); }}>Reject</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

/* ───────── People: users, roles, border post assignments ───────── */
const People: React.FC<{ onNotice: (m: string) => void }> = ({ onNotice }) => {
  const [users, setUsers] = useState<A.AdminUser[]>([]);
  const [posts, setPosts] = useState<{ code: string; name: string }[]>([]);
  const load = useCallback(async () => { try { const [u, p] = await Promise.all([A.adminUsers(), A.borderPosts()]); setUsers(u); setPosts(p); } catch (e) { onNotice(errText(e)); } }, [onNotice]);
  useEffect(() => { void load(); }, [load]);
  const run = async (fn: () => Promise<unknown>) => { try { await fn(); onNotice(''); await load(); } catch (e) { onNotice(errText(e)); } };
  return (
    <>
      <ScreenHeader title="People" subtitle="Roles and border post assignments are stored on the server" />
      <ul className="space-y-2">
        {users.map((u) => (
          <li key={u.id} className="p-3.5 rounded-xl bg-pearl-dark border border-pearl-border">
            <p className="text-sm font-semibold">{u.full_name}</p>
            <p className="text-[11px] text-pearl-placeholder">{u.email}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">{u.roles.map((r) => <Pill key={r} tone={r === 'admin_staff' ? 'info' : 'neutral'}>{r.replace('_', ' ')}</Pill>)}{u.border_posts.map((b) => <Pill key={b} tone="success">{b}</Pill>)}</div>
            <div className="flex flex-wrap gap-2 mt-3">
              {!u.roles.includes('border_officer') ? <Button full={false} variant="outline" className="!min-h-[34px] text-xs" onClick={() => void run(() => A.grantRole(u.id, 'border_officer'))}>Make officer</Button>
                : <>
                  {posts.filter((p) => !u.border_posts.includes(p.code)).map((p) => <Button key={p.code} full={false} variant="outline" className="!min-h-[34px] text-xs" onClick={() => void run(() => A.assignPost(u.id, p.code))}>Assign {p.code}</Button>)}
                  {u.border_posts.map((c) => <Button key={c} full={false} variant="ghost" className="!min-h-[34px] text-xs" onClick={() => void run(() => A.unassignPost(u.id, c))}>Unassign {c}</Button>)}
                  <Button full={false} variant="ghost" className="!min-h-[34px] text-xs" onClick={() => void run(() => A.revokeRole(u.id, 'border_officer'))}>Remove officer role</Button>
                </>}
              {!u.roles.includes('admin_staff') && <Button full={false} variant="ghost" className="!min-h-[34px] text-xs" onClick={() => { if (window.confirm(`Make ${u.full_name} an administrator?`)) void run(() => A.grantRole(u.id, 'admin_staff')); }}>Make administrator</Button>}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
};

/* ───────── Activity: audit log ───────── */
const ActivityLog: React.FC = () => {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof A.auditLogs>>>([]);
  const [error, setError] = useState('');
  useEffect(() => { void A.auditLogs().then(setRows).catch((e) => setError(errText(e))); }, []);
  return (
    <>
      <ScreenHeader title="Activity" subtitle="Who changed what, newest first" />
      {error && <p role="alert" className="text-xs text-pearl-danger-light mb-2">{error}</p>}
      {rows.length === 0 && !error ? <p className="text-sm text-pearl-placeholder">No activity yet.</p> : (
        <ul className="space-y-2">
          {rows.map((l) => (
            <li key={l.id} className="p-3 rounded-xl bg-pearl-dark border border-pearl-border flex items-start gap-3">
              <ListChecks className="w-4 h-4 mt-0.5 text-pearl-accent shrink-0" />
              <div className="min-w-0"><p className="text-sm font-mono font-semibold break-all">{l.action}</p><p className="text-[11px] text-pearl-placeholder">{l.actor_email ?? 'system'} · {new Date(l.created_at).toLocaleString()}</p></div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
};
