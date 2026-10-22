import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthScreen from './src/dev1_comercio/screens/AuthScreen';
import ComercioNavigator from './src/dev1_comercio/ComercioNavigator';
import ClienteNavigator from './src/dev2_cliente/ClienteNavigator';
import DomiciliarioNavigator from './src/dev3_domiciliario/DomiciliarioNavigator';
import { Btn } from './src/shared/ui';

function RootNavigator() {
  const { user, role, loading, logout } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) return <AuthScreen />;

  switch (role) {
    case 'COMERCIO':
      return <ComercioNavigator />;
    case 'CLIENTE':
      return <ClienteNavigator />;
    case 'DOMICILIARIO':
      return <DomiciliarioNavigator />;
    default:
      // Usuario autenticado pero sin fila en profiles
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 }}>
          <Text>No se encontró tu perfil/rol. Revisa la tabla profiles y el trigger.</Text>
          <Btn title="Cerrar sesión" onPress={logout} />
        </View>
      );
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
        <StatusBar style="dark" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
