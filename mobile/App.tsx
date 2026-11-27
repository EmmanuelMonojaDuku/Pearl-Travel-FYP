import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, Text, View } from 'react-native';
import { ApiUnavailableError, loadTokens, logout, me, setSignedOutHandler, type ServerUser } from './src/http';
import { BUNDLED_RULES, type RulesSnapshot } from './src/logic';
import { Auth } from './src/screens/Auth';
import { Officer } from './src/screens/Officer';
import { Assistant, Checklist, Journey, QrPass, useTraveller } from './src/screens/Traveller';
import { kvDel, kvGet, kvSet } from './src/store';
import { flushOutbox, isOnline, loadRules, onConnectivity, refreshRules } from './src/sync';
import { C } from './src/theme';
import { Banner } from './src/ui';

type Tab = 'journey' | 'checklist' | 'assistant' | 'qr' | 'scan';

export default function App() {
  const [user, setUser] = useState<ServerUser | null>(null);
  const [booting, setBooting] = useState(true);
  const [online, setOnline] = useState(true);
  const [rules, setRules] = useState<RulesSnapshot>(BUNDLED_RULES);

  useEffect(() => { setSignedOutHandler(() => setUser(null)); }, []);
  useEffect(() => onConnectivity(setOnline), []);

  // Start-up: use the saved rules and user immediately, then confirm the user (and roles) with the server.
  useEffect(() => { void (async () => {
    setRules(await loadRules());
    setOnline(await isOnline());
    const cached = await kvGet<ServerUser>('user');
    if (await loadTokens()) {
      try { const u = await me(); setUser(u); await kvSet('user', u); }
      catch (e) { if (e instanceof ApiUnavailableError && cached) setUser({ ...cached, roles: cached.roles.filter((r) => r === 'traveller') }); } // offline: never trust cached privileged roles
    }
    setBooting(false);
  })(); }, []);

  // When connectivity returns: send queued changes and pull the latest published rules.
  useEffect(() => {
    if (!online || !user) return;
    void flushOutbox();
    void refreshRules().then((r) => r && setRules(r));
  }, [online, user]);

  const signIn = useCallback(async (u: ServerUser) => { setUser(u); await kvSet('user', u); }, []);
  const signOut = useCallback(async () => { await logout(); await kvDel('user'); setUser(null); }, []);

  if (booting) return <View style={{ flex: 1, backgroundColor: C.navy, justifyContent: 'center' }}><ActivityIndicator color={C.yellow} /></View>;
  if (!user) return <><StatusBar style="light" /><Auth onUser={signIn} /></>;
  return <Shell user={user} online={online} rules={rules} onSignOut={signOut} />;
}

function Shell({ user, online, rules, onSignOut }: { user: ServerUser; online: boolean; rules: RulesSnapshot; onSignOut: () => void }) {
  const isOfficer = user.roles.includes('border_officer');
  const isAdmin = user.roles.includes('admin_staff');
  const [tab, setTab] = useState<Tab>(isOfficer ? 'scan' : 'journey');
  const t = useTraveller(rules, online, user.id);
  const tabs: [Tab, string][] = isOfficer
    ? [['scan', 'Scan']]
    : [['journey', 'Journey'], ['checklist', 'Checklist'], ['assistant', 'Assistant'], ['qr', 'QR pass']];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="light" />
      <View style={{ backgroundColor: C.navy, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View><Text style={{ color: '#fff', fontWeight: '800', fontSize: 17 }}>Pearl Travel</Text><Text style={{ color: C.yellow, fontSize: 11 }}>{isOfficer ? 'Border officer' : 'Traveller'} · {user.fullName}</Text></View>
        <Pressable accessibilityRole="button" onPress={onSignOut}><Text style={{ color: '#CBD5E1', fontSize: 13 }}>Sign out</Text></Pressable>
      </View>
      {!online && <Banner text="Offline. Saved checklist and pass still work. Sign-in, QR creation and the assistant need a connection." />}
      {isAdmin && !isOfficer && <Banner text="Administrator tools (content, rules, users, audit) are on the web dashboard." />}
      <View style={{ flex: 1 }}>
        {tab === 'journey' && <Journey t={t} />}
        {tab === 'checklist' && <Checklist t={t} online={online} />}
        {tab === 'assistant' && <Assistant t={t} online={online} />}
        {tab === 'qr' && <QrPass t={t} online={online} userKey={user.id} />}
        {tab === 'scan' && <Officer online={online} />}
      </View>
      {tabs.length > 1 && (
        <View style={{ flexDirection: 'row', backgroundColor: C.navy }}>
          {tabs.map(([id, label]) => (
            <Pressable key={id} accessibilityRole="tab" accessibilityState={{ selected: tab === id }} onPress={() => setTab(id)} style={{ flex: 1, paddingVertical: 14, alignItems: 'center' }}>
              <Text style={{ color: tab === id ? C.yellow : '#94A3B8', fontWeight: '700', fontSize: 12 }}>{label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}
