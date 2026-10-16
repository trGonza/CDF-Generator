import type { FleetUnit } from "../fleet/FleetUnit"

export const MONTHS = [
  "ENERO",
  "FEBRERO",
  "MARZO",
  "ABRIL",
  "MAYO",
  "JUNIO",
  "JULIO",
  "AGOSTO",
  "SEPTIEMBRE",
  "OCTUBRE",
  "NOVIEMBRE",
  "DICIEMBRE",
]

export const REFERENCE_CYCLE_STARTS = [
  "2026-09-04",
  "2026-10-02",
  "2026-10-30",
  "2026-11-27",
  "2026-12-25",
  "2027-01-23",
  "2027-02-20",
  "2027-03-20",
  "2027-04-17",
  "2027-05-15",
  "2027-06-12",
  "2027-07-10",
  "2027-08-07",
  "2027-09-04",
  "2027-10-02",
  "2027-10-30",
  "2027-11-27",
]

export const REFERENCE_FOLIO = 72784
export const CYCLE_CHANGE_INCREMENT = 20
export const DAYS_PER_CYCLE = 28
export const BLOCKS_PER_CYCLE = 12
export const FOLIOS_PER_BLOCK = 20

const REFERENCE_CYCLE_START = REFERENCE_CYCLE_STARTS[0]
const CYCLE_INCREMENT_OVERRIDES: Record<string, Record<number, number>> = {
  "2026-10-02": { 120: 10 },
  "2027-04-17": { 80: 20 },
}

export function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function datesForCycle(startValue: string) {
  const start = parseLocalDate(startValue)
  return Array.from({ length: BLOCKS_PER_CYCLE }, (_, blockIndex) =>
    addDays(start, Math.floor(blockIndex / 3) * 7 + (blockIndex % 3)),
  )
}

export function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`
}

function calendarDayNumber(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
}

function daysBetween(fromDate: Date, toDate: Date) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000
  return Math.round(
    (calendarDayNumber(toDate) - calendarDayNumber(fromDate)) /
      millisecondsPerDay,
  )
}

export function cycleStartAt(cycleIndex: number) {
  if (cycleIndex >= 0 && cycleIndex < REFERENCE_CYCLE_STARTS.length) {
    return REFERENCE_CYCLE_STARTS[cycleIndex]
  }

  if (cycleIndex < 0) {
    return dateKey(
      addDays(
        parseLocalDate(REFERENCE_CYCLE_START),
        cycleIndex * DAYS_PER_CYCLE,
      ),
    )
  }

  const lastIndex = REFERENCE_CYCLE_STARTS.length - 1
  return dateKey(
    addDays(
      parseLocalDate(REFERENCE_CYCLE_STARTS[lastIndex]),
      (cycleIndex - lastIndex) * DAYS_PER_CYCLE,
    ),
  )
}

export function cycleIndexForDate(date: Date) {
  const firstStart = parseLocalDate(REFERENCE_CYCLE_START)
  if (date < firstStart) {
    return Math.floor(daysBetween(firstStart, date) / DAYS_PER_CYCLE)
  }

  for (let index = REFERENCE_CYCLE_STARTS.length - 1; index >= 0; index -= 1) {
    const start = parseLocalDate(REFERENCE_CYCLE_STARTS[index])
    if (date >= start) {
      if (index < REFERENCE_CYCLE_STARTS.length - 1) return index
      return index + Math.floor(daysBetween(start, date) / DAYS_PER_CYCLE)
    }
  }

  return 0
}

export function currentCycleStartValue() {
  return cycleStartAt(cycleIndexForDate(new Date()))
}

export function shortDate(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  })
    .format(date)
    .replace(".", "")
}

export function formatDate(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")} DE ${
    MONTHS[date.getMonth()]
  } DEL ${date.getFullYear()}`
}

export function applicationDate(
  slotIndex: number,
  unitsPerBlock: number,
  activeDates: Date[],
) {
  return activeDates[Math.floor(slotIndex / unitsPerBlock)]
}

export function folioFor(
  slotIndex: number,
  units: FleetUnit[],
  initialFolio: number,
  unitsPerBlock: number,
  blockIncrement: number,
  typeIncrement: number,
  cycleStartValue?: string,
) {
  const sortedUnits = [...units].sort((a, b) => a.id - b.id)
  const typeAtSlot = (slot: number) => {
    let type = sortedUnits[0]?.type ?? ""
    for (const unit of sortedUnits) {
      if (unit.id - 1 > slot) break
      type = unit.type
    }
    return type
  }

  let folio = initialFolio
  for (let index = 1; index <= slotIndex; index += 1) {
    const incrementOverride = cycleStartValue
      ? CYCLE_INCREMENT_OVERRIDES[cycleStartValue]?.[index]
      : undefined
    const changedType = typeAtSlot(index) !== typeAtSlot(index - 1)
    const changedBlock =
      Math.floor(index / unitsPerBlock) !==
      Math.floor((index - 1) / unitsPerBlock)
    folio +=
      incrementOverride ??
      (changedType ? typeIncrement : changedBlock ? blockIncrement : 1)
  }
  return folio
}

export function reservedSlotCount(units: FleetUnit[], unitsPerBlock: number) {
  if (!units.length) return 0
  const lastSlot = Math.max(...units.map((unit) => unit.id))
  return Math.ceil(lastSlot / unitsPerBlock) * unitsPerBlock
}

export function initialFolioForCycle(
  cycleStartValue: string,
  units: FleetUnit[],
  unitsPerBlock: number,
  blockIncrement: number,
  typeIncrement: number,
) {
  if (!units.length) return REFERENCE_FOLIO

  const lastSlotIndex = reservedSlotCount(units, unitsPerBlock) - 1
  const distance = cycleIndexForDate(parseLocalDate(cycleStartValue))
  let folio = REFERENCE_FOLIO

  if (distance > 0) {
    for (let cycleIndex = 0; cycleIndex < distance; cycleIndex += 1) {
      const startValue = cycleStartAt(cycleIndex)
      folio =
        folioFor(
          lastSlotIndex,
          units,
          folio,
          unitsPerBlock,
          blockIncrement,
          typeIncrement,
          startValue,
        ) + CYCLE_CHANGE_INCREMENT
    }
  } else if (distance < 0) {
    for (let cycleIndex = -1; cycleIndex >= distance; cycleIndex -= 1) {
      const startValue = cycleStartAt(cycleIndex)
      const cycleAdvance =
        folioFor(
          lastSlotIndex,
          units,
          0,
          unitsPerBlock,
          blockIncrement,
          typeIncrement,
          startValue,
        ) + CYCLE_CHANGE_INCREMENT
      folio -= cycleAdvance
    }
  }

  return folio
}
