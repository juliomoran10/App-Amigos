import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';

const CustomInput = ({ value, setValue, placeholder, secureTextEntry, maxLength, multiline, keyboardType, containerStyle }) => {
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={[styles.input, multiline && styles.inputMultiline]}
        secureTextEntry={isSecure}
        maxLength={maxLength}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        keyboardType={keyboardType}
      />

      {secureTextEntry && (
        <Pressable
          onPress={() => setIsSecure(!isSecure)}
          style={styles.eyeButton}
        >
          <Ionicons
            name={isSecure ? "eye-off-outline" : "eye-outline"}
            size={22}
            color={colors.text}
          />
        </Pressable>
      )}
    </View>
  );
};

const makeStyles = (colors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.inputBackground,
      width: '100%',
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 5,
      paddingHorizontal: 15,
      marginVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    input: {
      flex: 1,
      height: 50,
      color: colors.text,
    },
    inputMultiline: {
      height: 90,
      paddingTop: 12,
    },
    eyeButton: {
      padding: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

export default CustomInput;
