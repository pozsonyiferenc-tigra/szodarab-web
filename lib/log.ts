import { appendRow } from './sheets'

// Napló oszlopok:
// A: Időbélyeg  B: Esemény  C: Végrehajtó email  D: Érintett email  E: Leírás

export async function writeLog(
  esemeny: string,
  vegrehajtó: string,
  erintett: string,
  leiras: string,
): Promise<void> {
  await appendRow('Napló', [
    new Date().toISOString(),
    esemeny,
    vegrehajtó,
    erintett,
    leiras,
  ])
}

/** Tűz-és-felejtsd-el wrapper – soha ne blokkolja a fő választ */
export function writeLogAsync(
  esemeny: string,
  vegrehajtó: string,
  erintett: string,
  leiras: string,
): void {
  writeLog(esemeny, vegrehajtó, erintett, leiras).catch(() => {})
}
