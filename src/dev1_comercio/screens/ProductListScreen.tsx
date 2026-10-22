import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../../context/AuthContext';
import { deleteImageByUrl, supabase } from '../../../services/supabase';
import { Btn, colors, money } from '../../shared/ui';
import { MOCK_PRODUCTS } from '../../shared/mockData';
import type { Product } from '../../../types';
import { useStore } from '../StoreContext';
import type { ComercioStackParams } from '../ComercioNavigator';

export default function ProductListScreen() {
  const nav = useNavigation<NativeStackNavigationProp<ComercioStackParams>>();
  const store = useStore();
  const { logout, isMock } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (isMock) return setProducts(MOCK_PRODUCTS);
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) return Alert.alert('Error', error.message);
    setProducts(data as Product[]);
  }, [store.id, isMock]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remove = (p: Product) =>
    Alert.alert('Dar de baja', `¿Eliminar "${p.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('products').delete().eq('id', p.id);
          if (error) {
            // 23503 = FK violation: el producto ya fue pedido (order_items) -> baja lógica
            if (error.code === '23503') {
              const { error: e2 } = await supabase.from('products').update({ is_available: false }).eq('id', p.id);
              if (e2) return Alert.alert('Error', e2.message);
              Alert.alert('Producto desactivado', 'Ya tiene pedidos asociados, así que se ocultó del catálogo en vez de borrarse.');
              return load();
            }
            return Alert.alert('Error', error.message);
          }
          if (p.image_url) deleteImageByUrl(p.image_url).catch(() => {});
          load();
        },
      },
    ]);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>{store.name}</Text>
        <Btn title="Salir" variant="outline" onPress={logout} />
      </View>
      <Btn title="+ Nuevo producto" onPress={() => nav.navigate('ProductForm', {})} style={{ marginBottom: 12 }} />
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={<Text style={s.empty}>Aún no tienes productos.</Text>}
        renderItem={({ item }) => (
          <View style={[s.card, !item.is_available && { opacity: 0.55 }]}>
            {item.image_url ? <Image source={{ uri: item.image_url }} style={s.img} /> : <View style={[s.img, { backgroundColor: colors.border }]} />}
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{item.name}</Text>
              <Text style={s.price}>{money(item.price)} · stock {item.stock}{!item.is_available ? ' · oculto' : ''}</Text>
              <View style={s.row}>
                <Btn title="Editar" variant="outline" onPress={() => nav.navigate('ProductForm', { product: item })} />
                <Btn title="Baja" variant="danger" onPress={() => remove(item)} />
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.bg, paddingTop: 56 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', flex: 1 },
  row: { flexDirection: 'row', gap: 8 },
  card: { flexDirection: 'row', gap: 12, backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 10 },
  img: { width: 84, height: 84, borderRadius: 10 },
  name: { fontWeight: '700', fontSize: 16 },
  price: { color: colors.primary, fontWeight: '700', marginBottom: 6 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
});
