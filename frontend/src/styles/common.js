import { lightTheme } from '../theme/themes';

export const COLORS = lightTheme;

export const SPACING = {
  page: 20,
  small: 8,
  medium: 15,
  large: 24,
};

export const commonStyles = {
  pageContainer: { flex: 1 },
  centerContent: { alignItems: 'center', padding: SPACING.page }
};

export const TYPOGRAPHY = {
  h1: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  h2: { fontSize: 20, fontWeight: '600', color: COLORS.text },
  body: { fontSize: 15, color: COLORS.textSecondary },
  small: { fontSize: 12, color: COLORS.muted }
};

export default { COLORS, SPACING, commonStyles };
