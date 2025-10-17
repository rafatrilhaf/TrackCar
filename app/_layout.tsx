// app/_layout.tsx - ATUALIZADO COM LANGUAGEPROVIDER
import { Stack } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { AuthProvider } from '../contexts/authContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { auth } from '../services/firebase';

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <LanguageProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="home" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="modal" />
          <Stack.Screen name="perfil" />
          <Stack.Screen name="carros" />
          <Stack.Screen name="cadastrar-carro" />
          <Stack.Screen name="detalhes-carro" />
          <Stack.Screen name="editar-carro" />
          <Stack.Screen name="veiculosroubados" />
          <Stack.Screen name="localizacao" />
          <Stack.Screen name="configuracoes" />
        </Stack>
      </AuthProvider>
    </LanguageProvider>
  );
}