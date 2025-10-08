// app/register.tsx
import { router } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { addDoc, collection } from 'firebase/firestore';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { theme } from '../constants/theme';
import { auth, db } from '../services/firebase';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  address: string;
}

export default function RegisterScreen() {
  const [form, setForm] = useState<RegisterForm>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
  });
  const [loading, setLoading] = useState<boolean>(false);

  const handleInputChange = (field: keyof RegisterForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    const { name, email, password, confirmPassword, phone, address } = form;
    if (!name || !email || !password || !confirmPassword || !phone || !address) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await addDoc(collection(db, 'users'), {
        uid: user.uid,
        name,
        email,
        phone,
        address,
        createdAt: new Date(),
      });
      Alert.alert('Sucesso', 'Conta criada com sucesso!');
      router.replace('/login');
    } catch (error: any) {
      const errorMessage = error.code === 'auth/email-already-in-use'
        ? 'E-mail já está em uso'
        : error.code === 'auth/invalid-email'
        ? 'E-mail inválido'
        : error.code === 'auth/weak-password'
        ? 'Senha muito fraca'
        : 'Erro ao criar conta';
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Criar Conta</Text>
        <View style={styles.form}>
          <Text style={styles.inputLabel}>Nome</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite seu nome"
            value={form.name}
            onChangeText={v => handleInputChange('name', v)}
            autoCapitalize="words"
          />

          <Text style={styles.inputLabel}>E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite seu e-mail"
            value={form.email}
            onChangeText={v => handleInputChange('email', v)}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite sua senha"
            value={form.password}
            onChangeText={v => handleInputChange('password', v)}
            secureTextEntry
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>Confirmar Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirme sua senha"
            value={form.confirmPassword}
            onChangeText={v => handleInputChange('confirmPassword', v)}
            secureTextEntry
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>Telefone</Text>
          <TextInput
            style={styles.input}
            placeholder="(XX) XXXXX-XXXX"
            value={form.phone}
            onChangeText={v => handleInputChange('phone', v)}
            keyboardType="phone-pad"
          />

          <Text style={styles.inputLabel}>Endereço</Text>
          <TextInput
            style={styles.input}
            placeholder="Rua, número, bairro, cidade"
            value={form.address}
            onChangeText={v => handleInputChange('address', v)}
            autoCapitalize="words"
          />

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Carregando...' : 'Registrar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.switchButton}
            onPress={() => router.replace('/login')}
          >
            <Text style={styles.switchButtonText}>
              Já tem conta? Entrar
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.header,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  form: {
    width: '100%',
  },
  inputLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.buttonDisabled,
  },
  buttonText: {
    color: theme.colors.background,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
  },
  switchButton: {
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  switchButtonText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
  },
});
