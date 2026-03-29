import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getDashboardData, isAuthorizedUser } from '@/lib/data'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress
  if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 })

  const authorized = await isAuthorizedUser(email)
  if (!authorized) return NextResponse.json({ error: 'Hozzáférés megtagadva' }, { status: 403 })

  const data = await getDashboardData(email)
  return NextResponse.json(data)
}
