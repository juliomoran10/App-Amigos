import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';

const Avatar = ({ uri, size = 60 }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const avatarStyle = [
    styles.avatar,
    { width: size, height: size, borderRadius: size / 2 }
  ];

  if (uri) {
    return <Image source={{ uri }} style={avatarStyle} contentFit="cover" transition={150} />;
  }

  return (
    <View style={[avatarStyle, styles.placeholder]}>
      <Ionicons name="person" size={size * 0.5} color={colors.text} />
    </View>
  );
};

const makeStyles = (colors) =>
  StyleSheet.create({
    avatar: { backgroundColor: colors.border },
    placeholder: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.avatarPlaceholder
    }
  });

export default Avatar;
