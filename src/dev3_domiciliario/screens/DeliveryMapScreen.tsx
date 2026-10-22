import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../services/supabase';
import { colors } from '../../shared/ui';
import { DEFAULT_COORDS } from '../../shared/config';
import type { OrderWithStore } from '../../../types';

type Pt = { latitude: number; longitude: number };
const STEPS = 60;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const off = (p: Pt, d: number): Pt => ({ latitude: p.latitude - d, longitude: p.longitude - d });

// Ruta demo si no hay un pedido activo
const DEMO_STORE: Pt = DEFAULT_COORDS;
const DEMO_CUSTOMER: Pt = { latitude: DEFAULT_COORDS.latitude + 0.012, longitude: DEFAULT_COORDS.longitude + 0.01 };

/** Mapa ficticio: simula al domiciliario moviéndose hacia la tienda (ACEPTADO) o hacia el cliente (EN_CAMINO). */
export default function DeliveryMapScreen() {
  const { user, isMock } = useAuth();
  const [order, setOrder] = useState<OrderWithStore | null>(null);
  const [t, setT] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!user || isMock) return;
      supabase
        .from('orders')
        .select('*, stores(name, latitude, longitude)')
        .eq('driver_id', user.id)
        .in('delivery_status', ['ACEPTADO', 'EN_CAMINO'])
        .limit(1)
        .maybeSingle()
        .then(({ data }) => { setOrder((data as OrderWithStore) ?? null); setT(0); });
    }, [user, isMock])
  );

  useEffect(() => {
    const id = setInterval(() => setT((p) => (p >= STEPS ? 0 : p + 1)), 500);
    return () => clearInterval(id);
  }, []);

  const store: Pt = order?.stores ? { latitude: order.stores.latitude, longitude: order.stores.longitude } : DEMO_STORE;
  const customer: Pt = order ? { latitude: order.delivery_latitude, longitude: order.delivery_longitude } : DEMO_CUSTOMER;
  const toStore = order?.delivery_status === 'ACEPTADO';
  const from = toStore ? off(store, 0.01) : store;
  const to = toStore ? store : customer;
  const driver: Pt = { latitude: lerp(from.latitude, to.latitude, t / STEPS), longitude: lerp(from.longitude, to.longitude, t / STEPS) };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        key={order?.id ?? 'demo'}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: (store.latitude + customer.latitude) / 2,
          longitude: (store.longitude + customer.longitude) / 2,
          latitudeDelta: Math.max(0.03, Math.abs(store.latitude - customer.latitude) * 2.5),
          longitudeDelta: Math.max(0.03, Math.abs(store.longitude - customer.longitude) * 2.5),
        }}
      >
        <Marker coordinate={store} title="Comercio" pinColor="orange" />
        <Marker coordinate={customer} title="Cliente" pinColor="green" />
        <Marker coordinate={driver} title="Tú 🛵" pinColor="blue" />
        <Polyline coordinates={[from, to]} strokeColor={colors.primary} strokeWidth={3} />
      </MapView>
      <View style={s.badge}>
        <Text style={s.badgeText}>
          {order ? (toStore ? 'Hacia el comercio' : 'Hacia el cliente') : 'Ruta demo'} · simulado {Math.round((t / STEPS) * 100)}%
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  badge: { position: 'absolute', top: 56, alignSelf: 'center', backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, elevation: 4 },
  badgeText: { fontWeight: '700' },
});
