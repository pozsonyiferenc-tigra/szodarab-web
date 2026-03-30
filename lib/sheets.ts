import { google } from 'googleapis'

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!)
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

export function getSheetsClient() {
  return google.sheets({ version: 'v4', auth: getAuth() })
}

export const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID!

export async function getSheetValues(range: string): Promise<string[][]> {
  const sheets = getSheetsClient()
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  })
  return (response.data.values ?? []) as string[][]
}

export async function appendRow(sheetName: string, values: (string | number | boolean | Date)[]): Promise<void> {
  const sheets = getSheetsClient()
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [values.map(v => v instanceof Date ? v.toISOString() : v)],
    },
  })
}

export async function updateCell(sheetName: string, row: number, col: number, value: string): Promise<void> {
  const sheets = getSheetsClient()
  const colLetter = String.fromCharCode(64 + col)
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!${colLetter}${row}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[value]] },
  })
}

export async function getSheetWithRowNumbers(range: string): Promise<{ row: number; values: string[] }[]> {
  const rows = await getSheetValues(range)
  const startRow = parseInt(range.split('A')[1]?.split(':')[0] ?? '2')
  return rows.map((values, i) => ({ row: startRow + i, values }))
}
