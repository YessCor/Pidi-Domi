import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { deleteImageByUrl, supabase, uploadImage } from '../../../services/supabase';
import { Btn, colors } from '../../shared/ui';
import { useStore } from '../StoreContext';
import type { ComercioStackParams } from '../ComercioNavigator';

type Props = NativeStackScreenProps<ComercioStackParams, 'ProductForm'>;

export default function ProductFormScreen({ route, navigation }: Props) {
  const editing = route.params?.product;
  const store = useStore();
  const [name, setName] = useState(editing?.name ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [price, setPrice] = useState(editing ? String(editing.price) : '');
  const [stock, setStock] = useState(editing ? String(editing.stock) : '0');
  const [isAvailable, setIsAvailable] = useState(editing?.is_available ?? true);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería.');
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (!res.canceled) setLocalUri(res.assets[0].uri);
  };

  const save = async () => {
    const priceNum = Number(price.replace(',', '.'));
    const stockNum = parseInt(stock, 10);
    if (!name.trim() || !Number.isFinite(priceNum) || priceNum < 0 || !Number.isInteger(stockNum) || stockNum < 0) {
      return Alert.alert('Datos inválidos', 'Nombre, precio (>= 0) y stock (entero >= 0) son obligatorios.');
    }
    setBusy(true);
    try {
      let image_url = editing?.image_url ?? null;
      if (localUri) {
        image_url = await uploadImage(localUri, { folder: store.id }); // bucket product-images
        if (editing?.image_url) deleteImageByUrl(editing.image_url).catch(() => {});
      }
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        price: priceNum,
        stock: stockNum,
        is_available: isAvailable,
        image_url,
      };
      const { error } = editing
        ? await supabase.from('products').update(payload).eq('id', editing.id)
        : await supabase.from('products').insert({ ...payload, store_id: store.id });
      if (error) throw error;
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo guardar');
    } finally {
      setBusy(false);
    }
  };

  const preview = localUri ?? editing?.image_url ?? null;

  return (
    <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
      {preview ? <Image source={{ uri: preview }} style={s.preview} /> : <View style={[s.preview, { backgroundColor: colors.border }]} />}
      <Btn title={preview ? 'Cambiar imagen' : 'Elegir imagen'} variant="outline" onPress={pickImage} />
      <TextInput style={s.input} placeholder="Nombre" value={name} onChangeText={setName} />
      <TextInput style={[s.input, { height: 80 }]} placeholder="Descripción" multiline value={description} onChangeText={setDescription} />
      <TextInput style={s.input} placeholder="Precio (COP)" keyboardType="numeric" value={price} onChangeText={setPrice} />
      <TextInput style={s.input} placeholder="Stock (unidades)" keyboardType="number-pad" value={stock} onChangeText={setStock} />
      <View style={s.switchRow}>
        <Text>Disponible en el catálogo</Text>
        <Switch value={isAvailable} onValueChange={setIsAvailable} />
      </View>
      <Btn title={editing ? 'Guardar cambios' : 'Crear producto'} loading={busy} onPress={save} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  preview: { width: '100%', height: 200, borderRadius: 12 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
