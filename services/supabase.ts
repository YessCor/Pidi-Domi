import 'react-native-url-polyfill/auto';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const STORAGE_BUCKET = process.env.EXPO_PUBLIC_STORAGE_BUCKET ?? 'product-images'; // fotos de productos
export const STORE_BUCKET = process.env.EXPO_PUBLIC_STORE_BUCKET ?? 'store-avatars'; // fotos de tiendas

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[supabase] Faltan EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY en .env. ' +
      'Las llamadas reales fallarán (usa EXPO_PUBLIC_USE_MOCK_AUTH=true para trabajar sin backend).'
  );
}

export const supabase = createClient(
  // Placeholders para que createClient no lance excepción al arrancar sin .env
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Refresca el token solo cuando la app está en primer plano
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
};

/**
 * Sube una imagen local (URI de expo-image-picker) a un bucket PÚBLICO de Supabase Storage.
 * Convierte la URI a ArrayBuffer (funciona en iOS, Android y Web) y devuelve la URL pública.
 */
export async function uploadImage(
  uri: string,
  opts: { bucket?: string; folder?: string } = {}
): Promise<string> {
  const bucket = opts.bucket ?? STORAGE_BUCKET;
  const folder = opts.folder ?? 'uploads';

  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();

  const ext = (uri.split('?')[0].split('.').pop() ?? 'jpg').toLowerCase();
  const contentType = MIME_BY_EXT[ext] ?? 'image/jpeg';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, arrayBuffer, { contentType, upsert: false });
  if (error) throw error;

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/** Borra una imagen a partir de su URL pública (útil al eliminar/modificar un producto). */
export async function deleteImageByUrl(publicUrl: string, bucket = STORAGE_BUCKET) {
  const marker = `/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;
  const path = decodeURIComponent(publicUrl.slice(idx + marker.length));
  await supabase.storage.from(bucket).remove([path]);
}
