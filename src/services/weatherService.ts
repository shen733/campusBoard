import { Coordinates, WeatherData } from '../types';

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const TIMEOUT_MS = 12000;

interface OpenMeteoResponse {
  current?: { temperature_2m: number; weather_code: number; wind_speed_10m: number };
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
}

export async function fetchWeather({ latitude, longitude }: Coordinates): Promise<WeatherData> {
  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    timezone: 'auto',
    forecast_days: '5',
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE_URL}?${query.toString()}`, { signal: controller.signal });
    if (response.status === 429) throw new Error('The weather service is busy. Please try again in a minute.');
    if (!response.ok) throw new Error(`The weather service returned an error (${response.status}).`);

    const body = (await response.json()) as OpenMeteoResponse;
    const { current, daily } = body;
    if (!current || !daily) return { temperature: 0, windSpeed: 0, conditionCode: 0, daily: [] };

    return {
      temperature: Math.round(current.temperature_2m),
      windSpeed: Math.round(current.wind_speed_10m),
      conditionCode: current.weather_code,
      daily: daily.time.map((date, index) => ({
        date,
        maxTemp: Math.round(daily.temperature_2m_max[index]),
        minTemp: Math.round(daily.temperature_2m_min[index]),
        conditionCode: daily.weather_code[index],
      })),
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('The weather request timed out. Check your connection and try again.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export interface ConditionInfo {
  label: string;
  icon: 'sunny' | 'partly-sunny' | 'cloud' | 'cloudy' | 'rainy' | 'thunderstorm' | 'snow';
}

/** Maps WMO weather codes (used by Open-Meteo) to a label and an Ionicons name. */
export function describeCondition(code: number): ConditionInfo {
  if (code === 0) return { label: 'Clear sky', icon: 'sunny' };
  if (code === 1) return { label: 'Mostly clear', icon: 'sunny' };
  if (code === 2) return { label: 'Partly cloudy', icon: 'partly-sunny' };
  if (code === 3) return { label: 'Overcast', icon: 'cloud' };
  if (code === 45 || code === 48) return { label: 'Fog', icon: 'cloudy' };
  if (code >= 51 && code <= 57) return { label: 'Drizzle', icon: 'rainy' };
  if (code >= 61 && code <= 67) return { label: 'Rain', icon: 'rainy' };
  if (code >= 71 && code <= 77) return { label: 'Snow', icon: 'snow' };
  if (code >= 80 && code <= 82) return { label: 'Rain showers', icon: 'rainy' };
  if (code === 85 || code === 86) return { label: 'Snow showers', icon: 'snow' };
  if (code >= 95) return { label: 'Thunderstorm', icon: 'thunderstorm' };
  return { label: 'Unknown', icon: 'cloud' };
}