import React, { useState, useCallback, useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Platform } from 'react-native';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { audioUriToBase64, processVoiceOrder, VoiceOrderResult } from '../../../services/gemini';
import { Btn, colors } from '../../shared/ui';
import { useCart } from '../CartContext';
import { useStoreCatalog } from '../useStoreCatalog';
import StoreChips from '../StoreChips';

// MIME types a probar en orden (expo-audio graba m4a/mp4)
const MIME_TYPES = ['audio/mp4', 'audio/m4a', 'audio/aac', 'audio/wav'];

export default function VoiceOrderScreen() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const { stores, storeId, setStoreId, products } = useStoreCatalog();
  const { addWithPrompt } = useCart();
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<VoiceOrderResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Verificar permisos al montar
  useEffect(() => {
    AudioModule.requestRecordingPermissionsAsync().then((perm) => {
      if (!perm.granted) setError('Permiso de micrófono denegado. Actívalo en ajustes para usar pedidos por voz.');
    });
  }, []);

  const start = useCallback(async () => {
    if (products.length === 0) return Alert.alert('Sin productos', 'Elige una tienda con productos disponibles.');
    const perm = await AudioModule.requestRecordingPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permiso denegado', 'Activa el micrófono para pedir por voz.');
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setResult(null);
    setError(null);
    setRecording(true);
  }, [products, recorder]);

  const stop = useCallback(async () => {
    setRecording(false);
    await recorder.stop();
    const uri = recorder.uri;
    if (!uri) return Alert.alert('Error', 'No se obtuvo el audio');

    setProcessing(true);
    setError(null);

    // Intentar con varios MIME types hasta que funcione
    for (const mime of MIME_TYPES) {
      try {
        const base64 = await audioUriToBase64(uri);
        const res = await processVoiceOrder(base64, products, mime);
        setResult(res);
        return; // éxito
      } catch (e: any) {
        const msg = String(e?.message ?? '');
        // Si es error de mime type no soportado, probamos el siguiente
        if (msg.includes('UNSUPPORTED_MEDIA_TYPE') || msg.includes('mime') || msg.includes('format')) {
          continue;
        }
        // Otro error: lo mostramos y paramos
        setError(msg);
        return;
      }
    }
    // Si llegamos aquí, ninguno funcionó
    setError('Formato de audio no soportado. Intenta de nuevo.');
  }, [products, recorder]);

  useEffect(() => {
    if (!recording) return;
    // Safety timeout: detener después de 60s
    const t = setTimeout(() => {
      if (recording) stop();
    }, 60000);
    return () => clearTimeout(t);
  }, [recording, stop]);

  const addAll = useCallback(() => {
    if (!result) return;
    addWithPrompt(result.items.map((i) => ({ product: i.product, quantity: i.quantity })));
    setResult(null);
  }, [result, addWithPrompt]);

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

      {error && <Text style={s.error}>{error}</Text>}

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
  error: { color: colors.danger, marginTop: 8, fontSize: 14 },
});
