// services/userService.ts
import * as ImageManipulator from 'expo-image-manipulator';
import { signOut, updatePassword } from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where
} from 'firebase/firestore';
import { Platform } from 'react-native';
import { auth, db } from './firebase';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// 🔧 Configura BASE_URL para qualquer dispositivo na mesma rede
// ⚠️ IMPORTANTE: Substitua pelo IP da sua máquina onde está rodando o servidor Java
const BASE_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:8080'  // Emulador Android
  : 'http://192.168.1.185:8080'; // iOS Simulator ou dispositivo físico

/**
 * Upload da foto de perfil do usuário para a API Java
 */
export async function uploadUserPhoto(uri: string): Promise<string> {
  try {
    // Comprime a imagem antes do upload
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1024 } }], // Redimensiona para 1024px de largura
      { 
        compress: 0.7, 
        format: ImageManipulator.SaveFormat.JPEG 
      }
    );

    const filename = `profile_${Date.now()}.jpg`;
    const mimeType = 'image/jpeg';

    // Cria FormData para enviar o arquivo
    const formData = new FormData();
    formData.append('file', {
      uri: manipResult.uri,
      name: filename,
      type: mimeType,
    } as any);

    // Faz o upload para a API Java
    const response = await fetch(`${BASE_URL}/files/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      throw new Error(`Falha no upload (${response.status})`);
    }

    const result = await response.json();
    
    // Retorna a URL completa para acesso à imagem
    const imageUrl = result.url?.startsWith('http') 
      ? result.url 
      : `${BASE_URL}${result.url}`;
    
    return imageUrl;
  } catch (error) {
    console.error('Erro no upload da foto:', error);
    throw new Error('Erro ao fazer upload da foto de perfil');
  }
}

/**
 * Remove foto de perfil da API Java
 */
export async function deleteUserPhoto(photoURL: string): Promise<void> {
  try {
    // Extrai o filename da URL
    const filename = photoURL.split('/').pop();
    if (!filename) {
      throw new Error('Nome do arquivo não encontrado na URL');
    }

    const response = await fetch(`${BASE_URL}/files/delete/${filename}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Falha ao deletar foto (${response.status})`);
    }

    console.log('Foto removida com sucesso do servidor');
  } catch (error) {
    console.error('Erro ao remover foto:', error);
    throw new Error('Erro ao remover foto de perfil');
  }
}

/**
 * Busca o perfil do usuário atual no Firestore
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Usuário não autenticado');
    }

    // Busca o documento do usuário na coleção users pelo uid
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('uid', '==', currentUser.uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Perfil do usuário não encontrado');
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    return {
      uid: userData.uid,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      address: userData.address,
      photoURL: userData.photoURL,
      createdAt: userData.createdAt?.toDate() || new Date(),
      updatedAt: userData.updatedAt?.toDate(),
    };
  } catch (error: any) {
    console.error('Erro ao buscar perfil do usuário:', error);
    throw new Error('Erro ao carregar dados do perfil');
  }
}

/**
 * Atualiza os dados do perfil do usuário no Firestore
 */
export async function updateUserProfile(profileData: Partial<UserProfile>): Promise<void> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Usuário não autenticado');
    }

    // Busca o documento do usuário
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('uid', '==', currentUser.uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Perfil do usuário não encontrado');
    }

    const userDocRef = doc(db, 'users', querySnapshot.docs[0].id);

    // Prepara os dados para atualização
    const updateData: any = {
      ...profileData,
      updatedAt: new Date(),
    };

    // Remove campos que não devem ser atualizados
    delete updateData.uid;
    delete updateData.email; // Email não pode ser editado
    delete updateData.createdAt;

    // Atualiza o documento no Firestore
    await updateDoc(userDocRef, updateData);

    console.log('Perfil atualizado com sucesso');
  } catch (error: any) {
    console.error('Erro ao atualizar perfil:', error);
    throw new Error('Erro ao salvar alterações do perfil');
  }
}

/**
 * Upload da foto de perfil e atualiza no Firestore
 */
export async function uploadAndUpdateProfilePhoto(uri: string): Promise<string> {
  try {
    // Faz upload da foto para a API Java
    const photoURL = await uploadUserPhoto(uri);
    
    // Atualiza a URL da foto no perfil do usuário
    await updateUserProfile({ photoURL });
    
    return photoURL;
  } catch (error: any) {
    console.error('Erro ao atualizar foto de perfil:', error);
    throw new Error('Erro ao salvar foto de perfil');
  }
}

/**
 * Remove a foto de perfil do usuário
 */
export async function removeProfilePhoto(currentPhotoURL?: string): Promise<void> {
  try {
    // Se há uma foto atual, remove do servidor
    if (currentPhotoURL) {
      try {
        await deleteUserPhoto(currentPhotoURL);
      } catch (error) {
        console.warn('Erro ao remover foto do servidor:', error);
        // Continua mesmo se não conseguir remover do servidor
      }
    }

    // Remove a referência da foto do perfil do usuário no Firestore
    await updateUserProfile({ photoURL: undefined });
    
    console.log('Foto de perfil removida com sucesso');
  } catch (error: any) {
    console.error('Erro ao remover foto de perfil:', error);
    throw new Error('Erro ao remover foto de perfil');
  }
}

/**
 * Atualiza a senha do usuário
 */
export async function updateUserPassword(newPassword: string): Promise<void> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Usuário não autenticado');
    }

    await updatePassword(currentUser, newPassword);
    console.log('Senha atualizada com sucesso');
  } catch (error: any) {
    console.error('Erro ao atualizar senha:', error);
    let errorMessage = 'Erro ao atualizar senha';
    
    if (error.code === 'auth/weak-password') {
      errorMessage = 'A senha deve ter pelo menos 6 caracteres';
    } else if (error.code === 'auth/requires-recent-login') {
      errorMessage = 'Por segurança, faça login novamente para alterar a senha';
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Função para logout do usuário
 */
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
    console.log('Logout realizado com sucesso');
  } catch (error: any) {
    console.error('Erro ao fazer logout:', error);
    throw new Error('Erro ao sair da conta');
  }
}

/**
 * Observa mudanças no perfil do usuário em tempo real
 */
export function subscribeToUserProfile(
  uid: string, 
  callback: (profile: UserProfile | null) => void
): () => void {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('uid', '==', uid));
    
    return onSnapshot(q, (querySnapshot) => {
      if (querySnapshot.empty) {
        callback(null);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      const profile: UserProfile = {
        uid: userData.uid,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        address: userData.address,
        photoURL: userData.photoURL,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate(),
      };

      callback(profile);
    }, (error) => {
      console.error('Erro no listener do perfil:', error);
      callback(null);
    });
  } catch (error) {
    console.error('Erro ao configurar listener do perfil:', error);
    return () => {}; // Retorna função vazia se falhar
  }
}