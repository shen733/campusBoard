import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web.
 * We intentionally defer the hydration update to avoid synchronous state changes during effect setup.
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setHasHydrated(true);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  const colorScheme = useRNColorScheme();
  return hasHydrated ? colorScheme : 'light';
}
