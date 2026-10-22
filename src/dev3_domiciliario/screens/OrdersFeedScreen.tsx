import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../services/supabase';
import { Btn, colors, money } from '../../shared/ui';
import { MOCK_ORDERS } from '../../shared/mockData';
import DriverStatusSwitch from '../components/DriverStatusSwitch';
import OrdersBottomSheet from '../components/OrdersBottomSheet';
import type { DriverStatus, OrderWithStore } from '../../../types';

function OrderCard({ o, children }: { o: OrderWithStore; children?: React.ReactNode }) {
  return (
    <View style={s.card}>
      <Text style={s.store}>
        🏪 {o.stores?.name ?? 'Comercio'} · {o.store_status}
      </Text>
      <Text style={s.addr}>📍 {o.delivery_address}</Text>
      <Text style={s.total}>
        {money(o.total)} · envío {money(o.delivery_fee)} · {o.delivery_status}
      </Text>
      {children}
    </View>
  );
}

export default function OrdersFeedScreen() {
  const { user, logout, isMock } = useAuth();
  const [available, setAvailable] = useState<OrderWithStore[]>([]);
  const [active, setActive] = useState<OrderWithStore[]>([]);
  const [driverStatus, setDriverStatus] = useState<DriverStatus>('INACTIVO');
  const [loading, setLoading] = useState(false);
  const sheetRef = useRef<BottomSheet>(null);

  const load = useCallback(async () => {
    if (!user) return;
    if (isMock) {
      setAvailable((cur) =>
        cur.length || active.length
          ? cur
          : MOCK_ORDERS.map((o) => ({
              ...o,
              stores: { name: 'Burger Demo', latitude: o.delivery_latitude, longitude: o.delivery_longitude },
            }))
      );
      return;
    }
    setLoading(true);
    const [a, m, d] = await Promise.all([
      supabase.from('orders').select('*, stores(name, latitude, longitude)').eq('delivery_status', 'SIN_ASIGNAR').order('created_at'),
      supabase.from('orders').select('*, stores(name, latitude, longitude)').eq('driver_id', user.id).in('delivery_status', ['ACEPTADO', 'EN_CAMINO']),
      supabase.from('drivers').select('status').eq('id', user.id).maybeSingle(),
    ]);
    setLoading(false);
    const err = a.error ?? m.error ?? d.error;
    if (err) return Alert.alert('Error', err.message);
    setAvailable((a.data ?? []) as OrderWithStore[]);
    setActive((m.data ?? []) as OrderWithStore[]);
    if (d.data) setDriverStatus(d.data.status as DriverStatus);
  }, [user, isMock, active.length]);

  // Sprint 3 · Realtime: cualquier cambio en 'orders' (nuevo pedido SIN_ASIGNAR, otro repartidor
  // tomándolo, el comercio marcándolo LISTO, etc.) refresca este feed sin recargar la pantalla.
  useEffect(() => {
    load();
    if (isMock) return;
    const ch = supabase
      .channel('driver-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [load, isMock]);

  const updateDriver = async (status: DriverStatus) => {
    setDriverStatus(status);
    if (isMock || !user) return;
    const { error } = await supabase.from('drivers').update({ status }).eq('id', user.id);
    if (error) Alert.alert('Error', error.message);
  };

  const accept = async (o: OrderWithStore) => {
    if (!user) return;
    // Sprint 2 · Bloqueo de UI: no se puede aceptar más de un pedido a la vez.
    if (active.length > 0) return Alert.alert('Ya tienes una entrega en curso', 'Termínala antes de aceptar otra.');
    if (isMock) {
      setAvailable((l) => l.filter((x) => x.id !== o.id));
      setActive([{ ...o, driver_id: user.id, delivery_status: 'ACEPTADO' }]);
      sheetRef.current?.snapToIndex(0);
      return setDriverStatus('OCUPADO');
    }
    // Solo si sigue SIN_ASIGNAR (evita que dos repartidores tomen el mismo pedido)
    const { data, error } = await supabase
      .from('orders')
      .update({ driver_id: user.id, delivery_status: 'ACEPTADO' })
      .eq('id', o.id)
      .eq('delivery_status', 'SIN_ASIGNAR')
      .select('id');
    if (error) return Alert.alert('Error', error.message);
    if (!data?.length) {
      Alert.alert('Pedido no disponible', 'Otro domiciliario lo tomó primero.');
      return load();
    }
    await updateDriver('OCUPADO');
    sheetRef.current?.snapToIndex(0);
    load();
  };

  const advance = async (o: OrderWithStore) => {
    // Sprint 3 · Ciclo de entrega: ACEPTADO -> EN_CAMINO -> ENTREGADO.
    const next = o.delivery_status === 'ACEPTADO' ? 'EN_CAMINO' : 'ENTREGADO';
    if (isMock) {
      if (next === 'ENTREGADO') {
        setActive([]);
        setDriverStatus('DISPONIBLE');
        sheetRef.current?.snapToIndex(1);
      } else setActive([{ ...o, delivery_status: next }]);
      return;
    }
    const { error } = await supabase.from('orders').update({ delivery_status: next }).eq('id', o.id);
    if (error) return Alert.alert('Error', error.message);
    if (next === 'ENTREGADO') {
      await updateDriver('DISPONIBLE');
      sheetRef.current?.snapToIndex(1);
    }
    load();
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Pedidos</Text>
        <Btn title="Salir" variant="outline" onPress={logout} />
      </View>

      <View style={s.statusRow}>
        <DriverStatusSwitch
          value={driverStatus}
          onChange={(next) => updateDriver(next)}
        />
      </View>

      <Text style={s.section}>Mi entrega en curso</Text>
      {active.length === 0 && <Text style={s.empty}>Sin entregas activas.</Text>}
      {active.map((o) => {
        const waitingStore = o.delivery_status === 'ACEPTADO' && o.store_status !== 'LISTO';
        return (
          <OrderCard key={o.id} o={o}>
            {waitingStore && <Text style={s.warn}>Esperando a que el comercio marque el pedido como LISTO…</Text>}
            <Btn
              title={o.delivery_status === 'ACEPTADO' ? 'Recogí la compra → EN CAMINO' : 'Marcar como ENTREGADO'}
              disabled={waitingStore}
              onPress={() => advance(o)}
            />
          </OrderCard>
        );
      })}

      {/* Sprint 2 · Panel deslizable con los pedidos SIN_ASIGNAR */}
      <OrdersBottomSheet
        ref={sheetRef}
        orders={available}
        loading={loading}
        disabled={active.length > 0}
        onRefresh={load}
        onAccept={accept}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 56, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800' },
  statusRow: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginTop: 8 },
  section: { fontWeight: '800', fontSize: 16, marginTop: 12, marginBottom: 6 },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 10, gap: 6 },
  store: { fontWeight: '700' },
  addr: { color: colors.muted },
  total: { color: colors.primary, fontWeight: '700' },
  warn: { color: colors.danger, fontSize: 12 },
  empty: { color: colors.muted },
});
