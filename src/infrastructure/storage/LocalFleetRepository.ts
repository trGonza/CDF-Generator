import type { FleetRepository } from "../../application/ports/FleetRepository"
import type { FleetUnit } from "../../domain/fleet/FleetUnit"

const STORAGE_KEY = "cdf-fleet"

export class LocalFleetRepository implements FleetRepository {
  constructor(private readonly seed: FleetUnit[]) {}

  async getAll() {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) as FleetUnit[] : this.seed
    } catch {
      return this.seed
    }
  }

  async saveAll(units: FleetUnit[]) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(units))
  }
}
