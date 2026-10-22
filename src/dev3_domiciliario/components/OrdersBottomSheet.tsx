import React, { forwardRef, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { Btn, colors, money } from '../../shared/ui';
import type { OrderWithStore } from '../../../types';

type Props = {
  orders: OrderWithStore[];
  loading: boolean;
  disabled?: boolean;
  onRefresh: () => void;
  onAccept: (o: OrderWithStore) => void;
};

/**
 * Sprint 2 · Panel deslizable (Bottom Sheet) con los pedidos en estado SIN_ASIGNAR.
 * Se superpone al mapa/feed y el repartidor puede arrastrarlo entre 3 posiciones (snap points).
 */
const OrdersBottomSheet = forwardRef<BottomSheet, Props>(
  ({ orders, loading, disabled, onRefresh, onAccept }, ref) => {
    const snapPoints = useMemo(() => ['16%', '48%', '85%'], []);

    return (
      <BottomSheet ref={ref} index={1} snapPoints={snapPoints} enablePanDownToClose={false}>
        <View style={s.header}>
          <Text style={s.title}>Pedidos disponibles</Text>
          <Text style={s.count}>{orders.length}</Text>
        </View>
        {disabled && (
          <Text style={s.warn}>Tienes una entrega en curso. Termínala para aceptar otra.</Text>
        )}
        <BottomSheetFlatList
          data={orders}
          keyExtractor={(o) => o.id}
          refreshing={loading}
          onRefresh={onRefresh}
          contentContainerStyle={s.list}
          ListEmptyComponent={<Text style={s.empty}>No hay pedidos disponibles por ahora.</Text>}
          renderItem={({ item }) => (
            <View style={s.card}>
              <Text style={s.store}>🏪 {item.stores?.name ?? 'Comercio'}</Text>
              <Text style={s.addr}>📍 {item.delivery_address}</Text>
              <Text style={s.total}>
                {money(item.total)} · envío {money(item.delivery_fee)}
              </Text>
              <Btn title="Aceptar pedido" disabled={disabled} onPress={() => onAccept(item)} />
            </View>
          )}
        />
      </BottomSheet>
    );
  }
);

export default OrdersBottomSheet;

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  title: { fontWeight: '800', fontSize: 16 },
  count: { color: colors.muted, fontWeight: '700' },
  warn: { color: colors.danger, fontSize: 12, paddingHorizontal: 16, paddingBottom: 6 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 12, gap: 6, borderWidth: 1, borderColor: '#eee' },
  store: { fontWeight: '700' },
  addr: { color: colors.muted },
  total: { color: colors.primary, fontWeight: '700' },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 24 },
});
