import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Notice } from '../types';

const REMINDERS_KEY = 'campusboard:reminders:v1';
const CHANNEL_ID = 'notice-reminders';
const LEAD_TIME_MS = 60 * 60 * 1000;
const MIN_DELAY_MS = 5000;

type NotificationsModule = typeof import('expo-notifications');
let notificationsModule: Promise<NotificationsModule> | null = null;
let handlerConfigured = false;

async function getNotifications(): Promise<NotificationsModule> {
  notificationsModule ??= import('expo-notifications');
  const Notifications = await notificationsModule;
  if (!handlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    handlerConfigured = true;
  }
  return Notifications;
}

export type ReminderResult = 'scheduled' | 'permission-denied' | 'event-passed';

type ReminderMap = Record<string, string>;

async function readReminders(): Promise<ReminderMap> {
  try {
    const raw = await AsyncStorage.getItem(REMINDERS_KEY);
    return raw ? (JSON.parse(raw) as ReminderMap) : {};
  } catch {
    return {};
  }
}

async function ensurePermission(): Promise<boolean> {
  const Notifications = await getNotifications();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function cancelReminder(noticeId: string): Promise<void> {
  const reminders = await readReminders();
  const scheduledId = reminders[noticeId];
  if (!scheduledId) return;
  const Notifications = await getNotifications();
  await Notifications.cancelScheduledNotificationAsync(scheduledId);
  delete reminders[noticeId];
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
}

export async function hasReminder(noticeId: string): Promise<boolean> {
  const reminders = await readReminders();
  return noticeId in reminders;
}

/** Schedules a local reminder one hour before the notice's event (or shortly from now if that moment has passed). */
export async function scheduleReminder(notice: Notice): Promise<ReminderResult> {
  if (!notice.event_date) return 'event-passed';
  const eventTime = new Date(notice.event_date).getTime();
  if (eventTime <= Date.now()) return 'event-passed';

  if (!(await ensurePermission())) return 'permission-denied';

  const Notifications = await getNotifications();
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Notice reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  await cancelReminder(notice.id);

  const triggerTime = Math.max(eventTime - LEAD_TIME_MS, Date.now() + MIN_DELAY_MS);
  const scheduledId = await Notifications.scheduleNotificationAsync({
    content: { title: notice.title, body: `${notice.category} notice starting soon`, data: { noticeId: notice.id } },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(triggerTime),
      channelId: CHANNEL_ID,
    },
  });

  const reminders = await readReminders();
  reminders[notice.id] = scheduledId;
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  return 'scheduled';
}