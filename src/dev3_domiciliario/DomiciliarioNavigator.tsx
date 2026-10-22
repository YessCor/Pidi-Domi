import React from 'react';
import { Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import OrdersFeedScreen from './screens/OrdersFeedScreen';
import DeliveryMapScreen from './screens/DeliveryMapScreen';

const Tab = createBottomTabNavigator();

// Nota: el Bottom Sheet del feed (Sprint 2) depende de react-native-gesture-handler,
// por eso este navigator queda envuelto en GestureHandlerRootView. Si el proyecto ya
// envuelve <App /> con GestureHandlerRootView más arriba, este wrapper extra es inofensivo.
export default function DomiciliarioNavigator() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen name="Feed" component={OrdersFeedScreen} options={{ tabBarLabel: 'Pedidos', tabBarIcon: () => <Text>📦</Text> }} />
        <Tab.Screen name="Mapa" component={DeliveryMapScreen} options={{ tabBarLabel: 'Home', tabBarIcon: () => <Text>🗺️</Text> }} />
      </Tab.Navigator>
    </GestureHandlerRootView>
  );
}
