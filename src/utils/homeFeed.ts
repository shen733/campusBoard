import { Category, Notice } from '../types';

export function getMostRecentEmergency(notices: Notice[]): Notice | null {
  let mostRecent: Notice | null = null;

  for (const notice of notices) {
    if (notice.category !== 'Emergency') continue;
    if (
      !mostRecent ||
      Date.parse(notice.created_at) > Date.parse(mostRecent.created_at)
    ) {
      mostRecent = notice;
    }
  }

  return mostRecent;
}

export function getUpcomingNotices(
  notices: Notice[],
  now: number = Date.now(),
  limit = 5,
): Notice[] {
  return notices
    .filter((notice) => {
      if (!notice.event_date) return false;
      const eventTime = Date.parse(notice.event_date);
      return Number.isFinite(eventTime) && eventTime > now;
    })
    .sort((a, b) => Date.parse(a.event_date!) - Date.parse(b.event_date!))
    .slice(0, limit);
}

export function filterHomeNotices(
  notices: Notice[],
  query: string,
  category: Category | 'All',
): Notice[] {
  const search = query.trim().toLowerCase();
  return notices.filter((notice) => {
    const matchesCategory = category === 'All' || notice.category === category;
    const matchesSearch =
      search.length === 0 ||
      notice.title.toLowerCase().includes(search) ||
      notice.description.toLowerCase().includes(search);
    return matchesCategory && matchesSearch;
  });
}

export function sortEmergencyFirst(notices: Notice[]): Notice[] {
  return notices
    .map((notice, index) => ({ notice, index }))
    .sort((a, b) => {
      const emergencyOrder =
        Number(b.notice.category === 'Emergency') - Number(a.notice.category === 'Emergency');
      return emergencyOrder || a.index - b.index;
    })
    .map(({ notice }) => notice);
}
