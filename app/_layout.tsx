// app/_layout.tsx - COM THEMEPROVIDER
import { Stack } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemeTransition } from '../components/ThemeTransition';
import { ThemeProvider } from '../hooks/useThemeManager'; // NOVO IMPORT
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
    return (
      <View style={styles.loadingContainer}>
        {/* Adicione seu componente de loading aqui se necessário */}
      </View>
    );
  }

  return (
    <ThemeProvider>
      <ThemeTransition>
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
        </Stack>
      </ThemeTransition>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});