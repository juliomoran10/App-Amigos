const { Resend } = require('resend');

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

function buildResetUrl(resetBaseUrl, token) {
  const base = (resetBaseUrl || 'friendmatch://').replace(/\/+$/, '');
  const path = base.includes('://') ? `${base}reset-password` : `${base}/reset-password`;
  return `${path}?token=${encodeURIComponent(token)}`;
}

class Mailer {
  constructor() {
    this.resend = resend;
    this.defaultFrom = process.env.EMAIL || 'onboarding@resend.dev';
  }

  async sendEmail(to, subject, html) {
    if (!this.resend) {
      console.warn('[mailer] RESEND_API_KEY is not set. Email not sent.');
      return { skipped: true, reason: 'missing_api_key' };
    }

    try {
      const result = await this.resend.emails.send({
        from: this.defaultFrom,
        to,
        subject,
        html
      });

      if (result?.error) {
        console.error('[mailer] resend error:', result.error);
      }

      return result;
    } catch (error) {
      console.error('[mailer] sendEmail failed:', {
        to,
        subject,
        error: error?.message || error
      });
      throw error;
    }
  }

  async sendRecoveryEmail({ email, token, resetBaseUrl, username }) {
    const resetUrl = buildResetUrl(resetBaseUrl, token);
    const shouldLogDevLink =
      process.env.MAIL_DEV_LOG === 'true' || process.env.NODE_ENV !== 'production';

    const result = await this.sendEmail(
      email,
      'FriendMatch - Recuperación de contraseña',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Recuperación de contraseña</h2>
          <p>Hola${username ? ` ${username}` : ''},</p>
          <p>Recibimos una solicitud para restablecer tu contraseña en FriendMatch.</p>
          <p>
            <a href="${resetUrl}" style="background:#FF4D6D;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;display:inline-block;">
              Abrir en la app
            </a>
          </p>
          <p>Si el botón no funciona en el móvil, abre este enlace:</p>
          <p style="word-break:break-all;">${resetUrl}</p>
          <p style="color:#666;font-size:13px;">El enlace expira en pocos minutos. Si no fuiste tú, ignora este correo.</p>
        </div>
      `
    );

    if (result?.skipped && shouldLogDevLink) {
      console.info('[mailer] DEV recovery link (copia y ábrelo en el dispositivo/emulador):');
      console.info(resetUrl);
    }

    return { ...result, resetUrl };
  }
}

module.exports = { Mailer, buildResetUrl };
