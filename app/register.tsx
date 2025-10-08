// app/register.tsx
import { router } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { addDoc, collection } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { auth, db } from '../services/firebase';
import styles from '../styles/authScreenStyles';

export default function RegisterScreen() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', address: ''
  });
  const [loading, setLoading] = useState(false);

 const handleInputChange = (field: string, value: string) => {
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
        uid: user.uid, name, email, phone, address, createdAt: new Date()
      });
      Alert.alert('Sucesso', 'Conta criada com sucesso!');
      router.replace('/login');
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
  }finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Criar Conta</Text>
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nome</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite seu nome"
              value={form.name}
              onChangeText={v => handleInputChange('name', v)}
              autoCapitalize="words"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite seu e-mail"
              value={form.email}
              onChangeText={v => handleInputChange('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
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
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirmar Senha</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirme sua senha"
              value={form.confirmPassword}
              onChangeText={v => handleInputChange('confirmPassword', v)}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Telefone</Text>
            <TextInput
              style={styles.input}
              placeholder="(XX) XXXXX-XXXX"
              value={form.phone}
              onChangeText={v => handleInputChange('phone', v)}
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Endereço</Text>
            <TextInput
              style={styles.input}
              placeholder="Rua, número, bairro, cidade"
              value={form.address}
              onChangeText={v => handleInputChange('address', v)}
              autoCapitalize="words"
            />
          </View>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}>
            <Text style={styles.buttonText}>
              {loading ? 'Carregando...' : 'Registrar'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => router.replace('/login')}>
            <Text style={styles.switchButtonText}>
              Já tem conta? Entrar
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
