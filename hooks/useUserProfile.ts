// hooks/useUserProfile.ts
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { auth } from '../services/firebase';
import {
  UserProfile,
  getUserProfile,
  removeProfilePhoto,
  signOutUser,
  subscribeToUserProfile,
  updateUserPassword,
  updateUserProfile,
  uploadAndUpdateProfilePhoto,
} from '../services/userService';

interface UseUserProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  uploadPhoto: (uri: string) => Promise<void>;
  removePhoto: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useUserProfile = (): UseUserProfileReturn => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carrega o perfil do usuário
   */
  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userProfile = await getUserProfile();
      setProfile(userProfile);
    } catch (err: any) {
      console.error('Erro ao carregar perfil:', err);
      setError(err.message || 'Erro ao carregar perfil');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Recarrega o perfil do usuário
   */
  const refreshProfile = async () => {
    await loadProfile();
  };

  /**
   * Atualiza dados do perfil
   */
  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      setLoading(true);
      setError(null);

      await updateUserProfile(data);
      
      // Atualiza o estado local
      if (profile) {
        setProfile({ ...profile, ...data, updatedAt: new Date() });
      }
      
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err);
      setError(err.message || 'Erro ao atualizar perfil');
      Alert.alert('Erro', err.message || 'Erro ao atualizar perfil');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Faz upload da foto de perfil
   */
  const uploadPhoto = async (uri: string) => {
    try {
      setLoading(true);
      setError(null);

      const photoURL = await uploadAndUpdateProfilePhoto(uri);
      
      // Atualiza o estado local
      if (profile) {
        setProfile({ ...profile, photoURL, updatedAt: new Date() });
      }
      
      Alert.alert('Sucesso', 'Foto de perfil atualizada!');
    } catch (err: any) {
      console.error('Erro ao fazer upload da foto:', err);
      setError(err.message || 'Erro ao salvar foto');
      Alert.alert('Erro', err.message || 'Erro ao salvar foto');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Remove a foto de perfil
   */
  const removePhoto = async () => {
    try {
      setLoading(true);
      setError(null);

      await removeProfilePhoto(profile?.photoURL);
      
      // Atualiza o estado local
      if (profile) {
        setProfile({ ...profile, photoURL: undefined, updatedAt: new Date() });
      }
      
      Alert.alert('Sucesso', 'Foto de perfil removida!');
    } catch (err: any) {
      console.error('Erro ao remover foto:', err);
      setError(err.message || 'Erro ao remover foto');
      Alert.alert('Erro', err.message || 'Erro ao remover foto');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Atualiza a senha do usuário
   */
  const updatePassword = async (newPassword: string) => {
    try {
      setLoading(true);
      setError(null);

      await updateUserPassword(newPassword);
      Alert.alert('Sucesso', 'Senha alterada com sucesso!');
    } catch (err: any) {
      console.error('Erro ao atualizar senha:', err);
      setError(err.message || 'Erro ao alterar senha');
      Alert.alert('Erro', err.message || 'Erro ao alterar senha');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Faz logout do usuário
   */
  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);

      await signOutUser();
      setProfile(null);
    } catch (err: any) {
      console.error('Erro ao fazer logout:', err);
      setError(err.message || 'Erro ao sair');
      Alert.alert('Erro', err.message || 'Erro ao sair da conta');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Effect para carregar o perfil quando o componente for montado
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    // Listener para mudanças no estado de autenticação
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Usuário está logado, configura listener do perfil
        unsubscribeProfile = subscribeToUserProfile(user.uid, (userProfile) => {
          setProfile(userProfile);
          setLoading(false);
        });
      } else {
        // Usuário não está logado, limpa o perfil
        setProfile(null);
        setLoading(false);
        
        // Remove listener do perfil se existir
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
      }
    });

    return () => {
      unsubscribeAuth(); // Cleanup do listener de auth
      if (unsubscribeProfile) {
        unsubscribeProfile(); // Cleanup do listener de perfil
      }
    };
  }, []);

  return {
    profile,
    loading,
    error,
    refreshProfile,
    updateProfile,
    uploadPhoto,
    removePhoto,
    updatePassword,
    signOut,
  };
};