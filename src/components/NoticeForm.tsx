import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';
import { colors, spacing } from '../theme';
import { Category } from '../types';
import { NoticeFormValues } from '../types/notices';
import { NoticeFormErrors, validateNoticeForm } from '../utils/noticeValidation';
import { CategoryChips } from './CategoryChips';

type NoticeFormProps = {
  initialValues: NoticeFormValues;
  submitLabel: string;
  onSubmit: (values: NoticeFormValues) => Promise<void>;
};

const formatEventDate = (date: Date) =>
  date.toLocaleString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export function NoticeForm({ initialValues, submitLabel, onSubmit }: NoticeFormProps) {
  const [values, setValues] = useState<NoticeFormValues>(initialValues);
  const [errors, setErrors] = useState<NoticeFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);

  const setField = <K extends keyof NoticeFormValues>(key: K, value: NoticeFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (key in errors) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
      });
      if (!result.canceled) setField('imageUri', result.assets[0].uri);
    } catch {
      setSubmitError('Could not open your photo library. Please try again.');
    }
  };

  const pickEventDate = () => {
    DateTimePickerAndroid.open({
      value: values.eventDate ?? new Date(),
      mode: 'date',
      minimumDate: new Date(),
      onChange: (dateEvent, pickedDate) => {
        if (dateEvent.type !== 'set' || !pickedDate) return;
        DateTimePickerAndroid.open({
          value: pickedDate,
          mode: 'time',
          onChange: (timeEvent, pickedTime) => {
            if (timeEvent.type === 'set' && pickedTime) setField('eventDate', pickedTime);
          },
        });
      },
    });
  };

  const clearEventDate = () => {
    setValues((current) => ({ ...current, eventDate: null, remind: false }));
    setErrors((current) => ({ ...current, eventDate: undefined }));
  };

  const handleSubmit = async () => {
    if (inFlight.current) return;
    const found = validateNoticeForm(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    inFlight.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({
        ...values,
        title: values.title.trim(),
        description: values.description.trim(),
        location: values.location.trim(),
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Could not save your notice. Check your connection and try again.',
      );
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {submitError ? (
          <View style={styles.errorBanner} accessibilityRole="alert">
            <Text style={styles.errorBannerText}>{submitError}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Title</Text>
        <TextInput
          style={[styles.input, errors.title ? styles.inputError : null]}
          value={values.title}
          onChangeText={(text) => setField('title', text)}
          placeholder="e.g. Library closed on Friday"
          placeholderTextColor={colors.textMuted}
          maxLength={100}
          returnKeyType="next"
          editable={!submitting}
        />
        {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.multiline, errors.description ? styles.inputError : null]}
          value={values.description}
          onChangeText={(text) => setField('description', text)}
          placeholder="Give students the details they need"
          placeholderTextColor={colors.textMuted}
          maxLength={1000}
          multiline
          textAlignVertical="top"
          editable={!submitting}
        />
        {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}

        <Text style={styles.label}>Category</Text>
        <CategoryChips
          selected={values.category}
          onSelect={(next: Category | 'All') => setField('category', next === 'All' ? 'General' : next)}
        />

        <Text style={styles.label}>Location (optional)</Text>
        <TextInput
          style={[styles.input, errors.location ? styles.inputError : null]}
          value={values.location}
          onChangeText={(text) => setField('location', text)}
          placeholder="e.g. Main Lecture Theatre"
          placeholderTextColor={colors.textMuted}
          maxLength={100}
          editable={!submitting}
        />
        {errors.location ? <Text style={styles.errorText}>{errors.location}</Text> : null}

        <Text style={styles.label}>Date and time (optional)</Text>
        <View style={styles.row}>
          <Pressable
            accessibilityRole="button"
            style={[styles.input, styles.flex, errors.eventDate ? styles.inputError : null]}
            onPress={pickEventDate}
            disabled={submitting}
          >
            <Text style={values.eventDate ? styles.valueText : styles.placeholderText}>
              {values.eventDate ? formatEventDate(values.eventDate) : 'Choose date and time'}
            </Text>
          </Pressable>
          {values.eventDate ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Clear date" onPress={clearEventDate}>
              <Text style={styles.link}>Clear</Text>
            </Pressable>
          ) : null}
        </View>
        {errors.eventDate ? <Text style={styles.errorText}>{errors.eventDate}</Text> : null}

        <View style={styles.switchRow}>
          <Text style={styles.valueText}>Remind me at this time</Text>
          <Switch
            value={values.remind}
            onValueChange={(next) => setField('remind', next)}
            disabled={submitting || !values.eventDate}
          />
        </View>

        <Text style={styles.label}>Image (optional)</Text>
        {values.imageUri ? (
          <View>
            <Image source={{ uri: values.imageUri }} style={styles.preview} />
            <Pressable accessibilityRole="button" onPress={() => setField('imageUri', null)} disabled={submitting}>
              <Text style={styles.link}>Remove image</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable accessibilityRole="button" style={styles.imageButton} onPress={pickImage} disabled={submitting}>
            <Text style={styles.link}>Choose from library</Text>
          </Pressable>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: submitting, busy: submitting }}
          style={[styles.submit, submitting && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.submitText}>{submitLabel}</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.lg * 2 },
  label: { color: colors.text, fontWeight: '600', marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm + 4,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  multiline: { minHeight: 120 },
  inputError: { borderColor: colors.danger },
  errorText: { color: colors.danger, fontSize: 13 },
  errorBanner: { backgroundColor: colors.surface, borderColor: colors.danger, borderWidth: 1, borderRadius: 8, padding: spacing.sm },
  errorBannerText: { color: colors.danger },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  valueText: { color: colors.text },
  placeholderText: { color: colors.textMuted },
  link: { color: colors.primary, fontWeight: '600' },
  imageButton: { borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, borderRadius: 8, padding: spacing.md, alignItems: 'center' },
  preview: { width: '100%', aspectRatio: 16 / 9, borderRadius: 8, marginBottom: spacing.sm },
  submit: { backgroundColor: colors.primary, borderRadius: 8, padding: spacing.md, alignItems: 'center', marginTop: spacing.md },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: colors.onPrimary, fontWeight: '700', fontSize: 16 },
});