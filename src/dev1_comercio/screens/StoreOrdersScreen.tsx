import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../services/supabase';
import { Btn, colors, money } from '../../shared/ui';
import { MOCK_ORDERS } from '../../shared/mockData';
import type { StoreOrderStatus } from '../../../types';
import { useStore } from '../StoreContext';

const NEXT: Partial<Record<StoreOrderStatus, { to: StoreOrderStatus; label: string }>> = {
  PENDIENTE: { to: 'EN_PREPARACION', label: 'Empezar a preparar' },
  EN_PREPARACION: { to: 'LISTO', label: 'Marcar como LISTO' },
};

/** Pedidos del comercio: avanza store_status (PENDIENTE -> EN_PREPARACION -> LISTO). */
export default function StoreOrdersScreen() {
  const store = useStore();
  const { isMock } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (isMock) {
      setOrders((cur) => (cur.length ? cur : MOCK_ORDERS.map((o) => ({ ...o, order_items: [{ quantity: 2, products: { name: 'Hamburguesa clásica' } }] }))));
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(quantity, products(name))')
      .eq('store_id', store.id)
      .not('delivery_status', 'in', '(ENTREGADO,CANCELADO)')
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) return Alert.alert('Error', error.message);
    setOrders(data ?? []);
  }, [store.id, isMock]);

  useEffect(() => {
    load();
    if (isMock) return;
    const ch = supabase
      .channel(`store-orders-${store.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `store_id=eq.${store.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, isMock, store.id]);

  const advance = async (id: string, to: StoreOrderStatus) => {
    if (isMock) return setOrders((l) => l.map((o) => (o.id === id ? { ...o, store_status: to } : o)));
    const { error } = await supabase.from('orders').update({ store_status: to }).eq('id', id);
    if (error) return Alert.alert('Error', error.message);
    load();
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Pedidos</Text>
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={<Text style={s.empty}>No hay pedidos activos.</Text>}
        renderItem={({ item }) => {
          const next = NEXT[item.store_status as StoreOrderStatus];
          return (
            <View style={s.card}>
              <Text style={s.status}>{item.store_status} · envío: {item.delivery_status}</Text>
              {(item.order_items ?? []).map((i: any, idx: number) => (
                <Text key={idx}>• {i.quantity} × {i.products?.name ?? 'Producto'}</Text>
              ))}
              <Text style={s.addr}>📍 {item.delivery_address}</Text>
              <Text style={s.total}>{money(item.total)}</Text>
              {next && <Btn title={next.label} onPress={() => advance(item.id, next.to)} />}
            </View>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 56, backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 10, gap: 4 },
  status: { fontWeight: '800', color: colors.primary },
  addr: { color: colors.muted },
  total: { fontWeight: '700' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
});
