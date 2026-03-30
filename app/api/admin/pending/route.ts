import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getPendingUsers, approveUser, isAdmin } from '@/lib/data'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress
  if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 })

  if (!await isAdmin(email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const pending = await getPendingUsers()
  return NextResponse.json(pending)
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress
  if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 })

  if (!await isAdmin(email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const targetEmail = (body.email ?? '').trim()
  if (!targetEmail) return NextResponse.json({ error: 'Email szükséges' }, { status: 400 })

  const result = await approveUser(targetEmail)
  return NextResponse.json(result, { status: result.success ? 200 : 400 })
}
