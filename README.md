# Domicilios — Expo + Supabase + Gemini

## Puesta en marcha
```bash
npx create-expo-app@latest domicilios --template blank-typescript
cd domicilios
# copia encima los archivos de este zip (sobrescribe App.tsx, app.json, tsconfig.json)
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill \
  expo-image-picker expo-audio react-native-maps expo-status-bar \
  @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs \
  react-native-screens react-native-safe-area-context
cp .env.example .env   # y completa las llaves
npx expo start -c
```

## Variables (.env)
| Variable | Descripción |
|---|---|
| EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY | Project Settings > API |
| EXPO_PUBLIC_STORAGE_BUCKET / _STORE_BUCKET | Buckets públicos (`product-images`, `store-avatars`) |
| EXPO_PUBLIC_GEMINI_API_KEY | https://aistudio.google.com/apikey |
| EXPO_PUBLIC_GEMINI_MODEL | `gemini-2.5-flash` |
| EXPO_PUBLIC_USE_MOCK_AUTH | `true` = entrar como cualquier rol sin backend |

⚠️ Todo `EXPO_PUBLIC_*` viaja dentro del bundle. Para producción mueve la llamada a Gemini a una Supabase Edge Function.

## Backend
1. Ejecuta **tu `schema.sql`** (el del equipo) en el SQL Editor de Supabase.
2. Ejecuta después `supabase/patch.sql` (realtime, `updated_at`, políticas de borrado de imágenes).

### Flujo de un pedido
`CLIENTE` crea pedido (`PENDIENTE` / `SIN_ASIGNAR`) → `COMERCIO` pasa `store_status` a `EN_PREPARACION` y `LISTO`
→ `DOMICILIARIO` acepta (`ACEPTADO`), recoge cuando el comercio está `LISTO` (`EN_CAMINO`) y entrega (`ENTREGADO`).
El stock se descuenta por el trigger `decrease_product_stock` (no se restaura al cancelar).

## Ownership (evita conflictos en Git)
- Dev1 → `src/dev1_comercio/`
- Dev2 → `src/dev2_cliente/`
- Dev3 → `src/dev3_domiciliario/`
- Compartido (cambios por PR con revisión): `services/`, `context/`, `types/`, `src/shared/`, `App.tsx`

## Notas
- `react-native-maps` funciona en Expo Go; para Google Maps en producción necesitas API key y development build.
- Si Gemini rechaza el audio, prueba el mime `audio/aac` en `VoiceOrderScreen`.
