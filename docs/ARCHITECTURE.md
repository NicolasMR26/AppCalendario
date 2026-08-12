# Arquitectura

## Capas

```
presentation (screens, components, zustand stores)
        │  depende de
        ▼
domain (entities, repository interfaces)   ◄── data implementa estas interfaces
        ▲
        │  implementa
data (local/, remote/, repositories/*Sync*)
```

`domain` no importa nada de `data` ni de `presentation`. `data` implementa los contratos
de `domain`. `presentation` sólo conoce `domain` (tipos) y el composition root en
`@data/repositories` (instancias concretas ya ensambladas). Esto permite, por ejemplo,
cambiar Supabase por Firebase reescribiendo solo `src/data/remote/*` sin tocar pantallas.

## Modelo de datos

Las mismas tablas existen en dos motores: **SQLite** en el dispositivo (`src/data/local/db.ts`,
sin `user_id` — es de un solo usuario) y **Postgres** en Supabase (`supabase/schema.sql`, con
`user_id` + RLS) para el espejo en la nube. La forma es igual salvo esa columna.

### `subjects`
| campo | tipo | notas |
|---|---|---|
| id | uuid | |
| user_id | uuid | dueño (Supabase Auth); ausente en el registro local |
| name | text | |
| professor | text? | opcional |
| color | text | hex `#RRGGBB` |
| day | 1–7 | 1 = lunes … 7 = domingo |
| start_time / end_time | `HH:mm` | valida `end > start` |
| is_favorite | bool | |

### `notes`
| campo | tipo | notas |
|---|---|---|
| id | uuid | |
| subject_id | uuid | FK a `subjects`, `on delete cascade` |
| text | text | ej. "Examen el 12 de junio" |
| date | date? | null = solo orden manual |
| sort_order | int | usado cuando `date` es null o modo "Manual" |
| alert_email | bool | activa el recordatorio por correo |
| alert_sent_at | timestamptz? | evita reenviar el mismo aviso |

### `user_settings`
Un registro por usuario: `alert_email` (override del correo de la cuenta), `theme_mode`,
`reminder_lead_days` (días de anticipación para el recordatorio).

### `alert_queue`
Cola de eventos de "cambio de horario", encolados por un trigger `AFTER UPDATE` en
`subjects` cuando `day`/`start_time`/`end_time` cambian. La función `schedule-alerts` los
procesa y marca `sent_at`.

## Sincronización offline-first

`Sync{Subject,Note,Settings}Repository` (en `src/data/repositories/`) es la única
implementación que usa el resto de la app:

1. **Toda escritura** (`create`, `update`, `remove`, `reorder`) se aplica primero al
   repositorio local — una base **SQLite** real (`src/data/local/db.ts`, vía `expo-sqlite`) —
   y retorna de inmediato: la UI nunca espera a la red, y el dispositivo sigue funcionando
   sin conexión ni cuenta indefinidamente.
2. Si hay sesión activa, se intenta un `upsert`/`delete` remoto en segundo plano
   (`void this.pushUpsert(...)`) contra las tablas equivalentes en Supabase (Postgres).
3. Si el push falla (sin red, error transitorio) la operación se encola en
   `SyncQueue`, respaldada por la tabla `pending_sync` de la misma base SQLite.
4. `flushPendingSync()` — llamado al iniciar la app y en cada cambio de sesión de
   Auth (`onAuthStateChange`) — reintenta todo lo encolado.

Supabase/Postgres nunca es la fuente de verdad para las pantallas: es un espejo opcional
que además sirve de backend a las Edge Functions de alertas por correo (que sí necesitan
un servidor con acceso a red para enviar el email).

Sin sesión iniciada, `isOnline()` devuelve `false` y la app opera 100% local: nada se
pierde, todo queda en la cola local en caso de agregar red o cuenta más tarde. Nótese que,
en esta versión, la cola no resuelve conflictos concurrentes entre dos dispositivos editando
el mismo registro sin conexión — el último `push` gana. Para un caso de uso multi-dispositivo
más exigente, agregar un campo `version`/`updated_at` con resolución "last write wins" explícita
o CRDTs sería el siguiente paso.

## Flujo de alertas por correo

Dos mecanismos, ambos usando el módulo compartido `supabase/functions/_shared/email.ts`
(Resend API):

1. **Barrido diario (`schedule-alerts`)**, disparado por `pg_cron` (ver `schema.sql`,
   sección final comentada):
   - Recorre `notes` con `alert_email = true`, `alert_sent_at is null` y `date` dentro de la
     ventana `reminder_lead_days` del usuario → envía y marca `alert_sent_at`.
   - Recorre `alert_queue` con `kind = 'schedule_change'` y `sent_at is null` → envía y marca
     `sent_at`.
   - Usa el cliente `service_role` (bypassa RLS) porque corre sin un usuario logueado.
2. **Envío bajo demanda (`send-alert-email`)**, invocado desde la app
   (`supabase.functions.invoke`) para el botón "Enviar correo de prueba" en Ajustes o para
   disparar el aviso de una nota puntual. Usa un cliente **scoped al usuario** (RLS activo)
   para que cada llamada sólo pueda tocar sus propios datos.

El destinatario es `user_settings.alert_email` si está definido, si no, el correo de la
cuenta de Supabase Auth (`auth.users.email`).

## Drag & drop del calendario

`src/presentation/utils/calendarLayout.ts` centraliza la conversión pixel ↔ tiempo/día
(altura por hora, snapping a 15 minutos, ancho de columna por día). `CardRamo` usa
`react-native-gesture-handler` (`Gesture.Pan` + `Gesture.Tap` simultáneos) y
`react-native-reanimated` para seguir el dedo con `translateX/Y` y animar el `scale` al
levantar la tarjeta; al soltar, la posición final en píxeles se traduce de vuelta a
`day`/`startTime`/`endTime` y se persiste vía `useSubjectsStore().moveSubject`.
