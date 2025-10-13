// types/car.ts - VERSÃO REORGANIZADA COM IGNIÇÃO
export interface CarFormData {
  // Informações Essenciais (obrigatórias)
  brand: string;
  model: string;
  year: string;
  licensePlate: string;
  color: string;
  colorHex: string;
  
  // Informações Gerais (opcionais)
  engine?: string;
  chassi?: string;
  renavam?: string;
  fuel?: string;
  description?: string;
}

export interface Car {
  id?: string;
  userId: string;
  // Informações Essenciais
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  color: string;
  colorHex: string;
  
  // Informações Gerais
  engine?: string;
  chassi?: string;
  renavam?: string;
  fuel?: string;
  description?: string;
  photoURL?: string;
  
  // NOVO: Estado da ignição
  ignitionState?: 'on' | 'off' | 'unknown';
  lastIgnitionUpdate?: Date;
  
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// CORRIGIDO: Apenas campos obrigatórios podem ter erro de validação
export interface CarValidationErrors {
  brand?: string;
  model?: string;
  year?: string;
  licensePlate?: string;
  color?: string;
  colorHex?: string;
}

// Opções pré-definidas para selects
export const CAR_BRANDS = [
  'Audi', 'BMW', 'Chevrolet', 'Citroën', 'Fiat', 'Ford', 'Honda', 'Hyundai',
  'Jeep', 'Kia', 'Mercedes-Benz', 'Mitsubishi', 'Nissan', 'Peugeot', 'Renault',
  'Toyota', 'Volkswagen', 'Volvo', 'Outro'
];

export const FUEL_TYPES = [
  { label: 'Gasolina', value: 'gasoline' },
  { label: 'Etanol', value: 'ethanol' },
  { label: 'Flex', value: 'flex' },
  { label: 'Diesel', value: 'diesel' },
  { label: 'GNV', value: 'gnv' },
  { label: 'Elétrico', value: 'electric' },
  { label: 'Híbrido', value: 'hybrid' }
];

export const CAR_COLORS = [
  { name: 'Branco', hex: '#FFFFFF' },
  { name: 'Preto', hex: '#000000' },
  { name: 'Prata', hex: '#C0C0C0' },
  { name: 'Cinza', hex: '#808080' },
  { name: 'Vermelho', hex: '#FF0000' },
  { name: 'Azul', hex: '#0000FF' },
  { name: 'Verde', hex: '#008000' },
  { name: 'Amarelo', hex: '#FFFF00' },
  { name: 'Laranja', hex: '#FFA500' },
  { name: 'Marrom', hex: '#8B4513' },
  { name: 'Bege', hex: '#F5F5DC' },
  { name: 'Dourado', hex: '#FFD700' }
];

export const validateCarForm = (data: CarFormData): CarValidationErrors => {
  const errors: CarValidationErrors = {};

  // Validação APENAS dos campos obrigatórios (informações essenciais)
  // Marca
  if (!data.brand.trim()) {
    errors.brand = 'Marca é obrigatória';
  }

  // Modelo
  if (!data.model.trim()) {
    errors.model = 'Modelo é obrigatório';
  } else if (data.model.trim().length < 2) {
    errors.model = 'Modelo deve ter pelo menos 2 caracteres';
  }

  // Ano
  if (!data.year.trim()) {
    errors.year = 'Ano é obrigatório';
  } else {
    const year = parseInt(data.year);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 1900 || year > currentYear + 1) {
      errors.year = `Ano deve estar entre 1900 e ${currentYear + 1}`;
    }
  }

  // Placa
  if (!data.licensePlate.trim()) {
    errors.licensePlate = 'Placa é obrigatória';
  } else {
    // Formato antigo (ABC-1234) ou Mercosul (ABC1D23)
    const plateRegex = /^[A-Z]{3}[-]?[0-9]{1}[A-Z0-9]{1}[0-9]{2}$|^[A-Z]{3}[-]?[0-9]{4}$/;
    if (!plateRegex.test(data.licensePlate.replace(/\s/g, '').toUpperCase())) {
      errors.licensePlate = 'Placa inválida (use formato ABC-1234 ou ABC1D23)';
    }
  }

  // Cor
  if (!data.color.trim()) {
    errors.color = 'Cor é obrigatória';
  }

  return errors;
};

// Função para formatar placa
export const formatLicensePlate = (plate: string): string => {
  const cleaned = plate.replace(/[^A-Z0-9]/g, '').toUpperCase();
  
  if (cleaned.length <= 3) {
    return cleaned;
  } else if (cleaned.length <= 7) {
    // Formato antigo ABC-1234
    return cleaned.replace(/^([A-Z]{3})([0-9]{1,4})$/, '$1-$2');
  } else {
    // Formato Mercosul ABC1D23
    return cleaned.replace(/^([A-Z]{3})([0-9A-Z]{4})$/, '$1$2');
  }
};

// Função para formatar RENAVAM
export const formatRenavam = (renavam: string): string => {
  const numbers = renavam.replace(/\D/g, '');
  
  if (numbers.length <= 11) {
    return numbers.replace(/(\d{4})(\d{4})(\d{0,3})/, (match, p1, p2, p3) => {
      let result = p1;
      if (p2) result += '.' + p2;
      if (p3) result += '.' + p3;
      return result;
    });
  }
  
  return numbers.slice(0, 11);
};
