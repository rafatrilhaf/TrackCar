// app/index.tsx - CÓDIGO COMPLETO CORRIGIDO
import { useRouter } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { auth } from '../services/firebase';

export default function Index() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [initialAuthCheck, setInitialAuthCheck] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'User not logged in');
      
      // Só navega após a primeira verificação
      if (!initialAuthCheck) {
        setInitialAuthCheck(true);
        setIsLoading(false);
        
        if (user) {
          console.log('Navigating to home');
          router.replace('/home');
        } else {
          console.log('Navigating to login');
          router.replace('/login');
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [router, initialAuthCheck]);

  // Mostra loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});
