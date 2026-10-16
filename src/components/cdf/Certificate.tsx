import footerImage from "../../assets/cdf-footer.png"
import headerImage from "../../assets/cdf-header.png"
import pestsImage from "../../assets/cdf-pests.png"
import {
  applicationDate,
  folioFor,
  formatDate,
} from "../../domain/cdf/cdfCalculations"
import type { FleetUnit } from "../../domain/fleet/FleetUnit"

type CertificateProps = {
  unit: FleetUnit
  slotIndex: number
  units: FleetUnit[]
  activeDates: Date[]
  initialFolio: number
  unitsPerBlock: number
  blockIncrement: number
  typeIncrement: number
  cycleStartValue: string
}

export default function Certificate({
  unit,
  slotIndex,
  units,
  activeDates,
  initialFolio,
  unitsPerBlock,
  blockIncrement,
  typeIncrement,
  cycleStartValue,
}: CertificateProps) {
  const date = applicationDate(slotIndex, unitsPerBlock, activeDates)
  const folio = folioFor(
    slotIndex,
    units,
    initialFolio,
    unitsPerBlock,
    blockIncrement,
    typeIncrement,
    cycleStartValue,
  )

  return (
    <article className="certificate">
      <img className="certificate-header" src={headerImage} alt="" />
      <div className="certificate-number">
        N<sup>o</sup> <strong>{folio}</strong>
      </div>
      <div className="certificate-fields">
        <p>
          <b>Fecha de aplicación:</b>
          <span>{date ? formatDate(date) : "SIN FECHA ASIGNADA"}</span>
        </p>
        <p>
          <b>Cliente:</b>
          <span>ADRIAN GONZALEZ GIL</span>
        </p>
        <p>
          <b>Dirección:</b>
          <span>AV.16 DE SEPTIEMBRE S/N VITO ATOTONILCO DE TULA, HGO</span>
        </p>
        <p className="split-field">
          <b>Teléfono:</b>
          <span>7787350443</span>
          <b>Placas:</b>
          <span>{unit.plate || "SIN PLACA"}</span>
        </p>
        <p>
          <b>Tipo de Transporte:</b>
          <span>THERMO REFRIGERADO</span>
        </p>
        <p>
          <b>Tipo de aplicación:</b>
          <span>ASPERSIÓN</span>
          <b>Producto:</b>
          <span>THIAMETHOXAM 30 ML POR UN LITRO DE AGUA</span>
        </p>
        <p>
          <b>Observaciones:</b>
          <span>VALIDO POR UN MES A PARTIR DE LA FECHA</span>
        </p>
      </div>
      <img className="certificate-pests" src={pestsImage} alt="" />
      <img className="certificate-footer" src={footerImage} alt="" />
    </article>
  )
}
