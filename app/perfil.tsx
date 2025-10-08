import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Colors } from '../constants/colors';
import { theme } from '../constants/theme';
import { useUserProfile } from '../hooks/useUserProfile';
import {
  formatPhoneNumber,
  PasswordFormData,
  ProfileFormData,
  validatePasswordForm,
  validateProfileForm,
} from '../types/profile';

const colors = Colors.light; // ou troque por Colors.dark conforme o estado de tema

export default function PerfilScreen() {
  const {
    profile,
    loading,
    error,
    updateProfile,
    uploadPhoto,
    removePhoto,
    updatePassword,
    signOut,
  } = useUserProfile();

  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    phone: '',
    address: '',
  });

  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [editMode, setEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  /* ---------- sincroniza state inicial ---------- */
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        address: profile.address || '',
      });
    }
  }, [profile]);

  /* ---------- helpers ---------- */
  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'phone' ? formatPhoneNumber(value) : value,
    }));
  };

  const handlePasswordChange = (field: keyof PasswordFormData, value: string) =>
    setPasswordData(prev => ({ ...prev, [field]: value }));

  /* ---------- salvar perfil ---------- */
  const handleSaveProfile = async () => {
    const validationErrors = validateProfileForm(formData);
    if (Object.keys(validationErrors).length) {
      Alert.alert('Erro de Validação', Object.values(validationErrors)[0]);
      return;
    }
    setIsUpdating(true);
    await updateProfile(formData);
    setIsUpdating(false);
    setEditMode(false);
  };

  /* ---------- alterar senha ---------- */
  const handleChangePassword = async () => {
    const validationErrors = validatePasswordForm(passwordData);
    if (Object.keys(validationErrors).length) {
      Alert.alert('Erro de Validação', Object.values(validationErrors)[0]);
      return;
    }
    setIsUpdating(true);
    await updatePassword(passwordData.newPassword);
    setIsUpdating(false);
    setShowPasswordModal(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  /* ---------- imagem ---------- */
  const pickOrCapture = async (camera = false) => {
    const perm = camera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Permissão necessária',
        camera ? 'Permita usar a câmera.' : 'Permita acessar a galeria.'
      );
      return;
    }
    const result = camera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
    if (!result.canceled && result.assets?.[0]) {
      setIsUpdating(true);
      await uploadPhoto(result.assets[0].uri);
      setIsUpdating(false);
    }
    setShowPhotoOptions(false);
  };

  /* ---------- remover foto ---------- */
  const handleRemovePhoto = () =>
    Alert.alert('Remover Foto', 'Deseja remover sua foto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          setIsUpdating(true);
          await removePhoto();
          setIsUpdating(false);
        },
      },
    ]);

  /* ---------- logout ---------- */
  const handleSignOut = () =>
    Alert.alert('Sair da Conta', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/login');
        },
      },
    ]);

  /* ---------- loading / erro ---------- */
  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );

  if (error && !profile)
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={colors.error} />
        <Text style={styles.errorText}>Erro ao carregar perfil</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
      </View>
    );

  /* ---------- UI principal ---------- */
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Foto */}
        <View style={styles.photoSection}>
          <TouchableOpacity
            style={styles.photoContainer}
            onPress={() => setShowPhotoOptions(true)}
            disabled={isUpdating}
          >
            {profile?.photoURL ? (
              <Image source={{ uri: profile.photoURL }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" size={50} color={colors.textSecondary} />
              </View>
            )}
            {isUpdating && (
              <View style={styles.photoLoading}>
                <ActivityIndicator size="small" color={colors.background} />
              </View>
            )}
            <View style={styles.photoEditIcon}>
              <Ionicons name="camera" size={16} color={colors.background} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Formulário */}
        <View style={styles.infoSection}>
          {/* Nome */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nome</Text>
            <TextInput
              style={[styles.input, !editMode && styles.inputDisabled]}
              value={formData.name}
              onChangeText={v => handleInputChange('name', v)}
              editable={editMode}
              autoCapitalize="words"
            />
          </View>

          {/* E-mail (readonly) */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>E-mail</Text>
            <TextInput style={[styles.input, styles.inputDisabled]} value={profile?.email || ''} editable={false} />
            <Text style={styles.inputHelper}>O e-mail não pode ser alterado</Text>
          </View>

          {/* Telefone */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Telefone</Text>
            <TextInput
              style={[styles.input, !editMode && styles.inputDisabled]}
              value={formData.phone}
              onChangeText={v => handleInputChange('phone', v)}
              editable={editMode}
              keyboardType="phone-pad"
              placeholder="(00) 00000-0000"
            />
          </View>

          {/* Endereço */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Endereço</Text>
            <TextInput
              style={[styles.input, !editMode && styles.inputDisabled, styles.textArea]}
              value={formData.address}
              onChangeText={v => handleInputChange('address', v)}
              editable={editMode}
              multiline
              numberOfLines={3}
              placeholder="Rua, número, bairro, cidade"
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Botões */}
        <View style={styles.actionButtons}>
          {editMode ? (
            <View style={styles.editButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setEditMode(false);
                  if (profile) {
                    setFormData({
                      name: profile.name || '',
                      phone: profile.phone || '',
                      address: profile.address || '',
                    });
                  }
                }}
                disabled={isUpdating}
              >
                <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton, isUpdating && styles.buttonDisabled]}
                onPress={handleSaveProfile}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Text style={styles.buttonText}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.button} onPress={() => setEditMode(true)} disabled={isUpdating}>
              <Ionicons name="create-outline" size={20} color={colors.background} />
              <Text style={[styles.buttonText, { marginLeft: theme.spacing.sm }]}>Editar Perfil</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.passwordButton]}
            onPress={() => setShowPasswordModal(true)}
            disabled={isUpdating}
          >
            <Ionicons name="lock-closed-outline" size={20} color={colors.background} />
            <Text style={[styles.buttonText, { marginLeft: theme.spacing.sm }]}>Alterar Senha</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Foto */}
      <Modal visible={showPhotoOptions} transparent animationType="slide" onRequestClose={() => setShowPhotoOptions(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Foto de Perfil</Text>

            <TouchableOpacity style={styles.modalOption} onPress={() => pickOrCapture(true)}>
              <Ionicons name="camera" size={24} color={colors.primary} />
              <Text style={styles.modalOptionText}>Tirar Foto</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOption} onPress={() => pickOrCapture(false)}>
              <Ionicons name="image" size={24} color={colors.primary} />
              <Text style={styles.modalOptionText}>Escolher da Galeria</Text>
            </TouchableOpacity>

            {profile?.photoURL && (
              <TouchableOpacity style={styles.modalOption} onPress={handleRemovePhoto}>
                <Ionicons name="trash" size={24} color={colors.error} />
                <Text style={[styles.modalOptionText, { color: colors.error }]}>Remover Foto</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowPhotoOptions(false)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Senha */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.passwordModalContent}>
            <Text style={styles.modalTitle}>Alterar Senha</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nova Senha</Text>
              <TextInput
                style={styles.input}
                value={passwordData.newPassword}
                onChangeText={v => handlePasswordChange('newPassword', v)}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirmar Nova Senha</Text>
              <TextInput
                style={styles.input}
                value={passwordData.confirmPassword}
                onChangeText={v => handlePasswordChange('confirmPassword', v)}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.editButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setShowPasswordModal(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                disabled={isUpdating}
              >
                <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton, isUpdating && styles.buttonDisabled]}
                onPress={handleChangePassword}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Text style={styles.buttonText}>Alterar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

/* ---------- estilos ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: colors.error,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: theme.fontSize.md,
    color: colors.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: theme.fontSize.header,
    fontWeight: theme.fontWeight.bold,
    color: colors.text,
  },
  logoutButton: { padding: theme.spacing.sm },
  scrollContainer: { flex: 1 },
  photoSection: { alignItems: 'center', paddingVertical: theme.spacing.xl },
  photoContainer: { position: 'relative' },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: theme.borderRadius.full,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: theme.borderRadius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.border,
  },
  photoEditIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: theme.borderRadius.full,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  photoLoading: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: theme.borderRadius.full,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: { paddingHorizontal: theme.spacing.lg },
  inputContainer: { marginBottom: theme.spacing.lg },
  inputLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: colors.text,
  },
  inputDisabled: {
    backgroundColor: colors.surface,
    color: colors.textSecondary,
  },
  inputHelper: {
    fontSize: theme.fontSize.sm,
    color: colors.textSecondary,
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  actionButtons: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    minHeight: 48,
  },
  buttonDisabled: { backgroundColor: colors.buttonDisabled },
  buttonText: {
    color: colors.background,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.textSecondary,
    flex: 1,
  },
  cancelButtonText: { color: colors.textSecondary },
  saveButton: { flex: 1 },
  passwordButton: { backgroundColor: colors.secondary },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '80%',
    maxWidth: 300,
  },
  passwordModalContent: {
    backgroundColor: colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  modalOptionText: {
    fontSize: theme.fontSize.md,
    color: colors.text,
    marginLeft: theme.spacing.md,
  },
  modalCancelButton: { alignItems: 'center', padding: theme.spacing.md, marginTop: theme.spacing.sm },
  modalCancelText: {
    fontSize: theme.fontSize.md,
    color: colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
});
