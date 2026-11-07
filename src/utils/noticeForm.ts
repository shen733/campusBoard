import { Notice } from '../types';
import { NoticeFormValues } from '../types/notices';

export const EMPTY_NOTICE_FORM: NoticeFormValues = {
  title: '',
  description: '',
  category: 'General',
  location: '',
  eventDate: null,
  imageUri: null,
  remind: false,
};

export function noticeToFormValues(notice: Notice): NoticeFormValues {
  return {
    title: notice.title,
    description: notice.description,
    category: notice.category,
    location: notice.location ?? '',
    eventDate: notice.event_date ? new Date(notice.event_date) : null,
    imageUri: notice.image_url,
    remind: false,
  };
}