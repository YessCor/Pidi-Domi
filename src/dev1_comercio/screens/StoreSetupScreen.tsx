import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../context/AuthContext';
import { STORE_BUCKET, supabase, uploadImage } from '../../../services/supabase';
import { Btn, colors } from '../../shared/ui';
import { DEFAULT_COORDS } from '../../shared/config';
import type { Store } from '../../../types';

/** Se muestra una sola vez: el comercio crea su tienda (fila en `stores`). */
export default function StoreSetupScreen({ onCreated }: { onCreated: (s: Store) => void }) {
  const { user, logout } = useAuth();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [lat, setLat] = useState(String(DEFAULT_COORDS.latitude));
  const [lng, setLng] = useState(String(DEFAULT_COORDS.longitude));
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permiso denegado');
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (!res.canceled) setLocalUri(res.assets[0].uri);
  };

  const create = async () => {
    if (!user) return;
    const latitude = Number(lat), longitude = Number(lng);
    if (!name.trim() || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return Alert.alert('Datos inválidos', 'Nombre y coordenadas son obligatorios.');
    }
    setBusy(true);
    try {
      const image_url = localUri ? await uploadImage(localUri, { bucket: STORE_BUCKET, folder: user.id }) : null;
      const { data, error } = await supabase
        .from('stores')
        .insert({ owner_id: user.id, name: name.trim(), category: category.trim() || null, image_url, latitude, longitude })
        .select()
        .single();
      if (error) throw error;
      onCreated(data as Store);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo crear la tienda');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
      <Text style={s.title}>Crea tu comercio 🏪</Text>
      <Text style={s.sub}>Necesitas una tienda para publicar productos.</Text>
      {localUri ? <Image source={{ uri: localUri }} style={s.img} /> : <View style={[s.img, { backgroundColor: colors.border }]} />}
      <Btn title="Elegir logo" variant="outline" onPress={pick} />
      <TextInput style={s.input} placeholder="Nombre del comercio" value={name} onChangeText={setName} />
      <TextInput style={s.input} placeholder="Categoría (ej. Comidas rápidas)" value={category} onChangeText={setCategory} />
      <TextInput style={s.input} placeholder="Latitud" keyboardType="numeric" value={lat} onChangeText={setLat} />
      <TextInput style={s.input} placeholder="Longitud" keyboardType="numeric" value={lng} onChangeText={setLng} />
      <Btn title="Crear comercio" loading={busy} onPress={create} />
      <Btn title="Salir" variant="outline" onPress={logout} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { padding: 24, paddingTop: 70, gap: 12, backgroundColor: colors.bg, flexGrow: 1 },
  title: { fontSize: 26, fontWeight: '800' },
  sub: { color: colors.muted },
  img: { width: 120, height: 120, borderRadius: 16, alignSelf: 'center' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12 },
});
