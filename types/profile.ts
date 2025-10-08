// types/profile.ts
export interface ProfileFormData {
  name: string;
  phone: string;
  address: string;
}

export interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PhotoUploadOptions {
  allowsEditing: boolean;
  aspect?: [number, number];
  quality?: number;
  mediaTypes?: string;
}

export interface ProfileValidationErrors {
  name?: string;
  phone?: string;
  address?: string;
  password?: string;
}

export const validateProfileForm = (data: ProfileFormData): ProfileValidationErrors => {
  const errors: ProfileValidationErrors = {};

  // Validação do nome
  if (!data.name.trim()) {
    errors.name = 'Nome é obrigatório';
  } else if (data.name.trim().length < 2) {
    errors.name = 'Nome deve ter pelo menos 2 caracteres';
  } else if (data.name.trim().length > 50) {
    errors.name = 'Nome deve ter no máximo 50 caracteres';
  }

  // Validação do telefone
  if (!data.phone.trim()) {
    errors.phone = 'Telefone é obrigatório';
  } else if (!/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(data.phone)) {
    errors.phone = 'Telefone deve estar no formato (XX) XXXXX-XXXX';
  }

  // Validação do endereço
  if (!data.address.trim()) {
    errors.address = 'Endereço é obrigatório';
  } else if (data.address.trim().length < 10) {
    errors.address = 'Endereço deve ter pelo menos 10 caracteres';
  } else if (data.address.trim().length > 100) {
    errors.address = 'Endereço deve ter no máximo 100 caracteres';
  }

  return errors;
};

export const validatePasswordForm = (data: PasswordFormData): ProfileValidationErrors => {
  const errors: ProfileValidationErrors = {};

  if (!data.newPassword) {
    errors.password = 'Nova senha é obrigatória';
  } else if (data.newPassword.length < 6) {
    errors.password = 'Nova senha deve ter pelo menos 6 caracteres';
  } else if (data.newPassword !== data.confirmPassword) {
    errors.password = 'As senhas não coincidem';
  }

  return errors;
};

export const formatPhoneNumber = (phone: string): string => {
  // Remove todos os caracteres não numéricos
  const numbers = phone.replace(/\D/g, '');
  
  // Aplica a máscara (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
  if (numbers.length <= 10) {
    // Formato para números com 10 dígitos
    return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
  } else {
    // Formato para números com 11 dígitos
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
  }
};

export const cleanPhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '');
};