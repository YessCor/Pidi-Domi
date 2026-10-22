import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { Btn, colors } from '../../shared/ui';
import type { Role } from '../../../types';

const ROLES: Role[] = ['CLIENTE', 'COMERCIO', 'DOMICILIARIO'];

export default function AuthScreen() {
  const { login, register, mockLogin, mockRegister, isMock } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<Role>('CLIENTE');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email || !password) return Alert.alert('Completa correo y contraseña');
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        const { needsEmailConfirmation } = await register({ email, password, fullName, role });
        if (needsEmailConfirmation) Alert.alert('Revisa tu correo', 'Confirma tu cuenta para iniciar sesión.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Algo salió mal');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
      <Text style={s.title}>Domicilios 🛵</Text>
      <Text style={s.sub}>{mode === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}</Text>

      {isMock && (
        <View style={s.mockBox}>
          <Text style={s.mockTitle}>Modo MOCK activo — entrar directo como:</Text>
          {ROLES.map((r) => (
            <Btn key={r} title={r} variant="outline" onPress={() => mockLogin(r)} style={{ marginTop: 8 }} />
          ))}
        </View>
      )}

      {mode === 'register' && (
        <>
          <TextInput style={s.input} placeholder="Nombre completo" value={fullName} onChangeText={setFullName} />
          <View style={s.roles}>
            {ROLES.map((r) => (
              <Pressable key={r} onPress={() => setRole(r)} style={[s.chip, role === r && s.chipOn]}>
                <Text style={[s.chipText, role === r && { color: '#fff' }]}>{r}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
      <TextInput style={s.input} placeholder="Correo" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={s.input} placeholder="Contraseña" secureTextEntry value={password} onChangeText={setPassword} />

      <Btn
        title={mode === 'login' ? 'Entrar' : 'Registrarme'}
        loading={busy}
        onPress={() => {
          if (isMock) {
            if (mode === 'register') mockRegister(fullName, role);
            else Alert.alert('Modo mock', 'Usa los botones de arriba o desactiva EXPO_PUBLIC_USE_MOCK_AUTH.');
            return;
          }
          submit();
        }}
      />
      <Pressable onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
        <Text style={s.link}>{mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { padding: 24, paddingTop: 80, gap: 12, backgroundColor: colors.bg, flexGrow: 1 },
  title: { fontSize: 32, fontWeight: '800', color: colors.primary },
  sub: { fontSize: 16, color: colors.muted, marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12 },
  roles: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: colors.primary },
  chipOn: { backgroundColor: colors.primary },
  chipText: { color: colors.primary, fontWeight: '600', fontSize: 12 },
  link: { color: colors.primary, textAlign: 'center', marginTop: 12 },
  mockBox: { backgroundColor: '#FFF7ED', padding: 12, borderRadius: 10, marginBottom: 8 },
  mockTitle: { fontWeight: '700', color: colors.dark },
});
