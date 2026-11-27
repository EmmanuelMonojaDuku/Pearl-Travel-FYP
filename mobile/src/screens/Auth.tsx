import React, { useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { ApiError, ApiUnavailableError, login, register, type ServerUser } from '../http';
import { C } from '../theme';
import { Btn, Field, Muted } from '../ui';

export const Auth = ({ onUser }: { onUser: (u: ServerUser) => void }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [f, setF] = useState({ first: '', last: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setBusy(true); setErr('');
    try {
      if (mode === 'register') await register(f.first.trim(), f.last.trim(), f.email.trim(), f.password);
      onUser(await login(f.email.trim(), f.password));
    } catch (e) {
      setErr(e instanceof ApiUnavailableError ? 'The server cannot be reached. Sign-in needs a connection.' : e instanceof ApiError ? e.message : 'Something went wrong.');
    } finally { setBusy(false); }
  };

  return (
    <ScrollView style={{ backgroundColor: C.navy }} contentContainerStyle={{ padding: 24, paddingTop: 72 }} keyboardShouldPersistTaps="handled">
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <Image source={require('../../assets/icon.png')} style={{ width: 96, height: 96, borderRadius: 20 }} />
        <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 12 }}>Pearl Travel</Text>
        <Text style={{ color: '#CBD5E1', marginTop: 4 }}>Get ready before you reach the border</Text>
      </View>
      <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20 }}>
        {mode === 'register' && (<><Field label="First name" value={f.first} onChangeText={set('first')} /><Field label="Last name" value={f.last} onChangeText={set('last')} /></>)}
        <Field label="Email" autoCapitalize="none" keyboardType="email-address" value={f.email} onChangeText={set('email')} />
        <Field label="Password" secureTextEntry value={f.password} onChangeText={set('password')} />
        {err ? <Text accessibilityRole="alert" style={{ color: C.error, fontSize: 12, marginBottom: 8 }}>{err}</Text> : null}
        <Btn title={mode === 'login' ? 'Sign in' : 'Create account'} onPress={() => void submit()} busy={busy} />
        <Btn title={mode === 'login' ? 'Create an account' : 'I have an account'} kind="outline" onPress={() => { setErr(''); setMode(mode === 'login' ? 'register' : 'login'); }} />
        <Muted>Accounts and roles are managed by the Pearl Travel server. Officer and administrator access is granted by an administrator.</Muted>
      </View>
    </ScrollView>
  );
};
