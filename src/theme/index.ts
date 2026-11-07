import { TextStyle } from 'react-native';

export const colors = {
  primary: '#3B82F6',
  primaryLight: '#BFDBFE',
  accent: '#F2A33A',
  background: '#0B1220',
  surface: '#141E2E',
  text: '#F3F6FB',
  textMuted: '#A2AEC0',
  border: '#2A374A',
  danger: '#F87171',
  success: '#4ADE80',
  warning: '#FBBF24',
  warningBackground: '#332712',
  onPrimary: '#FFFFFF',
  category: {
    Academic: '#3D78DD',
    Events: '#A855C7',
    General: '#2D9B64',
    Emergency: '#D94841',
  },
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const radius = { sm: 6, md: 12, lg: 20 } as const;

export const typography: Record<'title' | 'heading' | 'body' | 'label' | 'caption', TextStyle> = {
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  heading: { fontSize: 18, fontWeight: '600', color: colors.text },
  body: { fontSize: 15, lineHeight: 22, color: colors.text },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  caption: { fontSize: 12, color: colors.textMuted },
};