export const AUTH_ERRORS = {
  invalid_credentials: 'Correo o contraseña incorrectos.',
  username_exists: 'Ese usuario ya existe.',
  email_exists: 'Ese correo ya está registrado.',
  missing_fields: 'Completa todos los campos.',
  invalid_email: 'Por favor, introduce un correo electrónico válido.',
  invalid_username: 'El nombre de usuario debe tener entre 3 y 20 caracteres.',
  invalid_password: 'La contraseña debe tener entre 8 y 20 caracteres, incluir una mayúscula, un número y un símbolo.',
  invalid_or_expired_token: 'El código ingresado no es válido o ha expirado.',
  unauthorized: 'Tu sesión ha expirado. Inicia sesión de nuevo.',
  email_not_found: 'No encontramos un correo registrado con ese valor.',
  invalid_code: 'El código ingresado no es válido.',
  network_error: 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.',
  upload_error: 'No se pudo subir la imagen. Intenta de nuevo.',
  image_only: 'Solo se permiten imágenes.',
  image_required: 'Selecciona una imagen primero.',
  invalid_request: 'La solicitud no es válida.',
  not_found: 'Recurso no encontrado.',
  upload_failed: 'No se pudo subir la imagen. Intenta de nuevo.'
};

export function getAuthErrorMessage(input) {
  if (input && typeof input === 'object') {
    if (input.message) {
      return input.message;
    }
    if (input.error && AUTH_ERRORS[input.error]) {
      return AUTH_ERRORS[input.error];
    }
    return 'No se pudo completar la operación.';
  }
  return AUTH_ERRORS[input] || 'No se pudo completar la operación.';
}
