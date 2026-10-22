import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CartProvider, useCart } from './CartContext';
import CatalogScreen from './screens/CatalogScreen';
import VoiceOrderScreen from './screens/VoiceOrderScreen';
import CartScreen from './screens/CartScreen';

const Tab = createBottomTabNavigator();

function Tabs() {
  const { count } = useCart();
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Catalogo" component={CatalogScreen} options={{ tabBarLabel: 'Catálogo', tabBarIcon: () => <Text>🍔</Text> }} />
      <Tab.Screen name="Voz" component={VoiceOrderScreen} options={{ tabBarLabel: 'Por voz', tabBarIcon: () => <Text>🎙️</Text> }} />
      <Tab.Screen
        name="Carrito"
        component={CartScreen}
        options={{ tabBarIcon: () => <Text>🛒</Text>, tabBarBadge: count > 0 ? count : undefined }}
      />
    </Tab.Navigator>
  );
}

export default function ClienteNavigator() {
  return (
    <CartProvider>
      <Tabs />
    </CartProvider>
  );
}
