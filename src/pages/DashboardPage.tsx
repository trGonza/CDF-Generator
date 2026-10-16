import { useEffect, useMemo, useRef, useState } from "react"
import { fleet } from "../data/fleet"
import { dependencies } from "../dependencies"
import type { FleetUnit } from "../domain/fleet/FleetUnit"
import Certificate from "../components/cdf/Certificate"
import AppHeader from "../components/layout/AppHeader"
import Icon from "../components/ui/Icon"
import {
  CYCLE_CHANGE_INCREMENT,
  FOLIOS_PER_BLOCK,
  REFERENCE_FOLIO,
  addDays,
  applicationDate,
  currentCycleStartValue,
  cycleIndexForDate,
  cycleStartAt,
  dateKey,
  datesForCycle,
  folioFor,
  formatDate,
  initialFolioForCycle,
  parseLocalDate,
  reservedSlotCount,
  shortDate,
} from "../domain/cdf/cdfCalculations"

export default function DashboardPage() {
  const [units, setUnits] = useState<FleetUnit[]>(fleet)
  const fleetLoaded = useRef(false)
  const [cycleStartValue, setCycleStartValue] = useState(currentCycleStartValue)
  const unitsPerBlock = FOLIOS_PER_BLOCK
  const [blockIncrement, setBlockIncrement] = useState(10)
  const [typeIncrement, setTypeIncrement] = useState(20)
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Set<number>>(() => new Set())
  const [previewId, setPreviewId] = useState(fleet[0].id)
  const [printMode, setPrintMode] = useState(false)

  const filteredFleet = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return units
    return units.filter((unit) =>
      [unit.plate, unit.eco, unit.type].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    )
  }, [units, query])
  const cycleSlots = useMemo(() => {
    const unitsById = new Map(units.map((unit) => [unit.id, unit]))
    return Array.from(
      { length: reservedSlotCount(units, unitsPerBlock) },
      (_, slotIndex) => ({
        slotIndex,
        unit: unitsById.get(slotIndex + 1),
      }),
    )
  }, [units, unitsPerBlock])
  const visibleSlots = useMemo(
    () =>
      query.trim()
        ? filteredFleet.map((unit) => ({
            slotIndex: unit.id - 1,
            unit,
          }))
        : cycleSlots,
    [cycleSlots, filteredFleet, query],
  )
  const visibleSelectableUnits = filteredFleet.filter((unit) => unit.plate)

  const cycleDates = useMemo(
    () => datesForCycle(cycleStartValue),
    [cycleStartValue],
  )
  const activeDates = cycleDates
  const initialFolio = useMemo(
    () =>
      initialFolioForCycle(
        cycleStartValue,
        units,
        unitsPerBlock,
        blockIncrement,
        typeIncrement,
      ),
    [blockIncrement, cycleStartValue, typeIncrement, units, unitsPerBlock],
  )
  const previewUnit = units.find((unit) => unit.id === previewId) ?? units[0]
  const selectedUnits = units.filter(
    (unit) =>
      unit.plate &&
      selected.has(unit.id) &&
      applicationDate(unit.id - 1, unitsPerBlock, activeDates),
  )
  const previewSlot = previewUnit.id - 1
  const previewDate = applicationDate(previewSlot, unitsPerBlock, activeDates)
  const cycleStart = activeDates[0]
  const cycleEnd = activeDates.at(-1)
  const nextCycle = cycleStart ? addDays(cycleStart, 28) : undefined
  const lastFolio = units.length
    ? folioFor(
        reservedSlotCount(units, unitsPerBlock) - 1,
        units,
        initialFolio,
        unitsPerBlock,
        blockIncrement,
        typeIncrement,
        cycleStartValue,
      )
    : initialFolio

  useEffect(() => {
    const finishPrinting = () => setPrintMode(false)
    window.addEventListener("afterprint", finishPrinting)
    return () => window.removeEventListener("afterprint", finishPrinting)
  }, [])

  useEffect(() => {
    setSelected(new Set())
  }, [])

  useEffect(() => {
    let active = true
    void dependencies.fleetRepository.getAll().then((storedUnits) => {
      if (!active) return
      fleetLoaded.current = true
      setUnits(storedUnits)
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!fleetLoaded.current) return
    void dependencies.fleetRepository.saveAll(units)
  }, [units])

  useEffect(() => {
    if (!printMode) return

    async function openPrintDialog() {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      )
      await document.fonts.ready
      const images = Array.from(
        document.querySelectorAll<HTMLImageElement>(".print-batch img"),
      )
      await Promise.all(
        images.map((image) =>
          image.complete
            ? image.decode().catch(() => undefined)
            : new Promise<void>((resolve) => {
                image.addEventListener("load", () => resolve(), { once: true })
                image.addEventListener("error", () => resolve(), { once: true })
              }),
        ),
      )
      window.print()
    }

    void openPrintDialog()
  }, [printMode])

  function toggleUnit(id: number) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAllVisible() {
    const everyVisibleSelected = visibleSelectableUnits.every((unit) =>
      selected.has(unit.id),
    )
    setSelected((current) => {
      const next = new Set(current)
      visibleSelectableUnits.forEach((unit) =>
        everyVisibleSelected ? next.delete(unit.id) : next.add(unit.id),
      )
      return next
    })
  }

  function printCertificates() {
    if (!selectedUnits.length) return
    setPrintMode(true)
  }

  function toggleBlock(blockIndex: number) {
    const blockUnits = units.filter(
      (unit) =>
        unit.plate && Math.floor((unit.id - 1) / unitsPerBlock) === blockIndex,
    )
    const allSelected =
      blockUnits.length > 0 && blockUnits.every((unit) => selected.has(unit.id))
    setSelected((current) => {
      const next = new Set(current)
      blockUnits.forEach((unit) =>
        allSelected ? next.delete(unit.id) : next.add(unit.id),
      )
      return next
    })
    if (!allSelected && blockUnits[0]) setPreviewId(blockUnits[0].id)
  }

  function selectAllBlocks() {
    setSelected(
      new Set(units.filter((unit) => unit.plate).map((unit) => unit.id)),
    )
  }

  function updateUnit(id: number, patch: Partial<FleetUnit>) {
    setUnits((current) =>
      current.map((unit) => (unit.id === id ? { ...unit, ...patch } : unit)),
    )
  }

  return (
    <div className="app-shell">
      <AppHeader />

      <main className="workspace">
        <section className="page-heading">
          <div>
            <span className="eyebrow">Ciclo de fumigación</span>
            <h1>Generar constancias</h1>
            <p>
              Programa fechas, asigna folios y prepara el lote completo para
              impresión.
            </p>
          </div>
          <button
            className="primary-button"
            type="button"
            onClick={printCertificates}
            disabled={!selectedUnits.length}
          >
            <Icon name="download" />
            Imprimir {selectedUnits.length} CDF
          </button>
        </section>

        <section className="metrics-grid" aria-label="Resumen del ciclo">
          <div className="metric-card accent">
            <div className="metric-icon">
              <Icon name="document" />
            </div>
            <div>
              <span>Constancias seleccionadas</span>
              <strong>{selectedUnits.length}</strong>
              <small>de {units.length} unidades registradas</small>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon">
              <Icon name="calendar" />
            </div>
            <div>
              <span>Periodo programado</span>
              <strong>
                {cycleStart ? formatDate(cycleStart) : "Sin fechas"}
              </strong>
              <small>
                {cycleEnd
                  ? `al ${formatDate(cycleEnd)}`
                  : "Activa al menos un día"}
              </small>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon">
              <Icon name="shield" />
            </div>
            <div>
              <span>Rango de folios</span>
              <strong>
                {initialFolio} — {lastFolio}
              </strong>
              <small>Regla de separación aplicada</small>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon">
              <Icon name="truck" />
            </div>
            <div>
              <span>Siguiente fumigación</span>
              <strong>
                {nextCycle ? formatDate(nextCycle) : "Sin calcular"}
              </strong>
              <small>28 días después del inicio</small>
            </div>
          </div>
        </section>

        <div className="content-grid">
          <section className="panel configuration-panel">
            <div className="panel-heading">
              <div>
                <span className="step">01</span>
                <div>
                  <h2>Configurar ciclo</h2>
                  <p>Las fechas se asignan automáticamente a cada bloque.</p>
                </div>
              </div>
              <span className="status-chip">Cálculo automático</span>
            </div>

            <div className="form-grid rules-grid">
              <label>
                <span>Inicio del ciclo</span>
                <input
                  type="date"
                  value={cycleStartValue}
                  onChange={(event) =>
                    setCycleStartValue(
                      cycleStartAt(
                        cycleIndexForDate(parseLocalDate(event.target.value)),
                      ),
                    )
                  }
                />
                <small>
                  Ciclo automático de 28 días con cuatro fines de semana.
                </small>
              </label>
              <label>
                <span>Folio inicial automático</span>
                <input type="number" value={initialFolio} readOnly />
                <small>
                  Referencia: septiembre 2026 · folio {REFERENCE_FOLIO}.
                </small>
              </label>
              <label>
                <span>Folios por bloque</span>
                <input type="number" value={unitsPerBlock} readOnly />
                <small>Regla fija: cada bloque reserva 20 posiciones.</small>
              </label>
              <label>
                <span>Salto al cambiar tipo de unidad</span>
                <input
                  type="number"
                  min="1"
                  value={typeIncrement}
                  onChange={(event) =>
                    setTypeIncrement(
                      Math.max(1, Number(event.target.value) || 1),
                    )
                  }
                />
                <small>El estándar actual es de 20 folios.</small>
              </label>
              <label>
                <span>Salto al cambiar de bloque</span>
                <input
                  type="number"
                  min="1"
                  value={blockIncrement}
                  onChange={(event) =>
                    setBlockIncrement(
                      Math.max(1, Number(event.target.value) || 1),
                    )
                  }
                />
                <small>Diferencia entre el último y el siguiente folio.</small>
              </label>
            </div>

            <div className="rule-note">
              <Icon name="shield" />
              <div>
                <strong>Regla validada con la hoja fuente</strong>
                <p>
                  Dentro del mismo bloque los folios son consecutivos. El salto
                  es de {blockIncrement} al cambiar de bloque y de{" "}
                  {typeIncrement} al cambiar el tipo de unidad. Al iniciar otro
                  ciclo se suman {CYCLE_CHANGE_INCREMENT} folios después del
                  último folio del ciclo anterior. Cada bloque reserva sus{" "}
                  {unitsPerBlock} folios completos, aunque existan posiciones
                  sin placa o sin registro.
                </p>
              </div>
            </div>
          </section>

          <aside className="panel preview-panel">
            <div className="panel-heading compact">
              <div>
                <span className="step">03</span>
                <div>
                  <h2>Vista previa</h2>
                  <p>{previewUnit.eco || previewUnit.type}</p>
                </div>
              </div>
              <span className="live-dot">Actualizada</span>
            </div>
            <div className="document-stage">
              <Certificate
                unit={previewUnit}
                slotIndex={previewSlot}
                units={units}
                activeDates={activeDates}
                initialFolio={initialFolio}
                unitsPerBlock={unitsPerBlock}
                blockIncrement={blockIncrement}
                typeIncrement={typeIncrement}
                cycleStartValue={cycleStartValue}
              />
            </div>
            <label className="preview-plate-editor">
              <span>Placa que aparecerá en la constancia</span>
              <input
                value={previewUnit.plate}
                placeholder="Capturar placa"
                onChange={(event) =>
                  updateUnit(previewUnit.id, {
                    plate: event.target.value.toUpperCase(),
                  })
                }
              />
            </label>
            <div className="preview-meta">
              <div>
                <span>Folio</span>
                <strong>
                  {folioFor(
                    previewSlot,
                    units,
                    initialFolio,
                    unitsPerBlock,
                    blockIncrement,
                    typeIncrement,
                    cycleStartValue,
                  )}
                </strong>
              </div>
              <div>
                <span>Aplicación</span>
                <strong>
                  {previewDate ? formatDate(previewDate) : "Sin bloque"}
                </strong>
              </div>
              <div>
                <span>Renovación</span>
                <strong>
                  {previewDate
                    ? formatDate(addDays(previewDate, 28))
                    : "Sin calcular"}
                </strong>
              </div>
            </div>
          </aside>

          <section className="panel fleet-panel">
            <div className="panel-heading">
              <div>
                <span className="step">02</span>
                <div>
                  <h2>Seleccionar unidades</h2>
                  <p>Datos importados de la relación de placas 2026.</p>
                </div>
              </div>
              <div className="search-field">
                <Icon name="search" />
                <input
                  aria-label="Buscar unidad"
                  placeholder="Buscar placa o económico"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
            </div>

            <div className="block-selector">
              <div className="block-selector-heading">
                <span>Selecciona uno o varios bloques para imprimir:</span>
                <button
                  className="select-all-blocks"
                  type="button"
                  onClick={selectAllBlocks}
                  disabled={
                    visibleSelectableUnits.length > 0 &&
                    units
                      .filter((unit) => unit.plate)
                      .every((unit) => selected.has(unit.id))
                  }
                >
                  Seleccionar todos los días
                </button>
              </div>
              <div className="block-selector-grid">
                {Array.from({ length: 4 }, (_, weekendIndex) => {
                  const weekendDates = activeDates.slice(
                    weekendIndex * 3,
                    weekendIndex * 3 + 3,
                  )
                  return (
                    <div className="weekend-group" key={weekendIndex}>
                      <div className="weekend-group-heading">
                        <strong>Fin de semana {weekendIndex + 1}</strong>
                        <span>3 días programados</span>
                      </div>
                      <div className="weekend-blocks">
                        {weekendDates.map((date, dateIndex) => {
                          const blockIndex = weekendIndex * 3 + dateIndex
                          const blockUnits = units.filter(
                            (unit) =>
                              Math.floor((unit.id - 1) / unitsPerBlock) ===
                              blockIndex,
                          )
                          const printableBlockUnits = blockUnits.filter(
                            (unit) => unit.plate,
                          )
                          const isSelected =
                            printableBlockUnits.length > 0 &&
                            printableBlockUnits.every((unit) =>
                              selected.has(unit.id),
                            )
                          return (
                            <button
                              aria-pressed={isSelected}
                              className={isSelected ? "is-selected" : ""}
                              key={dateKey(date)}
                              type="button"
                              onClick={() => toggleBlock(blockIndex)}
                            >
                              <span className="block-title">
                                <span className="block-check"></span>
                                Bloque {blockIndex + 1}
                              </span>
                              <span className="block-date">
                                {shortDate(date)}
                              </span>
                              <small>
                                {blockUnits.length} registros · {unitsPerBlock}{" "}
                                folios
                              </small>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th className="checkbox-cell">
                      <input
                        aria-label="Seleccionar unidades visibles"
                        type="checkbox"
                        checked={
                          visibleSelectableUnits.length > 0 &&
                          visibleSelectableUnits.every((unit) =>
                            selected.has(unit.id),
                          )
                        }
                        onChange={toggleAllVisible}
                      />
                    </th>
                    <th>Unidad</th>
                    <th>Placa</th>
                    <th>Fecha de aplicación</th>
                    <th>Folio</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleSlots.map(({ slotIndex, unit }) => {
                    const date = applicationDate(
                      slotIndex,
                      unitsPerBlock,
                      activeDates,
                    )
                    const isPreviewed = unit?.id === previewUnit.id
                    return (
                      <tr
                        key={slotIndex}
                        className={isPreviewed ? "is-previewed" : ""}
                        onClick={() => unit && setPreviewId(unit.id)}
                      >
                        <td className="checkbox-cell">
                          <input
                            aria-label={
                              unit
                                ? `Seleccionar ${unit.plate || unit.eco}`
                                : `Folio reservado ${slotIndex + 1}`
                            }
                            type="checkbox"
                            checked={Boolean(unit && selected.has(unit.id))}
                            disabled={!unit?.plate}
                            onClick={(event) => event.stopPropagation()}
                            onChange={() => {
                              if (!unit) return
                              setPreviewId(unit.id)
                              toggleUnit(unit.id)
                            }}
                          />
                        </td>
                        <td>
                          <strong>{unit?.eco || "Sin registro"}</strong>
                          <small>
                            {unit?.type || `Posición ${slotIndex + 1}`}
                          </small>
                        </td>
                        <td className="plate">
                          {unit
                            ? unit.plate || "Sin placa"
                            : "Espacio reservado"}
                        </td>
                        <td>{date ? formatDate(date) : "Sin bloque activo"}</td>
                        <td className="folio">
                          {folioFor(
                            slotIndex,
                            units,
                            initialFolio,
                            unitsPerBlock,
                            blockIncrement,
                            typeIncrement,
                            cycleStartValue,
                          )}
                        </td>
                        <td>
                          <span className="ready-chip">
                            {unit?.plate
                              ? "Lista"
                              : unit
                                ? "Sin placa"
                                : "Reservado"}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {!visibleSlots.length && (
                <div className="empty-state">
                  No hay unidades que coincidan con la búsqueda.
                </div>
              )}
            </div>
            <div className="table-footer">
              <span>
                Mostrando {visibleSlots.length} posiciones · {units.length}{" "}
                registros · {cycleSlots.length} folios reservados
              </span>
              <span>{selectedUnits.length} seleccionadas para impresión</span>
            </div>
          </section>
        </div>
      </main>

      {printMode && (
        <div className="print-batch">
          {selectedUnits.map((unit) => (
            <Certificate
              key={unit.id}
              unit={unit}
              slotIndex={unit.id - 1}
              units={units}
              activeDates={activeDates}
              initialFolio={initialFolio}
              unitsPerBlock={unitsPerBlock}
              blockIncrement={blockIncrement}
              typeIncrement={typeIncrement}
              cycleStartValue={cycleStartValue}
            />
          ))}
        </div>
      )}
    </div>
  )
}
