import { Resend } from 'resend'
import { getNotificationEmails, getSettings } from './data'

const FROM = process.env.RESEND_FROM_EMAIL ?? 'szodarab@example.com'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!)
}

export async function sendCsereNotification(kekUres: number, rozsaszinUres: number, osszesen: number) {
  if (!process.env.RESEND_API_KEY) return

  const [emails, settings] = await Promise.all([getNotificationEmails(), getSettings()])
  if (emails.length === 0) return
  if (osszesen < settings.csereMinimum) return

  const text = `Szia!

Van összesen ${osszesen} db üres szódapatron a közös készletben:
- Kék: ${kekUres} db
- Rózsaszín: ${rozsaszinUres} db

Minimum ${settings.csereMinimum} db patron cserélhető egyszerre.

Ideje cserélni!

Üdv,
Szódarab`

  await getResend().emails.send({
    from: FROM,
    to: emails,
    subject: 'Szódapatron csere lehetséges!',
    text,
  })
}
