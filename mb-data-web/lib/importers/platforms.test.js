import { describe, it, expect } from 'vitest'
import { parseMoney, parseWallTime, parseCsv } from './common'
import { detectPlatform, parsePlatformFile, importMarker, IMPORT_MARKER_RE } from './detect'
import { ntInstrument } from './ninjatrader'
import { pairProjectXFills, contractSymbol, isoToLocalWall } from './projectx'

// Lignes reprises des formats publiés par chaque plateforme (voir l'en-tête
// de chaque parseur).
const TRADOVATE = [
  'symbol,_priceFormat,_priceFormatType,_tickSize,buyFillId,sellFillId,qty,buyPrice,sellPrice,pnl,boughtTimestamp,soldTimestamp,duration',
  'ESM6,-2,0,0.25,540725260010,540725260021,1,7494.25,7494.75,$25.00,06/14/2026 18:03:54,06/14/2026 18:04:19,25sec',
  'MESU6,-2,0,0.25,540725260088,540725260119,1,7555.50,7554.25,$(6.25),06/14/2026 18:49:36,06/14/2026 18:50:46,1min 9sec',
  'NQM6,-2,0,0.25,540725260200,540725260190,2,21000.00,21042.70,"$1,708.00",06/15/2026 10:05:00,06/15/2026 10:01:00,4min',
].join('\r\n')

const NINJA = [
  'Trade number,Instrument,Account,Strategy,Market pos.,Qty,Entry price,Exit price,Entry time,Exit time,Entry name,Exit name,Profit,Cum. net profit,Commission,Clearing Fee,Exchange Fee,IP Fee,NFA Fee,MAE,MFE,ETD,Bars,',
  '1,NQ 06-26,Playback101,PantheonMaster,Short,1,27911.00,27936.50,5/4/2026 12:11:02 AM,5/4/2026 1:15:47 AM,PantheonShort,Buy to cover,($510.00),($510.00),$0.00,$0.00,$0.00,$0.00,$0.00,$550.00,$775.00,$1285.00,65,',
  '4,NQ 06-26,Playback101,PantheonMaster,Long,1,29606.25,29628.75,5/14/2026 12:00:01 AM,5/14/2026 12:05:31 AM,PantheonLong,Profit target,$450.00,($60.00),$4.50,$0.00,$0.00,$0.00,$0.00,$0.00,$0.00,$0.00,5,',
].join('\n')

const TOPSTEPX = '﻿' + [
  'Id,ContractName,EnteredAt,ExitedAt,EntryPrice,ExitPrice,Fees,PnL,Size,Type,TradeDay,TradeDuration,Commissions',
  '1540212786,6EZ5,10/29/2025 02:34:55 -05:00,10/29/2025 03:15:22 -05:00,1.166050000,1.165500000,6.48000,-137.500000000,2,Long,10/29/2025 00:00:00 -05:00,00:40:26.7148440,',
  '1431726313,MNQZ5,10/06/2025 13:21:01 -04:00,10/06/2025 13:22:43 -04:00,25207.750000000,25213.750000000,3.70000,-60.000000000,5,Short,10/06/2025 00:00:00 -05:00,00:01:41.9743520,0.50000',
].join('\n')

const MT5 = `<html><body><table>
<tr><th colspan="13"><div><b>Trade History Report</b></div></th></tr>
<tr><th>Account:</th><th colspan="4"><b>1510283 (USD, FTMO-Demo, Hedge)</b></th></tr>
<tr><td colspan="13" style="height:30px"></td></tr>
<tr><th colspan="13"><div><b>Positions</b></div></th></tr>
<tr><td>Time</td><td>Position</td><td>Symbol</td><td>Type</td><td>Volume</td><td>Price</td><td>S / L</td><td>T / P</td><td>Time</td><td>Price</td><td>Commission</td><td>Swap</td><td colspan="2">Profit</td></tr>
<tr><td>2024.01.10 04:06:11</td><td>103260942</td><td>EURUSD</td><td>buy</td><td class="hidden" colspan="8"></td><td>5.52</td><td>1.09328</td><td>1.09310</td><td>1.09333</td><td>2024.01.10 04:08:33</td><td>1.09333</td><td>-16.56</td><td>0.00</td><td colspan="2">27.60</td></tr>
<tr><td>2024.01.18 09:17:05</td><td>103855814</td><td>EURUSD</td><td>sell</td><td class="hidden" colspan="8"></td><td>19.59</td><td>1.09019</td><td>1.09019</td><td>1.08918</td><td>2024.01.18 09:35:21</td><td>1.08918</td><td>-58.78</td><td>0.00</td><td colspan="2">1 978.59</td></tr>
<tr><td colspan="13" style="height:30px"></td></tr>
<tr><th colspan="13"><div><b>Orders</b></div></th></tr>
<tr><td>2024.01.10 04:06:11</td><td>1</td><td>EURUSD</td><td>buy</td></tr>
</table></body></html>`

const MT4 = `<html><body><table>
<tr align=left><td colspan=2><b>Account: 2088134</b></td><td colspan=5><b>Name: Demo</b></td></tr>
<tr align=left><td colspan=13><b>Closed Transactions:</b></td></tr>
<tr align=center bgcolor="#C0C0C0"><td>Ticket</td><td nowrap>Open Time</td><td>Type</td><td>Size</td><td>Item</td><td>Price</td><td>S / L</td><td>T / P</td><td nowrap>Close Time</td><td>Price</td><td>Commission</td><td>Taxes</td><td>Swap</td><td>Profit</td></tr>
<tr align=right><td>5501</td><td>2024.03.01 10:00:00</td><td>sell</td><td>1.00</td><td>gbpusd</td><td>1.26500</td><td>0.00000</td><td>0.00000</td><td>2024.03.01 12:00:00</td><td>1.26300</td><td>-7.00</td><td>0.00</td><td>0.00</td><td>200.00</td></tr>
<tr align=right><td>5502</td><td>2024.03.02 08:00:00</td><td>balance</td><td colspan=10>Deposit</td><td>10 000.00</td></tr>
<tr align=left><td colspan=14><b>Open Trades:</b></td></tr>
</table></body></html>`

describe('outils communs', () => {
  it.each([
    ['$25.00', 25], ['$(6.25)', -6.25], ['$1,708.00', 1708], ['($510.00)', -510],
    ['-137.500000000', -137.5], ['1 978.59', 1978.59], ['', null],
  ])('parseMoney(%s)', (s, n) => expect(parseMoney(s)).toBe(n))
  it('virgule décimale', () => expect(parseMoney('-$ 200,00', { decimalComma: true })).toBe(-200))
  it.each([
    ['06/14/2026 18:03:54', '2026-06-14T18:03:54'],
    ['5/4/2026 12:11:02 AM', '2026-05-04T00:11:02'],
    ['5/4/2026 1:15:47 PM', '2026-05-04T13:15:47'],
    ['2024.01.10 04:06:11', '2024-01-10T04:06:11'],
    ['10/29/2025 02:34:55 -05:00', '2025-10-29T02:34:55'],
  ])('parseWallTime(%s)', (s, out) => expect(parseWallTime(s)).toBe(out))
  it('CSV avec guillemets', () => expect(parseCsv('a,"b,c",d\n1,2,3')).toEqual([['a', 'b,c', 'd'], ['1', '2', '3']]))
})

describe('détection', () => {
  it.each([[TRADOVATE, 'tradovate'], [NINJA, 'ninjatrader'], [TOPSTEPX, 'topstepx'], [MT5, 'metatrader'], [MT4, 'metatrader'], ['a,b\n1,2', null]])(
    'reconnaît le format', (txt, kind) => expect(detectPlatform(txt)).toBe(kind))
})

describe('Tradovate Performance', () => {
  const { trades, notes } = parsePlatformFile(TRADOVATE)
  it('P&L brut et sens déduit de l’ordre des exécutions', () => {
    expect(trades).toHaveLength(3)
    expect(trades[0]).toMatchObject({ instrument: 'ESM6', side: 'Long', pnl: 25, entryPrice: 7494.25, exitPrice: 7494.75, date: '2026-06-14' })
    expect(trades[1].pnl).toBe(-6.25)
    expect(trades[2]).toMatchObject({ side: 'Short', qty: 2, entryPrice: 21042.7, exitPrice: 21000, pnl: 1708, entryTime: '2026-06-15T10:01:00' })
    expect(notes).toContain('grossOnly')
  })
})

describe('NinjaTrader Trades', () => {
  const { trades } = parsePlatformFile(NINJA)
  it('compte, contrat et frais', () => {
    expect(trades[0]).toMatchObject({ account: 'Playback101', instrument: 'NQM6', side: 'Short', pnl: -510, entryTime: '2026-05-04T00:11:02' })
    expect(trades[1]).toMatchObject({ side: 'Long', pnl: 450, commissions: 4.5 })
  })
  it('identifiant stable', () => {
    expect(parsePlatformFile(NINJA).trades[0].externalId).toBe(trades[0].externalId)
  })
  it('« NQ 06-26 » → NQM6', () => expect(ntInstrument('MES 12-25')).toBe('MESZ5'))
})

describe('TopstepX Trades', () => {
  const { trades } = parsePlatformFile(TOPSTEPX)
  it('P&L net = brut − frais − commissions', () => {
    expect(trades[0]).toMatchObject({ externalId: '1540212786', instrument: '6EZ5', side: 'Long', qty: 2, grossPnl: -137.5, commissions: 6.48, pnl: -143.98, date: '2025-10-29' })
    expect(trades[1]).toMatchObject({ side: 'Short', commissions: 4.2, pnl: -64.2 })
  })
})

describe('MetaTrader', () => {
  it('MT5 : section Positions, cellule masquée ignorée, espace des milliers', () => {
    const r = parsePlatformFile(MT5)
    expect(r.platform).toBe('mt5')
    expect(r.trades).toHaveLength(2)
    expect(r.trades[0]).toMatchObject({ account: '1510283', externalId: '103260942', instrument: 'EURUSD', side: 'Long', qty: 5.52, pnl: 11.04, commissions: 16.56 })
    expect(r.trades[1]).toMatchObject({ side: 'Short', grossPnl: 1978.59 })
  })
  it('MT4 : lignes balance ignorées', () => {
    const r = parsePlatformFile(MT4)
    expect(r.platform).toBe('mt4')
    expect(r.trades).toHaveLength(1)
    expect(r.trades[0]).toMatchObject({ account: '2088134', instrument: 'GBPUSD', side: 'Short', pnl: 193 })
  })
})

describe('API ProjectX : exécutions → allers-retours', () => {
  const fills = [
    { id: 1, accountId: 203, contractId: 'CON.F.US.EP.H25', creationTimestamp: '2025-01-21T16:13:52.523293+00:00', price: 6064.25, profitAndLoss: null, fees: 1.4, side: 0, size: 2, voided: false },
    { id: 2, accountId: 203, contractId: 'CON.F.US.EP.H25', creationTimestamp: '2025-01-21T16:20:00.000000+00:00', price: 6065.25, profitAndLoss: 50, fees: 0.7, side: 1, size: 1, voided: false },
    { id: 3, accountId: 203, contractId: 'CON.F.US.EP.H25', creationTimestamp: '2025-01-21T16:25:00.000000+00:00', price: 6063.25, profitAndLoss: -50, fees: 0.7, side: 1, size: 1, voided: false },
    { id: 4, accountId: 203, contractId: 'CON.F.US.EP.H25', creationTimestamp: '2025-01-21T16:26:00.000000+00:00', price: 6000, profitAndLoss: null, fees: 1, side: 0, size: 1, voided: true },
  ]
  const { trades, notes } = pairProjectXFills(fills, { accountName: 'PRAC-1', offsetMinutes: 0 })
  it('FIFO, frais répartis, exécution annulée ignorée', () => {
    expect(trades).toHaveLength(2)
    expect(trades[0]).toMatchObject({ externalId: '1-2', account: 'PRAC-1', instrument: 'EPH25', side: 'Long', qty: 1, grossPnl: 50, commissions: 1.4, pnl: 48.6, entryTime: '2025-01-21T16:13:52' })
    expect(trades[1]).toMatchObject({ externalId: '1-3', pnl: -51.4 })
    expect(notes).toEqual([])
  })
  it('symbole du contrat', () => expect(contractSymbol('CON.F.US.MNQ.Z25')).toBe('MNQZ25'))
  it('heure murale locale', () => expect(isoToLocalWall('2025-01-21T16:13:52Z', 300)).toBe('2025-01-21T11:13:52'))
})

describe('marqueur', () => {
  it('aller-retour du marqueur', () => {
    const m = importMarker('tradovate', '1-2').match(IMPORT_MARKER_RE)
    expect(m.slice(1)).toEqual(['tradovate', '1-2'])
  })
})
