import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getAllBalances, isAdmin, isAuthorizedUser } from '@/lib/data'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress
  if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 })

  const [authorized, adminCheck] = await Promise.all([
    isAuthorizedUser(email),
    isAdmin(email),
  ])

  if (!authorized) return NextResponse.json({ error: 'Hozzáférés megtagadva' }, { status: 403 })
  if (!adminCheck) return NextResponse.json({ error: 'Csak admin' }, { status: 403 })

  const balances = await getAllBalances()
  return NextResponse.json(balances)
}
