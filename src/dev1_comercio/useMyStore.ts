import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { MOCK_STORE } from '../shared/mockData';
import type { Store } from '../../types';

/** Carga la tienda del usuario COMERCIO (stores.owner_id = auth.uid()). */
export function useMyStore() {
  const { user, isMock } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    if (isMock) {
      setStore(MOCK_STORE);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.from('stores').select('*').eq('owner_id', user.id).limit(1).maybeSingle();
    if (error) Alert.alert('Error', error.message);
    setStore((data as Store) ?? null);
    setLoading(false);
  }, [user, isMock]);

  useEffect(() => { load(); }, [load]);

  return { store, loading, setStore, reload: load };
}
