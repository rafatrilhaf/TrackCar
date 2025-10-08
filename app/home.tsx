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

import { useNavigation } from '@react-navigation/native';

const Home: React.FC = () => {
  const navigation = useNavigation();
  const userName = 'Usuário'; // Você pode substituir isso por estado/contexto real

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.welcome}>Olá, {userName}! Bem-vindo ao TrackCar</Text>

        <View style={styles.blocksContainer}>
          <TouchableOpacity
            style={styles.block}
            onPress={() => navigation.navigate('perfil')}
          >
            <Text style={styles.blockText}>Usuário</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.block}
            onPress={() => navigation.navigate('carros')}
          >
            <Text style={styles.blockText}>Carros</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.block}
            onPress={() => navigation.navigate('veiculosroubados')}
          >
            <Text style={styles.blockText}>Veículos Roubados</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.block}
            onPress={() => navigation.navigate('localizacao')}
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
