import { getSheetValues, appendRow, updateCell, getSheetWithRowNumbers } from './sheets'
import { getCached, invalidate } from './cache'

const TTL = 5 * 60 * 1000 // 5 perc

// ==================== TAGOK ====================

export interface Tag {
  nev: string
  email: string
  aktiv: boolean
  szerep: string
  csereErtesites: boolean
  tema: 'dark' | 'light'
}

export async function getTags(): Promise<Tag[]> {
  return getCached('tagok', TTL, async () => {
    const rows = await getSheetValues('Tagok!A2:F')
    return rows.map(r => ({
      nev: r[0] ?? '',
      email: (r[1] ?? '').toLowerCase().trim(),
      aktiv: r[2]?.toString().toUpperCase() === 'TRUE',
      szerep: r[3] ?? 'tag',
      csereErtesites: r[4]?.toString().toUpperCase() === 'TRUE',
      tema: (r[5] === 'light' ? 'light' : 'dark') as 'dark' | 'light',
    }))
  })
}

export async function setUserTheme(email: string, tema: 'dark' | 'light'): Promise<void> {
  const rows = await getSheetWithRowNumbers('Tagok!A2:F')
  const found = rows.find(r => r.values[1]?.toLowerCase().trim() === email.toLowerCase().trim())
  if (!found) return
  await updateCell('Tagok', found.row, 6, tema) // F oszlop = 6
  invalidate('tagok')
}

export async function getTag(email: string): Promise<Tag | undefined> {
  const tags = await getTags()
  return tags.find(t => t.email === email.toLowerCase().trim())
}

export async function isAuthorizedUser(email: string): Promise<boolean> {
  const tag = await getTag(email)
  return !!(tag?.aktiv)
}

export async function isAdmin(email: string): Promise<boolean> {
  const tag = await getTag(email)
  return tag?.szerep === 'admin'
}

export async function getUserName(email: string): Promise<string> {
  const tag = await getTag(email)
  return tag?.nev ?? email.split('@')[0]
}

export async function getNotificationEmails(): Promise<string[]> {
  const tags = await getTags()
  return tags.filter(t => t.aktiv && t.csereErtesites).map(t => t.email)
}

export async function registerUser(email: string, nev: string): Promise<{ success: boolean; message: string; alreadyExists?: boolean }> {
  const tags = await getTags()
  const existing = tags.find(t => t.email === email.toLowerCase().trim())
  if (existing) {
    return { success: false, message: 'Ez az email már szerepel a rendszerben.', alreadyExists: true }
  }
  await appendRow('Tagok', [nev, email.toLowerCase().trim(), 'FALSE', 'tag', 'FALSE'])
  invalidate('tagok')
  return { success: true, message: 'Regisztrációd beérkezett, a menedzser jóváhagyására vár.' }
}

export async function getPendingUsers(): Promise<{ row: number; nev: string; email: string }[]> {
  const rows = await getSheetWithRowNumbers('Tagok!A2:E')
  return rows
    .filter(r => r.values[2]?.toString().toUpperCase() !== 'TRUE')
    .map(r => ({ row: r.row, nev: r.values[0] ?? '', email: r.values[1] ?? '' }))
}

export async function approveUser(email: string): Promise<{ success: boolean; message: string }> {
  const rows = await getSheetWithRowNumbers('Tagok!A2:E')
  const found = rows.find(r => r.values[1]?.toLowerCase().trim() === email.toLowerCase().trim())
  if (!found) return { success: false, message: 'Felhasználó nem található.' }
  await updateCell('Tagok', found.row, 3, 'TRUE') // col C = aktiv
  invalidate('tagok')
  return { success: true, message: `${found.values[0]} hozzáférése jóváhagyva.` }
}

// ==================== BEÁLLÍTÁSOK ====================

export interface Settings {
  patronAr: number
  csereMinimum: number
  emailErtesites: boolean
  szamlaszam: string
  revolut: string
}

// Több lehetséges kulcsnevet próbál ki
function pick(map: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const v = map[k] ?? map[k.toLowerCase()] ?? map[k.toUpperCase()]
    if (v && v.trim()) return v.trim()
  }
  return ''
}

export async function getSettings(): Promise<Settings> {
  return getCached('beallitasok', TTL, async () => {
    const rows = await getSheetValues('Beállítások!A2:B')
    const map = Object.fromEntries(rows.map(r => [r[0], r[1]]))
    // B8 = rows[6][1], B9 = rows[7][1] (A2:B → 0-indexed, row 8 = index 6)
    return {
      patronAr: parseInt(map['patron_ar'] ?? '1900'),
      csereMinimum: parseInt(map['csere_minimum'] ?? '4'),
      emailErtesites: map['email_ertesites']?.toUpperCase() !== 'FALSE',
      szamlaszam: rows[6]?.[1]?.trim() || pick(map, 'szamlaszam', 'szamla_szam', 'bankszamla', 'bank_szamla', 'szamla'),
      revolut: rows[7]?.[1]?.trim() || pick(map, 'revolut', 'revolut_id', 'revolut_azonosito', 'revolut_tag'),
    }
  })
}

// ==================== TRANZAKCIÓK ====================

export interface Transaction {
  timestamp: string
  tagNev: string
  muvelet: string
  kekUres: number
  kekTele: number
  rozsaszinUres: number
  rozsaszinTele: number
  osszegFt: number
  megjegyzes: string
}

export async function getTransactions(): Promise<Transaction[]> {
  const rows = await getSheetValues('Tranzakciók!A2:I')
  return rows.map(r => ({
    timestamp: r[0] ?? '',
    tagNev: r[1] ?? '',
    muvelet: r[2] ?? '',
    kekUres: parseFloat(r[3] ?? '0') || 0,
    kekTele: parseFloat(r[4] ?? '0') || 0,
    rozsaszinUres: parseFloat(r[5] ?? '0') || 0,
    rozsaszinTele: parseFloat(r[6] ?? '0') || 0,
    osszegFt: parseFloat(r[7] ?? '0') || 0,
    megjegyzes: r[8] ?? '',
  }))
}

// ==================== EGYENLEGEK ====================

export interface Balance {
  kekPatron: number
  rozsaszinPatron: number
  penz: number
}

export async function getUserBalance(email: string): Promise<Balance> {
  const [transactions, settings, userName] = await Promise.all([
    getTransactions(),
    getSettings(),
    getUserName(email),
  ])

  const balance: Balance = { kekPatron: 0, rozsaszinPatron: 0, penz: 0 }

  for (const t of transactions) {
    if (t.tagNev === userName || t.tagNev === email) {
      balance.kekPatron += t.kekUres + t.kekTele
      balance.rozsaszinPatron += t.rozsaszinUres + t.rozsaszinTele
      balance.penz += t.osszegFt
      balance.penz -= Math.abs(t.kekTele) * settings.patronAr
      balance.penz -= Math.abs(t.rozsaszinTele) * settings.patronAr
    }
  }

  return balance
}

export interface Stock {
  kekUres: number
  kekTele: number
  rozsaszinUres: number
  rozsaszinTele: number
}

export async function getStock(): Promise<Stock> {
  const transactions = await getTransactions()
  const stock: Stock = { kekUres: 0, kekTele: 0, rozsaszinUres: 0, rozsaszinTele: 0 }
  for (const t of transactions) {
    stock.kekUres += t.kekUres
    stock.kekTele += t.kekTele
    stock.rozsaszinUres += t.rozsaszinUres
    stock.rozsaszinTele += t.rozsaszinTele
  }
  return stock
}

export interface MemberBalance {
  nev: string
  email: string
  kekPatron: number
  rozsaszinPatron: number
  penz: number
}

export async function getAllBalances(): Promise<MemberBalance[]> {
  const tags = await getTags()
  const activeTags = tags.filter(t => t.aktiv)
  const balances = await Promise.all(
    activeTags.map(async t => {
      const b = await getUserBalance(t.email)
      return { nev: t.nev, email: t.email, ...b }
    })
  )
  return balances
}

// ==================== CSERE JAVASLAT ====================

export interface CsereSuggestion {
  tipus: string
  uzenet: string
  mennyiseg: number
  csereelheto: boolean
}

export async function getCsereSuggestion(): Promise<CsereSuggestion[]> {
  const [stock, settings] = await Promise.all([getStock(), getSettings()])
  const osszesUres = stock.kekUres + stock.rozsaszinUres
  const suggestions: CsereSuggestion[] = []

  if (osszesUres >= settings.csereMinimum) {
    suggestions.push({
      tipus: 'vegyes',
      uzenet: `Van összesen ${osszesUres} db üres patron (${stock.kekUres} kék + ${stock.rozsaszinUres} rózsaszín)! Javaslat: cseréld minimum ${settings.csereMinimum} db-ot!`,
      mennyiseg: osszesUres,
      csereelheto: true,
    })
  } else if (osszesUres > 0) {
    const hiany = settings.csereMinimum - osszesUres
    suggestions.push({
      tipus: 'vegyes',
      uzenet: `Még ${hiany} db üres patron kell a ${settings.csereMinimum}-es csomaghoz (jelenleg: ${stock.kekUres} kék + ${stock.rozsaszinUres} rózsaszín = ${osszesUres} db)`,
      mennyiseg: osszesUres,
      csereelheto: false,
    })
  }

  return suggestions
}

// ==================== TRANZAKCIÓ RÖGZÍTÉS ====================

export interface TransactionInput {
  muvelet: 'behozas' | 'elvitel' | 'befizetes' | 'csere'
  kekUres?: number
  kekTele?: number
  rozsaszinUres?: number
  rozsaszinTele?: number
  osszegFt?: number
  megjegyzes?: string
}

export interface ValidationResult {
  success: boolean
  message?: string
}

export async function validateTransaction(data: TransactionInput, email: string): Promise<ValidationResult> {
  const [balance, stock, adminCheck] = await Promise.all([
    getUserBalance(email),
    getStock(),
    isAdmin(email),
  ])

  if (data.muvelet === 'elvitel') {
    const kekElvitel = Math.abs(data.kekTele ?? 0)
    const rozsaszinElvitel = Math.abs(data.rozsaszinTele ?? 0)

    if (kekElvitel > balance.kekPatron) {
      return { success: false, message: `Nem vihetsz el ${kekElvitel} db kék patront! Patron egyenleged: ${balance.kekPatron} db` }
    }
    if (rozsaszinElvitel > balance.rozsaszinPatron) {
      return { success: false, message: `Nem vihetsz el ${rozsaszinElvitel} db rózsaszín patront! Patron egyenleged: ${balance.rozsaszinPatron} db` }
    }
    if (kekElvitel > stock.kekTele) {
      return { success: false, message: `Nincs elegendő kék tele patron a közös készletben! Elérhető: ${stock.kekTele} db` }
    }
    if (rozsaszinElvitel > stock.rozsaszinTele) {
      return { success: false, message: `Nincs elegendő rózsaszín tele patron! Elérhető: ${stock.rozsaszinTele} db` }
    }
  }

  if (data.muvelet === 'csere') {
    if (!adminCheck) {
      return { success: false, message: 'Csak adminisztrátor végezhet cserét!' }
    }
    const kekCsere = Math.abs(data.kekUres ?? 0)
    const rozsaszinCsere = Math.abs(data.rozsaszinUres ?? 0)
    const osszesenCsere = kekCsere + rozsaszinCsere
    const osszesenUres = stock.kekUres + stock.rozsaszinUres

    if (osszesenCsere > osszesenUres) {
      return { success: false, message: `Nincs elegendő üres patron! Összesen elérhető: ${osszesenUres} db (kék: ${stock.kekUres} + rózsaszín: ${stock.rozsaszinUres})` }
    }
  }

  if (data.muvelet === 'befizetes') {
    if ((data.osszegFt ?? 0) <= 0) {
      return { success: false, message: 'A befizetett összegnek pozitívnak kell lennie!' }
    }
  }

  if (data.muvelet === 'behozas') {
    if ((data.kekUres ?? 0) <= 0 && (data.rozsaszinUres ?? 0) <= 0) {
      return { success: false, message: 'Legalább 1 db patront be kell hozni!' }
    }
  }

  return { success: true }
}

export async function addTransaction(data: TransactionInput, email: string): Promise<ValidationResult> {
  const validation = await validateTransaction(data, email)
  if (!validation.success) return validation

  const userName = await getUserName(email)

  const row = [
    new Date().toISOString(),
    userName,
    data.muvelet,
    data.kekUres ?? 0,
    data.kekTele ?? 0,
    data.rozsaszinUres ?? 0,
    data.rozsaszinTele ?? 0,
    data.osszegFt ?? 0,
    data.megjegyzes ?? '',
  ]

  await appendRow('Tranzakciók', row)
  return { success: true, message: 'Tranzakció sikeresen rögzítve!' }
}

// ==================== DASHBOARD ====================

export interface DashboardData {
  userName: string
  userEmail: string
  isAdmin: boolean
  tema: 'dark' | 'light'
  balance: Balance
  stock: Stock
  patronPrice: number
  csereMinimum: number
  csereSuggestions: CsereSuggestion[]
  szamlaszam: string
  revolut: string
}

export async function getDashboardData(email: string): Promise<DashboardData> {
  const [tag, adminCheck, balance, stock, settings, csereSuggestions] = await Promise.all([
    getTag(email),
    isAdmin(email),
    getUserBalance(email),
    getStock(),
    getSettings(),
    getCsereSuggestion(),
  ])

  return {
    userName: tag?.nev ?? email.split('@')[0],
    userEmail: email,
    isAdmin: adminCheck,
    tema: tag?.tema ?? 'dark',
    balance,
    stock,
    patronPrice: settings.patronAr,
    csereMinimum: settings.csereMinimum,
    csereSuggestions,
    szamlaszam: settings.szamlaszam,
    revolut: settings.revolut,
  }
}
