export type FleetUnit = {
  id: number
  type: string
  plate: string
  eco: string
}

export type NewFleetUnit = Omit<FleetUnit, "id">
