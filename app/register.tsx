// app/register.tsx - VERSÃO CORRIGIDA SEM ERRO
import { router } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  Alert, Image, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { auth, db } from '../services/firebase';
import styles from '../styles/authScreenStyles';

export default function RegisterScreen() {
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const handleInputChange = (field: string, value: string) => {
    if (field === 'phone') {
      // Formatação básica de telefone
      const formattedPhone = formatPhoneNumber(value);
      setForm(prev => ({ ...prev, [field]: formattedPhone }));
    } else {
      setForm(prev => ({ ...prev, [field]: value }));
    }
  };

  // Função para formatar telefone
  const formatPhoneNumber = (value: string): string => {
    // Remove todos os caracteres não numéricos
    const cleaned = value.replace(/\D/g, '');
    
    // Aplica a máscara (XX) XXXXX-XXXX
    if (cleaned.length <= 2) {
      return cleaned;
    } else if (cleaned.length <= 7) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    } else {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
    }
  };

  const handleRegister = async () => {
    // Validações
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    if (form.password !== form.confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    if (form.password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      Alert.alert('Erro', 'Por favor, digite um e-mail válido');
      return;
    }

    // Validação de telefone (se preenchido)
    if (form.phone && form.phone.replace(/\D/g, '').length < 10) {
      Alert.alert('Erro', 'Por favor, digite um telefone válido');
      return;
    }

    setLoading(true);
    try {
      // Criar conta no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const user = userCredential.user;

      // Atualizar o nome no perfil do usuário
      await updateProfile(user, {
        displayName: form.name
      });

      // Salvar dados adicionais no Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name: form.name,
        email: form.email,
        phone: form.phone || '',
        address: form.address || '',
        photoURL: '',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      Alert.alert('Sucesso', 'Conta criada com sucesso!');
      router.replace('/home');
    } catch (err) {
      let code = '';
      if (err && typeof err === 'object' && 'code' in err && typeof err.code === 'string') {
        code = err.code;
      }
      let errorMessage = 'Erro ao criar conta';
      if (code === 'auth/email-already-in-use') errorMessage = 'E-mail já está em uso';
      else if (code === 'auth/invalid-email') errorMessage = 'E-mail inválido';
      else if (code === 'auth/weak-password') errorMessage = 'Senha muito fraca';
      else if (code === 'auth/network-request-failed') errorMessage = 'Erro de conexão. Verifique sua internet';
      Alert.alert('Erro', errorMessage);
    } finally { 
      setLoading(false); 
    }
  };

  // Estilos dinâmicos usando o tema atual
  const dynamicStyles = StyleSheet.create({
    input: {
      backgroundColor: theme.colors.inputBackground,
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      fontSize: theme.fontSize.md,
      color: theme.colors.text,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    // Estilo local para inputHelper
    inputHelper: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
      fontStyle: 'italic',
    },
  });

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Image source={require('../assets/images/logo.png')}
            style={styles.logo} resizeMode="contain" />
          <Text style={[styles.title, { color: theme.colors.text }]}>Criar Conta</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Cadastre-se para começar a monitorar seu veículo
          </Text>
        </View>
        
        <View style={styles.form}>
          {/* Nome */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
              Nome *
            </Text>
            <TextInput
              style={dynamicStyles.input}
              placeholder="Digite seu nome completo"
              placeholderTextColor={theme.colors.placeholder}
              value={form.name}
              onChangeText={v => handleInputChange('name', v)}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          {/* E-mail */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
              E-mail *
            </Text>
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

          {/* Telefone */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
              Telefone
            </Text>
            <TextInput
              style={dynamicStyles.input}
              placeholder="(00) 00000-0000"
              placeholderTextColor={theme.colors.placeholder}
              value={form.phone}
              onChangeText={v => handleInputChange('phone', v)}
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>

          {/* Endereço */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
              Endereço
            </Text>
            <TextInput
              style={[dynamicStyles.input, dynamicStyles.textArea]}
              placeholder="Rua, número, bairro, cidade"
              placeholderTextColor={theme.colors.placeholder}
              value={form.address}
              onChangeText={v => handleInputChange('address', v)}
              multiline
              numberOfLines={3}
              autoCapitalize="words"
            />
          </View>
          
          {/* Senha */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
              Senha *
            </Text>
            <TextInput
              style={dynamicStyles.input}
              placeholder="Digite sua senha (mín. 6 caracteres)"
              placeholderTextColor={theme.colors.placeholder}
              value={form.password}
              onChangeText={v => handleInputChange('password', v)}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {/* Confirmar Senha */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
              Confirmar Senha *
            </Text>
            <TextInput
              style={dynamicStyles.input}
              placeholder="Confirme sua senha"
              placeholderTextColor={theme.colors.placeholder}
              value={form.confirmPassword}
              onChangeText={v => handleInputChange('confirmPassword', v)}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {/* Texto de campos obrigatórios */}
          <Text style={[dynamicStyles.inputHelper, { marginBottom: theme.spacing.md }]}>
            * Campos obrigatórios
          </Text>

          {/* Botão Criar Conta */}
          <TouchableOpacity
            style={[
              { 
                backgroundColor: theme.colors.primary, 
                borderRadius: theme.borderRadius.md, 
                padding: theme.spacing.md, 
                alignItems: 'center', 
                marginBottom: theme.spacing.lg, 
                marginTop: theme.spacing.md 
              },
              loading && { backgroundColor: theme.colors.buttonDisabled }
            ]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={[styles.buttonText, { color: theme.isDark ? '#FFFFFF' : theme.colors.background }]}>
              {loading ? 'Criando...' : 'Criar Conta'}
            </Text>
          </TouchableOpacity>
          
          {/* Link para Login */}
          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={[styles.switchButtonText, { color: theme.colors.primary }]}>
              Já tem conta? Entrar
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
