// components/IgnitionControl.tsx - Componente para controlar ignição
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { controlCarIgnition, subscribeToIgnitionState } from '../services/carService';
import { Car } from '../types/car';

interface Props {
  car: Car;
  onStateChange?: (newState: 'on' | 'off' | 'unknown') => void;
}

export default function IgnitionControl({ car, onStateChange }: Props) {
  const [ignitionState, setIgnitionState] = useState<'on' | 'off' | 'unknown'>(
    car.ignitionState || 'unknown'
  );
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | undefined>(car.lastIgnitionUpdate);

  useEffect(() => {
    if (!car.id) return;

    // Subscreve para atualizações em tempo real
    const unsubscribe = subscribeToIgnitionState(car.id, (state) => {
      setIgnitionState(state.ignitionState);
      setLastUpdate(state.lastUpdate);
      onStateChange?.(state.ignitionState);
    });

    return unsubscribe;
  }, [car.id, onStateChange]);

  const handleIgnitionToggle = async () => {
    if (!car.id) {
      Alert.alert('Erro', 'ID do carro não encontrado');
      return;
    }

    const action = ignitionState === 'on' ? 'stop' : 'start';
    const actionText = action === 'start' ? 'ligar' : 'desligar';

    Alert.alert(
      'Confirmar Ação',
      `Deseja ${actionText} a ignição do veículo?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await controlCarIgnition(car.id!, action);
              
              Alert.alert('Sucesso', result.message);
              setIgnitionState(result.newState);
            } catch (error: any) {
              Alert.alert('Erro', error.message || `Erro ao ${actionText} ignição`);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = () => {
    switch (ignitionState) {
      case 'on':
        return '#4CAF50'; // Verde
      case 'off':
        return '#F44336'; // Vermelho
      default:
        return '#757575'; // Cinza
    }
  };

  const getStatusText = () => {
    switch (ignitionState) {
      case 'on':
        return 'Ligada';
      case 'off':
        return 'Desligada';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusIcon = () => {
    switch (ignitionState) {
      case 'on':
        return 'car-sport';
      case 'off':
        return 'car-sport-outline';
      default:
        return 'help-circle-outline';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Controle de Ignição</Text>
        {lastUpdate && (
          <Text style={styles.lastUpdate}>
            Atualizado: {lastUpdate.toLocaleTimeString()}
          </Text>
        )}
      </View>

      <View style={[styles.statusContainer, { borderColor: getStatusColor() }]}>
        <Ionicons name={getStatusIcon()} size={48} color={getStatusColor()} />
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.controlButton,
          {
            backgroundColor: ignitionState === 'on' ? '#F44336' : '#4CAF50',
            opacity: loading || ignitionState === 'unknown' ? 0.6 : 1,
          },
        ]}
        onPress={handleIgnitionToggle}
        disabled={loading || ignitionState === 'unknown'}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons
              name={ignitionState === 'on' ? 'stop-circle' : 'play-circle'}
              size={24}
              color="#fff"
            />
            <Text style={styles.buttonText}>
              {ignitionState === 'on' ? 'Desligar' : 'Ligar'} Ignição
            </Text>
          </>
        )}
      </TouchableOpacity>

      {ignitionState === 'unknown' && (
        <Text style={styles.warningText}>
          ⚠️ Status da ignição não disponível. Verifique a conexão do dispositivo.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  lastUpdate: {
    fontSize: 12,
    color: '#666',
  },
  statusContainer: {
    alignItems: 'center',
    padding: 20,
    borderWidth: 2,
    borderRadius: 10,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  warningText: {
    textAlign: 'center',
    color: '#FF9800',
    fontSize: 12,
    fontStyle: 'italic',
  },
});
