import { useCallback, useState } from 'react';
import * as noticeService from '../services/noticesService';
import * as notificationService from '../services/notificationServices';
import { Notice, NoticeInput } from '../types';
import { NoticeFormValues } from '../utils/validators';
import { useAuth } from './useAuth';

export interface ImageChange {
  /** Local URI of a newly picked image, if any. */
  newUri: string | null;
  /** True when the user removed the existing image without choosing a new one. */
  removed: boolean;
}

export type ReminderOutcome = notificationService.ReminderResult | 'not-requested';

function toInput(values: NoticeFormValues, imageUrl: string | null): NoticeInput {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    category: values.category,
    location: values.location.trim() || null,
    image_url: imageUrl,
    event_date: values.eventDate ? values.eventDate.toISOString() : null,
  };
}

export function useNoticeActions() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const applyReminder = useCallback(async (notice: Notice, wanted: boolean): Promise<ReminderOutcome> => {
    if (!wanted) {
      await notificationService.cancelReminder(notice.id);
      return 'not-requested';
    }
    return notificationService.scheduleReminder(notice);
  }, []);

  const create = useCallback(
    async (values: NoticeFormValues, imageUri: string | null, remind: boolean) => {
      if (!user) throw new Error('You must be signed in to post a notice.');
      setBusy(true);
      try {
        const imageUrl = imageUri ? await noticeService.uploadNoticeImage(user.id, imageUri) : null;
        const notice = await noticeService.createNotice(user.id, toInput(values, imageUrl));
        const reminder = await applyReminder(notice, remind);
        return { notice, reminder };
      } finally {
        setBusy(false);
      }
    },
    [user, applyReminder],
  );

  const update = useCallback(
    async (existing: Notice, values: NoticeFormValues, image: ImageChange, remind: boolean) => {
      if (!user) throw new Error('You must be signed in to edit a notice.');
      setBusy(true);
      try {
        let imageUrl = existing.image_url;
        if (image.newUri) imageUrl = await noticeService.uploadNoticeImage(user.id, image.newUri);
        else if (image.removed) imageUrl = null;

        const notice = await noticeService.updateNotice(existing.id, toInput(values, imageUrl));
        const reminder = await applyReminder(notice, remind);
        return { notice, reminder };
      } finally {
        setBusy(false);
      }
    },
    [user, applyReminder],
  );

  const remove = useCallback(async (noticeId: string) => {
    setBusy(true);
    try {
      await noticeService.deleteNotice(noticeId);
      await notificationService.cancelReminder(noticeId);
    } finally {
      setBusy(false);
    }
  }, []);

  return { busy, create, update, remove };
}