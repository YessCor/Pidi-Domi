-- Ejecutar DESPUÉS de tu schema.sql (ajustes que necesita la app)

-- 1) Realtime para los feeds (domiciliario y pedidos del comercio)
--    (si ya estaba agregada, Postgres avisará; es seguro ignorar el error)
alter publication supabase_realtime add table public.orders;

-- 2) Mantener updated_at automáticamente
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

create trigger orders_touch_updated_at before update on public.orders
  for each row execute function public.touch_updated_at();
create trigger drivers_touch_updated_at before update on public.drivers
  for each row execute function public.touch_updated_at();

-- 3) Permitir borrar imágenes reemplazadas / de productos dados de baja
create policy "Borrar fotos de productos (autenticados)" on storage.objects
  for delete using (bucket_id = 'product-images' and auth.role() = 'authenticated');
create policy "Borrar fotos de tiendas (autenticados)" on storage.objects
  for delete using (bucket_id = 'store-avatars' and auth.role() = 'authenticated');
