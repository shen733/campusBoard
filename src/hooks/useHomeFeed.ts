import { useMemo } from 'react';
import { Category } from '../types';
import {
  filterHomeNotices,
  getMostRecentEmergency,
  getUpcomingNotices,
  sortEmergencyFirst,
} from '../utils/homeFeed';
import { useNotices } from './useNotices';

interface UseHomeFeedOptions {
  category: Category | 'All';
  query: string;
}

export function useHomeFeed({ category, query }: UseHomeFeedOptions) {
  const feed = useNotices({ category: 'All' });
  const emergencyNotice = useMemo(
    () => getMostRecentEmergency(feed.notices),
    [feed.notices],
  );
  const upcomingNotices = useMemo(
    () => getUpcomingNotices(feed.notices),
    [feed.notices],
  );
  const notices = useMemo(
    () => sortEmergencyFirst(filterHomeNotices(feed.notices, query, category)),
    [feed.notices, query, category],
  );

  return {
    ...feed,
    notices,
    emergencyNotice,
    upcomingNotices,
    hasSearchResults: notices.length > 0,
    hasActiveSearch: query.trim().length > 0,
  };
}
