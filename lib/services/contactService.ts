import { Resend } from 'resend'

import { getContactEmailConfig } from '../config/env.js'
import { HttpError } from '../http/apiUtils.js'
import { renderContactEmailTemplate } from '../templates/contactEmailTemplate.js'
import type { SupportedLocale } from '../../src/types/app.js'

export interface ContactMessageInput {
  name: string
  email: string
  message: string
  locale: SupportedLocale
}

const CONTACT_SEND_TIMEOUT_MS = 12000

let resendClient: Resend | null = null

const getResendClient = () => {
  if (!resendClient) {
    const { resendApiKey } = getContactEmailConfig()
    resendClient = new Resend(resendApiKey)
  }

  return resendClient
}

const buildSubject = (locale: SupportedLocale, name: string) =>
  locale === 'it'
    ? `Nuovo contatto dal portfolio: ${name}`
    : `New portfolio contact: ${name}`

const buildTextBody = ({ name, email, message, locale }: ContactMessageInput) => {
  const intro =
    locale === 'it'
      ? 'Hai ricevuto un nuovo messaggio dal form contatti del portfolio.'
      : 'You received a new message from the portfolio contact form.'

  return [
    intro,
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    '',
    'Message:',
    message,
  ].join('\n')
}

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number) => {
  let timeoutHandle: NodeJS.Timeout | undefined

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(
            new HttpError(504, 'Contact delivery timed out', {
              code: 'contact_timeout',
            })
          )
        }, timeoutMs)
      }),
    ])
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle)
  }
}

export const sendContactMessage = async (payload: ContactMessageInput) => {
  let contactFromEmail: string
  let contactToEmail: string

  try {
    const config = getContactEmailConfig()
    contactFromEmail = config.contactFromEmail
    contactToEmail = config.contactToEmail
  } catch {
    throw new HttpError(503, 'Contact service is not configured right now', {
      code: 'contact_unavailable',
    })
  }

  const { data, error } = await withTimeout(
    getResendClient().emails.send({
      from: contactFromEmail,
      to: [contactToEmail],
      replyTo: payload.email,
      subject: buildSubject(payload.locale, payload.name),
      text: buildTextBody(payload),
      html: renderContactEmailTemplate(payload),
    }),
    CONTACT_SEND_TIMEOUT_MS
  )

  if (error) {
    throw new HttpError(502, 'Unable to deliver message right now', {
      code: 'contact_delivery_failed',
    })
  }

  return {
    id: data?.id ?? null,
  }
}
