import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { api, ApiError, ApiUnavailableError } from '../http';
import { C } from '../theme';
import { Btn, Card, Field, H, Muted } from '../ui';

interface Result { outcome: 'verified' | 'expired' | 'revoked' | 'invalid'; reason?: string; verificationId?: string; referenceCode?: string; score?: number; status?: string; documentCodes?: string; advisory: string }
const DOCS = ['Passport', 'Visa / entry', 'Yellow fever', 'Return ticket', 'Accommodation', 'Insurance'];
const WORD: Record<string, string> = { c: 'Complete', m: 'Missing', e: 'Expired', n: 'N/A' };
const TITLE: Record<string, string> = { verified: 'Verified pass', expired: 'Pass expired', revoked: 'Pass revoked', invalid: 'Not a valid pass' };

/** Officer verification. Every scan is checked by the server (signature, status, expiry) and recorded against the officer's border post. */
export const Officer = ({ online }: { online: boolean }) => {
  const [perm, ask] = useCameraPermissions();
  const [token, setToken] = useState('');
  const [res, setRes] = useState<Result | null>(null);
  const [err, setErr] = useState('');
  const busy = useRef(false);

  const verify = useCallback(async (code: string) => {
    if (busy.current) return;
    busy.current = true; setErr('');
    try { setRes(await api<Result>('POST', '/qr/verify', { token: code.trim() })); }
    catch (e) { setErr(e instanceof ApiUnavailableError ? 'Verification needs a connection to the server. An unsigned or offline check is not accepted.' : e instanceof ApiError ? e.message : 'Could not verify.'); }
    finally { setTimeout(() => { busy.current = false; }, 1200); }
  }, []);
  useEffect(() => { if (!perm) void ask(); }, [perm, ask]);

  const decide = async (d: 'approved' | 'flagged') => {
    if (!res?.verificationId) return;
    try { await api('POST', `/qr/verifications/${res.verificationId}/decision`, { decision: d }); setRes(null); setToken(''); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Could not save.'); }
  };

  if (res) {
    const ok = res.outcome === 'verified';
    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <H>{TITLE[res.outcome]}</H>
        <Card>
          {ok ? (
            <>
              <Muted>Reference</Muted><Text style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: 18 }}>{res.referenceCode}</Text>
              <Text style={{ color: C.navy, fontWeight: '700', marginVertical: 8 }}>{res.score}% · {res.status}</Text>
              {DOCS.map((d, i) => <Text key={d} style={{ color: C.text2 }}>{d}: {WORD[res.documentCodes?.[i] ?? 'n']}</Text>)}
            </>
          ) : <Text style={{ color: C.error }}>This code is not a genuine, current Pearl Travel pass. Do not rely on it.</Text>}
          <Muted>{res.advisory} The traveller's identity is not part of this code: check their passport as usual.</Muted>
        </Card>
        {ok ? (<><Btn title="Approve" onPress={() => void decide('approved')} /><Btn title="Flag for review" kind="danger" onPress={() => void decide('flagged')} /></>) : null}
        <Btn title="Back to scanner" kind="outline" onPress={() => setRes(null)} />
      </ScrollView>
    );
  }
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <H>Scan passenger pass</H>
      {perm?.granted ? (
        <View style={{ height: 300, borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
          <CameraView style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={({ data }) => { if (data.startsWith('PT1.')) void verify(data); else setErr('That is not a Pearl Travel pass.'); }} />
        </View>
      ) : <Card><Muted>Camera permission is needed to scan. You can also paste the pass code below.</Muted><Btn title="Allow camera" onPress={() => void ask()} /></Card>}
      <Field label="Or paste the pass code (starts with PT1.)" value={token} onChangeText={setToken} autoCapitalize="none" multiline />
      <Btn title="Verify pass code" kind="outline" onPress={() => void verify(token)} disabled={!online || token.length < 20} />
      {!online && <Muted>Offline: verification needs the server.</Muted>}
      {err ? <Text accessibilityRole="alert" style={{ color: C.error, marginTop: 8 }}>{err}</Text> : null}
    </ScrollView>
  );
};
