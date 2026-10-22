import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ProductListScreen from './screens/ProductListScreen';
import ProductFormScreen from './screens/ProductFormScreen';
import StoreOrdersScreen from './screens/StoreOrdersScreen';
import StoreSetupScreen from './screens/StoreSetupScreen';
import { StoreContext } from './StoreContext';
import { useMyStore } from './useMyStore';
import type { Product } from '../../types';

export type ComercioStackParams = {
  Main: undefined;
  ProductForm: { product?: Product };
};

const Stack = createNativeStackNavigator<ComercioStackParams>();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Productos" component={ProductListScreen} options={{ tabBarIcon: () => <Text>🛍️</Text> }} />
      <Tab.Screen name="Pedidos" component={StoreOrdersScreen} options={{ tabBarIcon: () => <Text>🧾</Text> }} />
    </Tab.Navigator>
  );
}

export default function ComercioNavigator() {
  const { store, loading, setStore } = useMyStore();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (!store) return <StoreSetupScreen onCreated={setStore} />;

  return (
    <StoreContext.Provider value={store}>
      <Stack.Navigator>
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="ProductForm"
          component={ProductFormScreen}
          options={({ route }) => ({ title: route.params?.product ? 'Editar producto' : 'Nuevo producto' })}
        />
      </Stack.Navigator>
    </StoreContext.Provider>
  );
}
