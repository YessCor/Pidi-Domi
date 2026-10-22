import React from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { Btn, colors, money } from '../../shared/ui';
import { useCart } from '../CartContext';
import { useStoreCatalog } from '../useStoreCatalog';
import StoreChips from '../StoreChips';
import { useAuth } from '../../../context/AuthContext';

export default function CatalogScreen() {
  const { stores, storeId, setStoreId, products, loading, reload } = useStoreCatalog();
  const { addWithPrompt } = useCart();
  const { logout } = useAuth();

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Catálogo</Text>
        <Btn title="Salir" variant="outline" onPress={logout} />
      </View>
      <StoreChips stores={stores} selected={storeId} onSelect={setStoreId} />
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        refreshing={loading}
        onRefresh={reload}
        ListEmptyComponent={<Text style={s.empty}>No hay productos disponibles.</Text>}
        renderItem={({ item }) => (
          <View style={s.card}>
            {item.image_url ? <Image source={{ uri: item.image_url }} style={s.img} /> : <View style={[s.img, { backgroundColor: colors.border }]} />}
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{item.name}</Text>
              {!!item.description && <Text style={s.desc}>{item.description}</Text>}
              <Text style={s.price}>{money(item.price)} <Text style={s.stock}>· {item.stock} disp.</Text></Text>
              <Btn title="Agregar" onPress={() => addWithPrompt([{ product: item, quantity: 1 }])} />
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
  img: { width: 84, height: 84, borderRadius: 10 },
  name: { fontWeight: '700', fontSize: 16 },
  desc: { color: colors.muted, fontSize: 12 },
  price: { color: colors.primary, fontWeight: '700', marginVertical: 4 },
  stock: { color: colors.muted, fontWeight: '400', fontSize: 12 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
});
