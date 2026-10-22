import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

export const colors = {
  primary: '#FF5A1F',
  dark: '#1F2937',
  muted: '#6B7280',
  bg: '#F9FAFB',
  card: '#FFFFFF',
  border: '#E5E7EB',
  danger: '#DC2626',
  ok: '#16A34A',
};

interface BtnProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Btn({ title, onPress, variant = 'primary', loading, disabled, style }: BtnProps) {
  const bg = variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : 'transparent';
  const fg = variant === 'outline' ? colors.primary : '#fff';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        s.btn,
        { backgroundColor: bg, borderColor: colors.primary, borderWidth: variant === 'outline' ? 1.5 : 0 },
        (disabled || loading) && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[s.btnText, { color: fg }]}>{title}</Text>}
    </Pressable>
  );
}

export const money = (n: number) => `$${Number(n).toLocaleString('es-CO')}`;

const s = StyleSheet.create({
  btn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center' },
  btnText: { fontWeight: '700', fontSize: 15 },
});
