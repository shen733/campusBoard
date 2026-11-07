import * as Location from 'expo-location';
import { Coordinates } from '../types';

export type LocationResult =
  | { status: 'granted'; coords: Coordinates; placeName?: string }
  | { status: 'denied' }
  | { status: 'error' };

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export async function getPermissionState(): Promise<PermissionState> {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status === Location.PermissionStatus.GRANTED
    ? 'granted'
    : status === Location.PermissionStatus.DENIED
      ? 'denied'
      : 'undetermined';
}

async function lookUpPlaceName(coords: Coordinates): Promise<string | undefined> {
  try {
    const [place] = await Location.reverseGeocodeAsync(coords);
    return place?.city ?? place?.subregion ?? place?.region ?? undefined;
  } catch {
    // The place name is a nicety; weather still works without it.
    return undefined;
  }
}

export async function getCurrentLocation(): Promise<LocationResult> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== Location.PermissionStatus.GRANTED) return { status: 'denied' };

    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
    return { status: 'granted', coords, placeName: await lookUpPlaceName(coords) };
  } catch {
    return { status: 'error' };
  }
}