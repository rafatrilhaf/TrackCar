// app/login.tsx
import { router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import {
  Alert, Image, KeyboardAvoidingView, Platform, ScrollView,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { auth } from '../services/firebase';
import styles from '../styles/authScreenStyles';

export default function LoginScreen() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

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
    Alert.alert('Erro', errorMessage);
  } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Image source={require('../assets/images/logo.png')}
            style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Entrar</Text>
          <Text style={styles.subtitle}>
            Acesse sua conta para monitorar seu veículo
          </Text>
        </View>
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite seu e-mail"
              value={form.email}
              onChangeText={v => handleInputChange('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Senha</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite sua senha"
              value={form.password}
              onChangeText={v => handleInputChange('password', v)}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}>
            <Text style={styles.buttonText}>
              {loading ? 'Carregando...' : 'Entrar'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => router.push('/register')}>
            <Text style={styles.switchButtonText}>
              Não tem conta? Cadastre-se
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
