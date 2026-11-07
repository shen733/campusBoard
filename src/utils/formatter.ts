const LOCALE = 'en-GB';

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatWeekday(isoDate: string, index: number): string {
  if (index === 0) return 'Today';
  return new Date(isoDate).toLocaleDateString(LOCALE, { weekday: 'short', day: 'numeric' });
}