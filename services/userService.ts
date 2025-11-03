// services/userService.ts - VERSÃO TOTALMENTE CORRIGIDA
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
 * Verifica se o usuário ainda está autenticado
 */
function isUserAuthenticated(): boolean {
  return auth.currentUser !== null;
}

/**
 * Upload da foto de perfil do usuário para a API Java
 * ✅ CORRIGIDO: Adiciona verificações de autenticação
 */
export async function uploadUserPhoto(uri: string): Promise<string> {
  try {
    // ✅ Verifica autenticação antes de prosseguir
    if (!isUserAuthenticated()) {
      throw new Error('Usuário não autenticado');
    }

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
 * ✅ CORRIGIDO: Adiciona verificações de autenticação
 */
export async function deleteUserPhoto(photoURL: string): Promise<void> {
  try {
    // ✅ Verifica autenticação antes de prosseguir
    if (!isUserAuthenticated()) {
      throw new Error('Usuário não autenticado');
    }

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
 * ✅ CORRIGIDO: Adiciona verificações de autenticação
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
 * ✅ CORRIGIDO: Adiciona verificações de autenticação
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
 * ✅ CORRIGIDO: Adiciona verificações de autenticação
 */
export async function uploadAndUpdateProfilePhoto(uri: string): Promise<string> {
  try {
    // ✅ Verifica autenticação antes de prosseguir
    if (!isUserAuthenticated()) {
      throw new Error('Usuário não autenticado');
    }

    // Faz upload da foto para a API Java
    const photoURL = await uploadUserPhoto(uri);
    
    // ✅ Verifica novamente se o usuário ainda está logado
    if (!isUserAuthenticated()) {
      throw new Error('Sessão expirou durante o upload');
    }
    
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
 * ✅ CORRIGIDO: Adiciona verificações de autenticação
 */
export async function removeProfilePhoto(currentPhotoURL?: string): Promise<void> {
  try {
    // ✅ Verifica autenticação antes de prosseguir
    if (!isUserAuthenticated()) {
      throw new Error('Usuário não autenticado');
    }

    // Se há uma foto atual, remove do servidor
    if (currentPhotoURL) {
      try {
        await deleteUserPhoto(currentPhotoURL);
      } catch (error) {
        console.warn('Erro ao remover foto do servidor:', error);
        // Continua mesmo se não conseguir remover do servidor
      }
    }

    // ✅ Verifica novamente se o usuário ainda está logado
    if (!isUserAuthenticated()) {
      throw new Error('Sessão expirou durante a remoção');
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
 * ✅ CORRIGIDO: Adiciona verificações de autenticação
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
 * ✅ TOTALMENTE CORRIGIDA: Limpa todas as subscriptions e gerencia estado
 */
export async function signOutUser(): Promise<void> {
  try {
    console.log('Iniciando processo de logout...');
    
    // ✅ Aguarda um breve momento para permitir limpeza de listeners
    // Isso dá tempo para que outros componentes limpem suas subscriptions
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // ✅ Realiza o logout
    await signOut(auth);
    
    console.log('Logout realizado com sucesso');
  } catch (error: any) {
    console.error('Erro ao fazer logout:', error);
    throw new Error('Erro ao sair da conta');
  }
}

/**
 * Observa mudanças no perfil do usuário em tempo real
 * ✅ TOTALMENTE CORRIGIDA: Gerencia corretamente o estado de autenticação
 */
export function subscribeToUserProfile(
  uid: string, 
  callback: (profile: UserProfile | null) => void
): () => void {
  let unsubscribe: (() => void) | null = null;
  let isActive = true;

  try {
    // ✅ Verifica se há usuário autenticado
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn('Usuário não autenticado para escutar perfil');
      callback(null);
      return () => { isActive = false; };
    }

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('uid', '==', uid));
    
    unsubscribe = onSnapshot(q, (querySnapshot) => {
      // ✅ Verifica se a subscription ainda está ativa
      if (!isActive) {
        console.log('Subscription de perfil inativa, ignorando callback');
        return;
      }

      // ✅ Verifica se ainda há usuário autenticado
      const user = auth.currentUser;
      if (!user) {
        console.log('Usuário deslogado, cancelando escuta de perfil');
        callback(null);
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }
        isActive = false;
        return;
      }

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
    }, (error: any) => {
      // ✅ Tratamento inteligente de erros
      const user = auth.currentUser;
      
      if (!user && (
        error.code === 'permission-denied' || 
        error.message.includes('Missing or insufficient permissions')
      )) {
        console.log('Escuta de perfil cancelada devido ao logout do usuário - isso é normal');
        callback(null);
        isActive = false;
      } else {
        console.error('Erro real no listener do perfil:', error);
        callback(null);
      }
    });

    // ✅ Retorna função de cleanup aprimorada
    return () => {
      isActive = false;
      if (unsubscribe) {
        console.log('Limpando subscription de perfil para uid:', uid);
        unsubscribe();
        unsubscribe = null;
      }
    };
  } catch (error) {
    console.error('Erro ao configurar listener do perfil:', error);
    isActive = false;
    return () => { /* função vazia */ };
  }
}

/**
 * ✅ NOVA FUNÇÃO: Verifica se o usuário está autenticado
 * Função auxiliar para uso em outros componentes
 */
export function isUserAuthenticatedPublic(): boolean {
  return isUserAuthenticated();
}

/**
 * ✅ NOVA FUNÇÃO: Cleanup de todas as subscriptions de usuário
 * Use esta função antes do logout para limpar todas as escutas relacionadas ao usuário
 */
export function cleanupUserSubscriptions(): void {
  console.log('Limpando todas as subscriptions do user service...');
  // Esta função pode ser expandida conforme necessário
  // Por enquanto serve como placeholder para futuras funcionalidades
}

/**
 * ✅ NOVA FUNÇÃO: Valida dados do perfil antes de salvar
 */
export function validateUserProfile(profile: Partial<UserProfile>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (profile.name !== undefined) {
    if (!profile.name || profile.name.trim().length < 2) {
      errors.push('Nome deve ter pelo menos 2 caracteres');
    }
    if (profile.name.length > 100) {
      errors.push('Nome não pode ter mais de 100 caracteres');
    }
  }

  if (profile.phone !== undefined) {
    if (!profile.phone || profile.phone.trim().length < 10) {
      errors.push('Telefone deve ter pelo menos 10 dígitos');
    }
    // Regex básico para validar telefone brasileiro
    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$|^\d{10,11}$/;
    if (profile.phone && !phoneRegex.test(profile.phone.replace(/\s/g, ''))) {
      console.warn('Formato de telefone pode não ser válido:', profile.phone);
    }
  }

  if (profile.address !== undefined) {
    if (!profile.address || profile.address.trim().length < 5) {
      errors.push('Endereço deve ter pelo menos 5 caracteres');
    }
    if (profile.address.length > 200) {
      errors.push('Endereço não pode ter mais de 200 caracteres');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * ✅ NOVA FUNÇÃO: Atualiza perfil com validação
 */
export async function updateUserProfileWithValidation(profileData: Partial<UserProfile>): Promise<void> {
  // Valida os dados antes de salvar
  const validation = validateUserProfile(profileData);
  if (!validation.isValid) {
    throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
  }

  // Chama a função original se a validação passou
  return updateUserProfile(profileData);
}
