// services/userService.ts
import { updatePassword } from 'firebase/auth';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from './firebase';

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

export class UserService {
  /**
   * Busca os dados do perfil do usuário atual no Firestore
   */
  static async getUserProfile(): Promise<UserProfile | null> {
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
   * Atualiza os dados do perfil do usuário
   */
  static async updateUserProfile(profileData: Partial<UserProfile>): Promise<void> {
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
      delete updateData.email; // Email não pode ser editado pelo usuário
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
   * Upload da foto de perfil do usuário
   */
  static async uploadProfilePhoto(uri: string): Promise<string> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      // Cria uma referência para o arquivo no Firebase Storage
      const fileName = `profile-photos/${currentUser.uid}_${Date.now()}.jpg`;
      const storageRef = ref(storage, fileName);

      // Converte a URI local para blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Faz upload do arquivo
      await uploadBytes(storageRef, blob);

      // Obtém a URL de download
      const downloadURL = await getDownloadURL(storageRef);

      // Atualiza o perfil do usuário com a nova foto
      await this.updateUserProfile({ photoURL: downloadURL });

      return downloadURL;
    } catch (error: any) {
      console.error('Erro ao fazer upload da foto:', error);
      throw new Error('Erro ao salvar foto de perfil');
    }
  }

  /**
   * Remove a foto de perfil do usuário
   */
  static async removeProfilePhoto(): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      const userProfile = await this.getUserProfile();
      if (!userProfile || !userProfile.photoURL) {
        return; // Nenhuma foto para remover
      }

      // Remove a foto do Storage
      try {
        const photoRef = ref(storage, userProfile.photoURL);
        await deleteObject(photoRef);
      } catch (storageError) {
        console.warn('Erro ao remover foto do storage:', storageError);
        // Continua mesmo se não conseguir remover do storage
      }

      // Remove a referência da foto do perfil do usuário
      await this.updateUserProfile({ photoURL: undefined });
    } catch (error: any) {
      console.error('Erro ao remover foto de perfil:', error);
      throw new Error('Erro ao remover foto de perfil');
    }
  }

  /**
   * Atualiza a senha do usuário
   */
  static async updateUserPassword(newPassword: string): Promise<void> {
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
  static async signOut(): Promise<void> {
    try {
      await auth.signOut();
      console.log('Logout realizado com sucesso');
    } catch (error: any) {
      console.error('Erro ao fazer logout:', error);
      throw new Error('Erro ao sair da conta');
    }
  }
}