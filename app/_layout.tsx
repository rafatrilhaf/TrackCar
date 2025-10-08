// app/_layout.tsx - ATUALIZADO
import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/authContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="home" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="modal" />
        <Stack.Screen name="perfil" />
        <Stack.Screen name="carros" />
        <Stack.Screen name="veiculosroubados" />
        <Stack.Screen name="localizacao" />
      </Stack>
    </AuthProvider>
  );
}
