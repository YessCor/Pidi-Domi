import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { MOCK_PRODUCTS, MOCK_STORE } from '../shared/mockData';
import type { Product, Store } from '../../types';

/** Tiendas activas + productos disponibles (is_available y stock > 0) de la tienda seleccionada. */
export function useStoreCatalog() {
  const { isMock } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const loadStores = useCallback(async () => {
    if (isMock) {
      setStores([MOCK_STORE]);
      setStoreId((cur) => cur ?? MOCK_STORE.id);
      return;
    }
    const { data, error } = await supabase.from('stores').select('*').eq('is_active', true).order('name');
    if (error) return Alert.alert('Error', error.message);
    setStores(data as Store[]);
    setStoreId((cur) => cur ?? (data?.[0]?.id ?? null));
  }, [isMock]);

  const loadProducts = useCallback(async () => {
    if (!storeId) return setProducts([]);
    if (isMock) return setProducts(MOCK_PRODUCTS.filter((p) => p.store_id === storeId));
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_available', true)
      .gt('stock', 0)
      .order('name');
    setLoading(false);
    if (error) return Alert.alert('Error', error.message);
    setProducts(data as Product[]);
  }, [storeId, isMock]);

  useEffect(() => { loadStores(); }, [loadStores]);
  useEffect(() => { loadProducts(); }, [loadProducts]);

  return { stores, storeId, setStoreId, products, loading, reload: loadProducts };
}
