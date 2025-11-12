// app/forgot-password.tsx - VERSÃO RESPONSIVA COMPLETA
import { router } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import React, { useState } from 'react';
import {
  Alert, Image, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { auth } from '../services/firebase';
import styles from '../styles/authScreenStyles';
import { scaleHeight } from '../utils/responsive';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert('Erro', 'Por favor, digite seu e-mail');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Erro', 'Por favor, digite um e-mail válido');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'E-mail Enviado!', 
        'Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      let errorMessage = 'Erro ao enviar e-mail de recuperação';
      
      if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
        const code = error.code;
        if (code === 'auth/user-not-found') {
          errorMessage = 'E-mail não encontrado em nossa base de dados';
        } else if (code === 'auth/invalid-email') {
          errorMessage = 'E-mail inválido';
        } else if (code === 'auth/too-many-requests') {
          errorMessage = 'Muitas tentativas. Tente novamente mais tarde';
        } else if (code === 'auth/network-request-failed') {
          errorMessage = 'Erro de conexão. Verifique sua internet';
        }
      }
      
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const dynamicStyles = StyleSheet.create({
    input: {
      backgroundColor: theme.colors.inputBackground,
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      fontSize: theme.fontSize.md,
      color: theme.colors.text,
      minHeight: scaleHeight(48),
    },
    button: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
      marginTop: theme.spacing.lg,
      minHeight: scaleHeight(48),
      justifyContent: 'center',
    },
    buttonDisabled: {
      backgroundColor: theme.colors.buttonDisabled,
    },
  });

  const localStyles = StyleSheet.create({
    backButton: {
      alignItems: 'center',
      padding: 16,
      marginTop: 12,
      borderWidth: 1,
      borderRadius: 8,
      backgroundColor: 'transparent',
      minHeight: scaleHeight(48),
      justifyContent: 'center',
    },
    
    backButtonText: {
      fontSize: 16,
      fontWeight: '500',
    },
  });

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Image 
            source={require('../assets/images/logo.png')}
            style={styles.logo} 
            resizeMode="contain" 
          />
          <Text style={[styles.title, { color: theme.colors.text }]}>Recuperar Senha</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Digite seu e-mail para receber as instruções de recuperação de senha
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>E-mail</Text>
            <TextInput
              style={dynamicStyles.input}
              placeholder="Digite seu e-mail"
              placeholderTextColor={theme.colors.placeholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[
              dynamicStyles.button,
              loading && dynamicStyles.buttonDisabled
            ]}
            onPress={handlePasswordReset}
            disabled={loading}
          >
            <Text style={[styles.buttonText, { color: theme.isDark ? '#FFFFFF' : theme.colors.background }]}>
              {loading ? 'Enviando...' : 'Enviar E-mail de Recuperação'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[localStyles.backButton, { borderColor: theme.colors.primary }]}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={[localStyles.backButtonText, { color: theme.colors.primary }]}>
              Voltar para o Login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
