import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, SafeAreaView, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors'; // Corrigir aqui
import screenLayoutStyles from '../../styles/screenLayout';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

const colors = Colors.light; // Defina o tema apropriado

interface Props {
  title: string;
  children: React.ReactNode;
  onMenuPress?: () => void;
}

export default function ScreenLayout({ title, children, onMenuPress }: Props) {
  const handleMenuPress = () => {
    if (onMenuPress) {
      onMenuPress();
    } else {
      Alert.alert('Menu', 'Menu não implementado ainda');
    }
  };

  return (
    <SafeAreaView style={screenLayoutStyles.container}>
      <View style={screenLayoutStyles.header}>
        <View style={screenLayoutStyles.logoPlaceholder}>
          <ThemedText style={screenLayoutStyles.logoText}>TrackCar</ThemedText>
        </View>
        <ThemedText style={screenLayoutStyles.headerTitle}>{title}</ThemedText>
        <TouchableOpacity 
          style={screenLayoutStyles.menuIcon} 
          onPress={handleMenuPress}
        >
          <Ionicons name="menu" size={28} color={colors.text} /> {/* Corrigir aqui */}
        </TouchableOpacity>
      </View>
      <ThemedView style={screenLayoutStyles.content}>
        {children}
      </ThemedView>
    </SafeAreaView>
  );
}
