import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { registerUser, getTag } from '@/lib/data'

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress
  if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 })

  const tag = await getTag(email)
  if (tag) return NextResponse.json({ error: 'Már szerepelsz a rendszerben.' }, { status: 400 })

  const body = await request.json()
  const nev = (body.nev ?? '').trim()
  if (!nev) return NextResponse.json({ error: 'Adj meg nevet!' }, { status: 400 })

  const result = await registerUser(email, nev)
  return NextResponse.json(result, { status: result.success ? 200 : 400 })
}
