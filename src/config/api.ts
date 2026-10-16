/**
 * Configuración única de conexión con el microservicio CDF.
 *
 * Para cambiar de servidor, modifica únicamente `baseUrl`.
 */
export const API_CONFIG = {
  baseUrl: "https://cdf-generator-ms.onrender.com",
  proxyPath: "/api",
  useDevelopmentProxy: false,
  useRemoteAuth: true,
  useRemoteFleet: false,
} as const
