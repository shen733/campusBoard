import { useCallback, useEffect, useState } from 'react';
import * as locationService from '../services/locationsService';
import * as weatherService from '../services/weatherService';
import { WeatherData } from '../types';
import { toMessage } from '../utils/errors';

export type WeatherState =
  | { phase: 'locating' }
  | { phase: 'loading'; placeName?: string }
  | { phase: 'denied' }
  | { phase: 'location-error' }
  | { phase: 'empty' }
  | { phase: 'error'; message: string }
  | { phase: 'success'; placeName?: string; weather: WeatherData };

/** Location -> coordinates -> Open-Meteo, exposed as one state machine the screen can render. */
export function useWeather() {
  const [state, setState] = useState<WeatherState>({ phase: 'locating' });

  const load = useCallback(async () => {
    setState({ phase: 'locating' });
    const location = await locationService.getCurrentLocation();
    if (location.status === 'denied') return setState({ phase: 'denied' });
    if (location.status === 'error') return setState({ phase: 'location-error' });

    setState({ phase: 'loading', placeName: location.placeName });
    try {
      const weather = await weatherService.fetchWeather(location.coords);
      if (weather.daily.length === 0) return setState({ phase: 'empty' });
      setState({ phase: 'success', placeName: location.placeName, weather });
    } catch (error) {
      setState({ phase: 'error', message: toMessage(error) });
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void load();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [load]);

  return { state, reload: load };
}