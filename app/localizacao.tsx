import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/colors';
import { theme } from '../constants/theme';

const colors = Colors.light;

export default function LocalizacaoScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tela de Localização</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: theme.fontSize.lg,
    color: colors.text,
  },
});
