export const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 20,
};

export const isValidPassword = (password = '') => {
  const value = password.trim();
  if (value.length < PASSWORD_RULES.minLength || value.length > PASSWORD_RULES.maxLength) {
    return false;
  }

  const hasUppercase = /[A-Z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);

  return hasUppercase && hasNumber && hasSymbol;
};

export const passwordValidationMessage = 'La contraseña debe tener entre 8 y 20 caracteres, incluir una mayúscula, un número y un símbolo.';
