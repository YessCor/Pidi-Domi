import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../shared/ui';
import type { DriverStatus } from '../../../types';

const OPTIONS: { value: DriverStatus; label: string; color: string }[] = [
  { value: 'DISPONIBLE', label: 'Disponible', color: colors.primary ?? '#2e7d32' },
  { value: 'OCUPADO', label: 'Ocupado', color: '#f59e0b' },
  { value: 'INACTIVO', label: 'Inactivo', color: colors.muted ?? '#9ca3af' },
];

type Props = {
  value: DriverStatus;
  onChange: (status: DriverStatus) => void;
};

/**
 * Sprint 1 · Switch de estado del repartidor: DISPONIBLE / OCUPADO / INACTIVO.
 * OCUPADO se asigna automáticamente al aceptar un pedido (ver OrdersFeedScreen -> accept())
 * y al marcarlo ENTREGADO vuelve a DISPONIBLE, por lo que no es seleccionable a mano aquí;
 * el repartidor solo alterna manualmente entre DISPONIBLE e INACTIVO.
 */
export default function DriverStatusSwitch({ value, onChange }: Props) {
  return (
    <View style={s.track}>
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        const disabled = opt.value === 'OCUPADO';
        return (
          <Pressable
            key={opt.value}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled }}
            onPress={() => !disabled && onChange(opt.value)}
            style={[s.option, active && { backgroundColor: opt.color }, disabled && s.disabled]}
          >
            <Text style={[s.label, active && s.labelActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  track: { flexDirection: 'row', backgroundColor: '#eee', borderRadius: 20, padding: 3, gap: 3 },
  option: { flex: 1, paddingVertical: 6, borderRadius: 18, alignItems: 'center' },
  disabled: { opacity: 0.6 },
  label: { fontSize: 12, fontWeight: '700', color: '#555' },
  labelActive: { color: '#fff' },
});
