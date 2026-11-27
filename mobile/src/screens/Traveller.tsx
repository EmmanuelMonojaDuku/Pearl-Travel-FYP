import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { api, ApiError, ApiUnavailableError } from '../http';
import { buildChecklist, type CheckItem, type RulesSnapshot, type Traveller } from '../logic';
import { kvDel, kvGet, kvSet } from '../store';
import { flushOutbox, queueAssessment, queueJourney } from '../sync';
import { C } from '../theme';
import { Btn, Card, Chip, Field, H, Muted } from '../ui';

const PURPOSES = [['tourism', 'Tourism'], ['business', 'Business'], ['family', 'Family'], ['studies', 'Studies'], ['transit', 'Transit'], ['employment', 'Work']] as const;
const MODES = ['road', 'air', 'rail'] as const;
const STATUS_NEXT: Record<CheckItem['status'], CheckItem['status']> = { missing: 'complete', complete: 'not_applicable', not_applicable: 'expired', expired: 'missing' };
const STATUS_TEXT: Record<CheckItem['status'], string> = { complete: 'Done', missing: 'Missing', expired: 'Expired', not_applicable: 'Not needed' };

export interface TravellerState { traveller: Traveller; items: CheckItem[] }

/** Hook that owns the traveller's data: cached on the device, rebuilt from the rules, and synced when online. */
export function useTraveller(rules: RulesSnapshot, online: boolean, userKey: string) {
  const [traveller, setTraveller] = useState<Traveller>({});
  const [items, setItems] = useState<CheckItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { void (async () => {
    setTraveller((await kvGet<Traveller>(`traveller:${userKey}`)) ?? {});
    setItems((await kvGet<CheckItem[]>(`items:${userKey}`)) ?? []);
    setLoaded(true);
  })(); }, [userKey]);

  // The checklist is re-evaluated whenever nationality, purpose, journey or the rules change.
  const built = useMemo(() => buildChecklist(traveller, rules, items), [traveller, rules, items]);
  useEffect(() => {
    if (!loaded) return;
    const same = JSON.stringify(built.items) === JSON.stringify(items);
    if (!same) { setItems(built.items); void kvSet(`items:${userKey}`, built.items); }
  }, [built, items, loaded, userKey]);

  const update = useCallback(async (patch: Partial<Traveller>) => {
    const next = { ...traveller, ...patch };
    setTraveller(next);
    await kvSet(`traveller:${userKey}`, next);
    if (next.borderPoint && next.purpose && next.travelMode) {
      await queueJourney({ intendedBorderPoint: next.borderPoint, destinationCountry: 'Uganda', travelPurpose: next.purpose, travelMode: next.travelMode, travelDate: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10) });
      if (online) await flushOutbox();
    }
  }, [traveller, online, userKey]);

  const setStatus = useCallback(async (id: string) => {
    const next = built.items.map((i) => (i.id === id ? { ...i, status: STATUS_NEXT[i.status] } : i));
    setItems(next);
    await kvSet(`items:${userKey}`, next);
  }, [built, userKey]);

  const saveAssessment = useCallback(async () => {
    const r = buildChecklist(traveller, rules, items);
    await queueAssessment({ nationality: traveller.nationality ?? '', score: r.readiness.score, status: r.readiness.statusLabel, completedItems: r.readiness.completedCount, totalItems: r.readiness.totalCount, missingMandatoryCount: r.readiness.missingMandatoryCount, checklist: r.items.map((i) => ({ code: i.id, status: i.status })) });
    return online ? flushOutbox() : { sent: 0, remaining: 1 };
  }, [traveller, rules, items, online]);

  return { traveller, update, built, setStatus, saveAssessment, loaded };
}
type T = ReturnType<typeof useTraveller>;

export const Journey = ({ t }: { t: T }) => (
  <ScrollView contentContainerStyle={{ padding: 16 }}>
    <H>Your journey</H>
    <Card>
      <Field label="Nationality" value={t.traveller.nationality ?? ''} onChangeText={(v) => void t.update({ nationality: v })} placeholder="e.g. Kenya" />
      <Text style={{ fontSize: 12, fontWeight: '600', color: C.text2, marginBottom: 6 }}>Purpose of travel</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{PURPOSES.map(([k, l]) => <Chip key={k} label={l} on={t.traveller.purpose === k} onPress={() => void t.update({ purpose: k })} />)}</View>
      <Text style={{ fontSize: 12, fontWeight: '600', color: C.text2, marginVertical: 6 }}>How are you travelling?</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{MODES.map((m) => <Chip key={m} label={m} on={t.traveller.travelMode === m} onPress={() => void t.update({ travelMode: m })} />)}</View>
      <Field label="Border post or airport" value={t.traveller.borderPoint ?? ''} onChangeText={(v) => void t.update({ borderPoint: v })} placeholder="e.g. Malaba" />
    </Card>
    <Card>
      <Text style={{ fontWeight: '700', color: C.navy, marginBottom: 8 }}>What you already have</Text>
      {([['passport', 'Valid passport'], ['yellowFever', 'Yellow fever certificate'], ['returnTicket', 'Return ticket'], ['accommodation', 'Accommodation proof'], ['insurance', 'Travel insurance']] as const).map(([k, l]) => (
        <Chip key={k} label={l} on={Boolean(t.traveller[k])} onPress={() => void t.update({ [k]: !t.traveller[k] })} />
      ))}
    </Card>
    <Muted>Your checklist updates when you change nationality or purpose. Details are kept on this phone and synced when you are online.</Muted>
  </ScrollView>
);

export const Checklist = ({ t, online }: { t: T; online: boolean }) => {
  const [msg, setMsg] = useState('');
  const b = t.built;
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <H>Checklist</H>
      {b.warnings.includes('missing_nationality') && <Muted>Add your nationality in Journey to see what applies to you.</Muted>}
      {b.warnings.includes('missing_purpose') && <Muted>Choose a purpose of travel to include purpose-specific documents.</Muted>}
      {b.warnings.includes('unsupported_purpose') && <Muted>Your purpose is not covered by a specific rule yet. General requirements are shown.</Muted>}
      <Card>
        <Text style={{ fontSize: 34, fontWeight: '800', color: C.navy }}>{b.readiness.score}%</Text>
        <Text style={{ color: C.text2, fontWeight: '600' }}>{b.readiness.statusLabel}</Text>
        <Muted>{b.readiness.completedCount} of {b.readiness.totalCount} done</Muted>
      </Card>
      {b.items.map((i) => (
        <Card key={i.id}>
          <Text style={{ fontWeight: '700', color: C.navy }}>{i.title}{i.mandatory ? ' *' : ''}</Text>
          <Muted>{i.description}</Muted>
          <Btn title={STATUS_TEXT[i.status]} kind={i.status === 'complete' ? 'primary' : 'outline'} onPress={() => void t.setStatus(i.id)} />
        </Card>
      ))}
      <Btn title="Save my readiness" onPress={() => void t.saveAssessment().then((r) => setMsg(r.remaining ? 'Saved on this phone. It will sync when you are online.' : 'Saved and synced.'))} />
      {msg ? <Muted>{msg}</Muted> : null}
      {!online && <Muted>Offline: everything here still works.</Muted>}
      {b.warnings.includes('unverified_rules_applied') && <Muted>Some rules shown are still awaiting official verification. Always confirm with the immigration authority.</Muted>}
    </ScrollView>
  );
};

export const Assistant = ({ t, online }: { t: T; online: boolean }) => {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ answer: string; sources: { id: string; title: string; authority: string }[]; mode: 'rag' | 'general' | 'fallback'; disclaimer: string } | null>(null);
  const [err, setErr] = useState('');
  const ask = async () => {
    setBusy(true); setErr('');
    try { setRes(await api('POST', '/assistant/ask', { question: q, nationalityGroup: t.built.group, purpose: t.built.purpose })); }
    catch (e) { setErr(e instanceof ApiUnavailableError ? 'The assistant needs an internet connection.' : e instanceof ApiError && e.status === 503 ? 'The assistant is not switched on for this server yet.' : e instanceof Error ? e.message : 'Could not get an answer.'); }
    finally { setBusy(false); }
  };
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <H>Assistant</H>
      <Muted>Answers come only from approved Pearl Travel guidance, with sources. It cannot give legal advice.</Muted>
      <Field label="Your question" value={q} onChangeText={setQ} multiline placeholder="e.g. Do I need a yellow fever certificate?" />
      <Btn title="Ask" onPress={() => void ask()} busy={busy} disabled={!online || q.trim().length < 3} />
      {!online && <Muted>Offline: the assistant needs a connection. Your checklist and saved guidance still work.</Muted>}
      {err ? <Text accessibilityRole="alert" style={{ color: C.error, marginTop: 8 }}>{err}</Text> : null}
      {res && (
        <Card>
          {res.mode === 'general' ? <Text style={{ color: C.error, fontWeight: '700', fontSize: 12, marginBottom: 6 }}>General travel answer, not approved guidance</Text> : null}
          <Text style={{ color: C.text }}>{res.answer}</Text>
          {res.sources.map((s) => <Muted key={s.id}>{s.id} · {s.title} ({s.authority})</Muted>)}
          <Muted>{res.disclaimer}</Muted>
        </Card>
      )}
    </ScrollView>
  );
};

interface Pass { token: string; referenceCode: string; expiresAt: string; score: number; status: string }
export const QrPass = ({ t, online, userKey }: { t: T; online: boolean; userKey: string }) => {
  const [pass, setPass] = useState<Pass | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { void kvGet<Pass>(`pass:${userKey}`).then(setPass); }, [userKey]);
  const expired = pass ? new Date(pass.expiresAt).getTime() < Date.now() : false;
  const create = async () => {
    setBusy(true); setErr('');
    try {
      const p = await api<Pass>('POST', '/qr/issue', { profile: { nationality: t.traveller.nationality, purpose: t.traveller.purpose, travelMode: t.traveller.travelMode, borderPoint: t.traveller.borderPoint }, items: t.built.items.map((i) => ({ code: i.id, status: i.status })) });
      await kvSet(`pass:${userKey}`, p); setPass(p);
    } catch (e) { setErr(e instanceof ApiUnavailableError ? 'Creating a pass needs an internet connection. A saved pass stays available.' : e instanceof Error ? e.message : 'Could not create the pass.'); }
    finally { setBusy(false); }
  };
  const revoke = async () => {
    setBusy(true); setErr('');
    try { await api('POST', '/qr/revoke', {}); await kvDel(`pass:${userKey}`); setPass(null); }
    catch (e) { setErr(e instanceof ApiUnavailableError ? 'Revoking needs an internet connection.' : e instanceof Error ? e.message : 'Could not revoke.'); }
    finally { setBusy(false); }
  };
  return (
    <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'stretch' }}>
      <H>QR pass</H>
      <Card>
        {pass && !expired ? (
          <View style={{ alignItems: 'center' }}>
            <View style={{ padding: 12, backgroundColor: '#fff' }}><QRCode value={pass.token} size={220} ecl="M" /></View>
            <Text style={{ fontFamily: 'monospace', fontWeight: '700', marginTop: 10 }}>{pass.referenceCode}</Text>
            <Text style={{ color: C.navy, fontWeight: '700' }}>{pass.score}% · {pass.status}</Text>
            <Muted>Valid until {new Date(pass.expiresAt).toLocaleString()}{!online ? ' · saved pass, works offline' : ''}</Muted>
          </View>
        ) : <Muted>{expired ? 'Your pass has expired. Create a new one.' : 'No pass yet.'}</Muted>}
      </Card>
      <Btn title={pass && !expired ? 'Create new pass' : 'Create pass'} onPress={() => void create()} busy={busy} disabled={!online} />
      {pass && !expired && <Btn title="Revoke" kind="danger" onPress={() => void revoke()} disabled={!online || busy} />}
      {err ? <Text accessibilityRole="alert" style={{ color: C.error, marginTop: 8 }}>{err}</Text> : null}
      <Muted>The code holds only a random reference, your score and six document statuses. No name, passport number or contact details. Advisory only: it is not a travel permit.</Muted>
    </ScrollView>
  );
};
