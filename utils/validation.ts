// utils/validation.ts
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 6) {
    return { isValid: false, message: 'A senha deve ter pelo menos 6 caracteres' };
  }
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, message: 'A senha deve conter pelo menos uma letra minúscula' };
  }
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: 'A senha deve conter pelo menos um número' };
  }
  return { isValid: true, message: '' };
};

export const getFirebaseErrorMessage = (errorCode: string): string => {
  const errorMessages: { [key: string]: string } = {
    'auth/user-not-found': 'E-mail não encontrado',
    'auth/wrong-password': 'Senha incorreta',
    'auth/invalid-email': 'E-mail inválido',
    'auth/user-disabled': 'Conta desativada',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde',
    'auth/network-request-failed': 'Erro de conexão. Verifique sua internet',
    'auth/invalid-credential': 'Credenciais inválidas',
    'auth/email-already-in-use': 'E-mail já está em uso',
    'auth/weak-password': 'Senha muito fraca',
  };

  return errorMessages[errorCode] || 'Erro desconhecido';
};
