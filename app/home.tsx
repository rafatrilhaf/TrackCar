import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../components/themed-text';
import ScreenLayout from '../components/ui/ScreenLayout';
import { Colors } from '../constants/colors'; // Importar cores
import { theme } from '../constants/theme';

const colors = Colors.light; // Selecionar tema claro ou escuro conforme necessário

const Home: React.FC = () => {
  const router = useRouter();
  const userName = 'Usuário';

  return (
    <ScreenLayout title="Início">
      <ScrollView showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.welcome}>
          Olá, {userName}! Bem-vindo ao TrackCar
        </ThemedText>

        <View style={styles.blocksContainer}>
          <TouchableOpacity
            style={styles.block}
            onPress={() => router.push('/perfil')}
          >
            <ThemedText style={styles.blockText}>Usuário</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.block}
            onPress={() => router.push('/carros')}
          >
            <ThemedText style={styles.blockText}>Carros</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.block}
            onPress={() => router.push('/veiculosroubados')}
          >
            <ThemedText style={styles.blockText}>Veículos Roubados</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.block}
            onPress={() => router.push('/localizacao')}
          >
            <ThemedText style={styles.blockText}>Localização</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  welcome: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.xl,
    color: colors.text, // Usar colors
  },
  blocksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  block: {
    width: '48%',
    backgroundColor: colors.primary, // Usar colors
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  blockText: {
    color: colors.background, // Usar colors
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    textAlign: 'center',
  },
});

export default Home;
