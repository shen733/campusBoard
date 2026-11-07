import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { NoticeForm } from '../../src/components/NoticeForm';
import { Screen } from '../../src/components/Screen';
import { EmptyView, ErrorView, LoadingView } from '../../src/components/StateViews';
import { useAuth } from '../../src/hooks/useAuth';
import { useNotice } from '../../src/hooks/useNotice';
import { useNoticeActions } from '../../src/hooks/useNoticeActions';
import { noticeToFormValues } from '../../src/utils/noticeForm';

export default function EditNoticeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const noticeId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { session, profile } = useAuth();
  const { notice, status, errorMessage, retry } = useNotice(noticeId);
  const { update } = useNoticeActions();

  const goBack = () => router.back();

  const renderBody = () => {
    if (status === 'loading') return <LoadingView message="Loading notice..." />;
    if (status === 'error') return <ErrorView message={errorMessage} onRetry={retry} />;
    if (!notice) {
      return (
        <EmptyView
          icon="document-outline"
          title="Notice not found"
          message="It may have been deleted."
          actionLabel="Go back"
          onAction={goBack}
        />
      );
    }
    if (notice.user_id !== session?.user.id && profile?.role !== 'admin') {
      return (
        <EmptyView
          icon="lock-closed-outline"
          title="You can't edit this notice"
          message="Only the author can edit a notice."
          actionLabel="Go back"
          onAction={goBack}
        />
      );
    }
    return (
      <NoticeForm
        initialValues={noticeToFormValues(notice)}
        submitLabel="Save changes"
        onSubmit={async (values) => {
          const image = values.imageUri === notice.image_url
            ? { newUri: null, removed: false }
            : values.imageUri
              ? { newUri: values.imageUri, removed: false }
              : { newUri: null, removed: notice.image_url !== null };
          await update(notice, values, image, values.remind);
          router.back();
        }}
      />
    );
  };

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ title: 'Edit notice' }} />
      {renderBody()}
    </Screen>
  );
}