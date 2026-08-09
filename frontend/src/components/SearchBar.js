import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';

export const SearchBar = ({ value, onChangeText, placeholder = 'Buscar...' }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.container}>
      <Ionicons name="search" size={18} color={colors.muted} style={{ marginRight: 6 }} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.input}
        autoCapitalize="none"
      />
    </View>
  );
};

const makeStyles = (colors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBackground,
      borderRadius: 10,
      paddingHorizontal: 12,
      marginBottom: 15
    },
    input: {
      flex: 1,
      height: 44,
      fontSize: 15,
      color: colors.text
    }
  });

export default SearchBar;
