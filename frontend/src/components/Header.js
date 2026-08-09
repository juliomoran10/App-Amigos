import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';

const Header = ({ title, showBack = false, onBack }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : <View style={styles.backPlaceholder} />}

        <Text style={styles.title}>{title}</Text>

        <View style={styles.rightPlaceholder} />
      </View>
    </View>
  );
};

const makeStyles = (colors) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 20,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 12,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    backButton: { padding: 5, marginRight: 10 },
    backPlaceholder: { width: 34 },
    rightPlaceholder: { width: 34 },
    title: { fontSize: 18, fontWeight: 'bold', color: colors.text }
  });

export default Header;
