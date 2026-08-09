import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CustomInput from './CustomInput';
import CustomButton from './CustomButton';
import { useTheme } from '../theme/ThemeProvider';

const AuthForm = ({
  fields = [],
  initialValues = {},
  onSubmit,
  submitText = 'Submit',
  secondaryAction,
  submitting = false
}) => {
  const [values, setValues] = useState(() => {
    const init = {};
    fields.forEach(f => { init[f.name] = initialValues[f.name] ?? ''; });
    return init;
  });
  const { colors } = useTheme();

  const setField = (name, val) => setValues(v => ({ ...v, [name]: val }));

  return (
    <View style={styles.container}>
      {fields.map(field => (
        field.render ? (
          field.render({
            value: values[field.name],
            setValue: (val) => setField(field.name, val)
          })
        ) : (
          <CustomInput
            key={field.name}
            placeholder={field.placeholder}
            value={values[field.name]}
            setValue={(val) => setField(field.name, val)}
            secureTextEntry={field.secure}
            keyboardType={field.keyboardType}
            multiline={field.multiline}
          />
        )
      ))}

      <CustomButton text={submitText} onPress={() => onSubmit(values)} disabled={submitting} />

      {secondaryAction?.text && (
        <CustomButton
          text={secondaryAction.text}
          onPress={secondaryAction.onPress}
          type={secondaryAction.type || 'TERTIARY'}
          fgColor={secondaryAction.fgColor || colors.primary}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%' }
});

export default AuthForm;
