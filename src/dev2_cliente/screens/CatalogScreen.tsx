import React, { useCallback } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Btn, colors, money } from '../../shared/ui';
import { useCart } from '../CartContext';
import { useStoreCatalog } from '../useStoreCatalog';
import StoreChips from '../StoreChips';
import { useAuth } from '../../../context/AuthContext';

export default function CatalogScreen() {
  const { stores, storeId, setStoreId, products, loading, reload, error } = useStoreCatalog();
  const { addWithPrompt } = useCart();
  const { logout } = useAuth();

  const onRefresh = useCallback(() => {
    reload();
  }, [reload]);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Catálogo</Text>
        <Btn title="Salir" variant="outline" onPress={logout} />
      </View>
      <StoreChips stores={stores} selected={storeId} onSelect={setStoreId} />
      {error && <Text style={s.error}>Error: {error} — Tira para reintentar</Text>}
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        refreshing={loading}
        onRefresh={onRefresh}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={s.empty}>No hay productos disponibles en esta tienda.</Text>}
        renderItem={({ item }) => (
          <View style={[s.card, !item.is_available && s.unavailable]}>
            {item.image_url ? <Image source={{ uri: item.image_url }} style={s.img} /> : <View style={[s.img, { backgroundColor: colors.border }]} />}
            <View style={{ flex: 1 }}>
              <Text style={[s.name, !item.is_available && s.nameUnavailable]}>{item.name} {!item.is_available && '(No disponible)'}</Text>
              {!!item.description && <Text style={s.desc}>{item.description}</Text>}
              <Text style={s.price}>{money(item.price)} <Text style={s.stock}>· {item.stock} disp.</Text></Text>
              <Btn
                title="Agregar"
                disabled={item.stock <= 0 || !item.is_available}
                onPress={() => addWithPrompt([{ product: item, quantity: 1 }])}
              />
            </View>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 56, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '800' },
  card: { flexDirection: 'row', gap: 12, backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 10 },
  unavailable: { opacity: 0.6, backgroundColor: '#fafafa' },
  img: { width: 84, height: 84, borderRadius: 10 },
  name: { fontWeight: '700', fontSize: 16 },
  nameUnavailable: { textDecorationLine: 'line-through', color: colors.muted },
  desc: { color: colors.muted, fontSize: 12 },
  price: { color: colors.primary, fontWeight: '700', marginVertical: 4 },
  stock: { color: colors.muted, fontWeight: '400', fontSize: 12 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
  error: { color: colors.danger, textAlign: 'center', marginBottom: 8, fontSize: 14 },
});
