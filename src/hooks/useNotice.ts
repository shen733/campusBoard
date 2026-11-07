import { useCallback, useEffect, useState } from 'react';
import { fetchNotice } from '../services/noticesService';
import { Notice } from '../types';
import { toMessage } from '../utils/errors';

type NoticeStatus = 'loading' | 'success' | 'error' | 'not-found';

export function useNotice(id: string | undefined) {
  const [retryCount, setRetryCount] = useState(0);
  const [result, setResult] = useState<{
    id: string;
    attempt: number;
    notice: Notice | null;
    status: Exclude<NoticeStatus, 'loading'>;
    errorMessage: string;
  } | null>(null);

  const retry = useCallback(() => setRetryCount((current) => current + 1), []);

  useEffect(() => {
    let active = true;

    if (!id) return;
    fetchNotice(id)
      .then((fetchedNotice) => {
        if (!active) return;
        setResult({
          id,
          attempt: retryCount,
          notice: fetchedNotice,
          status: fetchedNotice ? 'success' : 'not-found',
          errorMessage: '',
        });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setResult({
          id,
          attempt: retryCount,
          notice: null,
          status: 'error',
          errorMessage: toMessage(error),
        });
      });

    return () => {
      active = false;
    };
  }, [id, retryCount]);

  const currentResult = result && result.id === id && result.attempt === retryCount ? result : null;
  return {
    notice: currentResult?.notice ?? null,
    status: id ? (currentResult?.status ?? 'loading') : 'not-found',
    errorMessage: currentResult?.errorMessage ?? '',
    retry,
  };
}
