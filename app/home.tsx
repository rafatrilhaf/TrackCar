// app/home.tsx - CÓDIGO COMPLETO CORRIGIDO
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { auth } from '../services/firebase';

export default function HomeScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert('Sucesso', 'Logout realizado com sucesso!');
      router.replace('/login');
    } catch (error) {
      Alert.alert('Erro', 'Erro ao fazer logout');
      console.error('Erro no logout:', error);
    }
  };

  const navigateToCarros = () => {
    router.push('/carros');
  };

  const navigateToLocalizacao = () => {
    router.push('/localizacao');
  };

  const navigateToPerfil = () => {
    router.push('/perfil');
  };

  const navigateToVeiculosRoubados = () => {
    router.push('/veiculosroubados');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>TrackCar</Text>
          <Text style={styles.subtitle}>Sistema de Monitoramento Veicular</Text>
        </View>

        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuButton} onPress={navigateToCarros}>
            <Text style={styles.menuButtonText}>🚗 Meus Carros</Text>
            <Text style={styles.menuButtonDescription}>
              Gerenciar veículos cadastrados
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuButton} onPress={navigateToLocalizacao}>
            <Text style={styles.menuButtonText}>📍 Localização</Text>
            <Text style={styles.menuButtonDescription}>
              Ver localização dos veículos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuButton} onPress={navigateToVeiculosRoubados}>
            <Text style={styles.menuButtonText}>🚨 Veículos Roubados</Text>
            <Text style={styles.menuButtonDescription}>
              Consultar base de dados
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuButton} onPress={navigateToPerfil}>
            <Text style={styles.menuButtonText}>👤 Perfil</Text>
            <Text style={styles.menuButtonDescription}>
              Configurações da conta
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Sair</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  menuContainer: {
    flex: 1,
  },
  menuButton: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  menuButtonDescription: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    marginTop: 30,
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: '#ff4757',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
