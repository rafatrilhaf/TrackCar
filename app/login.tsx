// app/login.tsx - VERSÃO RESPONSIVA COMPLETA
import { router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
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

export default function LoginScreen() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const handleInputChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      Alert.alert('Sucesso', 'Login realizado com sucesso!');
      router.replace('/home');
    } catch (err) {
      let code = '';
      if (err && typeof err === 'object' && 'code' in err && typeof err.code === 'string') {
        code = err.code;
      }
      let errorMessage = 'Erro na autenticação';
      if (code === 'auth/invalid-email') errorMessage = 'E-mail inválido';
      else if (code === 'auth/user-not-found') errorMessage = 'Usuário não encontrado';
      else if (code === 'auth/wrong-password') errorMessage = 'Senha incorreta';
      else if (code === 'auth/invalid-credential') errorMessage = 'Credenciais inválidas';
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
    forgotPasswordButton: {
      alignSelf: 'flex-end',
      marginBottom: 20,
      marginTop: -5,
      paddingVertical: 8,
      paddingHorizontal: 4,
      minHeight: scaleHeight(32),
      justifyContent: 'center',
    },
    
    forgotPasswordText: {
      fontSize: 14,
      fontWeight: '500',
      textDecorationLine: 'underline',
    },
  });

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Image source={require('../assets/images/logo.png')}
            style={styles.logo} resizeMode="contain" />
          <Text style={[styles.title, { color: theme.colors.text }]}>Entrar</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Acesse sua conta para monitorar seu veículo
          </Text>
        </View>
        
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>E-mail</Text>
            <TextInput
              style={dynamicStyles.input}
              placeholder="Digite seu e-mail"
              placeholderTextColor={theme.colors.placeholder}
              value={form.email}
              onChangeText={v => handleInputChange('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Senha</Text>
            <TextInput
              style={dynamicStyles.input}
              placeholder="Digite sua senha"
              placeholderTextColor={theme.colors.placeholder}
              value={form.password}
              onChangeText={v => handleInputChange('password', v)}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={localStyles.forgotPasswordButton}
            onPress={() => router.push('/forgot-password')}
            disabled={loading}
          >
            <Text style={[localStyles.forgotPasswordText, { color: theme.colors.primary }]}>
              Esqueci minha senha
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              dynamicStyles.button,
              loading && dynamicStyles.buttonDisabled
            ]}
            onPress={handleLogin}
            disabled={loading}>
            <Text style={[styles.buttonText, { color: theme.isDark ? '#FFFFFF' : theme.colors.background }]}>
              {loading ? 'Carregando...' : 'Entrar'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => router.push('/register')}
            disabled={loading}>
            <Text style={[styles.switchButtonText, { color: theme.colors.primary }]}>
              Não tem conta? Cadastre-se
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
