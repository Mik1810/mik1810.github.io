import type { SupportedLocale } from '../../src/types/app.js'

export interface ContactEmailTemplateInput {
  name: string
  email: string
  message: string
  locale: SupportedLocale
}

const CONTACT_EMAIL_TEMPLATE = String.raw`
<div style="background:#06111f;padding:32px 18px;font-family:'Segoe UI',Arial,sans-serif;color:#dbe7f3;">
  <div style="max-width:720px;margin:0 auto;background:#0d1b2d;border:1px solid #1f3550;border-radius:24px;overflow:hidden;box-shadow:0 18px 50px rgba(2,6,23,.35);">
    <div style="padding:28px 32px;border-bottom:1px solid #1f3550;background:radial-gradient(circle at top left,#15365a 0%,#0d1b2d 62%,#091322 100%);">
      <div style="display:inline-block;padding:7px 12px;border-radius:999px;background:#0b2540;border:1px solid #234b74;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#7dd3fc;">
        Portfolio Contact
      </div>
      <h1 style="margin:18px 0 10px;font-size:28px;line-height:1.2;color:#f8fbff;">{{intro}}</h1>
      <p style="margin:0;color:#b7c8da;font-size:15px;line-height:1.6;">{{summary}}</p>
    </div>
    <div style="padding:28px 32px;">
      <table role="presentation" style="width:100%;border-collapse:separate;border-spacing:0 12px;margin-bottom:26px;">
        <tr>
          <td style="width:132px;padding:0;vertical-align:top;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#7f97b2;">{{labelName}}</td>
          <td style="padding:0;color:#f8fbff;font-size:16px;font-weight:600;">{{name}}</td>
        </tr>
        <tr>
          <td style="width:132px;padding:0;vertical-align:top;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#7f97b2;">{{labelEmail}}</td>
          <td style="padding:0;font-size:16px;">
            <a href="mailto:{{emailHref}}" style="color:#7dd3fc;text-decoration:none;">{{email}}</a>
          </td>
        </tr>
      </table>
      <div style="border:1px solid #1f3550;border-radius:18px;background:linear-gradient(180deg,#08111e 0%,#0a1626 100%);overflow:hidden;">
        <div style="padding:14px 18px;border-bottom:1px solid #1f3550;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#8ca4bf;">
          {{labelMessage}}
        </div>
        <div style="padding:20px 18px;white-space:pre-wrap;color:#f8fbff;font-size:15px;line-height:1.8;">{{message}}</div>
      </div>
    </div>
    <div style="padding:18px 32px 24px;border-top:1px solid #1f3550;background:#0a1524;">
      <p style="margin:0 0 12px;color:#b7c8da;font-size:14px;line-height:1.7;">{{replyHint}}</p>
      <p style="margin:0;color:#7f97b2;font-size:12px;line-height:1.6;">{{footerNote}}</p>
    </div>
  </div>
</div>
`.trim()

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const replaceTemplateTokens = (template: string, values: Record<string, string>) => {
  let output = template

  for (const [key, value] of Object.entries(values)) {
    output = output.replaceAll(`{{${key}}}`, value)
  }

  return output
}

const getCopy = (locale: SupportedLocale) =>
  locale === 'it'
    ? {
        intro: 'Hai ricevuto un nuovo messaggio dal form contatti del portfolio.',
        summary: 'Il riepilogo qui sotto contiene i dati del mittente e il testo completo del messaggio.',
        labelName: 'Nome',
        labelEmail: 'Email',
        labelMessage: 'Messaggio',
        replyHint: 'Puoi rispondere direttamente a questa email per contattare il mittente.',
        footerNote:
          'Messaggio generato automaticamente dal contact form del portfolio.',
      }
    : {
        intro: 'You received a new message from the portfolio contact form.',
        summary: 'The summary below contains the sender details and the full message body.',
        labelName: 'Name',
        labelEmail: 'Email',
        labelMessage: 'Message',
        replyHint: 'You can reply directly to this email to contact the sender.',
        footerNote:
          'This message was generated automatically by the portfolio contact form.',
      }

export const renderContactEmailTemplate = ({
  name,
  email,
  message,
  locale,
}: ContactEmailTemplateInput) => {
  const copy = getCopy(locale)

  return replaceTemplateTokens(CONTACT_EMAIL_TEMPLATE, {
    intro: escapeHtml(copy.intro),
    summary: escapeHtml(copy.summary),
    labelName: escapeHtml(copy.labelName),
    labelEmail: escapeHtml(copy.labelEmail),
    labelMessage: escapeHtml(copy.labelMessage),
    replyHint: escapeHtml(copy.replyHint),
    footerNote: escapeHtml(copy.footerNote),
    name: escapeHtml(name),
    email: escapeHtml(email),
    emailHref: escapeHtml(email),
    message: escapeHtml(message),
  })
}
