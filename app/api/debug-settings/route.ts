import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getSheetValues } from '@/lib/sheets'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await getSheetValues('Beállítások!A1:B20')
  return NextResponse.json(rows)
}
