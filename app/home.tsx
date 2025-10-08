// app/home.tsx
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { useRouter } from 'expo-router';

const Home: React.FC = () => {
  const router = useRouter();
  const userName = 'Usuário'; // Use o contexto do usuário no futuro

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.welcome}>Olá, {userName}! Bem-vindo ao TrackCar</Text>

        <View style={styles.blocksContainer}>
          <TouchableOpacity
            style={styles.block}
            onPress={() => router.push('/perfil')}
          >
            <Text style={styles.blockText}>Usuário</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.block}
            onPress={() => router.push('/carros')}
          >
            <Text style={styles.blockText}>Carros</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.block}
            onPress={() => router.push('/veiculosroubados')}
          >
            <Text style={styles.blockText}>Veículos Roubados</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.block}
            onPress={() => router.push('/localizacao')}
          >
            <Text style={styles.blockText}>Localização</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  content: {
    padding: 20,
  },
  welcome: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  blocksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  block: {
    width: '48%',
    backgroundColor: '#007bff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
  },
  blockText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
});
