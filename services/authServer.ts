// services/authService.ts
import {
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
    User
} from 'firebase/auth';
import { auth } from './firebase';

export class AuthService {
  // Login
  static async signIn(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Registro
  static async signUp(email: string, password: string) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  // Logout
  static async signOut() {
    return signOut(auth);
  }

  // Recuperação de senha
  static async sendPasswordResetEmail(email: string) {
    return sendPasswordResetEmail(auth, email, {
        // Configurações opcionais
        handleCodeInApp: false,
        url: ''
    });
  }

  // Verificar se usuário está logado
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Listener para mudanças no estado de autenticação
  static onAuthStateChanged(callback: (user: User | null) => void) {
    return auth.onAuthStateChanged(callback);
  }
}
