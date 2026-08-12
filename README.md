# DayGridK&N

Calendario universitario minimalista basado en tarjetas. Cada ramo es una tarjeta arrastrable
en una grilla semanal, con colores personalizables, notas rápidas por ramo y alertas por
correo para exámenes, entregas y cambios de horario.

- **App:** React Native + Expo (Expo Router), TypeScript, Reanimated + Gesture Handler para
  drag & drop, Zustand para estado. Persistencia local offline-first: **SQLite** (`expo-sqlite`)
  en iOS/Android, **IndexedDB** (`idb`) en la versión web — mismo código, Metro elige el
  archivo correcto por plataforma (`*.web.ts`).
- **Backend:** Supabase (Auth + Postgres + Edge Functions) para sincronización en la nube y
  el envío de correos de alerta vía Resend.
- **Web/PWA:** `npx expo export --platform web` genera un sitio estático gratis de alojar
  (Vercel/Netlify/GitHub Pages) e instalable desde Safari con "Agregar a inicio" — ver
  [docs/SETUP.md](docs/SETUP.md#8-publicar-como-web-pwa--gratis-sin-cuenta-de-apple).

La app funciona **completamente sin cuenta** (todo en una base de datos local al dispositivo/navegador).
Iniciar sesión en Ajustes activa sincronización en la nube y alertas por correo.

## Estructura del proyecto

```
DayGridKN/
├── app/                      # Expo Router: pantallas y navegación
│   ├── _layout.tsx           # Providers raíz, carga de fuentes, bootstrap
│   ├── (tabs)/                
│   │   ├── index.tsx         # Calendario semanal
│   │   └── settings.tsx      # Ajustes, cuenta, alertas
│   └── subject/[id].tsx      # Editor de ramo (crear/editar) + notas
├── src/
│   ├── domain/                # Entidades + interfaces de repositorio (sin dependencias externas)
│   │   ├── entities/          # Subject, Note, UserSettings
│   │   └── repositories/      # Puertos (contratos) que implementa la capa data
│   ├── data/
│   │   ├── local/             # Repositorios sobre SQLite (fuente de verdad offline: db.ts + schema)
│   │   ├── remote/             # Cliente Supabase + repositorios remotos
│   │   └── repositories/      # Repositorios "Sync*" (offline-first: local + push a la nube)
│   └── presentation/
│       ├── components/        # CardRamo, ColorPicker, NotesList, CalendarGrid
│       ├── store/              # Zustand: subjects, notes, settings, auth
│       ├── theme/              # Tokens de diseño + ThemeProvider (claro/oscuro)
│       └── utils/              # Layout de calendario, generación de ids
├── supabase/
│   ├── schema.sql              # Tablas, RLS, triggers, cron de alertas
│   └── functions/
│       ├── _shared/            # Envío de correo (Resend), cliente admin
│       ├── schedule-alerts/    # Barrido diario (cron): exámenes/entregas + cambios de horario
│       └── send-alert-email/   # Invocable desde la app: correo de prueba / alerta inmediata
└── docs/
    ├── ARCHITECTURE.md
    └── SETUP.md
```

## Arquitectura

Clean Architecture / MVVM ligero:

1. **Domain** define `Subject`, `Note`, `UserSettings` y las interfaces `SubjectRepository`,
   `NoteRepository`, `SettingsRepository` — sin saber nada de SQLite ni Supabase.
2. **Data** implementa esas interfaces dos veces (`Local*`, `Remote*`) y las combina en
   `Sync*Repository`: toda lectura/escritura pasa primero por `Local*` (instantáneo, funciona
   sin red) y luego se empuja a Supabase en segundo plano; si falla, la operación se encola
   (`SyncQueue`) y se reintenta en el próximo `flushPendingSync()`.
3. **Presentation** consume únicamente `@data/repositories` (el composition root) a través de
   stores de Zustand; las pantallas y componentes no saben si los datos vienen de disco o de
   la nube.

Ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para el detalle del modelo de datos y del
flujo de alertas por correo.

## Empezar

```bash
npm install
cp .env.example .env.local   # agrega tus credenciales de Supabase (opcional)
npm run start
```

Ver [docs/SETUP.md](docs/SETUP.md) para la configuración completa de Supabase, variables de
entorno, y compilación/despliegue a iOS con EAS Build.
