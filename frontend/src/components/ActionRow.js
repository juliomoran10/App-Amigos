import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../theme/ThemeProvider';

const ActionRow = ({ icon, text, onPress, tint: tintProp, rightIcon = 'chevron-forward' }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const tint = tintProp || colors.text;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.left}>
        {icon && <Ionicons name={icon} size={20} color={tint} style={{ marginRight: 12 }} />}
        <Text style={[styles.text, { color: tint }]}>{text}</Text>
      </View>
      <Ionicons name={rightIcon} size={18} color={colors.muted} />
    </TouchableOpacity>
  );
};

const makeStyles = () =>
  StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
    left: { flexDirection: 'row', alignItems: 'center' },
    text: { fontSize: 15, fontWeight: '500' }
  });

export default ActionRow;
