import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getDashboardData, getTag } from '@/lib/data'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress
  if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 })

  const tag = await getTag(email)

  if (!tag) {
    return NextResponse.json({ error: 'not_registered', clerkName: user?.fullName ?? '' }, { status: 403 })
  }
  if (!tag.aktiv) {
    return NextResponse.json({ error: 'pending', nev: tag.nev }, { status: 403 })
  }

  const data = await getDashboardData(email)
  return NextResponse.json(data)
}
