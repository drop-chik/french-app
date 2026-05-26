/**
 * Email delivery via Resend. Gated on RESEND_API_KEY env — when unset we
 * log the email body to stdout instead of sending. That keeps local dev
 * working without a Resend account and lets you see the reset-link
 * straight from `pnpm dev` output.
 *
 * Sender: `noreply@frenchup.app` once the domain is verified in Resend.
 * Until verification, Resend ships with `onboarding@resend.dev` which works
 * out of the box (Resend lets unverified accounts send only to the account
 * owner's email — fine for testing).
 */
import { Resend } from 'resend';

const API_KEY = process.env['RESEND_API_KEY'];
const FROM = process.env['RESEND_FROM'] ?? 'FrenchUp <onboarding@resend.dev>';

const client = API_KEY ? new Resend(API_KEY) : null;

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  if (!client) {
    // Dev mode: log to stdout. This is the easiest way to grab the reset
    // link locally without configuring Resend at all.
    console.log('\n[email] (no RESEND_API_KEY — logging instead of sending)');
    console.log(`  to: ${input.to}`);
    console.log(`  subject: ${input.subject}`);
    console.log('  text:');
    console.log(input.text.split('\n').map((l) => `    ${l}`).join('\n'));
    console.log('');
    return;
  }
  const res = await client.emails.send({
    from: FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
  if (res.error) {
    // Throw — caller decides whether to surface to the user or swallow
    // (we swallow on forgot-password to avoid email enumeration).
    throw new Error(`Resend failed: ${res.error.message}`);
  }
}

/**
 * Branded password-reset email. Same template, RU and EN versions selected
 * by the caller's language preference; we don't try to detect from the user
 * row because it's their UI preference at request time, not a stored field.
 */
export function buildPasswordResetEmail(
  resetUrl: string,
  lang: 'ru' | 'en',
): { subject: string; html: string; text: string } {
  if (lang === 'en') {
    return {
      subject: 'Reset your FrenchUp password',
      text: [
        'You asked to reset your FrenchUp password.',
        '',
        'Open this link to set a new password (valid for 1 hour):',
        resetUrl,
        '',
        'If you did not request this, you can safely ignore this email — your',
        'password will not change.',
        '',
        '— FrenchUp',
      ].join('\n'),
      html: renderHtml({
        title: 'Reset your password',
        intro: 'You asked to reset your FrenchUp password. Click the button below to set a new one. The link is valid for 1 hour.',
        button: 'Reset password',
        href: resetUrl,
        footer: 'If you did not request this, you can safely ignore this email — your password will not change.',
        signature: '— FrenchUp',
      }),
    };
  }
  return {
    subject: 'Сброс пароля FrenchUp',
    text: [
      'Вы запросили сброс пароля для аккаунта FrenchUp.',
      '',
      'Откройте ссылку, чтобы задать новый пароль (действительна 1 час):',
      resetUrl,
      '',
      'Если вы этого не делали — просто проигнорируйте письмо.',
      'Пароль останется прежним.',
      '',
      '— FrenchUp',
    ].join('\n'),
    html: renderHtml({
      title: 'Сброс пароля',
      intro: 'Вы запросили сброс пароля для аккаунта FrenchUp. Нажмите кнопку ниже, чтобы задать новый. Ссылка действительна 1 час.',
      button: 'Сбросить пароль',
      href: resetUrl,
      footer: 'Если вы этого не делали — просто проигнорируйте письмо. Пароль останется прежним.',
      signature: '— FrenchUp',
    }),
  };
}

interface HtmlInput {
  title: string;
  intro: string;
  button: string;
  href: string;
  footer: string;
  signature: string;
}

function renderHtml({ title, intro, button, href, footer, signature }: HtmlInput): string {
  // Plain inline-styled HTML — every popular email client supports it. No
  // external CSS, no images, no fonts (Resend serves <2KB → spam score low).
  // Escape `href` to avoid breaking the markup if URL ever has odd chars.
  const safeHref = href
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:14px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <tr><td>
          <h1 style="margin:0 0 16px 0;font-size:22px;line-height:1.3;font-weight:700;color:#0f172a;">${title}</h1>
          <p style="margin:0 0 24px 0;font-size:15px;line-height:1.55;color:#334155;">${intro}</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px auto;">
            <tr><td style="background:#f97316;border-radius:10px;">
              <a href="${safeHref}" style="display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">${button}</a>
            </td></tr>
          </table>
          <p style="margin:0 0 8px 0;font-size:13px;line-height:1.5;color:#64748b;">${footer}</p>
          <p style="margin:24px 0 0 0;font-size:13px;color:#94a3b8;">${signature}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
