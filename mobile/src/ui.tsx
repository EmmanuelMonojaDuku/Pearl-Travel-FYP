import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { C } from './theme';

export const Btn = ({ title, onPress, kind = 'primary', disabled, busy }: { title: string; onPress: () => void; kind?: 'primary' | 'outline' | 'danger'; disabled?: boolean; busy?: boolean }) => (
  <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={disabled || busy} onPress={onPress}
    style={[s.btn, kind === 'outline' && s.btnOutline, kind === 'danger' && s.btnDanger, (disabled || busy) && { opacity: 0.5 }]}>
    {busy ? <ActivityIndicator color={C.navy} /> : <Text style={[s.btnText, kind !== 'primary' && { color: kind === 'danger' ? '#fff' : C.navy }]}>{title}</Text>}
  </Pressable>
);
export const Field = (p: TextInputProps & { label: string }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={s.label}>{p.label}</Text>
    <TextInput {...p} accessibilityLabel={p.label} placeholderTextColor={C.muted} style={s.input} />
  </View>
);
export const Card = ({ children }: { children: React.ReactNode }) => <View style={s.card}>{children}</View>;
export const H = ({ children }: { children: React.ReactNode }) => <Text style={s.h}>{children}</Text>;
export const Muted = ({ children }: { children: React.ReactNode }) => <Text style={s.muted}>{children}</Text>;
export const Chip = ({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) => (
  <Pressable accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress} style={[s.chip, on && s.chipOn]}><Text style={[s.chipText, on && { color: C.navy }]}>{label}</Text></Pressable>
);
export const Banner = ({ text }: { text: string }) => <View style={s.banner}><Text style={s.bannerText}>{text}</Text></View>;

export const s = StyleSheet.create({
  btn: { backgroundColor: C.yellow, borderRadius: 14, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, marginVertical: 4 },
  btnOutline: { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border },
  btnDanger: { backgroundColor: C.error },
  btnText: { color: C.navy, fontWeight: '700', fontSize: 15 },
  label: { fontSize: 12, fontWeight: '600', color: C.text2, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: C.text },
  card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12 },
  h: { fontSize: 20, fontWeight: '800', color: C.navy, marginBottom: 8 },
  muted: { fontSize: 12, color: C.muted, lineHeight: 18 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: C.grey, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  chipOn: { backgroundColor: C.yellow, borderColor: C.gold },
  chipText: { fontSize: 13, fontWeight: '600', color: C.text2 },
  banner: { backgroundColor: C.yellow, paddingVertical: 6, paddingHorizontal: 12 },
  bannerText: { color: C.navy, fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
