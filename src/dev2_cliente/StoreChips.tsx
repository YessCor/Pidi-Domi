import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors } from '../shared/ui';
import type { Store } from '../../types';

export default function StoreChips({ stores, selected, onSelect }: { stores: Store[]; selected: string | null; onSelect: (id: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 8 }} contentContainerStyle={{ gap: 8 }}>
      {stores.map((st) => (
        <Pressable key={st.id} onPress={() => onSelect(st.id)} style={[s.chip, selected === st.id && s.on]}>
          <Text style={[s.text, selected === st.id && { color: '#fff' }]}>{st.name}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.primary },
  on: { backgroundColor: colors.primary },
  text: { color: colors.primary, fontWeight: '700' },
});
