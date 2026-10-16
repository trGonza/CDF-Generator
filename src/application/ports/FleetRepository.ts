import type { FleetUnit } from "../../domain/fleet/FleetUnit"

export interface FleetRepository {
  getAll(): Promise<FleetUnit[]>
  saveAll(units: FleetUnit[]): Promise<void>
}
