
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, SafeAreaView, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import screenLayoutStyles from '../../styles/screenLayout';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

const colors = Colors.light;

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
        <ThemedText style={screenLayoutStyles.appName}>
          TrackCar
        </ThemedText>
        <ThemedText style={screenLayoutStyles.screenTitle}>
          {title}
        </ThemedText>
        <TouchableOpacity 
          style={screenLayoutStyles.menuIcon}   
          onPress={handleMenuPress}
        >
          <Ionicons 
            name="menu" 
            size={24} 
            color={colors.text} 
          />
        </TouchableOpacity>
      </View>
      
      <ThemedView style={screenLayoutStyles.content}>
        {children}
      </ThemedView>
    </SafeAreaView>
  );
}

