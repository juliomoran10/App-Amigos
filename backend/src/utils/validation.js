const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 20
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidPassword(password = '') {
  const value = String(password).trim();

  if (value.length < PASSWORD_RULES.minLength || value.length > PASSWORD_RULES.maxLength) {
    return false;
  }

  const hasUppercase = /[A-Z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);

  return hasUppercase && hasNumber && hasSymbol;
}

function isValidEmail(email = '') {
  return EMAIL_REGEX.test(String(email).trim());
}

function requireNonEmpty(value, fieldName) {
  if (!String(value || '').trim()) {
    return { ok: false, error: 'missing_fields', field: fieldName };
  }
  return { ok: true };
}

function validateRegister({ username, email, password, name }) {
  const nameCheck = requireNonEmpty(name, 'name');
  if (!nameCheck.ok) return nameCheck;

  const emailCheck = requireNonEmpty(email, 'email');
  if (!emailCheck.ok) return emailCheck;

  const passwordCheck = requireNonEmpty(password, 'password');
  if (!passwordCheck.ok) return passwordCheck;

  if (username !== undefined && username !== null && String(username).trim()) {
    const normalized = String(username).trim();
    if (normalized.length < 3 || normalized.length > 20) {
      return { ok: false, error: 'invalid_username' };
    }
  }

  if (!isValidEmail(email)) {
    return { ok: false, error: 'invalid_email' };
  }

  if (!isValidPassword(password)) {
    return { ok: false, error: 'invalid_password' };
  }

  return { ok: true };
}

function validateLogin({ username, password }) {
  const usernameCheck = requireNonEmpty(username, 'username');
  if (!usernameCheck.ok) return usernameCheck;

  const passwordCheck = requireNonEmpty(password, 'password');
  if (!passwordCheck.ok) return passwordCheck;

  return { ok: true };
}

function validateForgotPassword({ email }) {
  const emailCheck = requireNonEmpty(email, 'email');
  if (!emailCheck.ok) return emailCheck;

  if (!isValidEmail(email)) {
    return { ok: false, error: 'invalid_email' };
  }

  return { ok: true };
}

function validateResetPassword({ token, newPassword, confirmPassword }) {
  const tokenCheck = requireNonEmpty(token, 'token');
  if (!tokenCheck.ok) return tokenCheck;

  const passwordCheck = requireNonEmpty(newPassword, 'newPassword');
  if (!passwordCheck.ok) return passwordCheck;

  if (!isValidPassword(newPassword)) {
    return { ok: false, error: 'invalid_password' };
  }

  if (confirmPassword !== undefined && newPassword !== confirmPassword) {
    return { ok: false, error: 'passwords_do_not_match' };
  }

  return { ok: true };
}

function validateProfileUpdate({ name }) {
  const nameCheck = requireNonEmpty(name, 'name');
  if (!nameCheck.ok) return nameCheck;

  return { ok: true };
}

module.exports = {
  PASSWORD_RULES,
  isValidPassword,
  isValidEmail,
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateProfileUpdate
};
