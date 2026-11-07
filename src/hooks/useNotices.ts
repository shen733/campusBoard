import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadNotices, saveNotices } from '../services/cacheServices';
import { fetchNotices } from '../services/noticesService';
import { Category, Notice } from '../types';
import { toMessage } from '../utils/errors';

type NoticesStatus = 'loading' | 'success' | 'error';

interface UseNoticesOptions {
  category?: Category | 'All';
  userId?: string | null;
}

export function useNotices(options: UseNoticesOptions = {}) {
  const [allNotices, setAllNotices] = useState<Notice[]>([]);
  const [status, setStatus] = useState<NoticesStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const hasAttemptedLoad = useRef(false);

  const load = useCallback(async () => {
    hasAttemptedLoad.current = true;
    try {
      const freshNotices = await fetchNotices();
      setAllNotices(freshNotices);
      setCachedAt(null);
      setErrorMessage('');
      setStatus('success');

      try {
        await saveNotices(freshNotices);
      } catch (error) {
        console.warn('Could not cache notices:', error);
      }
    } catch (error) {
      const cached = await loadNotices();
      if (cached) {
        setAllNotices(cached.notices);
        setCachedAt(cached.savedAt);
        setStatus('success');
      } else {
        setErrorMessage(toMessage(error));
        setStatus('error');
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const retry = useCallback(async () => {
    setStatus('loading');
    setErrorMessage('');
    await load();
  }, [load]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const notices = useMemo(() => {
    let filtered = allNotices;
    if (options.category && options.category !== 'All') {
      filtered = filtered.filter((notice) => notice.category === options.category);
    }
    if (options.userId !== undefined) {
      filtered = filtered.filter((notice) => notice.user_id === options.userId);
    }
    return filtered;
  }, [allNotices, options.category, options.userId]);

  return {
    notices,
    status,
    errorMessage,
    refreshing,
    cachedAt,
    loading: status === 'loading',
    error: errorMessage,
    refresh,
    retry,
    refetch: refresh,
  };
}