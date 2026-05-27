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
 * Weekly digest — "here's what you did this week" recap. Designed to be
 * pull-not-push: it celebrates progress, doesn't demand action, no streak
 * shaming. Skipped entirely when the user has zero activity for the week
 * (caller checks before calling).
 *
 * Lang taken from the user's `uiLanguage` field — same source as the rest
 * of the app, no surprise.
 */
export function buildWeeklyDigestEmail(
  name: string,
  stats: {
    wordsLearned: number;
    wordsReviewed: number;
    grammarTopics: number;
    listeningExercises: number;
    readingTexts: number;
    streakDays: number;
    minutesActive: number;
  },
  unsubscribeUrl: string,
  lang: 'ru' | 'en',
): { subject: string; html: string; text: string } {
  // Pick the highlight line — biggest number wins. Keeps the subject fresh
  // week-to-week rather than always "your weekly recap".
  const highlightRu = stats.wordsLearned > 0
    ? `Выучил${stats.wordsLearned === 1 ? '' : 'а'} ${stats.wordsLearned} ${plural(stats.wordsLearned, ['слово', 'слова', 'слов'])} 🎉`
    : stats.streakDays > 0
      ? `Серия ${stats.streakDays} ${plural(stats.streakDays, ['день', 'дня', 'дней'])} 🔥`
      : 'Хорошо позанимался(лась) на неделе';
  const highlightEn = stats.wordsLearned > 0
    ? `Learned ${stats.wordsLearned} new ${stats.wordsLearned === 1 ? 'word' : 'words'} 🎉`
    : stats.streakDays > 0
      ? `${stats.streakDays}-day streak 🔥`
      : 'Solid week of practice';

  const rowsRu = [
    [`📚 Слов выучено`, String(stats.wordsLearned)],
    [`🔄 Повторений`, String(stats.wordsReviewed)],
    [`📖 Тем грамматики`, String(stats.grammarTopics)],
    [`🎧 Аудио упражнений`, String(stats.listeningExercises)],
    [`📝 Текстов прочитано`, String(stats.readingTexts)],
    [`🔥 Серия (дней)`, String(stats.streakDays)],
  ];
  const rowsEn = [
    [`📚 Words learned`, String(stats.wordsLearned)],
    [`🔄 Reviews`, String(stats.wordsReviewed)],
    [`📖 Grammar topics`, String(stats.grammarTopics)],
    [`🎧 Listening exercises`, String(stats.listeningExercises)],
    [`📝 Reading texts`, String(stats.readingTexts)],
    [`🔥 Streak (days)`, String(stats.streakDays)],
  ];

  if (lang === 'en') {
    return {
      subject: `${highlightEn} — your FrenchUp week`,
      text: [
        `Hi ${name},`,
        '',
        `${highlightEn}. Quick recap of your last 7 days on FrenchUp:`,
        '',
        ...rowsEn.map(([l, v]) => `  ${l}: ${v}`),
        '',
        'Open the dashboard to keep going:',
        unsubscribeUrl.replace('/profile?unsub=1', '/dashboard'),
        '',
        '— FrenchUp',
        '',
        `Don't want these? Turn off weekly recaps in profile settings:`,
        unsubscribeUrl,
      ].join('\n'),
      html: renderDigestHtml({
        greeting: `Hi ${name},`,
        highlight: highlightEn,
        rows: rowsEn,
        ctaLabel: 'Open dashboard',
        ctaHref: unsubscribeUrl.replace('/profile?unsub=1', '/dashboard'),
        unsubscribeLabel: 'Turn off weekly recaps',
        unsubscribeHref: unsubscribeUrl,
        signature: '— FrenchUp',
      }),
    };
  }
  return {
    subject: `${highlightRu} — твоя неделя на FrenchUp`,
    text: [
      `Привет, ${name}!`,
      '',
      `${highlightRu}. Краткая сводка за последние 7 дней:`,
      '',
      ...rowsRu.map(([l, v]) => `  ${l}: ${v}`),
      '',
      'Продолжай в том же духе:',
      unsubscribeUrl.replace('/profile?unsub=1', '/dashboard'),
      '',
      '— FrenchUp',
      '',
      'Не хочешь получать эти письма? Отключи в настройках профиля:',
      unsubscribeUrl,
    ].join('\n'),
    html: renderDigestHtml({
      greeting: `Привет, ${name}!`,
      highlight: highlightRu,
      rows: rowsRu,
      ctaLabel: 'Открыть приложение',
      ctaHref: unsubscribeUrl.replace('/profile?unsub=1', '/dashboard'),
      unsubscribeLabel: 'Отключить еженедельные письма',
      unsubscribeHref: unsubscribeUrl,
      signature: '— FrenchUp',
    }),
  };
}

// Simple ru plural: rules vary, this covers most learning-stats cases.
function plural(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return forms[2];
  if (mod10 === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4) return forms[1];
  return forms[2];
}

interface DigestHtmlInput {
  greeting: string;
  highlight: string;
  rows: string[][];
  ctaLabel: string;
  ctaHref: string;
  unsubscribeLabel: string;
  unsubscribeHref: string;
  signature: string;
}

function renderDigestHtml(input: DigestHtmlInput): string {
  const rowsHtml = input.rows.map(([label, value]) => `
    <tr>
      <td style="padding:8px 0;font-size:14px;color:#334155;">${label}</td>
      <td style="padding:8px 0;font-size:14px;font-weight:600;color:#0f172a;text-align:right;">${value}</td>
    </tr>
  `).join('');
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>FrenchUp weekly</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:14px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <tr><td>
          <p style="margin:0 0 8px 0;font-size:15px;color:#334155;">${input.greeting}</p>
          <h1 style="margin:0 0 20px 0;font-size:24px;line-height:1.3;font-weight:700;color:#0f172a;">${input.highlight}</h1>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;border-top:1px solid #e2e8f0;">
            ${rowsHtml}
          </table>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px auto;">
            <tr><td style="background:#f97316;border-radius:10px;">
              <a href="${input.ctaHref}" style="display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">${input.ctaLabel}</a>
            </td></tr>
          </table>
          <p style="margin:24px 0 0 0;font-size:12px;color:#94a3b8;text-align:center;">
            <a href="${input.unsubscribeHref}" style="color:#94a3b8;">${input.unsubscribeLabel}</a>
          </p>
          <p style="margin:8px 0 0 0;font-size:13px;color:#94a3b8;text-align:center;">${input.signature}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Confirm-your-email template. Same visual shell as password-reset so
 * domain reputation builds on a single look. Sent on registration and
 * resend-from-banner.
 */
export function buildEmailVerificationEmail(
  verifyUrl: string,
  lang: 'ru' | 'en',
): { subject: string; html: string; text: string } {
  if (lang === 'en') {
    return {
      subject: 'Confirm your FrenchUp email',
      text: [
        'Welcome to FrenchUp! Please confirm your email so we can keep your',
        'account secure and send you password-reset links if you ever need one.',
        '',
        'Open this link to confirm (valid for 7 days):',
        verifyUrl,
        '',
        'If you did not create a FrenchUp account, ignore this email — the',
        'address won\'t be activated without the click.',
        '',
        '— FrenchUp',
      ].join('\n'),
      html: renderHtml({
        title: 'Confirm your email',
        intro: 'Welcome to FrenchUp! Click the button below to confirm your email — this lets us keep your account secure and recover it if you forget the password.',
        button: 'Confirm email',
        href: verifyUrl,
        footer: 'Link valid for 7 days. If you did not sign up for FrenchUp, just ignore this email.',
        signature: '— FrenchUp',
      }),
    };
  }
  return {
    subject: 'Подтверди email FrenchUp',
    text: [
      'Добро пожаловать в FrenchUp! Подтверди email, чтобы мы могли защитить',
      'твой аккаунт и присылать ссылки сброса пароля, если понадобится.',
      '',
      'Открой ссылку (действительна 7 дней):',
      verifyUrl,
      '',
      'Если ты не регистрировал аккаунт — просто проигнорируй письмо.',
      '',
      '— FrenchUp',
    ].join('\n'),
    html: renderHtml({
      title: 'Подтверди email',
      intro: 'Добро пожаловать в FrenchUp! Нажми кнопку ниже, чтобы подтвердить email — это нужно для безопасности аккаунта и восстановления пароля.',
      button: 'Подтвердить email',
      href: verifyUrl,
      footer: 'Ссылка действительна 7 дней. Если ты не регистрировался — просто проигнорируй письмо.',
      signature: '— FrenchUp',
    }),
  };
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
