import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { addTransaction, isAuthorizedUser, getStock } from '@/lib/data'
import { sendCsereNotification } from '@/lib/email'

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress
  if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 })

  const authorized = await isAuthorizedUser(email)
  if (!authorized) return NextResponse.json({ error: 'Hozzáférés megtagadva' }, { status: 403 })

  const data = await request.json()
  const result = await addTransaction(data, email)

  if (result.success && data.muvelet === 'csere') {
    const stock = await getStock()
    const osszesen = stock.kekUres + stock.rozsaszinUres
    sendCsereNotification(stock.kekUres, stock.rozsaszinUres, osszesen).catch(() => {})
  }

  return NextResponse.json(result)
}
