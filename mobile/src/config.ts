import Constants from 'expo-constants';

/** API address. Set EXPO_PUBLIC_API_URL for a real device; the default reaches a server on the host computer from the Android emulator. */
export const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL ?? (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ?? 'http://10.0.2.2:4000';
export const API_BASE = `${API_URL.replace(/\/$/, '')}/api/v1`;
