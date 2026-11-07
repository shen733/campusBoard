import { NoticeFormValues } from '../types/notices';

export type NoticeFormErrors = Partial<
  Record<'title' | 'description' | 'location' | 'eventDate', string>
>;

export function validateNoticeForm(values: NoticeFormValues): NoticeFormErrors {
  const errors: NoticeFormErrors = {};
  const title = values.title.trim();
  const description = values.description.trim();

  if (title.length < 3) errors.title = 'Title must be at least 3 characters.';
  else if (title.length > 100) errors.title = 'Title must be 100 characters or fewer.';

  if (description.length < 10) errors.description = 'Description must be at least 10 characters.';
  else if (description.length > 1000) errors.description = 'Description must be 1000 characters or fewer.';

  if (values.location.trim().length > 100) errors.location = 'Location must be 100 characters or fewer.';

  if (values.remind) {
    if (!values.eventDate) errors.eventDate = 'Choose a date and time to set a reminder.';
    else if (values.eventDate.getTime() <= Date.now()) errors.eventDate = 'The reminder time must be in the future.';
  }

  return errors;
}