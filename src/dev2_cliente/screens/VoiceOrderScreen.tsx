import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { audioUriToBase64, processVoiceOrder, VoiceOrderResult } from '../../../services/gemini';
import { Btn, colors } from '../../shared/ui';
import { useCart } from '../CartContext';
import { useStoreCatalog } from '../useStoreCatalog';
import StoreChips from '../StoreChips';

export default function VoiceOrderScreen() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const { stores, storeId, setStoreId, products } = useStoreCatalog(); // catálogo de UNA tienda
  const { addWithPrompt } = useCart();
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<VoiceOrderResult | null>(null);

  const start = async () => {
    if (products.length === 0) return Alert.alert('Sin productos', 'Elige una tienda con productos disponibles.');
    const perm = await AudioModule.requestRecordingPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permiso denegado', 'Activa el micrófono para pedir por voz.');
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setResult(null);
    setRecording(true);
  };

  const stop = async () => {
    setRecording(false);
    await recorder.stop();
    const uri = recorder.uri;
    if (!uri) return Alert.alert('Error', 'No se obtuvo el audio');

    setProcessing(true);
    try {
      const base64 = await audioUriToBase64(uri);
      setResult(await processVoiceOrder(base64, products, 'audio/mp4'));
    } catch (e: any) {
      Alert.alert('Error con Gemini', e?.message ?? 'No se pudo procesar el audio');
    } finally {
      setProcessing(false);
    }
  };

  const addAll = () => {
    if (!result) return;
    addWithPrompt(result.items.map((i) => ({ product: i.product, quantity: i.quantity })));
    setResult(null);
  };

  return (
    <ScrollView contentContainerStyle={s.container}>
      <Text style={s.title}>Pedir por voz 🎙️</Text>
      <StoreChips stores={stores} selected={storeId} onSelect={setStoreId} />
      <Text style={s.hint}>Ejemplo: “Quiero dos hamburguesas y una gaseosa”.</Text>

      <Btn
        title={recording ? '⏹ Detener y procesar' : '🎙️ Grabar pedido'}
        variant={recording ? 'danger' : 'primary'}
        loading={processing}
        onPress={recording ? stop : start}
      />

      {result && (
        <View style={s.card}>
          <Text style={s.label}>Entendí:</Text>
          <Text style={s.transcript}>“{result.transcript}”</Text>
          {result.items.map((i) => (
            <Text key={i.product.id} style={s.item}>• {i.quantity} × {i.product.name}</Text>
          ))}
          {result.unmatched.length > 0 && <Text style={s.warn}>No encontré: {result.unmatched.join(', ')}</Text>}
          {result.items.length > 0 && <Btn title="Agregar al carrito" onPress={addAll} style={{ marginTop: 12 }} />}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { padding: 16, paddingTop: 56, gap: 12 },
  title: { fontSize: 24, fontWeight: '800' },
  hint: { color: colors.muted },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, gap: 4 },
  label: { fontWeight: '700' },
  transcript: { fontStyle: 'italic', color: colors.muted, marginBottom: 8 },
  item: { fontSize: 16 },
  warn: { color: colors.danger, marginTop: 8 },
});
