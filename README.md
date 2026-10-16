# Sistema CDF

Aplicación React para generar constancias de fumigación, administrar el ciclo
de 28 días, calcular folios e imprimir lotes.

## Comandos

```bash
pnpm build
pnpm format
```

El servidor de desarrollo de Figma Make ya se encuentra activo.

## Configuración del microservicio

Toda la configuración está en un solo archivo:

```text
src/config/api.ts
```

Para cambiar el servidor solo modifica `baseUrl`:

```ts
export const API_CONFIG = {
  baseUrl: "https://nonevaporating-soon-arhythmical.ngrok-free.dev",
  proxyPath: "/api",
  useDevelopmentProxy: false,
  useRemoteAuth: true,
  useRemoteFleet: false,
} as const;
```

- `useRemoteAuth`: usa el microservicio para login y renovación.
- `useRemoteFleet`: usa `/fleet`; permanece desactivado hasta implementar esa
  API.
- `useDevelopmentProxy`: enruta las llamadas mediante Vite cuando sea
  necesario.

## Estructura

```text
src/
├── App.tsx                 # Única raíz de React y Router
├── main.tsx                # Montaje en el DOM
├── routes.tsx              # Rutas públicas y protegidas
├── dependencies.ts         # Selección de repositorios local/HTTP
├── config/
│   └── api.ts              # Única configuración de API
├── auth/
│   ├── AuthProvider.tsx    # Estado global de autenticación
│   └── useAuth.ts          # Contexto y hook
├── components/
│   ├── auth/               # Login
│   ├── cdf/                # Documento imprimible
│   ├── layout/             # Cabecera y protección de rutas
│   └── ui/                 # Iconos compartidos
├── data/
│   └── fleet.ts            # 163 unidades importadas
├── domain/
│   ├── cdf/                # Reglas de fechas y folios
│   └── fleet/              # Entidad FleetUnit
├── application/ports/      # Contratos de repositorios
├── infrastructure/
│   ├── http/               # API y repositorios remotos
│   └── storage/            # Repositorios locales
├── pages/
│   └── DashboardPage.tsx   # Pantalla principal
└── assets/                 # Imágenes originales de la constancia
```

## Flujo de autenticación

El frontend utiliza:

```text
POST /auth/login
POST /auth/refresh
POST /auth/logout
```

El token de acceso permanece en memoria. El refresh token se guarda en
`sessionStorage`. La administración visual de sesiones e historial está
pendiente y no forma parte de las rutas actuales.

## Unidades y folios

- 163 unidades registradas.
- Posiciones reservadas hasta completar bloques de 20.
- 12 bloques por ciclo.
- Ciclos de 28 días.
- Folio de referencia: `72784`.
- Inicio de referencia: `2026-09-04`.
- Las fechas irregulares y excepciones históricas se conservan en
  `src/domain/cdf/cdfCalculations.ts`.

No se deben renumerar los identificadores de las unidades: también representan
la posición utilizada para asignar bloque, fecha y folio.
