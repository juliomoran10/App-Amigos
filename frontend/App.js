import React from 'react';
import { StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Navigation from './src/navigation';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';

function AppContent() {
  const { colors } = useTheme();
  const barStyle = colors.mode === 'dark' ? 'light-content' : 'dark-content';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={barStyle} backgroundColor={colors.background} />
      <Navigation />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
