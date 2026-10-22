import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../services/supabase';
import { Btn, colors, money } from '../../shared/ui';
import { DELIVERY_FEE, fakeDeliveryCoords } from '../../shared/config';
import { useCart } from '../CartContext';

export default function CartScreen() {
  const { items, storeId, subtotal, setQuantity, clear } = useCart();
  const { user, isMock } = useAuth();
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const total = items.length ? subtotal + DELIVERY_FEE : 0;

  const placeOrder = async () => {
    if (!user || !storeId || items.length === 0) return;
    if (!address.trim()) return Alert.alert('Falta la dirección de entrega');
    if (isMock) {
      clear();
      return Alert.alert('Pedido simulado ✅', 'En modo mock no se guarda en Supabase.');
    }
    setBusy(true);
    let orderId: string | null = null;
    try {
      const coords = fakeDeliveryCoords(); // TODO: reemplazar por ubicación real (expo-location)
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          client_id: user.id,
          store_id: storeId,
          subtotal,
          delivery_fee: DELIVERY_FEE,
          total,
          delivery_latitude: coords.latitude,
          delivery_longitude: coords.longitude,
          delivery_address: address.trim(),
        })
        .select()
        .single();
      if (error) throw error;
      orderId = order.id;

      // El trigger decrease_product_stock descuenta el stock; si no alcanza, el CHECK (stock >= 0) falla
      const { error: itemsError } = await supabase.from('order_items').insert(
        items.map((i) => ({
          order_id: order.id,
          product_id: i.product.id,
          quantity: i.quantity,
          unit_price: i.product.price,
          subtotal: i.product.price * i.quantity,
        }))
      );
      if (itemsError) throw itemsError;

      clear();
      setAddress('');
      Alert.alert('¡Pedido enviado!', 'El comercio lo preparará y un domiciliario lo recogerá.');
    } catch (e: any) {
      // Evita pedidos huérfanos si falló el detalle (p. ej. stock insuficiente)
      if (orderId) await supabase.from('orders').delete().eq('id', orderId);
      const msg = String(e?.message ?? '');
      Alert.alert('No se pudo crear el pedido', /stock/i.test(msg) ? 'Stock insuficiente para algún producto. Actualiza el catálogo.' : msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Carrito</Text>
      <FlatList
        data={items}
        keyExtractor={(i) => i.product.id}
        ListEmptyComponent={<Text style={s.empty}>Tu carrito está vacío.</Text>}
        renderItem={({ item }) => (
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{item.product.name}</Text>
              <Text style={s.price}>{money(item.product.price * item.quantity)}</Text>
            </View>
            <Btn title="−" variant="outline" onPress={() => setQuantity(item.product.id, item.quantity - 1)} />
            <Text style={s.qty}>{item.quantity}</Text>
            <Btn title="+" variant="outline" onPress={() => setQuantity(item.product.id, item.quantity + 1)} />
          </View>
        )}
      />
      <TextInput style={s.input} placeholder="Dirección de entrega" value={address} onChangeText={setAddress} />
      <Text style={s.line}>Subtotal: {money(subtotal)}</Text>
      <Text style={s.line}>Domicilio: {money(items.length ? DELIVERY_FEE : 0)}</Text>
      <Text style={s.total}>Total: {money(total)}</Text>
      <Btn title="Confirmar pedido" loading={busy} disabled={items.length === 0} onPress={placeOrder} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 56, backgroundColor: colors.bg, gap: 6 },
  title: { fontSize: 24, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 8 },
  name: { fontWeight: '700' },
  price: { color: colors.primary },
  qty: { minWidth: 24, textAlign: 'center', fontWeight: '700' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12 },
  line: { textAlign: 'right', color: colors.muted },
  total: { fontSize: 18, fontWeight: '800', textAlign: 'right' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
});
