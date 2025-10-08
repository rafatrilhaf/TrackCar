// components/ProfilePhotoSelector.tsx
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface ProfilePhotoSelectorProps {
  photoURL?: string;
  onPhotoChange: (uri: string) => Promise<void>;
  onPhotoRemove: () => Promise<void>;
  isLoading?: boolean;
}

export const ProfilePhotoSelector: React.FC<ProfilePhotoSelectorProps> = ({
  photoURL,
  onPhotoChange,
  onPhotoRemove,
  isLoading = false,
}) => {
  const theme = useTheme();
  const [showOptions, setShowOptions] = React.useState(false);

  const handlePickFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permissão necessária', 'Permita o acesso à galeria para selecionar uma foto.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setShowOptions(false);
        await onPhotoChange(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permissão necessária', 'Permita o acesso à câmera para tirar uma foto.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setShowOptions(false);
        await onPhotoChange(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      Alert.alert('Erro', 'Não foi possível tirar a foto');
    }
  };

  const handleRemovePhoto = () => {
    Alert.alert(
      'Remover Foto',
      'Tem certeza que deseja remover sua foto de perfil?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            setShowOptions(false);
            await onPhotoRemove();
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    photoContainer: {
      position: 'relative',
    },
    profilePhoto: {
      width: 120,
      height: 120,
      borderRadius: theme.borderRadius.full,
      borderWidth: 3,
      borderColor: theme.colors.primary,
    },
    photoPlaceholder: {
      width: 120,
      height: 120,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: theme.colors.border,
    },
    photoEditIcon: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.full,
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: theme.colors.background,
    },
    photoLoading: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: theme.borderRadius.full,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.xl,
      width: '80%',
      maxWidth: 300,
    },
    modalTitle: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.text,
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
      color: theme.colors.text,
      marginLeft: theme.spacing.md,
    },
    modalCancelButton: {
      alignItems: 'center',
      padding: theme.spacing.md,
      marginTop: theme.spacing.sm,
    },
    modalCancelText: {
      fontSize: theme.fontSize.md,
      color: theme.colors.textSecondary,
      fontWeight: theme.fontWeight.medium,
    },
  });

  return (
    <>
      <TouchableOpacity
        style={styles.photoContainer}
        onPress={() => setShowOptions(true)}
        disabled={isLoading}
      >
        {photoURL ? (
          <Image source={{ uri: photoURL }} style={styles.profilePhoto} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="person" size={50} color={theme.colors.textSecondary} />
          </View>
        )}
        
        {isLoading && (
          <View style={styles.photoLoading}>
            <ActivityIndicator size="small" color={theme.colors.background} />
          </View>
        )}
        
        <View style={styles.photoEditIcon}>
          <Ionicons name="camera" size={16} color={theme.colors.background} />
        </View>
      </TouchableOpacity>

      {/* Modal para Opções da Foto */}
      <Modal
        visible={showOptions}
        animationType="slide"
        transparent
        onRequestClose={() => setShowOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Foto de Perfil</Text>
            
            <TouchableOpacity style={styles.modalOption} onPress={handleTakePhoto}>
              <Ionicons name="camera" size={24} color={theme.colors.primary} />
              <Text style={styles.modalOptionText}>Tirar Foto</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalOption} onPress={handlePickFromGallery}>
              <Ionicons name="image" size={24} color={theme.colors.primary} />
              <Text style={styles.modalOptionText}>Escolher da Galeria</Text>
            </TouchableOpacity>
            
            {photoURL && (
              <TouchableOpacity style={styles.modalOption} onPress={handleRemovePhoto}>
                <Ionicons name="trash" size={24} color={theme.colors.error} />
                <Text style={[styles.modalOptionText, { color: theme.colors.error }]}>
                  Remover Foto
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowOptions(false)}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};