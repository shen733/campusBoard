import { Alert } from 'react-native';

function confirm(title: string, message: string, actionLabel: string): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: actionLabel, style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

export function confirmDelete(noticeTitle: string): Promise<boolean> {
  return confirm('Delete notice?', `"${noticeTitle}" will be permanently removed. This cannot be undone.`, 'Delete');
}

export function confirmLogout(): Promise<boolean> {
  return confirm('Log out?', 'You will need to sign in again to view notices.', 'Log out');
}