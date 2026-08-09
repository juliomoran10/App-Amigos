import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

const CustomButton = ({ onPress, text, type = 'PRIMARY', bgColor, fgColor, disabled }) => {
  const { colors } = useTheme();
  const isPrimary = type === 'PRIMARY';
  const isTertiary = type === 'TERTIARY';

  let backgroundColor = colors.primary;
  if (isTertiary) {
    backgroundColor = 'transparent';
  }
  if (bgColor) {
    backgroundColor = bgColor;
  }

  let textColor = '#fff';
  if (isTertiary) {
    textColor = colors.muted;
  }
  if (fgColor) {
    textColor = fgColor;
  }

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={[
        styles.container,
        { backgroundColor },
        isPrimary ? styles.container_PRIMARY_Shadow : {},
        disabled ? styles.disabled : {}
      ]}
    >
      <Text style={[styles.text, { color: textColor }]}>
        {text}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 15,
    marginVertical: 5,
    alignItems: 'center',
    borderRadius: 5,
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  container_PRIMARY_Shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  text: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CustomButton;
