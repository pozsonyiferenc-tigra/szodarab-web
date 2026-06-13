import { getSheetValues, appendRow, updateCell, updateRowCells, getSheetWithRowNumbers } from './sheets'
import { getCached, invalidate } from './cache'

const TTL = 5 * 60 * 1000 // 5 perc

// ==================== TAGOK ====================

export interface Tag {
  nev: string
  email: string
  email2: string
  aktiv: boolean
  szerep: string
  csereErtesites: boolean
  tema: 'dark' | 'light'
  // Tagok H-L: aktuális készlet (közvetlen forrás)
  uresKek:  number   // H – behozás növeli, elvitel/töltetés csökkenti (= elviteli jog)
  uresPink: number   // I
  teleKek:  number   // J – proxy töltetés növeli, elvitel csökkenti (= kiosztott teli)
  telePink: number   // K
  tartozas: number   // L – pénzügyi egyenleg (negatív = tartozás)
}

export async function getTags(): Promise<Tag[]> {
  return getCached('tagok', TTL, async () => {
    const rows = await getSheetValues('Tagok!A2:L')
    return rows
      .filter(r => r[1] && r[1].includes('@'))   // csak valódi felhasználó sorok
      .map(r => ({
        nev:           r[0] ?? '',
        email:         (r[1] ?? '').toLowerCase().trim(),
        aktiv:         r[2]?.toString().toUpperCase() === 'TRUE',
        szerep:        r[3] ?? 'tag',
        csereErtesites: r[4]?.toString().toUpperCase() === 'TRUE',
        tema:          (r[5] === 'light' ? 'light' : 'dark') as 'dark' | 'light',
        email2:        (r[6] ?? '').toLowerCase().trim(),
        uresKek:       parseFloat(r[7]  ?? '0') || 0,
        uresPink:      parseFloat(r[8]  ?? '0') || 0,
        teleKek:       parseFloat(r[9]  ?? '0') || 0,
        telePink:      parseFloat(r[10] ?? '0') || 0,
        tartozas:      parseFloat(r[11] ?? '0') || 0,
      }))
  })
}

export async function setUserTheme(email: string, tema: 'dark' | 'light'): Promise<void> {
  const rows = await getSheetWithRowNumbers('Tagok!A2:G')
  const norm = email.toLowerCase().trim()
  const found = rows.find(r =>
    r.values[1]?.toLowerCase().trim() === norm ||
    (r.values[6]?.toLowerCase().trim() || '') === norm && norm !== ''
  )
  if (!found) return
  await updateCell('Tagok', found.row, 6, tema) // F oszlop = 6
  invalidate('tagok')
}

export async function getTag(email: string): Promise<Tag | undefined> {
  const tags = await getTags()
  const norm = email.toLowerCase().trim()
  return tags.find(t => t.email === norm || (t.email2 !== '' && t.email2 === norm))
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
  const norm = email.toLowerCase().trim()
  const existing = tags.find(t => t.email === norm || (t.email2 !== '' && t.email2 === norm))
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
    .filter(r => r.values[1]?.includes('@'))                          // speciális sorok (képletsor, alaptőke) kizárása
    .filter(r => r.values[2]?.toString().toUpperCase() !== 'TRUE')   // még nem aktív tagok
    .map(r => ({ row: r.row, nev: r.values[0] ?? '', email: r.values[1] ?? '' }))
}

export async function approveUser(email: string): Promise<{ success: boolean; message: string }> {
  const rows = await getSheetWithRowNumbers('Tagok!A2:G')
  const norm = email.toLowerCase().trim()
  const found = rows.find(r =>
    r.values[1]?.toLowerCase().trim() === norm ||
    (r.values[6]?.toLowerCase().trim() || '') === norm && norm !== ''
  )
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
  kekPatron: number        // H – üres leadott = elviteli jogosultság
  rozsaszinPatron: number  // I
  kekTeli: number          // J – proxy töltetéssel kiosztott teli (előre allokált)
  rozsaszinTeli: number    // K
  penz: number
}

export async function getUserBalance(email: string): Promise<Balance> {
  // Egyenleg közvetlenül a Tagok H-L oszlopaiból – gyors, nem kell az összes tranzakciót végigolvasni
  const norm = email.toLowerCase().trim()
  const tags = await getTags()
  const tag = tags.find(t => t.email === norm || (t.email2 !== '' && t.email2 === norm))
  return {
    kekPatron:       tag?.uresKek  ?? 0,   // H = üres leadott → ennyi teli elvihető
    rozsaszinPatron: tag?.uresPink ?? 0,   // I
    kekTeli:         tag?.teleKek  ?? 0,   // J = proxy kiosztott teli
    rozsaszinTeli:   tag?.telePink ?? 0,   // K
    penz:            tag?.tartozas ?? 0,
  }
}

export interface Stock {
  kekUres: number
  kekTele: number
  rozsaszinUres: number
  rozsaszinTele: number
}

export async function getStock(): Promise<Stock> {
  // Teljes készlet: Tagok H-K oszlopaiból (alaptőke + felhasználói sorok összege)
  // index 0 = összesítő képletsor (skip!), index 1+ = alaptőke + tagok
  const tagokRows = await getSheetValues('Tagok!A2:L')   // friss, nem cachelve

  const stock: Stock = { kekUres: 0, kekTele: 0, rozsaszinUres: 0, rozsaszinTele: 0 }

  for (let i = 1; i < tagokRows.length; i++) {
    const r = tagokRows[i]
    if (!r || !r[0]) continue   // üres sor → skip
    stock.kekUres        += parseFloat(r[7]  ?? '0') || 0   // H
    stock.rozsaszinUres  += parseFloat(r[8]  ?? '0') || 0   // I
    stock.kekTele        += parseFloat(r[9]  ?? '0') || 0   // J
    stock.rozsaszinTele  += parseFloat(r[10] ?? '0') || 0   // K
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
  // Egy getTags() hívás elég – H-L már benne van a cached tag objektumokban
  const tags = await getTags()
  return tags
    .filter(t => t.aktiv && t.email)
    .map(t => ({
      nev:              t.nev,
      email:            t.email,
      kekPatron:        t.uresKek,   // H = üres leadott = elviteli jog
      rozsaszinPatron:  t.uresPink,  // I
      penz:             t.tartozas,
    }))
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
      uzenet: `Van összesen ${osszesUres} db üres patron (${stock.kekUres} kék + ${stock.rozsaszinUres} rózsaszín)! Javaslat: töltess minimum ${settings.csereMinimum} db-ot!`,
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
  muvelet: 'behozas' | 'elvitel' | 'befizetes' | 'toltes' | 'csere'
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

export async function validateTransaction(data: TransactionInput, email: string, adminEmail?: string): Promise<ValidationResult> {
  const [balance, stock, adminCheck] = await Promise.all([
    getUserBalance(email),
    getStock(),
    adminEmail ? isAdmin(adminEmail) : isAdmin(email),   // proxy esetén az eredeti admin email-t ellenőrizzük
  ])

  if (data.muvelet === 'elvitel') {
    const kekElvitel      = Math.abs(data.kekTele       ?? 0)
    const rozsaszinElvitel = Math.abs(data.rozsaszinTele ?? 0)

    // Jogosultság: leadott üres (H) + neki kiosztott teli (J)
    if (kekElvitel > balance.kekPatron + balance.kekTeli) {
      return { success: false, message: `Nem vihetsz el ${kekElvitel} db kék patront! Egyenleged: ${balance.kekPatron} db üres + ${balance.kekTeli} db kiosztott teli` }
    }
    if (rozsaszinElvitel > balance.rozsaszinPatron + balance.rozsaszinTeli) {
      return { success: false, message: `Nem vihetsz el ${rozsaszinElvitel} db rózsaszín patront! Egyenleged: ${balance.rozsaszinPatron} db üres + ${balance.rozsaszinTeli} db kiosztott teli` }
    }

    // Banki teli fedezet a jog terhére vitt részre (ami nem a saját kiosztott teliből megy)
    const alap = await getAlaptokeStock()
    const kekBankbol  = Math.max(0, kekElvitel      - balance.kekTeli)
    const pinkBankbol = Math.max(0, rozsaszinElvitel - balance.rozsaszinTeli)
    if (kekBankbol > alap.teleKek) {
      return { success: false, message: `Nincs elegendő teli kék patron a közös készletben! Elérhető: ${alap.teleKek} db` }
    }
    if (pinkBankbol > alap.telePink) {
      return { success: false, message: `Nincs elegendő teli rózsaszín patron a közös készletben! Elérhető: ${alap.telePink} db` }
    }
  }

  if (data.muvelet === 'toltes') {
    if (!adminCheck) {
      return { success: false, message: 'Csak adminisztrátor végezhet töltetést!' }
    }
    const kekLeadott     = Math.abs(data.kekUres       ?? 0)
    const rozsaszinLeadott = Math.abs(data.rozsaszinUres ?? 0)
    const kekAtvett      = Math.abs(data.kekTele       ?? 0)
    const rozsaszinAtvett  = Math.abs(data.rozsaszinTele ?? 0)
    const osszesenLeadott  = kekLeadott + rozsaszinLeadott
    const osszesenAtvett   = kekAtvett  + rozsaszinAtvett
    const osszesenUres     = stock.kekUres + stock.rozsaszinUres

    if (osszesenLeadott > osszesenUres) {
      return { success: false, message: `Nincs elegendő üres patron! Összesen elérhető: ${osszesenUres} db (kék: ${stock.kekUres} + rózsaszín: ${stock.rozsaszinUres})` }
    }
    if (osszesenAtvett !== osszesenLeadott) {
      return { success: false, message: `A leadott (${osszesenLeadott} db) és átvett (${osszesenAtvett} db) patronok száma nem egyezik!` }
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

  if (data.muvelet === 'csere') {
    const kekDb      = Math.abs(data.kekUres       ?? 0)
    const rozsaszinDb = Math.abs(data.rozsaszinUres ?? 0)
    if (kekDb + rozsaszinDb === 0) {
      return { success: false, message: 'Legalább 1 db patront kell cserélni!' }
    }
    // A cseréhez teli fedezet kell a banki készletből (színenként)
    const alap = await getAlaptokeStock()
    if (kekDb > alap.teleKek) {
      return { success: false, message: `Nincs elegendő teli kék patron a cseréhez! Elérhető: ${alap.teleKek} db` }
    }
    if (rozsaszinDb > alap.telePink) {
      return { success: false, message: `Nincs elegendő teli rózsaszín patron a cseréhez! Elérhető: ${alap.telePink} db` }
    }
  }

  return { success: true }
}

// ==================== TAGOK KÉSZLET FRISSÍTÉS ====================

/** Felhasználói sor H-L cellák delta-alapú frissítése */
async function updateTagStock(
  email: string,
  delta: { uresKek?: number; uresPink?: number; teleKek?: number; telePink?: number; tartozas?: number },
): Promise<void> {
  const norm = email.toLowerCase().trim()
  const rows = await getSheetWithRowNumbers('Tagok!A2:L')
  const found = rows.find(r =>
    r.values[1]?.toLowerCase().trim() === norm ||
    ((r.values[6]?.toLowerCase().trim() || '') === norm && norm !== ''),
  )
  if (!found) return

  const cur = {
    uresKek:  parseFloat(found.values[7]  ?? '0') || 0,
    uresPink: parseFloat(found.values[8]  ?? '0') || 0,
    teleKek:  parseFloat(found.values[9]  ?? '0') || 0,
    telePink: parseFloat(found.values[10] ?? '0') || 0,
    tartozas: parseFloat(found.values[11] ?? '0') || 0,
  }

  await updateRowCells('Tagok', found.row, 8, [
    cur.uresKek  + (delta.uresKek  ?? 0),
    cur.uresPink + (delta.uresPink ?? 0),
    cur.teleKek  + (delta.teleKek  ?? 0),
    cur.telePink + (delta.telePink ?? 0),
    cur.tartozas + (delta.tartozas ?? 0),
  ])
  invalidate('tagok')
}

/** Alaptőke (bank) sor aktuális H-K értékei – validációhoz */
async function getAlaptokeStock(): Promise<{ uresKek: number; uresPink: number; teleKek: number; telePink: number }> {
  const rows = await getSheetValues('Tagok!A2:L')
  const r = rows.find(r => r[0]?.toLowerCase().trim() === 'alaptőke')
  return {
    uresKek:  parseFloat(r?.[7]  ?? '0') || 0,
    uresPink: parseFloat(r?.[8]  ?? '0') || 0,
    teleKek:  parseFloat(r?.[9]  ?? '0') || 0,
    telePink: parseFloat(r?.[10] ?? '0') || 0,
  }
}

/** Alaptőke sor H-K frissítése (töltetés: H/I csökken – üres ki, J/K nő – teli be) */
async function updateAlaptoke(delta: { uresKek?: number; uresPink?: number; teleKek?: number; telePink?: number }): Promise<void> {
  const rows = await getSheetWithRowNumbers('Tagok!A2:L')
  const alaptokeRow = rows.find(r => r.values[0]?.toLowerCase().trim() === 'alaptőke')
  if (!alaptokeRow) return

  const curH = parseFloat(alaptokeRow.values[7]  ?? '0') || 0
  const curI = parseFloat(alaptokeRow.values[8]  ?? '0') || 0
  const curJ = parseFloat(alaptokeRow.values[9]  ?? '0') || 0
  const curK = parseFloat(alaptokeRow.values[10] ?? '0') || 0

  await updateRowCells('Tagok', alaptokeRow.row, 8, [
    curH + (delta.uresKek  ?? 0),
    curI + (delta.uresPink ?? 0),
    curJ + (delta.teleKek  ?? 0),
    curK + (delta.telePink ?? 0),
  ])
  invalidate('tagok')
}

// ==================== TRANZAKCIÓ RÖGZÍTÉS ====================

export async function addTransaction(data: TransactionInput, email: string, adminEmail?: string): Promise<ValidationResult> {
  const validation = await validateTransaction(data, email, adminEmail)
  if (!validation.success) return validation

  const [userName, settings] = await Promise.all([getUserName(email), getSettings()])

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

  // Tagok készlet-oszlopok frissítése tranzakció típusa szerint
  if (data.muvelet === 'behozas') {
    // Felhasználó üres patronokat hoz be → H, I nő
    await updateTagStock(email, {
      uresKek:  data.kekUres       ?? 0,
      uresPink: data.rozsaszinUres ?? 0,
    })
  } else if (data.muvelet === 'elvitel') {
    // Felhasználó teli patront visz el. Először a neki kiosztott teliből (J/K) fogyaszt,
    // a maradék a leadott-üres jog (H/I) terhére a banki teli készletből megy ki.
    const kek       = Math.abs(data.kekTele        ?? 0)
    const rozsaszin = Math.abs(data.rozsaszinTele  ?? 0)
    const tag = await getTag(email)
    const kekJbol   = Math.min(kek,       tag?.teleKek  ?? 0)
    const pinkJbol  = Math.min(rozsaszin, tag?.telePink ?? 0)
    const kekHbol   = kek       - kekJbol
    const pinkHbol  = rozsaszin - pinkJbol

    await updateTagStock(email, {
      uresKek:  -kekHbol,    // H csökken (elviteli jog elhasználva)
      uresPink: -pinkHbol,
      teleKek:  -kekJbol,    // J csökken (kiosztott teli elvitele)
      telePink: -pinkJbol,
      tartozas: -(kek + rozsaszin) * settings.patronAr,  // L csökken (adósság nő)
    })

    if (kekHbol + pinkHbol > 0) {
      // A jog terhére vitt teli a bank készletéből fogy; a tag üres palackja a banké lesz
      await updateAlaptoke({
        uresKek:  kekHbol,    // az üres palack átszáll a bankra
        uresPink: pinkHbol,
        teleKek:  -kekHbol,   // a teli kimegy a banki készletből
        telePink: -pinkHbol,
      })
    }
  } else if (data.muvelet === 'toltes') {
    // Töltetés: üres patronok kimennek (kekUres/rozsaszinUres negatív),
    // teli patronok bejönnek (kekTele/rozsaszinTele pozitív) – szín szabadon változhat
    if (adminEmail) {
      // Proxy töltetés: a palackok a tag sorára kerülnek (H→J konverzió),
      // a költség a végrehajtó adminra – a tag majd a kiosztott teli ELVITELEKOR tartozik
      await updateTagStock(email, {
        uresKek:  data.kekUres       ?? 0,  // negatív → H csökken
        uresPink: data.rozsaszinUres ?? 0,  // negatív → I csökken
        teleKek:  data.kekTele       ?? 0,  // pozitív → J nő (tényleges teli átvétel)
        telePink: data.rozsaszinTele ?? 0,  // pozitív → K nő
      })
      await updateTagStock(adminEmail, { tartozas: data.osszegFt ?? 0 })
    } else {
      // Nem-proxy töltetés: alaptőke sort frissítjük
      await updateAlaptoke({
        uresKek:  data.kekUres       ?? 0,  // negatív
        uresPink: data.rozsaszinUres ?? 0,
        teleKek:  data.kekTele       ?? 0,  // tényleges teli átvétel (nem abs(ures)!)
        telePink: data.rozsaszinTele ?? 0,
      })
      // Admin L-je változik (osszegFt negatív = kiadás)
      await updateTagStock(email, { tartozas: data.osszegFt ?? 0 })
    }
  } else if (data.muvelet === 'csere') {
    // Felhasználói közvetlen csere: N üres behoz + N teli elvisz (azonos szín).
    // A tag H-ja nettó nulla; a hozott üres a banké lesz, a teli a bank készletéből fogy.
    const kek       = Math.abs(data.kekUres       ?? 0)
    const rozsaszin = Math.abs(data.rozsaszinUres ?? 0)
    await updateTagStock(email, {
      tartozas: -(kek + rozsaszin) * settings.patronAr,  // L csökken (tartozás nő)
    })
    await updateAlaptoke({
      uresKek:  kek,         // hozott üres → bank H nő
      uresPink: rozsaszin,
      teleKek:  -kek,        // elvitt teli → bank J csökken
      telePink: -rozsaszin,
    })
  } else if (data.muvelet === 'befizetes') {
    // Befizetés → L nő (adósság csökken)
    await updateTagStock(email, { tartozas: data.osszegFt ?? 0 })
  }

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
  adminUsers?: Array<{ nev: string; email: string }>
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

  const adminUsers = adminCheck
    ? (await getTags()).filter(t => t.aktiv).map(t => ({ nev: t.nev, email: t.email }))
    : undefined

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
    adminUsers,
  }
}
