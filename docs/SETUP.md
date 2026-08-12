# Setup, compilación y despliegue

## 1. Requisitos

- Node.js 18+ y npm
- Cuenta [Expo](https://expo.dev) (para EAS Build)
- Cuenta [Supabase](https://supabase.com) (opcional — solo si quieres sync en la nube +
  alertas por correo; la app funciona sin esto)
- Cuenta [Resend](https://resend.com) (o adaptar `supabase/functions/_shared/email.ts` a
  SendGrid) para el envío de correos
- macOS + Xcode, o una cuenta EAS para build en la nube, para compilar a iOS

## 2. Instalar dependencias

```bash
npm install
```

## 3. Correr en desarrollo

```bash
npm run start      # abre Expo Dev Tools / Metro
npm run ios         # requiere macOS + Xcode, o usa Expo Go escaneando el QR
```

Sin configurar Supabase, la app funciona igual: todo se guarda en la base SQLite local y las
secciones de nube/alertas quedan ocultas u ofrecen solo el modo local.

## 4. Configurar Supabase (sync en la nube + alertas)

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, pega y ejecuta el contenido de [`supabase/schema.sql`](../supabase/schema.sql).
   Crea las tablas `subjects`, `notes`, `user_settings`, `alert_queue`, sus políticas RLS y
   los triggers de `updated_at` / cambio de horario.
3. En **Authentication → Providers**, confirma que "Email" esté habilitado (login con
   email + contraseña, ya usado por la pantalla de Ajustes).
4. En **Settings → API**, copia `Project URL` y `anon public key`.
5. Copia `.env.example` a `.env.local` y completa:

   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=xxxxxxx
   ```

   Expo carga automáticamente `.env.local` en dev; para builds con EAS, define las mismas
   variables como **EAS Secrets** (paso 7).

## 5. Configurar el envío de correos (Resend)

1. Crea una cuenta en [resend.com](https://resend.com) y verifica un dominio (o usa el
   dominio de pruebas de Resend mientras desarrollas).
2. Genera una API key.
3. En el dashboard de Supabase → **Edge Functions → Manage secrets**, agrega:

   ```
   RESEND_API_KEY=re_xxxxxxxxxxxx
   ALERT_FROM_EMAIL=DayGridK&N <alerts@tudominio.com>
   ```

   `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` ya están disponibles automáticamente dentro
   de las Edge Functions — no hace falta configurarlas a mano.

## 6. Desplegar las Edge Functions

```bash
npm install -g supabase
supabase login
supabase link --project-ref TU_PROJECT_REF
supabase functions deploy schedule-alerts
supabase functions deploy send-alert-email
```

### Programar el barrido diario

En el **SQL Editor**, habilita `pg_cron` y `pg_net`, y agenda la función (reemplaza
`YOUR_PROJECT_REF` y `YOUR_SERVICE_ROLE_KEY` — este último en **Settings → API**, sección
`service_role`, mantenlo secreto):

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'daygridkn-daily-alerts',
  '0 8 * * *', -- 08:00 UTC todos los días
  $$
  select net.http_post(
    url := 'https://YOUR_PROJECT_REF.functions.supabase.co/schedule-alerts',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

(Este bloque también está comentado al final de `supabase/schema.sql` para copiar/pegar.)

## 7. Compilar y desplegar a iOS (EAS Build)

```bash
npm install -g eas-cli
eas login
eas build:configure          # crea eas.json y el projectId; pégalo en app.config.js -> extra.eas.projectId
```

Define los secretos de entorno para los builds en la nube (equivalentes a `.env.local`):

```bash
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value https://xxxx.supabase.co
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value xxxxxxx
```

Build de desarrollo (para probar en un iPhone físico vía TestFlight/ad-hoc):

```bash
eas build --platform ios --profile development
```

Build de producción y subida a App Store Connect:

```bash
eas build --platform ios --profile production
eas submit --platform ios
```

Antes del build de producción, reemplaza los íconos/splash placeholder en `assets/`
(`icon.png`, `adaptive-icon.png`, `splash.png`, 1024×1024) por el arte final, y define un
`bundleIdentifier` propio en `app.config.js` si `com.daygridkn.app` no es tuyo.

## 8. Publicar como web (PWA) — gratis, sin cuenta de Apple

La app también corre en el navegador: en `src/data/local/` cada repositorio tiene una
variante `*.web.ts` que usa **IndexedDB** (vía la librería `idb`) en vez de SQLite —
Metro elige automáticamente el archivo correcto según la plataforma, así que el resto del
código (pantallas, componentes, stores) no sabe ni le importa cuál está activo.

1. Generar el sitio estático:

   ```bash
   npx expo export --platform web
   ```

   Esto crea `dist/` con `index.html` + los assets — un sitio 100% estático, sin backend
   propio (Supabase sigue siendo opcional y funciona igual que en la app nativa).

2. Subir `dist/` a cualquier hosting gratuito de sitios estáticos: [Vercel](https://vercel.com),
   [Netlify](https://netlify.app) o [GitHub Pages](https://pages.github.com) — los tres tienen
   plan gratuito suficiente para esto. Necesitas tu propia cuenta en el que elijas (gratis, pero
   hay que crearla).
3. En tu iPhone, abre esa URL en Safari → compartir → **"Agregar a inicio"**. Queda un ícono en
   la pantalla de inicio que abre la app en pantalla completa.

**Limitación a tener en cuenta:** Safari en iOS puede borrar el almacenamiento local de un sitio
si no lo abres en 7 días (política anti-tracking de Apple). Si usas Supabase + cuenta (ver
sección 4), tus datos quedan respaldados en la nube y no se pierden aunque esto pase; sin
cuenta, es 100% local a ese "sitio" en tu iPhone, igual que la app nativa lo es al dispositivo.

Pendiente de pulir (no bloqueante): el ícono/manifest de PWA (`public/manifest.json`,
`public/icon-*.png`) ya están listos pero no conectados al `<head>` — conectarlos requiere el
modo `output: "static"` de Expo Router, que por ahora rompe porque el cliente de Supabase se
crea en el arranque del módulo y toca `window` durante el pre-render en Node. Ver el comentario
en `app.config.js` (`web.output`).

## 9. Verificación rápida

```bash
npm run typecheck   # tsc --noEmit
npm run lint
```
