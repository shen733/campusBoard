import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { getPermissionState, PermissionState } from '../services/locationsService';

export function useLocationPermission() {
  const [permission, setPermission] = useState<PermissionState | null>(null);

  useFocusEffect(
    useCallback(() => {
      getPermissionState()
        .then(setPermission)
        .catch(() => setPermission(null));
    }, []),
  );

  return permission;
}