import { Ionicons } from '@expo/vector-icons';
import { Linking, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { EmptyView, ErrorView, LoadingView } from '../../src/components/StateViews';
import { useWeather } from '../../src/hooks/useWeather';
import { describeCondition } from '../../src/services/weatherService';
import { colors, radius, spacing, typography } from '../../src/theme';
import { formatWeekday } from '../../src/utils/formatter';

export default function WeatherScreen() {
  const { state, reload } = useWeather();

  switch (state.phase) {
    case 'locating':
      return <LoadingView message="Getting your location..." />;
    case 'loading':
      return <LoadingView message={state.placeName ? `Loading weather for ${state.placeName}...` : 'Loading weather...'} />;
    case 'denied':
      return (
        <EmptyView
          icon="location-outline"
          title="Location permission needed"
          message="Location permission is required to provide local weather."
          actionLabel="Try again"
          onAction={reload}
          secondaryLabel="Open settings"
          onSecondary={() => Linking.openSettings()}
        />
      );
    case 'location-error':
      return <ErrorView title="Location unavailable" message="Unable to determine your location. Try again." onRetry={reload} />;
    case 'error':
      return <ErrorView title="Weather unavailable" message={state.message} onRetry={reload} />;
    case 'empty':
      return <EmptyView icon="cloud-offline-outline" title="No forecast data" message="The weather service had no data for your area right now." actionLabel="Try again" onAction={reload} />;
    case 'success': {
      const { weather, placeName } = state;
      const current = describeCondition(weather.conditionCode);
      return (
        <Screen edges={['left', 'right']}>
          <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={false} onRefresh={reload} />}>
            <View style={styles.current}>
              <View style={styles.placeRow}>
                <Ionicons name="location" size={18} color={colors.onPrimary} />
                <Text style={styles.place}>{placeName ?? 'Your location'}</Text>
              </View>
              <Ionicons name={current.icon} size={72} color={colors.onPrimary} />
              <Text style={styles.temperature}>{weather.temperature}°C</Text>
              <Text style={styles.condition}>{current.label}</Text>
              <Text style={styles.wind}>Wind {weather.windSpeed} km/h</Text>
            </View>

            <Text style={typography.heading}>Forecast</Text>
            {weather.daily.map((day, index) => {
              const info = describeCondition(day.conditionCode);
              return (
                <View key={day.date} style={styles.dayRow}>
                  <Text style={styles.dayName}>{formatWeekday(day.date, index)}</Text>
                  <Ionicons name={info.icon} size={24} color={colors.primary} />
                  <Text style={styles.dayCondition}>{info.label}</Text>
                  <Text style={styles.dayTemps}>
                    {day.maxTemp}° / {day.minTemp}°
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </Screen>
      );
    }
  }
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.lg },
  current: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', gap: spacing.xs },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  place: { color: colors.onPrimary, fontSize: 16, fontWeight: '600' },
  temperature: { color: colors.onPrimary, fontSize: 56, fontWeight: '700' },
  condition: { color: colors.onPrimary, fontSize: 18 },
  wind: { color: colors.primaryLight, fontSize: 13 },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayName: { width: 64, fontWeight: '600', color: colors.text },
  dayCondition: { flex: 1, color: colors.textMuted },
  dayTemps: { fontWeight: '600', color: colors.text },
});