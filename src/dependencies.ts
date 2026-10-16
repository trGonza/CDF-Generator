import { API_CONFIG } from "./config/api"
import { fleet } from "./data/fleet"
import { ApiClient } from "./infrastructure/http/ApiClient"
import { HttpAuthRepository } from "./infrastructure/http/HttpAuthRepository"
import { HttpFleetRepository } from "./infrastructure/http/HttpFleetRepository"
import { LocalAuthRepository } from "./infrastructure/storage/LocalAuthRepository"
import { LocalFleetRepository } from "./infrastructure/storage/LocalFleetRepository"

const apiClient = new ApiClient()

export const dependencies = {
  authRepository: API_CONFIG.useRemoteAuth
    ? new HttpAuthRepository(apiClient)
    : new LocalAuthRepository(),
  fleetRepository: API_CONFIG.useRemoteFleet
    ? new HttpFleetRepository(apiClient)
    : new LocalFleetRepository(fleet),
}
