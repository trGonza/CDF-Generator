import type { FleetRepository } from "../../application/ports/FleetRepository"
import type { FleetUnit } from "../../domain/fleet/FleetUnit"
import { ApiClient } from "./ApiClient"

export class HttpFleetRepository implements FleetRepository {
  constructor(private readonly client: ApiClient) {}

  getAll() {
    return this.client.request<FleetUnit[]>("/fleet")
  }

  async saveAll(units: FleetUnit[]) {
    await this.client.request<void>("/fleet", {
      body: JSON.stringify({ units }),
      method: "PUT",
    })
  }
}
