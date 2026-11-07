import { Stack, useRouter } from 'expo-router';
import { NoticeForm } from '../../src/components/NoticeForm';
import { Screen } from '../../src/components/Screen';
import { useNoticeActions } from '../../src/hooks/useNoticeActions';
import { EMPTY_NOTICE_FORM } from '../../src/utils/noticeForm';

export default function CreateNoticeScreen() {
  const router = useRouter();
  const { create } = useNoticeActions();

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: 'Post a notice' }} />
      <NoticeForm
        initialValues={EMPTY_NOTICE_FORM}
        submitLabel="Post notice"
        onSubmit={async (values) => {
          await create(values, values.imageUri, values.remind);
          router.back();
        }}
      />
    </Screen>
  );
}