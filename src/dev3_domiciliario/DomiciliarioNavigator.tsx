import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import OrdersFeedScreen from './screens/OrdersFeedScreen';
import DeliveryMapScreen from './screens/DeliveryMapScreen';

const Tab = createBottomTabNavigator();

export default function DomiciliarioNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Feed" component={OrdersFeedScreen} options={{ tabBarLabel: 'Pedidos', tabBarIcon: () => <Text>📦</Text> }} />
      <Tab.Screen name="Mapa" component={DeliveryMapScreen} options={{ tabBarIcon: () => <Text>🗺️</Text> }} />
    </Tab.Navigator>
  );
}
