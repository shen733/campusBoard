import AsyncStorage from '@react-native-async-storage/async-storage';
import { Notice } from '../types';

const NOTICES_KEY = 'campusboard:notices:v1';

interface CachedNotices {
  savedAt: string;
  notices: Notice[];
}

export async function saveNotices(notices: Notice[]): Promise<void> {
  const payload: CachedNotices = { savedAt: new Date().toISOString(), notices };
  await AsyncStorage.setItem(NOTICES_KEY, JSON.stringify(payload));
}

export async function loadNotices(): Promise<CachedNotices | null> {
  try {
    const raw = await AsyncStorage.getItem(NOTICES_KEY);
    return raw ? (JSON.parse(raw) as CachedNotices) : null;
  } catch {
    return null;
  }
}

export async function clearNoticeCache(): Promise<void> {
  await AsyncStorage.removeItem(NOTICES_KEY);
}