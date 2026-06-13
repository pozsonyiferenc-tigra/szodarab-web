import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { addTransaction, isAuthorizedUser, isAdmin, getStock } from '@/lib/data'
import { sendCsereNotification } from '@/lib/email'
import { writeLogAsync } from '@/lib/log'

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress
  if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 })

  const authorized = await isAuthorizedUser(email)
  if (!authorized) return NextResponse.json({ error: 'Hozzáférés megtagadva' }, { status: 403 })

  const { targetEmail, ...data } = await request.json()

  // Proxy: admin más nevében rögzítheti a tranzakciót (töltetés is engedélyezett proxy módban)
  const adminCheck = await isAdmin(email)
  const isProxy = !!(targetEmail && adminCheck)
  const effectiveEmail = isProxy ? targetEmail : email

  const result = await addTransaction(data, effectiveEmail, isProxy ? email : undefined)

  if (result.success) {
    const esemenyNev: Record<string, string> = {
      behozas: 'Üres behozás',
      elvitel: 'Teli elvitel',
      csere:   'Csere',
      toltes:  'Töltetés',
    }
    const esemeny = esemenyNev[data.muvelet] ?? data.muvelet

    const reszek: string[] = []
    if ((data.kekUres ?? 0)       !== 0) reszek.push(`${Math.abs(data.kekUres)} db kék üres`)
    if ((data.kekTele ?? 0)       !== 0) reszek.push(`${Math.abs(data.kekTele)} db kék teli`)
    if ((data.rozsaszinUres ?? 0) !== 0) reszek.push(`${Math.abs(data.rozsaszinUres)} db rózsaszín üres`)
    if ((data.rozsaszinTele ?? 0) !== 0) reszek.push(`${Math.abs(data.rozsaszinTele)} db rózsaszín teli`)
    if ((data.osszegFt ?? 0)      !== 0) reszek.push(`${data.osszegFt} Ft`)
    const leiras = reszek.join(', ') || esemeny

    // proxy módban: végrehajtó = admin, érintett = target; egyébként mindkettő azonos
    const proxyCal = isProxy
    writeLogAsync(esemeny, email, proxyCal ? effectiveEmail : email, leiras)

    if (data.muvelet === 'toltes') {
      const stock = await getStock()
      const osszesen = stock.kekUres + stock.rozsaszinUres
      sendCsereNotification(stock.kekUres, stock.rozsaszinUres, osszesen).catch(() => {})
    }
  }

  return NextResponse.json(result)
}
