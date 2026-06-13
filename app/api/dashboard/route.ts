import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getDashboardData, getTag, isAdmin, getTags } from '@/lib/data'

export async function GET(request: NextRequest) {
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

  const proxyEmail = request.nextUrl.searchParams.get('proxyEmail')

  if (proxyEmail && await isAdmin(email)) {
    const [proxyData, adminUsers] = await Promise.all([
      getDashboardData(proxyEmail),
      getTags().then(tags => tags.filter(t => t.aktiv).map(t => ({ nev: t.nev, email: t.email }))),
    ])
    // Admin témája és jogosultsága marad, a proxy user adatai jelennek meg
    proxyData.tema = tag.tema
    proxyData.isAdmin = true
    proxyData.adminUsers = adminUsers
    return NextResponse.json(proxyData)
  }

  const data = await getDashboardData(email)
  return NextResponse.json(data)
}
